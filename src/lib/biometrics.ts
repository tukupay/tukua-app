import * as LocalAuthentication from 'expo-local-authentication';
import {
  clearBiometricCredentials,
  getBiometricCredentials,
  getCachedPassword,
  normalizeBiometricEmail,
  refreshBiometricCredentialsIfEnabled,
  saveBiometricCredentials,
} from './biometricStorage';
import { fetchProfile, signInWithEmail } from './auth';

export type BiometricEnableResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'cancelled' | 'no_password' };

export async function checkBiometricSupport() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricLoginAvailable() {
  const { email, pass, enabled } = await getBiometricCredentials();
  if (!enabled || !email || !pass) return false;
  return checkBiometricSupport();
}

export async function authenticateDevice(reason: string) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function biometricLogin(): Promise<boolean> {
  const { email, pass } = await getBiometricCredentials();
  if (!email || !pass) return false;

  const ok = await authenticateDevice('Log in with your fingerprint or PIN');
  if (!ok) return false;

  const { user } = await signInWithEmail(email, pass);
  if (user) {
    await fetchProfile(user.id);
  }
  return !!user;
}

export async function setupBiometricsAfterLogin(email: string) {
  const canAuth = await checkBiometricSupport();
  if (!canAuth) return false;

  const normalized = normalizeBiometricEmail(email);
  const stored = await getBiometricCredentials();
  if (stored.email && stored.email.toLowerCase() !== normalized) {
    await clearBiometricCredentials();
    return false;
  }

  if (stored.enabled && stored.email?.toLowerCase() === normalized && stored.pass) {
    const cached = await getCachedPassword();
    if (cached) {
      await saveBiometricCredentials(normalized, cached);
    }
    return true;
  }

  return false;
}

export async function enableBiometrics(
  email: string,
  password?: string,
): Promise<BiometricEnableResult> {
  const canAuth = await checkBiometricSupport();
  if (!canAuth) return { ok: false, reason: 'unsupported' };

  const ok = await authenticateDevice('Confirm identity to enable biometric login');
  if (!ok) return { ok: false, reason: 'cancelled' };

  const pass = password ?? (await getCachedPassword());
  if (!pass) return { ok: false, reason: 'no_password' };

  await saveBiometricCredentials(normalizeBiometricEmail(email), pass);
  return { ok: true };
}

export async function repairBiometricsAfterPasswordLogin(email: string, password: string) {
  await refreshBiometricCredentialsIfEnabled(email, password);
}

export function biometricEnableMessage(reason: Exclude<BiometricEnableResult, { ok: true }>['reason']) {
  switch (reason) {
    case 'unsupported':
      return 'This device does not have fingerprint or face unlock set up.';
    case 'cancelled':
      return 'Biometric confirmation was cancelled.';
    case 'no_password':
      return 'Sign out and sign in with your password once, then try enabling biometrics again.';
    default:
      return 'Could not enable biometric login.';
  }
}
