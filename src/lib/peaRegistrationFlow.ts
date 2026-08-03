import { canonicalizePhone, toE164Kenya, toMpesaPhone } from './phoneUtils';
import { log } from './logger';
import { getNestApiBaseUrl } from './localHost';
import {
  mpesaCheckStatus,
  mpesaGwInit,
  peaCompleteSignup,
  platformLogin,
  platformRegister,
} from './platformAuthApi';
import { getDeskToken } from './deskApi';

export type PeaStatus = 'idle' | 'sending' | 'pending' | 'completed' | 'failed';

export type RegistrationForm = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  idNumber: string;
  county: string;
  accountType: string;
  isOrg: boolean;
  orgSubtype: string;
  orgName: string;
  businessLocation: string;
};

async function nestAuthedPost(path: string, body: unknown, bearer?: string | null) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

export async function logRegistrationAttempt(
  form: RegistrationForm,
  patch: Record<string, unknown>,
  attemptId?: string | null,
): Promise<string | null> {
  const phoneE164 = toE164Kenya(form.phone);
  const phoneCanonical = canonicalizePhone(phoneE164 || form.phone);
  try {
    const tok = await getDeskToken().catch(() => null);
    if (!tok) return attemptId ?? null;
    if (attemptId) {
      await nestAuthedPost(
        '/platform/db',
        {
          table: 'ai_registration_attempts',
          action: 'update',
          filters: [{ op: 'eq', column: 'id', value: attemptId }],
          data: { ...patch, updated_at: new Date().toISOString() },
        },
        tok,
      );
      return attemptId;
    }
    const r = await nestAuthedPost(
      '/platform/db',
      {
        table: 'ai_registration_attempts',
        action: 'insert',
        data: {
          full_name: form.fullName,
          email: form.email,
          phone: phoneE164,
          phone_canonical: phoneCanonical,
          county: form.county || null,
          account_type: form.accountType,
          org_subtype: form.isOrg ? form.orgSubtype : null,
          organization_name: form.isOrg ? form.orgName : null,
          status: 'initiated',
          user_agent: 'tukua-mobile',
          url: 'register',
          ...patch,
        },
        single: true,
      },
      tok,
    );
    const id = r.json?.data?.data?.id || r.json?.data?.id;
    return id ? String(id) : attemptId ?? null;
  } catch (e) {
    log.warn('Register', 'attempt log failed', String(e));
    return attemptId ?? null;
  }
}

export async function checkBlockedPhone(_phone: string): Promise<string | null> {
  return null;
}

export async function initiatePeaPayment(
  form: RegistrationForm,
  amount: number,
): Promise<{
  ok: boolean;
  checkoutId?: string;
  reused?: boolean;
  alreadyPaid?: boolean;
  error?: string;
  code?: string;
}> {
  const phoneE164 = toE164Kenya(form.phone);
  const mpesaPhone = toMpesaPhone(phoneE164, form.phone);
  const r = await mpesaGwInit({
    phone_number: mpesaPhone,
    email: form.email.trim(),
    amount,
    purpose: 'phone_activation',
    description: `PEA — Phone Activation (KES ${amount})`,
  });
  const payload = (r.data || {}) as Record<string, any>;
  const nested = payload.checkout_request_id ? payload : payload.data || payload;
  if (!r.ok || !nested?.checkout_request_id) {
    return {
      ok: false,
      error: r.message || payload.error || "We couldn't reach M-Pesa. Please try again.",
      code: r.error != null ? String(r.error) : undefined,
    };
  }
  return {
    ok: true,
    checkoutId: String(nested.checkout_request_id),
    reused: Boolean(nested.already_paid || nested.resumed),
    alreadyPaid: Boolean(nested.already_paid),
  };
}

export async function pollPeaPayment(
  checkoutId: string,
  maxAttempts = 40,
  intervalMs = 3000,
): Promise<{ status: 'completed' | 'failed' | 'timeout'; message?: string; resultCode?: number }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const r = await mpesaCheckStatus(checkoutId);
      const data = (r.data || {}) as Record<string, any>;
      const status = data.status || data.data?.status;
      if (status === 'completed') return { status: 'completed' };
      if (status === 'failed') {
        return {
          status: 'failed',
          message: data.message || 'Payment failed or cancelled.',
          resultCode: data.result_code ?? undefined,
        };
      }
    } catch {
      /* keep polling */
    }
  }
  return { status: 'timeout', message: 'Payment timed out. Try again.', resultCode: 1037 };
}

/**
 * Same as web Register finalize — Nest POST /platform/registration/pea-complete
 * after completed M-Pesa phone_activation (not free /platform/auth/register).
 */
export async function finalizePeaAccount(
  form: RegistrationForm,
  checkoutId: string | null,
  attemptId?: string | null,
): Promise<{ ok: boolean; userId?: string; error?: string; accessToken?: string }> {
  const phoneE164 = toE164Kenya(form.phone);
  if (!checkoutId) {
    return { ok: false, error: 'Missing payment reference. Complete M-Pesa first.' };
  }

  const role = form.isOrg ? form.orgSubtype || 'organization' : 'individual';
  const pea = await peaCompleteSignup({
    email: form.email.trim(),
    password: form.password,
    checkout_request_id: checkoutId,
    full_name: form.fullName.trim(),
    phone: phoneE164,
    phone_number: phoneE164,
    role,
    account_type: form.accountType,
    county: form.county || null,
    id_number: form.idNumber || null,
    org_subtype: form.isOrg ? form.orgSubtype : null,
    organization_name: form.isOrg ? form.orgName : null,
    business_location: form.isOrg ? form.businessLocation || null : null,
    approval_status: form.isOrg ? 'pending' : 'approved',
    activation_status: 'active',
    registration_payment_status: 'paid',
  });

  if (!pea.ok || !pea.data?.user_id) {
    const detail = pea.message || pea.error || 'Account could not be created';
    await logRegistrationAttempt(
      form,
      { status: 'finalize_failed', failure_reason: detail, pea_checkout_request_id: checkoutId },
      attemptId,
    );
    return {
      ok: false,
      error: `Payment received but account creation failed: ${detail}. Contact support with your M-Pesa code.`,
    };
  }

  const userId = String(pea.data.user_id);
  await logRegistrationAttempt(
    form,
    { status: 'account_created', user_id: userId, pea_checkout_request_id: checkoutId },
    attemptId,
  );

  const login = await platformLogin(form.email.trim(), form.password);
  const accessToken =
    (login.data as { access_token?: string } | undefined)?.access_token || undefined;

  return { ok: true, userId, accessToken };
}

/** Deferred / remind-me — Nest register without PEA (same as web nestRegister). */
export async function registerDeferredAccount(form: RegistrationForm): Promise<{
  ok: boolean;
  userId?: string;
  error?: string;
  accessToken?: string;
}> {
  const phoneE164 = toE164Kenya(form.phone);
  const reg = await platformRegister({
    email: form.email.trim(),
    phone: phoneE164 || undefined,
    password: form.password,
    full_name: form.fullName.trim(),
    account_type: form.accountType,
  });
  if (!reg.ok) {
    return { ok: false, error: reg.message || reg.error || 'Could not create account' };
  }
  const data = reg.data as { access_token?: string; user?: { id?: string } } | undefined;
  return {
    ok: true,
    userId: data?.user?.id,
    accessToken: data?.access_token,
  };
}
