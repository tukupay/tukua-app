/**
 * Wallet helpers — Nest REST only (no tukupay-proxy edge, no /platform/edge).
 * Balance: GET /platform/me/balances (token balance).
 * Top-up: POST /payments/mpesa/stk.
 */
import { getNestApiBaseUrl } from './localHost';
import { mpesaCheckStatus, mpesaStk } from './platformAuthApi';
import { resolveNestAccessTokenForWebView } from './platformNestAuth';

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
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
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
const DEFAULT_PRICE_PER_1M_KES = 950;

export function tokensFromKes(amountKes: number, pricePer1mKes: number = DEFAULT_PRICE_PER_1M_KES): number {
  if (!amountKes || !pricePer1mKes || pricePer1mKes <= 0) return 0;
  return Math.floor((amountKes / pricePer1mKes) * 1_000_000);
}

/** M-Pesa STK top-up via Nest (never /platform/edge). Computes `tokens` client-side so the STK
 * callback credits the wallet — the Nest `mpesa_transactions.tokens` column drives crediting. */
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
  const phone = String(body.phone_number || '').trim();
  if (!phone) throw new Error('phone_number is required');
  if (!(Number(body.amount) > 0)) throw new Error('amount must be > 0');
  const tokens = body.tokens != null ? Math.max(0, Math.floor(body.tokens)) : tokensFromKes(Number(body.amount));

  const res = await mpesaStk({
    phone_number: phone,
    amount: Number(body.amount),
    user_id: body.user_id,
    tokens,
    purpose: body.purpose || 'tokens',
    description: body.description || `${tokens.toLocaleString()} Tukua tokens`,
    account_reference: body.account_reference,
    metadata: body.metadata,
  });
  if (!res.ok) {
    throw new Error(res.message || res.error || 'M-Pesa STK failed — use Nest /payments/mpesa/stk');
  }
  const data = (res.data || {}) as { checkout_request_id?: string; data?: { checkout_request_id?: string } };
  const checkoutRequestId = String(data.checkout_request_id || data.data?.checkout_request_id || '');
  if (!checkoutRequestId) throw new Error('M-Pesa did not return a checkout request id');
  return { checkout_request_id: checkoutRequestId, tokens };
}

export type MpesaTopUpStatus = {
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'unknown';
  tokens?: number;
  mpesa_receipt?: string;
  message?: string;
};

/** Poll a checkout request until it resolves, or maxAttempts is hit (default 5s interval, 3 min). */
export async function pollMpesaTopUpStatus(
  checkoutRequestId: string,
  opts?: { intervalMs?: number; maxAttempts?: number; onTick?: (status: MpesaTopUpStatus) => void },
): Promise<MpesaTopUpStatus> {
  const intervalMs = opts?.intervalMs ?? 5000;
  const maxAttempts = opts?.maxAttempts ?? 36;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await mpesaCheckStatus(checkoutRequestId);
    const data = (res.data || {}) as Record<string, unknown>;
    const rawStatus = String(data.status || '').toLowerCase();
    const status: MpesaTopUpStatus = {
      status:
        rawStatus === 'completed' || rawStatus === 'failed' || rawStatus === 'cancelled' || rawStatus === 'pending'
          ? (rawStatus as MpesaTopUpStatus['status'])
          : 'unknown',
      tokens: typeof data.tokens === 'number' ? data.tokens : undefined,
      mpesa_receipt: typeof data.mpesa_receipt === 'string' ? data.mpesa_receipt : undefined,
      message: typeof data.user_message === 'string' ? data.user_message : (typeof data.message === 'string' ? data.message : undefined),
    };
    opts?.onTick?.(status);
    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: 'unknown', message: 'Payment status check timed out' };
}
