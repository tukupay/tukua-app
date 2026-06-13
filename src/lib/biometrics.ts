import * as LocalAuthentication from 'expo-local-authentication';
import {
  clearBiometricCredentials,
  getBiometricCredentials,
  saveBiometricCredentials,
  getCachedPassword,
} from './biometricStorage';
import { fetchProfile, signInWithEmail } from './auth';

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

  const stored = await getBiometricCredentials();
  if (stored.email && stored.email !== email) {
    await clearBiometricCredentials();
  }

  if (stored.enabled && stored.email === email) return true;

  return false;
}

export async function enableBiometrics(email: string): Promise<boolean> {
  const canAuth = await checkBiometricSupport();
  if (!canAuth) return false;

  const ok = await authenticateDevice('Confirm identity to enable biometric login');
  if (!ok) return false;

  const pass = await getCachedPassword();
  if (!pass) return false;

  await saveBiometricCredentials(email, pass);
  return true;
}
