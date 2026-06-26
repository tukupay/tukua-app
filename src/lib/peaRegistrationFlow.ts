import { supabase } from './supabase';
import { canonicalizePhone, toE164Kenya, toMpesaPhone } from './phoneUtils';
import { log } from './logger';

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

export async function logRegistrationAttempt(
  form: RegistrationForm,
  patch: Record<string, unknown>,
  attemptId?: string | null,
): Promise<string | null> {
  const phoneE164 = toE164Kenya(form.phone);
  const phoneCanonical = canonicalizePhone(phoneE164 || form.phone);
  try {
    if (attemptId) {
      await (supabase as any)
        .from('ai_registration_attempts')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', attemptId);
      return attemptId;
    }
    const { data } = await (supabase as any)
      .from('ai_registration_attempts')
      .insert({
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
      })
      .select('id')
      .maybeSingle();
    return data?.id ?? null;
  } catch (e) {
    log.warn('Register', 'attempt log failed', String(e));
    return attemptId ?? null;
  }
}

export async function checkBlockedPhone(phone: string): Promise<string | null> {
  const phoneCanonical = canonicalizePhone(toE164Kenya(phone) || phone);
  try {
    const { data } = await (supabase as any)
      .from('ai_blocked_phones')
      .select('reason')
      .eq('phone_canonical', phoneCanonical)
      .maybeSingle();
    return data?.reason ?? null;
  } catch {
    return null;
  }
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
  const { data: stk, error: stkErr } = await supabase.functions.invoke('gw-init', {
    body: {
      phone_number: mpesaPhone,
      email: form.email.trim(),
      amount,
      purpose: 'phone_activation',
      description: `PEA — Phone Activation (KES ${amount})`,
    },
  });
  if (stkErr || !(stk as any)?.success) {
    const code = (stk as any)?.code ?? null;
    return {
      ok: false,
      error: (stk as any)?.error || stkErr?.message || "We couldn't reach M-Pesa. Please try again.",
      code: code != null ? String(code) : undefined,
    };
  }
  return {
    ok: true,
    checkoutId: (stk as any).checkout_request_id,
    reused: (stk as any).already_paid || (stk as any).resumed,
    alreadyPaid: (stk as any).already_paid,
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
      const { data } = await supabase.functions.invoke('mpesa-check-status', {
        body: { checkout_request_id: checkoutId },
      });
      if ((data as any)?.status === 'completed') {
        return { status: 'completed' };
      }
      if ((data as any)?.status === 'failed') {
        return {
          status: 'failed',
          message: (data as any)?.message || 'Payment failed or cancelled.',
          resultCode: (data as any)?.result_code ?? null,
        };
      }
    } catch {
      // keep polling
    }
  }
  return { status: 'timeout', message: 'Payment timed out. Try again.', resultCode: 1037 };
}

export async function finalizePeaAccount(
  form: RegistrationForm,
  checkoutId: string | null,
  attemptId?: string | null,
): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const phoneE164 = toE164Kenya(form.phone);
  const role = form.isOrg ? form.orgSubtype : 'individual';
  const parts = form.fullName.trim().split(' ');

  const signupMeta: Record<string, unknown> = {
    full_name: form.fullName.trim(),
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' ') ?? '',
    role,
    account_type: form.accountType,
    phone: phoneE164,
    phone_number: phoneE164,
    phone_verified: true,
    county: form.county.trim() || null,
    id_number: form.idNumber.trim() || null,
    pea_checkout_request_id: checkoutId,
    country_code: 'KE',
    country_name: 'Kenya',
    preferred_currency: 'KES',
    phone_dial_code: '+254',
  };
  if (form.isOrg) {
    signupMeta.org_subtype = form.orgSubtype;
    signupMeta.organization_name = form.orgName.trim();
    signupMeta.business_location = form.businessLocation.trim() || null;
  }

  const { data, error } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: { data: signupMeta },
  });

  if (error) {
    await logRegistrationAttempt(form, { status: 'finalize_failed', failure_reason: error.message }, attemptId);
    return {
      ok: false,
      error: `Payment received but account creation failed: ${error.message}. Contact support with your M-Pesa code.`,
    };
  }

  const userId = data.user?.id;
  if (!userId) {
    return {
      ok: false,
      error: 'Payment received but account creation failed. Contact support with your M-Pesa code.',
    };
  }

  await logRegistrationAttempt(form, { status: 'account_created', user_id: userId }, attemptId);

  if (checkoutId) {
    const { error: linkErr } = await (supabase as any).rpc('claim_mpesa_transaction', {
      _checkout_request_id: checkoutId,
    });
    if (linkErr) log.warn('Register', 'claim_mpesa_transaction failed', linkErr.message);
  }

  const { error: profileErr } = await (supabase as any)
    .from('profiles')
    .update({
      role,
      full_name: form.fullName.trim(),
      phone: phoneE164,
      phone_number: phoneE164,
      id_number: form.idNumber.trim() || null,
      account_type: form.accountType,
      org_subtype: form.isOrg ? form.orgSubtype : null,
      organization_name: form.isOrg ? form.orgName.trim() : null,
      business_location: form.businessLocation.trim() || null,
      county: form.county.trim() || null,
      approval_status: form.isOrg ? 'pending' : 'approved',
      activation_status: 'active',
      registration_payment_status: 'paid',
      country_code: 'KE',
      country_name: 'Kenya',
      preferred_currency: 'KES',
      phone_dial_code: '+254',
    })
    .eq('id', userId);

  if (profileErr) {
    log.warn('Register', 'profile update failed', profileErr.message);
  } else {
    await logRegistrationAttempt(form, { status: 'completed', user_id: userId }, attemptId);
  }

  supabase.functions
    .invoke('notify-admin-registration', { body: { user_id: userId, checkout_request_id: checkoutId } })
    .catch(() => {});
  supabase.functions
    .invoke('send-registration-welcome', { body: { user_id: userId, mode: 'paid' } })
    .catch(() => {});

  return { ok: true, userId };
}
