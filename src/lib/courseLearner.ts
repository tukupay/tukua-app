/**
 * Course-only learners (owner, 2026-11-07). Buying or joining a course makes the person a "student" of
 * the organisation that offers it (org_students + organization_user_roles 'student'), but that gives
 * them no school record (admin_students): every school-student call (overview, attendance, fees,
 * timetable…) fails for them. Such an organisation opens on the personal / learner dashboard instead.
 *
 * Signal: `GET /students/me` at that school, sent with the platform token (it carries every role the
 * person holds, so the answer is about the record, not about which token was sent). 200 = a real
 * school learner; 404 "Student not found" (or 403 "Student role required") = course-only. Anything
 * else (offline, 5xx) is unknown and is not remembered. The membership payloads carry no such flag
 * (org_students.join_notes 'Joined through a course' is only set for new rows), so the probe is used.
 *
 * Answers are kept per user + school in memory and AsyncStorage. A remembered answer is used at once
 * and checked again once per app session in the background.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deskFetch } from './deskApi';
import { mobilePickerRolesFrom } from './deskRoles';
import { log } from './logger';
import type { UserSchool } from './orgRoles';

export type StudentRecordState = 'school' | 'course';

const KEY = 'tukua_student_record_v1';
const PROBE_TIMEOUT_MS = 8000;

type StoredMap = Record<string, Record<string, { state: StudentRecordState; at: number }>>;

/** userId → schoolId → state. */
const memory = new Map<string, Map<string, StudentRecordState>>();
/** `${userId}:${schoolId}` probed (with a definite answer) in this app session. */
const probedThisSession = new Set<string>();
const inflight = new Map<string, Promise<StudentRecordState | null>>();

async function readStored(): Promise<StoredMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStored(userId: string, states: Map<string, StudentRecordState>): Promise<void> {
  try {
    const all = await readStored();
    const at = Date.now();
    all[userId] = Object.fromEntries([...states].map(([sid, state]) => [sid, { state, at }]));
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // only a convenience
  }
}

async function statesFor(userId: string): Promise<Map<string, StudentRecordState>> {
  const hit = memory.get(userId);
  if (hit) return hit;
  const stored = (await readStored())[userId] ?? {};
  const map = new Map<string, StudentRecordState>();
  for (const [sid, row] of Object.entries(stored)) {
    if (row?.state === 'school' || row?.state === 'course') map.set(sid, row.state);
  }
  memory.set(userId, map);
  return map;
}

/** The school lists a learner hat (student / individual) for this person. */
export function holdsLearnerHat(school: Pick<UserSchool, 'roles'>): boolean {
  return mobilePickerRolesFrom(school.roles ?? []).includes('student');
}

function statusOf(e: unknown): number | undefined {
  const s = (e as { statusCode?: unknown })?.statusCode;
  return typeof s === 'number' ? s : undefined;
}

/** One `GET /students/me` at `schoolId`: 'school', 'course', or null when it could not tell. */
export async function probeStudentRecord(schoolId: string): Promise<StudentRecordState | null> {
  const existing = inflight.get(schoolId);
  if (existing) return existing;
  const run = (async (): Promise<StudentRecordState | null> => {
    let platformToken: string | null = null;
    try {
      const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
      platformToken = await resolveNestAccessTokenForWebView();
    } catch {
      platformToken = null;
    }
    try {
      await deskFetch('/students/me', {
        token: platformToken ?? undefined,
        context: { schoolId, studentId: null, roles: ['student'] },
        timeoutMs: PROBE_TIMEOUT_MS,
      });
      return 'school';
    } catch (e) {
      const status = statusOf(e);
      const msg = e instanceof Error ? e.message : String(e);
      if (status === 404) return 'course';
      if (status === 403 && /student role required/i.test(msg)) return 'course';
      log.warn('CourseLearner', 'student record probe inconclusive', { schoolId, status, msg });
      return null;
    }
  })().finally(() => {
    inflight.delete(schoolId);
  });
  inflight.set(schoolId, run);
  return run;
}

function courseSet(states: Map<string, StudentRecordState>, schools: UserSchool[]): Set<string> {
  const out = new Set<string>();
  for (const s of schools) {
    if (holdsLearnerHat(s) && states.get(s.id) === 'course') out.add(s.id);
  }
  return out;
}

/**
 * Schools where this person's learner role is course-only. Unknown schools are probed now (in
 * parallel); remembered ones answer at once and are checked again in the background once per session,
 * calling `onChange` with the new set when the answer moved.
 */
export async function resolveCourseOnlySchools(
  userId: string,
  schools: UserSchool[],
  onChange?: (next: Set<string>) => void,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const learnerSchools = schools.filter(holdsLearnerHat);
  if (!learnerSchools.length) return new Set();
  const states = await statesFor(userId);

  const unknown = learnerSchools.filter((s) => !states.has(s.id));
  const stale = learnerSchools.filter((s) => states.has(s.id) && !probedThisSession.has(`${userId}:${s.id}`));

  const apply = (sid: string, state: StudentRecordState | null): boolean => {
    if (!state) return false;
    probedThisSession.add(`${userId}:${sid}`);
    if (states.get(sid) === state) return false;
    states.set(sid, state);
    return true;
  };

  if (unknown.length) {
    const answers = await Promise.all(unknown.map((s) => probeStudentRecord(s.id)));
    let changed = false;
    unknown.forEach((s, i) => {
      changed = apply(s.id, answers[i]) || changed;
    });
    if (changed) await writeStored(userId, states);
    log.info('CourseLearner', 'learner roles checked', {
      schools: unknown.map((s, i) => ({ id: s.id, state: answers[i] ?? 'unknown' })),
    });
  }

  if (stale.length) {
    void (async () => {
      const answers = await Promise.all(stale.map((s) => probeStudentRecord(s.id)));
      let changed = false;
      stale.forEach((s, i) => {
        changed = apply(s.id, answers[i]) || changed;
      });
      if (!changed) return;
      await writeStored(userId, states);
      log.info('CourseLearner', 'learner roles changed on re-check', {
        schools: stale.map((s, i) => ({ id: s.id, state: answers[i] ?? 'unknown' })),
      });
      onChange?.(courseSet(states, schools));
    })().catch(() => {});
  }

  return courseSet(states, schools);
}
