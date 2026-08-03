/**
 * Safaricom Daraja STK result codes → user-facing copy (mobile).
 * Keep in sync with src/lib/darajaErrors.ts
 */

export type DarajaFailureKind =
  | 'cancelled'
  | 'wrong_pin'
  | 'insufficient'
  | 'unreachable'
  | 'timeout'
  | 'busy'
  | 'credentials'
  | 'rejected'
  | 'unknown';

export type DarajaUserError = {
  code: number | null;
  kind: DarajaFailureKind;
  title: string;
  message: string;
  tips: string[];
};

const BY_CODE: Record<number, Omit<DarajaUserError, 'code'>> = {
  0: {
    kind: 'unknown',
    title: 'Payment successful',
    message: 'Your M-Pesa payment completed.',
    tips: [],
  },
  1: {
    kind: 'insufficient',
    title: 'Insufficient M-Pesa balance',
    message: 'Your M-Pesa account does not have enough money for this payment.',
    tips: [
      'Top up your M-Pesa, then try again',
      'Or use a different number that has enough balance',
    ],
  },
  1001: {
    kind: 'busy',
    title: 'Another M-Pesa request is still open',
    message: 'Finish or cancel the prompt already on your phone, then try again.',
    tips: ['Close any open M-Pesa menu on your phone', 'Wait about a minute, then tap Try again'],
  },
  1019: {
    kind: 'timeout',
    title: 'M-Pesa prompt expired',
    message: 'You did not enter your PIN in time.',
    tips: [
      'Tap Try again — you usually have about a minute',
      'Keep your phone unlocked when the prompt appears',
    ],
  },
  1032: {
    kind: 'cancelled',
    title: 'Payment cancelled',
    message: 'You cancelled the M-Pesa prompt on your phone.',
    tips: ['Tap Try again when you are ready to pay', 'Do not press Cancel on the M-Pesa screen'],
  },
  1037: {
    kind: 'unreachable',
    title: 'Could not reach your phone',
    message: 'M-Pesa could not deliver the payment prompt to this number.',
    tips: [
      'Check signal — turn off airplane mode',
      'Confirm this is the SIM registered for M-Pesa',
      'On dual-SIM phones, make sure M-Pesa is on the active line',
    ],
  },
  2001: {
    kind: 'wrong_pin',
    title: 'Wrong M-Pesa PIN',
    message: 'The PIN entered on the phone was incorrect.',
    tips: [
      'Double-check your M-Pesa PIN',
      'Too many wrong attempts can lock M-Pesa — wait and retry',
    ],
  },
  2006: {
    kind: 'credentials',
    title: 'Payment could not be started',
    message: 'The payment service rejected the request. Please try again shortly.',
    tips: ['Try again in a minute', 'If it keeps failing, contact support'],
  },
};

export function classifyDarajaText(desc: string | null | undefined): DarajaFailureKind {
  const t = String(desc || '').toLowerCase();
  if (!t) return 'unknown';
  if (t.includes('cancel') || t.includes('1032')) return 'cancelled';
  if (t.includes('wrong') && (t.includes('pin') || t.includes('credential'))) return 'wrong_pin';
  if (t.includes('insufficient') || t.includes('balance') || t.includes('not enough')) {
    return 'insufficient';
  }
  if (
    t.includes('unreachable') ||
    t.includes('not available') ||
    t.includes('unable to lock') ||
    t.includes('1037')
  ) {
    return 'unreachable';
  }
  if (t.includes('timeout') || t.includes('timed out') || t.includes('expired') || t.includes('1019')) {
    return 'timeout';
  }
  if (t.includes('busy') || t.includes('in progress') || t.includes('1001')) return 'busy';
  if (t.includes('wrong credentials') || t.includes('initiator')) return 'credentials';
  if (t.includes('reject')) return 'rejected';
  return 'unknown';
}

const KIND_FALLBACK: Record<DarajaFailureKind, Omit<DarajaUserError, 'code' | 'kind'>> = {
  cancelled: BY_CODE[1032],
  wrong_pin: BY_CODE[2001],
  insufficient: BY_CODE[1],
  unreachable: BY_CODE[1037],
  timeout: BY_CODE[1019],
  busy: BY_CODE[1001],
  credentials: BY_CODE[2006],
  rejected: {
    title: 'Payment was declined',
    message: 'M-Pesa could not complete this payment.',
    tips: ['Try again', 'If it keeps failing, use a different number or contact support'],
  },
  unknown: {
    title: 'Payment did not complete',
    message: 'Something went wrong with the M-Pesa payment.',
    tips: [
      'Make sure your phone has signal and M-Pesa is working',
      'Confirm the phone number is your M-Pesa number',
      'Try again in a moment',
    ],
  },
};

export function darajaUserError(
  code: number | string | null | undefined,
  resultDesc?: string | null,
): DarajaUserError {
  const n = code == null || code === '' ? null : Number(code);
  if (n != null && Number.isFinite(n) && BY_CODE[n]) {
    return { code: n, ...BY_CODE[n] };
  }
  const kind = classifyDarajaText(resultDesc);
  const base = KIND_FALLBACK[kind];
  return {
    code: n != null && Number.isFinite(n) ? n : null,
    kind,
    title: base.title,
    message: resultDesc?.trim() && kind === 'unknown' ? String(resultDesc).trim() : base.message,
    tips: base.tips,
  };
}

export function darajaToastMessage(
  code: number | string | null | undefined,
  resultDesc?: string | null,
): string {
  return darajaUserError(code, resultDesc).message;
}
