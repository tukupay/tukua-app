/**
 * Wallet helpers — Nest REST only (no tukupay-proxy edge, no /platform/edge).
 * Balance: GET /platform/me/balances (token balance).
 * Top-up: POST /payments/mpesa/stk.
 */
import { getNestApiBaseUrl } from './localHost';
import { mpesaCheckStatus, mpesaStk } from './platformAuthApi';
import { recoverPlatformTokenAfter401, resolveNestAccessTokenForWebView } from './platformNestAuth';
import { mpesaMsisdn } from './phoneUtils';
import { fetchWithTimeout } from './apiHttp';

export type Wallet = {
  id: number;
  name: string | null;
  wallet_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  is_primary: boolean;
  is_tukupay_wallet: boolean;
  alias: string;
};

async function nestAuthedGet<T>(path: string, accessToken?: string): Promise<T> {
  const token = accessToken || (await resolveNestAccessTokenForWebView());
  if (!token) throw new Error('Sign in required');
  const base = getNestApiBaseUrl().replace(/\/$/, '');
  const res = await fetchWithTimeout(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/**
 * List wallets via Nest.
 * Prefers `/platform/me/balances` (platform token balance).
 * School collection wallets (`/accounts/wallets`) require finance roles — tried next.
 * TukuPay edge proxy is retired — never call `/platform/edge`.
 */
export async function listWallets(accessToken?: string): Promise<Wallet[]> {
  const token = accessToken || (await resolveNestAccessTokenForWebView());
  if (!token) throw new Error('Sign in required — use Nest login');

  // 1) Platform token balance (always available for signed-in Nest users).
  try {
    const data = await nestAuthedGet<{
      balance?: { balance?: number; monthly_grant_amount?: number; user_id?: string };
    }>('/platform/me/balances?limit=40', token);
    const bal = Number(data?.balance?.balance ?? 0) || 0;
    return [
      {
        id: 1,
        name: 'Tukua balance',
        wallet_type: 'tokens',
        balance: bal,
        currency: 'KES',
        is_active: true,
        is_primary: true,
        is_tukupay_wallet: false,
        alias: 'tukua',
      },
    ];
  } catch (e) {
    // Continue to school wallets / clear error
    const balErr = e instanceof Error ? e.message : String(e);

    // 2) School collection wallets (finance / bursar).
    try {
      const data = await nestAuthedGet<{
        wallets?: Array<Record<string, unknown>>;
      }>('/accounts/wallets', token);
      const rows = Array.isArray(data?.wallets) ? data.wallets : [];
      if (rows.length) {
        return rows.map((w, i) => ({
          id: Number(w.id ?? i + 1) || i + 1,
          name: (w.display_name as string) || (w.name as string) || 'School wallet',
          wallet_type: String(w.purpose || w.wallet_type || 'collection'),
          balance: Number(w.balance ?? 0) || 0,
          currency: String(w.currency || 'KES'),
          is_active: w.is_active !== false,
          is_primary: Boolean(w.is_primary) || i === 0,
          is_tukupay_wallet: Boolean(w.tukupay_wallet_id || w.is_tukupay_wallet),
          alias: String(w.alias || w.purpose || 'wallet'),
        }));
      }
    } catch {
      /* not a finance user or route unavailable */
    }

    throw new Error(
      `Wallet listing requires Nest (/platform/me/balances or /accounts/wallets). ${balErr}. TukuPay edge is retired — top up via Nest POST /payments/mpesa/stk.`,
    );
  }
}

export function totalSavings(wallets: Wallet[]) {
  return wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
}

/**
 * Default individual-tier rate — mirrors web `DEFAULT_TOKEN_MINIMUMS.individual` fallback
 * (`price_per_1m_kes: 950`). Org/role-specific tiers live in Supabase `token_pricing_settings`
 * with no Nest REST reader yet, so mobile uses this flat default until that endpoint exists.
 */
export const DEFAULT_PRICE_PER_1M_KES = 950;

/** Minimum top-up presets — shared with BalancesScreen and zero-token gate modal. */
export const TOPUP_PRESETS = [50, 100, 250, 500] as const;

export const MIN_TOPUP_KES = TOPUP_PRESETS[0];

export function tokensFromKes(amountKes: number, pricePer1mKes: number = DEFAULT_PRICE_PER_1M_KES): number {
  if (!amountKes || !pricePer1mKes || pricePer1mKes <= 0) return 0;
  return Math.floor((amountKes / pricePer1mKes) * 1_000_000);
}

/** Thrown by {@link topUpViaMpesa} with a message that is safe to show as-is. */
export class MpesaTopUpError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'MpesaTopUpError';
    this.code = code;
  }
}

/** Kept here so existing `mpesaMsisdn` imports from wallet keep working (lives in phoneUtils). */
export { mpesaMsisdn };

const SESSION_ENDED = 'Your session has ended. Sign in again, then retry the top-up.';

/**
 * The Nest JWT for payment calls. `/payments/mpesa/stk` and `/payments/mpesa/status` refuse a call
 * without one (401 "Authentication required") — sending none is what made every in-app top-up fail.
 */
async function paymentBearer(): Promise<string> {
  const token = await resolveNestAccessTokenForWebView().catch(() => null);
  if (!token) throw new MpesaTopUpError(SESSION_ENDED, 'auth_required');
  return token;
}

type NestPostResult = Awaited<ReturnType<typeof mpesaStk>>;

/** Call with the Bearer token; on a 401 refresh the token once and retry (a 401 never sent a prompt). */
async function withPaymentAuth(call: (bearer: string) => Promise<NestPostResult>): Promise<NestPostResult> {
  const token = await paymentBearer();
  const first = await call(token);
  if (first.status !== 401) return first;
  const next = await recoverPlatformTokenAfter401(token).catch(() => null);
  if (!next || next === token) return first;
  return call(next);
}

/** M-Pesa STK top-up via Nest (never /platform/edge). Computes `tokens` client-side so the STK
 * callback credits the wallet — the Nest `mpesa_transactions.tokens` column drives crediting.
 * Throws {@link MpesaTopUpError} with a user-facing message. */
export async function topUpViaMpesa(body: {
  phone_number: string;
  amount: number;
  user_id?: string;
  tokens?: number;
  purpose?: string;
  description?: string;
  account_reference?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ checkout_request_id: string; tokens: number }> {
  const phone = mpesaMsisdn(String(body.phone_number || ''));
  if (!phone) throw new MpesaTopUpError('Enter a valid M-Pesa number, e.g. 0712 345 678.', 'invalid_phone');
  const amount = Math.round(Number(body.amount));
  if (!(amount >= 1)) throw new MpesaTopUpError('Enter an amount of at least KES 1.', 'invalid_amount');
  const tokens = body.tokens != null ? Math.max(0, Math.floor(body.tokens)) : tokensFromKes(amount);

  const res = await withPaymentAuth((bearer) =>
    mpesaStk(
      {
        phone_number: phone,
        amount,
        user_id: body.user_id,
        tokens,
        purpose: body.purpose || 'tokens',
        description: body.description || `${tokens.toLocaleString()} Tukua tokens`,
        account_reference: body.account_reference,
        metadata: body.metadata,
      },
      bearer,
    ),
  );
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new MpesaTopUpError(SESSION_ENDED, 'auth_required');
    if (res.status === 0) {
      throw new MpesaTopUpError(
        res.error === 'timeout'
          ? 'M-Pesa is slow to answer. If a prompt reaches your phone, finish it there; otherwise try again in a minute.'
          : 'No connection to Tukua. Check your internet and try again.',
        res.error,
      );
    }
    throw new MpesaTopUpError(res.message || 'Could not start the M-Pesa payment. Try again.', res.error);
  }
  const data = (res.data || {}) as { checkout_request_id?: string; data?: { checkout_request_id?: string } };
  const checkoutRequestId = String(data.checkout_request_id || data.data?.checkout_request_id || '');
  if (!checkoutRequestId) throw new MpesaTopUpError('M-Pesa did not confirm the prompt. Try again.', 'no_checkout_id');
  return { checkout_request_id: checkoutRequestId, tokens };
}

export type MpesaTopUpStatus = {
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'unknown';
  tokens?: number;
  mpesa_receipt?: string;
  message?: string;
};

function normaliseStatus(raw: string, resultCode: unknown): MpesaTopUpStatus['status'] {
  const s = raw.toLowerCase();
  if (s === 'completed' || s === 'paid') return 'completed';
  if (s === 'cancelled' || (s === 'failed' && Number(resultCode) === 1032)) return 'cancelled';
  if (s === 'failed' || s === 'timeout' || s === 'expired') return 'failed';
  if (s === 'pending') return 'pending';
  return 'unknown';
}

/** Poll a checkout request until it resolves, or maxAttempts is hit (default 5s interval, 3 min).
 * Never throws: network blips and token refreshes keep polling; the end of the wait is `unknown`. */
export async function pollMpesaTopUpStatus(
  checkoutRequestId: string,
  opts?: {
    intervalMs?: number;
    maxAttempts?: number;
    onTick?: (status: MpesaTopUpStatus) => void;
    /** Return true to stop polling (screen closed). */
    isCancelled?: () => boolean;
  },
): Promise<MpesaTopUpStatus> {
  const intervalMs = opts?.intervalMs ?? 5000;
  const maxAttempts = opts?.maxAttempts ?? 36;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // The prompt takes a few seconds to reach the phone: wait first, then ask.
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? Math.min(intervalMs, 4000) : intervalMs));
    if (opts?.isCancelled?.()) break;
    let res: NestPostResult;
    try {
      res = await withPaymentAuth((bearer) => mpesaCheckStatus(checkoutRequestId, bearer));
    } catch {
      continue; // no token right now (e.g. offline refresh) — try again on the next tick
    }
    if (!res.ok) continue;
    const data = (res.data || {}) as Record<string, unknown>;
    const status: MpesaTopUpStatus = {
      status: normaliseStatus(String(data.status || ''), data.result_code),
      tokens: typeof data.tokens === 'number' ? data.tokens : undefined,
      mpesa_receipt: typeof data.mpesa_receipt === 'string' ? data.mpesa_receipt : undefined,
      message:
        typeof data.user_message === 'string'
          ? data.user_message
          : typeof data.message === 'string' && data.message !== 'Payment pending'
            ? data.message
            : undefined,
    };
    opts?.onTick?.(status);
    if (status.status === 'cancelled' && !status.message) {
      status.message = 'You cancelled the M-Pesa prompt. Nothing was charged.';
    }
    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') return status;
  }
  return {
    status: 'unknown',
    message: 'We did not get M-Pesa’s answer in time. If you entered your PIN, your tokens will show in Balances shortly.',
  };
}

/** Dialog copy for the end of a top-up, shared by Balances, the zero-token gate and Tukua Pay. */
export function topUpOutcome(
  result: MpesaTopUpStatus,
  tokensRequested: number,
): { title: string; message: string; variant: 'success' | 'warning' } {
  if (result.status === 'completed') {
    const tokens = result.tokens || tokensRequested;
    return {
      title: 'Top-up successful',
      message: `${tokens.toLocaleString()} tokens have been added to your balance.${result.mpesa_receipt ? ` M-Pesa receipt ${result.mpesa_receipt}.` : ''}`,
      variant: 'success',
    };
  }
  if (result.status === 'cancelled') {
    return { title: 'Payment cancelled', message: result.message || 'You cancelled the M-Pesa prompt. Nothing was charged.', variant: 'warning' };
  }
  if (result.status === 'failed') {
    return { title: 'Top-up not completed', message: result.message || 'The M-Pesa payment was not completed. You can try again.', variant: 'warning' };
  }
  return {
    title: 'Still processing',
    message: result.message || 'We could not confirm the payment yet — check Balances shortly.',
    variant: 'warning',
  };
}
