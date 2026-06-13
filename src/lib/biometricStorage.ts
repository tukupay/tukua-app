import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_KEYS = {
  email: 'biometric_email',
  pass: 'biometric_pass',
  enabled: 'biometric_enabled',
} as const;

export async function getBiometricCredentials() {
  const email = await SecureStore.getItemAsync(BIOMETRIC_KEYS.email);
  const pass = await SecureStore.getItemAsync(BIOMETRIC_KEYS.pass);
  const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEYS.enabled);
  return { email, pass, enabled: enabled === 'true' };
}

export async function saveBiometricCredentials(email: string, password: string) {
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.email, email);
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.pass, password);
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.enabled, 'true');
}

export async function clearBiometricCredentials() {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.email);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.pass);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.enabled);
}

export async function cachePasswordForBiometrics(password: string) {
  await SecureStore.setItemAsync('tukua_cached_password', password);
}

export async function getCachedPassword() {
  return SecureStore.getItemAsync('tukua_cached_password');
}
