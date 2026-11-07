/**
 * Paying school fees with no account: the same public Nest routes tukua.ai/fees uses
 * (web: src/pages/home/homeData.ts; api: modules/school-site/school-site.controller.ts,
 * modules/school-directory/school-directory.controller.ts). No auth header is sent.
 *
 *   GET  /public/school-directory?q=&limit=          schools (only `published` ones take fees online)
 *   POST /public/school-site/:slug/fees/search        { by: adm|name|phone|upi, q } → masked learners
 *   POST /public/school-site/:slug/fees/quote         { ref, amount?, purpose: 'fees' } → balance, charge, total
 *   POST /public/school-site/:slug/fees/pay           { ref, phone, amount, purpose: 'fees' } → M-Pesa STK push
 *   GET  /public/school-site/:slug/fees/pay/:checkout → { status: pending|completed|failed…, message?, receipt? }
 */
import { getNestApiBaseUrl } from '../../lib/localHost';
import {
  NETWORK_MESSAGE,
  apiError,
  fetchWithTimeout,
  messageForStatus,
  readJsonSafe,
  userMessageFromError,
  warnDev,
  type ApiError,
} from '../../lib/apiHttp';

export type DirectorySchool = {
  name: string;
  slug: string;
  url: string;
  county: string | null;
  kind: string;
  tagline: string | null;
  logo: string | null;
  brand: string;
  published: boolean;
};

export type FoundLearner = {
  ref: string;
  name: string;
  initials: string;
  class_name: string | null;
  admission: string | null;
  /** One parent's full name (newer APIs). */
  parent_name?: string | null;
};

export type FeeQuote = {
  balance_kes: number | null;
  /** Each financial year still owing (from the school's ledgers), oldest first. Older APIs leave it out. */
  balance_years?: Array<{ year: string; balance: number }>;
  amount_kes: number;
  bank_app_charge_kes: number;
  total_kes: number;
  pays_for: Array<{ label: string; amount: number }>;
};

export type FeePaymentStatus = { status: string; message?: string; receipt?: string };

export type LearnerSearchBy = 'adm' | 'name' | 'phone';

function base(): string {
  return getNestApiBaseUrl().replace(/\/+$/, '');
}

async function call<T>(path: string, init: { method?: 'GET' | 'POST'; json?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${base()}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
  } catch (e) {
    warnDev('PayFees', e, { path });
    throw apiError(userMessageFromError(e, NETWORK_MESSAGE), {
      network: Boolean((e as ApiError)?.network),
      timeout: Boolean((e as ApiError)?.timeout),
    });
  }
  const json: any = await readJsonSafe(res);
  if (!res.ok || json?.status === 'error' || json?.success === false) {
    warnDev('PayFees', { message: json?.message, statusCode: res.status }, { path });
    throw apiError(messageForStatus(res.status, json), { statusCode: res.status });
  }
  // Nest wraps answers as { statusCode, status, message, data }.
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T;
}

const site = (slug: string) => `/public/school-site/${encodeURIComponent(slug)}`;

export async function searchFeeSchools(q: string, limit = 24): Promise<DirectorySchool[]> {
  const p = new URLSearchParams();
  if (q.trim()) p.set('q', q.trim());
  p.set('limit', String(limit));
  const data = await call<{ schools?: DirectorySchool[] }>(`/public/school-directory?${p.toString()}`);
  return (data?.schools ?? []).filter((s) => s.published);
}

export const findLearners = (slug: string, by: LearnerSearchBy, q: string) =>
  call<{ learners: FoundLearner[] }>(`${site(slug)}/fees/search`, { method: 'POST', json: { by, q } });

export const quoteFees = (slug: string, ref: string, amount?: number) =>
  call<FeeQuote>(`${site(slug)}/fees/quote`, { method: 'POST', json: { ref, amount, purpose: 'fees' } });

export const startFeePayment = (slug: string, ref: string, phone: string, amount: number) =>
  call<{ checkout_request_id: string; total_kes: number }>(`${site(slug)}/fees/pay`, {
    method: 'POST',
    json: { ref, phone, amount, purpose: 'fees' },
  });

export const feePaymentStatus = (slug: string, checkout: string) =>
  call<FeePaymentStatus>(`${site(slug)}/fees/pay/${encodeURIComponent(checkout)}`);

export const kes = (n: number | null | undefined) =>
  n == null || !Number.isFinite(Number(n))
    ? '—'
    : `KES ${Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
