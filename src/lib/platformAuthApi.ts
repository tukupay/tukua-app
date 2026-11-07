/**
 * Nest platform auth helpers for mobile — OTP, password reset, login/register.
 * No Deno / Supabase Auth for these flows.
 */
import { getNestApiBaseUrl } from './localHost';
import { humanizeError } from './humanizeError';
import { log } from './logger';
import {
  BAD_ANSWER_MESSAGE,
  NETWORK_MESSAGE,
  fetchWithTimeout,
  messageForStatus,
  readJsonSafe,
  userMessageFromError,
  warnDev,
  type ApiError,
} from './apiHttp';

function nestBase(): string {
  return getNestApiBaseUrl().replace(/\/$/, '');
}

function nestRawMessage(json: any): string {
  if (!json || typeof json !== 'object') return '';
  const m = json.message;
  if (Array.isArray(m)) {
    return m.filter((x: unknown) => typeof x === 'string' && x.trim()).join('. ');
  }
  if (typeof m === 'string' && m.trim()) return m;
  if (typeof json.error === 'string' && json.error.trim()) return json.error;
  if (json.error && typeof json.error === 'object') {
    if (typeof json.error.message === 'string' && json.error.message.trim()) return json.error.message;
    if (Array.isArray(json.error.message)) {
      return json.error.message.filter((x: unknown) => typeof x === 'string' && x.trim()).join('. ');
    }
    if (typeof json.error.code === 'string') return json.error.code;
  }
  if (typeof json.result_description === 'string' && json.result_description.trim()) {
    return json.result_description;
  }
  return '';
}

/** Auth routes (sign-in, OTP, reset): a 401 means wrong details, not "payment" — worded for that screen. */
function authMessage(raw: string, status: number): string | undefined {
  if (/invalid (login )?credentials|invalid_credentials|wrong password|incorrect password|user not found|no account/i.test(raw)) {
    return 'That email, phone or username, or the password, is not right. Check them and try again.';
  }
  if (status === 429 || /too many|rate limit/i.test(raw)) {
    return 'Too many tries. Wait a minute and try again.';
  }
  if (/locked|suspended|disabled|deactivated|banned/i.test(raw)) {
    return 'This account is not active. Contact your school or Tukua support.';
  }
  if (/expired|already used/i.test(raw) && /token|link|code|otp/i.test(raw)) {
    return 'This link or code has expired. Request a new one.';
  }
  if (raw && !/^(unauthorized|forbidden|bad request|internal server error|error)$/i.test(raw.trim())) {
    const shown = userMessageFromError(raw, '');
    if (shown) return shown;
  }
  if (status === 401) return 'That email, phone or username, or the password, is not right. Check them and try again.';
  if (status === 403) return 'This account cannot sign in here yet. Contact your school or Tukua support.';
  if (status === 404) return 'We could not find that account. Check the details, or create an account.';
  if (status >= 500) return 'Tukua is having a problem right now. Please try again in a few minutes.';
  if (status >= 400) return messageForStatus(status, null);
  return undefined;
}

function pickMessage(json: any, status: number, path = ''): string | undefined {
  const raw = nestRawMessage(json);
  if (path.startsWith('/platform/auth')) return authMessage(raw, status);
  if (raw) return humanizeError(raw);
  if (status === 401 || status === 403) return humanizeError('Authentication required');
  if (status === 429) return 'Too many tries. Wait a minute and try again.';
  if (status >= 500) return humanizeError('service unavailable');
  return undefined;
}

type NestResult<T> = { ok: boolean; data?: T; message?: string; error?: string; status: number };

/** POST to Nest. Never throws: network, timeout, bad JSON and server errors come back as { ok: false, message }. */
async function nestPost<T>(path: string, body: unknown, bearer?: string | null): Promise<NestResult<T>> {
  let res: Response;
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    res = await fetchWithTimeout(
      `${nestBase()}${path}`,
      { method: 'POST', headers, body: JSON.stringify(body ?? {}) },
      45_000,
    );
  } catch (e) {
    const timeout = Boolean((e as ApiError)?.timeout);
    log.warn('NestAuth', `POST ${path} ${timeout ? 'timeout' : 'network'}`, String(e));
    warnDev('NestAuth', e, { path });
    return {
      ok: false,
      message: timeout
        ? 'The server took too long. Check your connection and try again.'
        : userMessageFromError(e, NETWORK_MESSAGE),
      error: timeout ? 'timeout' : 'network_error',
      status: 0,
    };
  }
  try {
    const json = (await readJsonSafe(res)) as any;
    const data =
      json && typeof json === 'object' && 'data' in json ? (json as { data: T }).data : (json as T);
    const ok = res.ok && json?.success !== false;
    if (!ok) {
      log.warn('NestAuth', `POST ${path} ${res.status}`, JSON.stringify(json).slice(0, 220));
      warnDev('NestAuth', { message: nestRawMessage(json) || 'no JSON body', statusCode: res.status }, { path });
    }
    const message = ok
      ? typeof json?.message === 'string'
        ? json.message
        : undefined
      : pickMessage(json, res.status, path) || messageForStatus(res.status, null);
    return {
      ok,
      data,
      message,
      error: typeof json?.error === 'string' ? json.error : json?.error?.code,
      status: res.status,
    };
  } catch (e) {
    warnDev('NestAuth', e, { path, status: res.status });
    return { ok: false, message: BAD_ANSWER_MESSAGE, error: 'bad_response', status: res.status };
  }
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

export async function checkTukuaAccount(email: string, phone: string) {
  return nestPost<{ exists?: boolean; unpaid?: boolean }>('/platform/auth/register-check', {
    email,
    phone,
  });
}

export async function platformRegister(body: {
  email: string;
  phone?: string;
  password: string;
  full_name?: string;
  username?: string;
  account_type?: string;
  role?: string;
  activation_status?: string;
  registration_payment_status?: string;
}) {
  return nestPost<{ access_token?: string; refresh_token?: string; user?: unknown }>(
    '/platform/auth/register',
    body,
  );
}

export async function platformLogin(identifier: string, password: string) {
  return nestPost<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: {
      id?: string;
      activation_status?: string | null;
      registration_payment_status?: string | null;
    };
  }>('/platform/auth/login', { identifier, password });
}

export async function mpesaStk(body: Record<string, unknown>, bearer?: string | null) {
  return nestPost<Record<string, unknown>>('/payments/mpesa/stk', body, bearer);
}

/**
 * Registration (PEA) prompt. Same Nest route as top-ups. No fallback to `/payments/mpesa/gw-init` on a
 * network error or timeout: the first prompt may already be on the phone, and gw-init would send a second.
 */
export async function mpesaGwInit(body: Record<string, unknown>, bearer?: string | null) {
  return mpesaStk(body, bearer);
}

export async function mpesaCheckStatus(checkout_request_id: string, bearer?: string | null) {
  return nestPost<Record<string, unknown>>(
    '/payments/mpesa/status',
    { checkout_request_id },
    bearer,
  );
}

export async function sendRegistrationWelcome(body: {
  user_id: string;
  mode?: string;
  organization_ids?: string[];
}) {
  return nestPost('/platform/edge/send-registration-welcome', body);
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
  const res = await fetchWithTimeout(`${nestBase()}/platform/registration/pea-config${q}`, {
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
    res = await fetchWithTimeout(`${nestBase()}/platform/registration/org-types`, {
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
    res = await fetchWithTimeout(
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
    res = await fetchWithTimeout(`${nestBase()}/platform/registration/school-join`, {
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
