import { supabase } from './supabase';
import { log } from './logger';

type UserPreferences = Record<string, unknown> & {
  sarcasm_mode?: boolean;
  preferred_model?: string;
};

async function getCurrentPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('users')
    .select('user_preferences')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    log.warn('Preferences', 'fetch failed', error.message);
  }

  return (data?.user_preferences as UserPreferences) || {};
}

/** Toggle savage/sarcasm mode — same API as yana ChatNavbar (`users.user_preferences`). */
export async function toggleSavageMode(): Promise<boolean | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const current = await getCurrentPreferences(user.id);
  const next = !current.sarcasm_mode;

  const { error } = await supabase
    .from('users')
    .update({ user_preferences: { ...current, sarcasm_mode: next } })
    .eq('id', user.id);

  if (error) {
    log.warn('Preferences', 'savage toggle failed', error.message);
    throw error;
  }

  log.info('Preferences', 'savage mode', { enabled: next });
  return next;
}

export async function getSavageModeEnabled(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return getSavageModeForUser(user.id);
}

export async function getSavageModeForUser(userId: string): Promise<boolean> {
  const prefs = await getCurrentPreferences(userId);
  return !!prefs.sarcasm_mode;
}
