import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const SELECTED_CONTEXT_PREFIX = 'tukua_selected_context_';

export type StoredContext = {
  /** Null when the user skipped school/role pick (individual → student). */
  schoolId: string | null;
  /** Parent focus — null for teacher/admin school-only context. */
  studentId: string | null;
  /** Active hat when user has multiple roles at one school (parent, teacher, security, …). */
  activeRole?: string | null;
  /** Skipped school/role — no school dashboards until they pick. */
  skipped?: boolean;
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
      return { schoolId: raw, studentId: null, activeRole: null, skipped: false };
    }
    const parsed = JSON.parse(raw) as StoredContext;
    const skipped = Boolean(parsed?.skipped);
    if (!parsed?.schoolId && !skipped) return null;
    return {
      schoolId: parsed.schoolId ? String(parsed.schoolId) : null,
      studentId: parsed.studentId ? String(parsed.studentId) : null,
      activeRole: parsed.activeRole ? String(parsed.activeRole).toLowerCase().trim() : null,
      skipped,
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
    if (fromSecure?.schoolId || fromSecure?.skipped) return fromSecure;
  } catch {
    /* fall through to file backup */
  }
  const fromFile = await readFileBackup(userId);
  if (fromFile?.schoolId || fromFile?.skipped) return fromFile;
  // Fallback: context saved alongside Nest token / desk user
  try {
    const { getCachedDeskUser } = await import('./deskApi');
    const user = await getCachedDeskUser();
    const embedded = user?.selected_context ? parseRaw(JSON.stringify(user.selected_context)) : null;
    if (embedded?.schoolId || embedded?.skipped) return embedded;
  } catch {
    /* ignore */
  }
  return null;
}

export async function setSelectedContext(userId: string, ctx: StoredContext): Promise<void> {
  if (!userId) return;
  if (!ctx.skipped && !ctx.schoolId) return;
  const normalized: StoredContext = {
    schoolId: ctx.schoolId ? String(ctx.schoolId) : null,
    studentId: ctx.studentId ? String(ctx.studentId) : null,
    activeRole: ctx.activeRole ? String(ctx.activeRole).toLowerCase().trim() : null,
    skipped: Boolean(ctx.skipped),
  };
  const payload = JSON.stringify(normalized);
  try {
    await SecureStore.setItemAsync(key(userId), payload);
  } catch {
    /* still write file backup */
  }
  await writeFileBackup(userId, normalized);
  // Keep a copy on the desk session so context survives with the token
  try {
    const { attachSelectedContextToDeskUser } = await import('./deskApi');
    await attachSelectedContextToDeskUser(normalized);
  } catch {
    /* ignore */
  }
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
  try {
    const { attachSelectedContextToDeskUser } = await import('./deskApi');
    await attachSelectedContextToDeskUser(null);
  } catch {
    /* ignore */
  }
}

/** @deprecated use clearSelectedContext */
export async function clearSelectedSchoolId(userId: string): Promise<void> {
  await clearSelectedContext(userId);
}
