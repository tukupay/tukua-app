/**
 * Expo web only (Metro resolves `*.web.ts`). Native still uses `secureStore.ts` → expo-secure-store.
 * `expo-secure-store` ships `ExpoSecureStore.web.ts` as `export default {}`, so getItemAsync crashes.
 */
const PREFIX = 'tukua-secure:';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function fullKey(key: string) {
  return `${PREFIX}${key}`;
}

export async function getItemAsync(key: string): Promise<string | null> {
  const store = storage();
  if (!store) return null;
  try {
    return store.getItem(fullKey(key));
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  const store = storage();
  if (!store) return;
  store.setItem(fullKey(key), value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  const store = storage();
  if (!store) return;
  store.removeItem(fullKey(key));
}

export async function isAvailableAsync(): Promise<boolean> {
  return storage() != null;
}
