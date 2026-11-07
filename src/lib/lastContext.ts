/**
 * The last school + role hat each user opened the app as (owner, 2026-11-07: "remember the last logged in
 * user type and login as that ... until they shift profile").
 *
 * Unlike the selected context (selectedContext.ts, which is cleared on logout, on "Switch profile" and when
 * the picker is forced), this per-user map survives logout, so the next login opens straight into the same
 * school and role. It is only overwritten when the user lands on a context (picks, switches or is
 * auto-placed), never cleared by a switch that is abandoned half way.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredContext } from './selectedContext';

const KEY = 'tukua_last_context_v1';

export type LastContext = {
  userId: string;
  schoolId: string | null;
  role: string | null;
  studentId: string | null;
  /** Opened as an individual (no school), the 'skipped' context. */
  skipped: boolean;
  at: number;
};

type LastContextMap = Record<string, LastContext>;

async function readMap(): Promise<LastContextMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LastContextMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeMap(map: LastContextMap): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore: only a convenience
  }
}

export async function getLastContext(userId: string): Promise<LastContext | null> {
  if (!userId) return null;
  const entry = (await readMap())[userId];
  if (!entry) return null;
  if (!entry.skipped && !entry.schoolId) return null;
  return entry;
}

export async function rememberLastContext(userId: string, ctx: StoredContext): Promise<void> {
  if (!userId) return;
  if (!ctx.skipped && !ctx.schoolId) return;
  const map = await readMap();
  const prev = map[userId];
  const next: LastContext = {
    userId,
    schoolId: ctx.skipped ? null : ctx.schoolId ? String(ctx.schoolId) : null,
    role: ctx.activeRole ? String(ctx.activeRole).toLowerCase().trim() : null,
    studentId: ctx.studentId ? String(ctx.studentId) : null,
    skipped: Boolean(ctx.skipped),
    at: Date.now(),
  };
  if (
    prev &&
    prev.schoolId === next.schoolId &&
    prev.role === next.role &&
    prev.studentId === next.studentId &&
    prev.skipped === next.skipped
  ) {
    return;
  }
  map[userId] = next;
  await writeMap(map);
}

/** Forget one user's remembered context (other users on this phone keep theirs). */
export async function forgetLastContext(userId: string): Promise<void> {
  if (!userId) return;
  const map = await readMap();
  if (!(userId in map)) return;
  delete map[userId];
  await writeMap(map);
}

export function lastContextAsStored(last: LastContext): StoredContext {
  return {
    schoolId: last.skipped ? null : last.schoolId,
    studentId: last.studentId,
    activeRole: last.role,
    skipped: last.skipped,
  };
}
