/**
 * Nest platform auth helpers for mobile — OTP, password reset, login/register.
 * No Deno / Supabase Auth for these flows.
 */
import { getNestApiBaseUrl } from './localHost';

function nestBase(): string {
  return getNestApiBaseUrl().replace(/\/$/, '');
}

async function nestPost<T>(path: string, body: unknown): Promise<{ ok: boolean; data?: T; message?: string; error?: string; status: number }> {
  const res = await fetch(`${nestBase()}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => null);
  const data =
    json && typeof json === 'object' && 'data' in json ? (json as { data: T }).data : (json as T);
  return {
    ok: res.ok && (json?.success !== false),
    data,
    message: json?.message,
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

export async function forgotPassword(email: string, redirect_to?: string) {
  return nestPost<{ email: string }>('/platform/auth/password/forgot', { email, redirect_to });
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

export async function mpesaGwInit(body: Record<string, unknown>) {
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
