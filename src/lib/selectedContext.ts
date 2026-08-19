import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const SELECTED_CONTEXT_PREFIX = 'tukua_selected_context_';

export type StoredContext = {
  schoolId: string;
  /** Parent focus — null for teacher/admin school-only context. */
  studentId: string | null;
  /** Active hat when user has multiple roles at one school (parent, teacher, security, …). */
  activeRole?: string | null;
};

function key(userId: string) {
  return `${SELECTED_CONTEXT_PREFIX}${userId}`;
}

function fileUri(userId: string) {
  const base = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${base}${SELECTED_CONTEXT_PREFIX}${userId}.json`;
}

function parseRaw(raw: string | null | undefined): StoredContext | null {
  if (!raw) return null;
  try {
    // Legacy: school id only
    if (!raw.includes('{')) {
      return { schoolId: raw, studentId: null, activeRole: null };
    }
    const parsed = JSON.parse(raw) as StoredContext;
    if (!parsed?.schoolId) return null;
    return {
      schoolId: String(parsed.schoolId),
      studentId: parsed.studentId ? String(parsed.studentId) : null,
      activeRole: parsed.activeRole ? String(parsed.activeRole).toLowerCase().trim() : null,
    };
  } catch {
    return null;
  }
}

async function readFileBackup(userId: string): Promise<StoredContext | null> {
  try {
    const uri = fileUri(userId);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(uri);
    return parseRaw(raw);
  } catch {
    return null;
  }
}

async function writeFileBackup(userId: string, ctx: StoredContext): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(fileUri(userId), JSON.stringify(ctx));
  } catch {
    // ignore — SecureStore is primary
  }
}

export async function getSelectedContext(userId: string): Promise<StoredContext | null> {
  if (!userId) return null;
  try {
    const raw = await SecureStore.getItemAsync(key(userId));
    const fromSecure = parseRaw(raw);
    if (fromSecure?.schoolId) return fromSecure;
  } catch {
    /* fall through to file backup */
  }
  return readFileBackup(userId);
}

export async function setSelectedContext(userId: string, ctx: StoredContext): Promise<void> {
  if (!userId || !ctx.schoolId) return;
  const normalized: StoredContext = {
    schoolId: String(ctx.schoolId),
    studentId: ctx.studentId ? String(ctx.studentId) : null,
    activeRole: ctx.activeRole ? String(ctx.activeRole).toLowerCase().trim() : null,
  };
  const payload = JSON.stringify(normalized);
  try {
    await SecureStore.setItemAsync(key(userId), payload);
  } catch {
    /* still write file backup */
  }
  await writeFileBackup(userId, normalized);
}

export async function clearSelectedContext(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await SecureStore.deleteItemAsync(key(userId));
  } catch {
    // ignore
  }
  try {
    const uri = fileUri(userId);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

/** @deprecated use clearSelectedContext */
export async function clearSelectedSchoolId(userId: string): Promise<void> {
  await clearSelectedContext(userId);
}
