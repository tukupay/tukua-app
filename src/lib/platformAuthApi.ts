/**
 * Nest platform auth helpers for mobile — OTP, password reset, login/register.
 * No Deno / Supabase Auth for these flows.
 */
import { getNestApiBaseUrl } from './localHost';
import { humanizeError } from './humanizeError';
import { log } from './logger';

function nestBase(): string {
  return getNestApiBaseUrl().replace(/\/$/, '');
}

function pickMessage(json: any, status: number): string | undefined {
  if (!json || typeof json !== 'object') {
    if (status === 401 || status === 403) return humanizeError('Authentication required');
    if (status >= 500) return humanizeError('service unavailable');
    return undefined;
  }
  const raw =
    (typeof json.message === 'string' && json.message) ||
    (typeof json.error === 'string' && json.error) ||
    (typeof json.error?.message === 'string' && json.error.message) ||
    (typeof json.error?.code === 'string' && json.error.code) ||
    '';
  return raw ? humanizeError(raw) : undefined;
}

async function nestPost<T>(path: string, body: unknown): Promise<{ ok: boolean; data?: T; message?: string; error?: string; status: number }> {
  let res: Response;
  try {
    res = await fetch(`${nestBase()}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  } catch (e) {
    log.warn('NestAuth', `POST ${path} network`, String(e));
    return {
      ok: false,
      message: humanizeError(e),
      error: 'network_error',
      status: 0,
    };
  }
  const json = await res.json().catch(() => null);
  const data =
    json && typeof json === 'object' && 'data' in json ? (json as { data: T }).data : (json as T);
  const ok = res.ok && (json?.success !== false);
  if (!ok) {
    log.warn('NestAuth', `POST ${path} ${res.status}`, JSON.stringify(json).slice(0, 220));
  }
  return {
    ok,
    data,
    message: pickMessage(json, res.status) || (ok ? json?.message : humanizeError('request failed')),
    error: typeof json?.error === 'string' ? json.error : json?.error?.code,
    status: res.status,
  };
}

/** One security code → email and/or SMS. */
export async function sendOtp(opts: {
  email?: string;
  phone?: string;
  phone_number?: string;
  purpose?: string;
}) {
  return nestPost<{
    email?: string;
    phone_number?: string;
    channels?: string[];
    expires_at?: string;
    code?: string;
  }>('/platform/auth/otp/send', opts);
}

export async function verifyOtp(opts: {
  email?: string;
  phone?: string;
  phone_number?: string;
  code: string;
}) {
  return nestPost<{ verified: boolean }>('/platform/auth/otp/verify', opts);
}

export async function forgotPassword(opts: {
  email?: string;
  phone?: string;
  redirect_to?: string;
}) {
  return nestPost<{ email?: string }>('/platform/auth/password/forgot', {
    email: opts.email,
    phone: opts.phone,
    redirect_to: opts.redirect_to,
  });
}

export async function resetPassword(token: string, password: string) {
  return nestPost('/platform/auth/password/reset', { token, password });
}

export async function platformRegister(body: {
  email?: string;
  phone?: string;
  password: string;
  full_name?: string;
  username?: string;
  account_type?: string;
}) {
  return nestPost<{ access_token?: string; refresh_token?: string; user?: unknown }>(
    '/platform/auth/register',
    body,
  );
}

export async function platformLogin(identifier: string, password: string) {
  return nestPost<{ access_token?: string; refresh_token?: string; expires_in?: number }>(
    '/platform/auth/login',
    { identifier, password },
  );
}

export async function mpesaStk(body: Record<string, unknown>) {
  return nestPost<Record<string, unknown>>('/payments/mpesa/stk', body);
}

export async function mpesaGwInit(body: Record<string, unknown>) {
  // Prefer Nest STK (Daraja in Nest / OPS callbacks). Fall back to gw-init only if STK path fails shape.
  const stk = await mpesaStk(body);
  if (stk.ok) return stk;
  return nestPost<Record<string, unknown>>('/payments/mpesa/gw-init', body);
}

export async function mpesaCheckStatus(checkout_request_id: string) {
  return nestPost<Record<string, unknown>>('/payments/mpesa/status', { checkout_request_id });
}

export async function peaCompleteSignup(body: Record<string, unknown>) {
  return nestPost<{
    ok?: boolean;
    user_id?: string;
    tokens_granted?: number;
    sms_sent?: boolean;
    email_sent?: boolean;
    mpesa_receipt?: string;
  }>('/platform/registration/pea-complete', body);
}

export async function getPeaConfig(role?: string) {
  const q = role ? `?role=${encodeURIComponent(role)}` : '';
  const res = await fetch(`${nestBase()}/platform/registration/pea-config${q}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const json = await res.json().catch(() => null);
  const data =
    json && typeof json === 'object' && 'data' in json
      ? (json as { data: { amount: number; free_tokens: number; message: string } }).data
      : (json as { amount: number; free_tokens: number; message: string });
  return {
    ok: res.ok && (json?.success !== false),
    data,
    message: json?.message,
    error: typeof json?.error === 'string' ? json.error : json?.error?.code,
    status: res.status,
  };
}

export async function listRegistrationOrgTypes() {
  let res: Response;
  try {
    res = await fetch(`${nestBase()}/platform/registration/org-types`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    log.warn('NestAuth', 'org-types network', String(e));
    return {
      ok: false,
      data: [] as Array<{ id: string; slug: string; label: string; description: string | null }>,
      message: humanizeError(e),
      status: 0,
    };
  }
  const json = await res.json().catch(() => null);
  const raw =
    json && typeof json === 'object' && 'data' in json
      ? (json as { data: { items?: unknown[] } | unknown[] }).data
      : json;
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] })?.items)
      ? (raw as { items: unknown[] }).items
      : [];
  if (!res.ok) {
    log.warn('NestAuth', `org-types ${res.status}`, JSON.stringify(json).slice(0, 200));
  }
  return {
    ok: res.ok && (json?.success !== false),
    data: items as Array<{ id: string; slug: string; label: string; description: string | null }>,
    message: pickMessage(json, res.status),
    status: res.status,
  };
}

export type RegistrationSchoolHit = {
  id: string;
  name: string;
  code?: string | null;
  logo_url?: string | null;
  county?: string | null;
};

export async function searchRegistrationSchools(q: string) {
  const term = q.trim();
  if (term.length < 2) {
    return { ok: true, data: [] as RegistrationSchoolHit[], status: 200 };
  }
  let res: Response;
  try {
    res = await fetch(
      `${nestBase()}/platform/registration/schools?q=${encodeURIComponent(term)}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
    );
  } catch (e) {
    return {
      ok: false,
      data: [] as RegistrationSchoolHit[],
      message: humanizeError(e),
      status: 0,
    };
  }
  const json = await res.json().catch(() => null);
  const data =
    json && typeof json === 'object' && 'data' in json
      ? (json as { data: { schools?: RegistrationSchoolHit[] } }).data
      : json;
  const schools = Array.isArray((data as any)?.schools)
    ? (data as { schools: RegistrationSchoolHit[] }).schools
    : Array.isArray(data)
      ? (data as RegistrationSchoolHit[])
      : [];
  return {
    ok: res.ok && (json?.success !== false),
    data: schools,
    message: pickMessage(json, res.status),
    status: res.status,
  };
}

export async function joinSchoolAfterRegister(
  accessToken: string,
  body: {
    organization_id: string;
    role?: string;
    notes?: string | null;
    admission_number?: string | null;
  },
) {
  let res: Response;
  try {
    res = await fetch(`${nestBase()}/platform/registration/school-join`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, message: humanizeError(e), status: 0 };
  }
  const json = await res.json().catch(() => null);
  return {
    ok: res.ok && (json?.success !== false),
    data: json?.data,
    message: pickMessage(json, res.status),
    status: res.status,
  };
}
