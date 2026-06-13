import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_KEYS = {
  email: 'biometric_email',
  pass: 'biometric_pass',
  enabled: 'biometric_enabled',
  legacyEnabled: 'tukua_biometric_enabled',
  cachedPass: 'tukua_cached_password',
} as const;

export function normalizeBiometricEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getBiometricCredentials() {
  const email = await SecureStore.getItemAsync(BIOMETRIC_KEYS.email);
  const pass = await SecureStore.getItemAsync(BIOMETRIC_KEYS.pass);
  let enabled = (await SecureStore.getItemAsync(BIOMETRIC_KEYS.enabled)) === 'true';

  if (!enabled) {
    const legacy = await SecureStore.getItemAsync(BIOMETRIC_KEYS.legacyEnabled);
    if (legacy === '1' && email && pass) {
      enabled = true;
      await SecureStore.setItemAsync(BIOMETRIC_KEYS.enabled, 'true');
    }
  }

  return { email, pass, enabled };
}

export async function saveBiometricCredentials(email: string, password: string) {
  const normalized = normalizeBiometricEmail(email);
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.email, normalized);
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.pass, password);
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.enabled, 'true');
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.legacyEnabled, '1');
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.cachedPass, password);
}

export async function clearBiometricCredentials() {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.email);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.pass);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.enabled);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEYS.legacyEnabled);
}

export async function cachePasswordForBiometrics(password: string) {
  await SecureStore.setItemAsync(BIOMETRIC_KEYS.cachedPass, password);
}

export async function getCachedPassword() {
  return SecureStore.getItemAsync(BIOMETRIC_KEYS.cachedPass);
}

/** Re-save stored credentials after a fresh password login (fixes lost pass / stale password). */
export async function refreshBiometricCredentialsIfEnabled(email: string, password: string) {
  const creds = await getBiometricCredentials();
  const normalized = normalizeBiometricEmail(email);
  if (!creds.enabled || creds.email?.toLowerCase() !== normalized) return false;
  await saveBiometricCredentials(normalized, password);
  return true;
}
