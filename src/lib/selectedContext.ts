import * as SecureStore from 'expo-secure-store';

const SELECTED_CONTEXT_PREFIX = 'tukua_selected_context_';

export type StoredContext = {
  schoolId: string;
  /** Parent focus — null for teacher/admin school-only context. */
  studentId: string | null;
};

function key(userId: string) {
  return `${SELECTED_CONTEXT_PREFIX}${userId}`;
}

export async function getSelectedContext(userId: string): Promise<StoredContext | null> {
  if (!userId) return null;
  try {
    const raw = await SecureStore.getItemAsync(key(userId));
    if (!raw) return null;
    // Legacy: school id only
    if (!raw.includes('{')) {
      return { schoolId: raw, studentId: null };
    }
    const parsed = JSON.parse(raw) as StoredContext;
    if (!parsed?.schoolId) return null;
    return {
      schoolId: String(parsed.schoolId),
      studentId: parsed.studentId ? String(parsed.studentId) : null,
    };
  } catch {
    return null;
  }
}

export async function setSelectedContext(userId: string, ctx: StoredContext): Promise<void> {
  if (!userId || !ctx.schoolId) return;
  await SecureStore.setItemAsync(key(userId), JSON.stringify(ctx));
}

export async function clearSelectedContext(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await SecureStore.deleteItemAsync(key(userId));
  } catch {
    // ignore
  }
}

/** @deprecated use clearSelectedContext */
export async function clearSelectedSchoolId(userId: string): Promise<void> {
  await clearSelectedContext(userId);
}
