import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearBiometricCredentials,
  getBiometricCredentials,
  getCachedPassword,
  normalizeBiometricEmail,
  refreshBiometricCredentialsIfEnabled,
  saveBiometricCredentials,
} from './biometricStorage';
import { fetchProfile, signInWithEmail } from './auth';
import { ensureNestDeskSession, saveDeskCredentials } from './deskApi';
import { log } from './logger';

export type BiometricEnableResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'cancelled' | 'no_password' };

/** Fingerprint / face hardware with at least one enrolled. Never throws (a native error reads as "no"). */
export async function checkBiometricSupport() {
  if (Platform.OS === 'web') return false;
  try {
    const [compatible, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return compatible && enrolled;
  } catch (e) {
    log.warn('Biometrics', 'support check failed', String(e));
    return false;
  }
}

/**
 * The phone can confirm it is its owner: fingerprint / face, or failing that the screen-lock PIN, pattern or
 * password (authenticateDevice allows the device fallback). Used by "Continue as".
 */
export async function checkDeviceUnlockSupport() {
  if (Platform.OS === 'web') return false;
  if (await checkBiometricSupport()) return true;
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Stored fingerprint sign-in (email + password kept in the keystore). Never throws. */
export async function isBiometricLoginAvailable() {
  try {
    const { email, pass, enabled } = await getBiometricCredentials();
    if (!enabled || !email || !pass) return false;
    return checkBiometricSupport();
  } catch (e) {
    // A keystore that cannot decrypt (e.g. after a restore from backup) must not hide the rest of the page.
    log.warn('Biometrics', 'stored credentials unreadable', String(e));
    return false;
  }
}

/** What the sign-in page needs, each part checked on its own so one failure cannot blank the others. */
export async function loadSignInBiometrics(): Promise<{ storedLogin: boolean; deviceUnlock: boolean; hardware: boolean }> {
  const [storedLogin, deviceUnlock, hardware] = await Promise.all([
    isBiometricLoginAvailable().catch(() => false),
    checkDeviceUnlockSupport().catch(() => false),
    checkBiometricSupport().catch(() => false),
  ]);
  return { storedLogin, deviceUnlock, hardware };
}

/* ---------------- Fingerprint sign-in preference (permission wizard) ---------------- */

const BIO_PREF_KEY = 'tukua_bio_signin_pref';
export type BiometricPreference = 'wanted' | 'declined' | null;

export async function getBiometricPreference(): Promise<BiometricPreference> {
  try {
    const v = await AsyncStorage.getItem(BIO_PREF_KEY);
    return v === 'wanted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export async function setBiometricPreference(pref: Exclude<BiometricPreference, null>) {
  try {
    await AsyncStorage.setItem(BIO_PREF_KEY, pref);
  } catch {
    /* ignore */
  }
}

/**
 * After a password sign-in: if the user said yes to fingerprint sign-in (wizard), store the credentials now so
 * the fingerprint button is there next time. No prompt here — they already confirmed with their finger.
 */
export async function applyBiometricPreferenceAfterLogin(email: string, password: string) {
  try {
    if ((await getBiometricPreference()) !== 'wanted') return false;
    if (!(await checkBiometricSupport())) return false;
    await saveBiometricCredentials(normalizeBiometricEmail(email), password);
    return true;
  } catch (e) {
    log.warn('Biometrics', 'apply preference failed', String(e));
    return false;
  }
}

export async function authenticateDevice(reason: string) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (e) {
    log.warn('Biometrics', 'authenticate failed', String(e));
    return false;
  }
}

/**
 * Device unlock only — returns stored email/password for the caller to run
 * the same Nest REST login path as password login.
 */
export async function unlockBiometricCredentials(): Promise<
  { email: string; password: string } | null
> {
  let creds: Awaited<ReturnType<typeof getBiometricCredentials>>;
  try {
    creds = await getBiometricCredentials();
  } catch (e) {
    log.warn('Biometrics', 'stored credentials unreadable', String(e));
    return null;
  }
  const { email, pass, enabled } = creds;
  if (!enabled || !email || !pass) return null;

  const ok = await authenticateDevice('Log in with your fingerprint or face');
  if (!ok) return null;

  return { email, password: pass };
}

/** @deprecated Prefer unlockBiometricCredentials + screen finishLogin for Nest parity. */
export async function biometricLogin(): Promise<boolean> {
  const unlocked = await unlockBiometricCredentials();
  if (!unlocked) return false;

  try {
    await saveDeskCredentials(unlocked.email, unlocked.password);
    await ensureNestDeskSession();
  } catch (e) {
    log.warn('Biometrics', 'Nest soft-connect after bio', String(e));
  }

  const { user } = await signInWithEmail(unlocked.email, unlocked.password);
  if (user) {
    await fetchProfile(user.id);
  }
  return !!user;
}

/** After sign-in: true when nothing needs asking (already on, or answered in the wizard). Never throws. */
export async function setupBiometricsAfterLogin(email: string) {
  try {
    return await setupBiometricsAfterLoginInner(email);
  } catch (e) {
    log.warn('Biometrics', 'setup after login failed', String(e));
    return true;
  }
}

async function setupBiometricsAfterLoginInner(email: string) {
  const canAuth = await checkBiometricSupport();
  // No fingerprint / face on this phone: nothing to offer (the "Enable quick login" sheet would only fail).
  if (!canAuth) return true;

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

  // Answered in the first-run wizard: "wanted" → turn it on with the password just used; "declined" → do not
  // ask again after every sign-in (it stays available from the menu).
  const pref = await getBiometricPreference();
  if (pref === 'wanted') {
    const cached = await getCachedPassword();
    if (cached) {
      await saveBiometricCredentials(normalized, cached);
      return true;
    }
  }
  if (pref === 'declined') return true;

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
