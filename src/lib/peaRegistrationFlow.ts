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
import { fetchWithTimeout } from './apiHttp';

export type PeaStatus = 'idle' | 'sending' | 'pending' | 'completed' | 'failed';

export type RegistrationForm = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  idNumber: string;
  county: string;
  /** Profile persona — student / parent / teacher / school_admin (people, not orgs). */
  accountType: string;
  role: string;
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
  const res = await fetchWithTimeout(`${getNestApiBaseUrl().replace(/\/$/, '')}${path}`, {
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
  accessToken?: string | null,
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
  const r = await mpesaGwInit(
    {
      phone_number: mpesaPhone,
      email: form.email.trim(),
      amount,
      purpose: 'phone_activation',
      description: `PEA — Phone Activation (KES ${amount})`,
    },
    accessToken,
  );
  const payload = (r.data || {}) as Record<string, any>;
  const nested = payload.checkout_request_id ? payload : payload.data || payload;
  if (!r.ok || !nested?.checkout_request_id) {
    const raw = r.message || (typeof payload.error === 'string' ? payload.error : '') || '';
    let error = raw || "We couldn't start M-Pesa. Please try again.";
    if (r.error === 'timeout') {
      error = 'M-Pesa is slow to answer. If a prompt reaches your phone, enter your PIN; otherwise wait a minute and tap Complete again.';
    } else if (r.error === 'network_error' || r.status === 0) {
      error = 'M-Pesa did not start. Wait a moment and tap Complete again.';
    } else if (r.status === 401 || r.status === 403) {
      error = 'Could not start payment. Tap Complete again.';
    }
    return {
      ok: false,
      error,
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
  accessToken?: string | null,
): Promise<{ status: 'completed' | 'failed' | 'timeout'; message?: string; resultCode?: number }> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const r = await mpesaCheckStatus(checkoutId, accessToken);
      const data = (r.data || {}) as Record<string, any>;
      const status = data.status || data.data?.status;
      if (status === 'completed') return { status: 'completed' };
      if (status === 'failed' || status === 'cancelled') {
        return {
          status: 'failed',
          message:
            data.message ||
            (status === 'cancelled' || Number(data.result_code) === 1032
              ? 'You cancelled the M-Pesa prompt. Nothing was charged — tap Complete to try again.'
              : 'Payment failed or cancelled.'),
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

  const role = form.isOrg
    ? form.orgSubtype || 'organization'
    : form.role || form.accountType || 'individual';
  const pea = await peaCompleteSignup({
    email: form.email.trim(),
    password: form.password,
    checkout_request_id: checkoutId,
    full_name: form.fullName.trim(),
    phone: phoneE164,
    phone_number: phoneE164,
    role,
    account_type: form.isOrg ? form.accountType : 'individual',
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

const ALREADY_ON_TUKUA = 'This email or phone is already registered on Tukua. Sign in.';

function unpaidPea(user?: {
  activation_status?: string | null;
  registration_payment_status?: string | null;
} | null): boolean {
  const pay = String(user?.registration_payment_status || '').toLowerCase();
  const act = String(user?.activation_status || '').toLowerCase();
  if (pay === 'paid') return false;
  if (pay === 'unpaid' || pay === 'deferred' || pay === 'pending') return true;
  if (act === 'pending_payment') return true;
  return false;
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
    account_type: form.isOrg ? form.accountType : 'individual',
    role: form.role || form.accountType || 'individual',
    activation_status: 'pending_payment',
    registration_payment_status: 'unpaid',
  });
  if (!reg.ok) {
    const code = String(reg.error || '');
    const msg = String(reg.message || '');
    const already =
      code === 'account_exists' ||
      code === 'account_unpaid' ||
      /already registered|already exists|conflict|taken|sign in/i.test(msg);
    if (!already) {
      return { ok: false, error: reg.message || reg.error || 'Could not create account' };
    }
    if (code === 'account_exists') {
      return { ok: false, error: ALREADY_ON_TUKUA };
    }
    const login = await platformLogin(form.email.trim(), form.password);
    if (!login.ok) {
      return {
        ok: false,
        error: 'Already on Tukua. Sign in, or use a different email or phone.',
      };
    }
    const data = login.data as
      | {
          access_token?: string;
          user?: {
            id?: string;
            activation_status?: string | null;
            registration_payment_status?: string | null;
          };
        }
      | undefined;
    // Paid / active Tukua account — do not start another PEA. Unpaid may finish payment.
    if (code !== 'account_unpaid' && !unpaidPea(data?.user)) {
      return { ok: false, error: ALREADY_ON_TUKUA };
    }
    return {
      ok: true,
      userId: data?.user?.id,
      accessToken: data?.access_token,
    };
  }
  const data = reg.data as { access_token?: string; user?: { id?: string } } | undefined;
  let accessToken = data?.access_token;
  if (!accessToken) {
    const login = await platformLogin(form.email.trim(), form.password);
    if (login.ok) {
      accessToken = (login.data as { access_token?: string } | undefined)?.access_token;
    }
  }
  return {
    ok: true,
    userId: data?.user?.id,
    accessToken,
  };
}
