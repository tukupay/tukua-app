import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const CHUNK_SIZE = 1800;

/** SecureStore caps values at ~2048 bytes; Supabase sessions can exceed that. */
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(`${key}_meta`);
    if (meta === 'single') {
      return SecureStore.getItemAsync(key);
    }
    if (meta?.startsWith('chunked:')) {
      const count = Number.parseInt(meta.split(':')[1] ?? '0', 10);
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        parts.push((await SecureStore.getItemAsync(`${key}_chunk_${i}`)) ?? '');
      }
      return parts.join('');
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(`${key}_meta`, 'single');
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_meta`, `chunked:${chunks}`);
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(
        `${key}_chunk_${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
  },
  removeItem: async (key: string) => {
    const meta = await SecureStore.getItemAsync(`${key}_meta`);
    await SecureStore.deleteItemAsync(`${key}_meta`);
    if (meta === 'single' || !meta) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    if (meta.startsWith('chunked:')) {
      const count = Number.parseInt(meta.split(':')[1] ?? '0', 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
      }
    }
  },
};

function createSafeClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — auth will fail until env is baked.',
    );
    // Placeholder so import never throws; real calls fail softly.
    return createClient('https://invalid.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder', {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSafeClient();
