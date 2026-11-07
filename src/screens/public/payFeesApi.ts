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
import { humanizeError } from '../../lib/humanizeError';

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
};

export type FeeQuote = {
  balance_kes: number | null;
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
    res = await fetch(`${base()}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
  } catch (e) {
    throw new Error(humanizeError(e));
  }
  const json: any = await res.json().catch(() => null);
  if (!res.ok || json?.status === 'error' || json?.success === false) {
    const raw = json?.message;
    const msg = Array.isArray(raw) ? raw.join(' ') : typeof raw === 'string' && raw ? raw : `Request failed (${res.status})`;
    throw new Error(msg);
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
