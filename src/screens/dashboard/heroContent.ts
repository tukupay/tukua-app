/**
 * What the compact dashboard hero card shows for each kind of user (owner, 2026-11-07: "make that card
 * dynamic depending on the user type and have details"). Pure mapping: DashboardHomeScreen fetches the
 * figures (only existing APIs) and passes them in; anything unknown shows "—" or its chip is left out.
 * Never invent a number here.
 */
import type { DeskPersona } from '../../lib/deskRoles';
import type { FeatherIconName } from './dashboardActions';
import { formatTokensShort } from '../../components/navigation/TokenBalancePill';

/** Where a tap on the hero or one of its chips goes. */
export type HeroTarget =
  | { kind: 'screen'; screen: HeroScreen }
  | { kind: 'web'; path: string; tab?: 'Courses' | 'Profile' }
  | { kind: 'none' };

export type HeroScreen =
  | 'Accounts'
  | 'AdminAccounts'
  | 'AdminStudents'
  | 'AdminTeachers'
  | 'Attendance'
  | 'StudentAttendance'
  | 'StudentAssignments'
  | 'StudentPocketMoney'
  | 'TeacherTimetable'
  | 'TeacherClasses'
  | 'SecurityHome'
  | 'SecurityDailyAttendance'
  | 'SuperAdminSchools';

export type HeroChip = {
  id: string;
  label: string;
  value: string;
  /** Hidden by the eye toggle (money). */
  sensitive?: boolean;
  target: HeroTarget;
};

export type HeroContent = {
  kicker: string;
  value: string;
  sensitive: boolean;
  /** One line of detail under the main figure. */
  caption: string;
  icon: FeatherIconName;
  target: HeroTarget;
  /** At most two. */
  chips: HeroChip[];
};

export type HeroLesson = { time: string; subject: string; className?: string | null };

export type HeroInput = {
  persona: DeskPersona;
  /** School-office user whose roles are finance only (bursar / accountant / finance officer). */
  isFinance: boolean;
  schoolName?: string | null;
  tokens: number | null;
  student?: {
    fees: number | null;
    attendancePct: number | null;
    pendingAssignments: number | null;
    className?: string | null;
    grade?: string | null;
    lessonsToday: number | null;
    nextLesson: HeroLesson | null;
    coursesInProgress: number | null;
  } | null;
  parent?: {
    childName?: string | null;
    childMeta?: string | null;
    childCount: number;
    fees: number | null;
    pocket: number | null;
    familyFees: number | null;
    attendancePct: number | null;
  } | null;
  teacher?: {
    classes: number | null;
    students: number | null;
    workloads: number | null;
    lessonsToday: number | null;
    nextLesson: HeroLesson | null;
  } | null;
  office?: {
    learners: number | null;
    staff: number | null;
    collected: number | null;
    outstanding: number | null;
    invoiced: number | null;
    receipts: number | null;
  } | null;
  security?: {
    tripActive: boolean;
    tripKind?: string | null;
    boarded: number | null;
    gateToday: number | null;
    vehicle?: string | null;
    route?: string | null;
  } | null;
  superAdmin?: { schools: number | null } | null;
  individual?: { coursesInProgress: number | null } | null;
};

const DASH = '—';

type TimetableRow = Record<string, unknown>;
const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** "MON".."SUN" or 0-6 (0 = Monday), as TeacherTimetableScreen reads it; null when unreadable. */
function dayIndex(row: TimetableRow): number | null {
  const raw = row.day_of_week;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isNaN(n)) return n >= 0 && n <= 6 ? n : null;
  const i = DAY_NAMES.findIndex((d) => String(raw).toLowerCase().startsWith(d));
  return i >= 0 ? i : null;
}

function hhmm(v: unknown): string {
  return String(v ?? '').slice(0, 5);
}

/** Today's periods from a timetable response: how many, and the next one still to start. */
export function summariseToday(
  data: unknown,
  now: Date = new Date(),
): { lessonsToday: number | null; nextLesson: HeroLesson | null } {
  let rows: TimetableRow[] = [];
  if (Array.isArray(data)) rows = data as TimetableRow[];
  else if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const k of ['entries', 'items', 'data']) {
      if (Array.isArray(o[k])) {
        rows = o[k] as TimetableRow[];
        break;
      }
    }
  }
  if (!rows.length) return { lessonsToday: null, nextLesson: null };
  const today = (now.getDay() + 6) % 7;
  const nowHm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todays = rows
    .filter((r) => dayIndex(r) === today)
    .map((r) => ({ r, start: hhmm(r.period_start_time || r.period_start || r.start_time) }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = todays.find((x) => x.start && x.start >= nowHm);
  return {
    lessonsToday: todays.length,
    nextLesson: next
      ? {
          time: next.start,
          subject: String(next.r.subject_name || next.r.period_name || 'Lesson'),
          className: (next.r.class_name as string | undefined) ?? null,
        }
      : null,
  };
}

export function kes(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? `KES ${DASH}` : `KES ${Math.round(n).toLocaleString()}`;
}

/** KES 1.2M / KES 350K / KES 9,800 — for the small chips. */
export function kesShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return `KES ${DASH}`;
  const a = Math.abs(n);
  if (a >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (a >= 100_000) return `KES ${Math.round(n / 1000)}K`;
  return `KES ${Math.round(n).toLocaleString()}`;
}

function count(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? DASH : Math.round(n).toLocaleString();
}

function pct(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? DASH : `${Math.round(n)}%`;
}

function firstName(name?: string | null): string {
  return String(name ?? '').trim().split(/\s+/)[0] || '';
}

function join(...parts: Array<string | null | undefined | false>): string {
  return parts.filter((p): p is string => Boolean(p && String(p).trim())).join(' · ');
}

const screen = (s: HeroScreen): HeroTarget => ({ kind: 'screen', screen: s });
const TOKENS_TARGET: HeroTarget = { kind: 'web', path: '/profile/balances', tab: 'Profile' };
const COURSES_TARGET: HeroTarget = { kind: 'web', path: '/courses', tab: 'Courses' };

function tokensChip(tokens: number | null): HeroChip {
  return { id: 'tokens', label: 'AI tokens', value: tokens == null ? DASH : formatTokensShort(tokens), target: TOKENS_TARGET };
}

export function buildHeroContent(input: HeroInput): HeroContent {
  const { persona } = input;

  if (persona === 'student') {
    const s = input.student;
    const chips: HeroChip[] = [
      { id: 'attendance', label: 'Attendance', value: pct(s?.attendancePct), target: screen('StudentAttendance') },
    ];
    if (s?.nextLesson) {
      chips.push({
        id: 'next',
        label: `Next · ${s.nextLesson.time}`,
        value: s.nextLesson.subject,
        target: screen('TeacherTimetable'),
      });
    } else if (s?.coursesInProgress) {
      chips.push({ id: 'courses', label: 'Courses', value: `${s.coursesInProgress} in progress`, target: COURSES_TARGET });
    } else {
      chips.push({
        id: 'homework',
        label: 'Homework due',
        value: count(s?.pendingAssignments),
        target: screen('StudentAssignments'),
      });
    }
    return {
      kicker: 'Fee balance',
      value: kes(s?.fees),
      sensitive: true,
      caption:
        join(
          s?.className,
          s?.grade ? `Mean ${s.grade}` : null,
          s?.lessonsToday != null ? `${s.lessonsToday} lesson${s.lessonsToday === 1 ? '' : 's'} today` : null,
        ) || input.schoolName || 'School fees',
      icon: 'dollar-sign',
      target: screen('Accounts'),
      chips,
    };
  }

  if (persona === 'parent') {
    const p = input.parent;
    const child = firstName(p?.childName);
    const family = p && p.childCount > 1 && p.familyFees != null ? `All ${p.childCount} children ${kesShort(p.familyFees)}` : null;
    return {
      kicker: child ? `${child}'s fee balance` : 'Fee balance',
      value: kes(p?.fees),
      sensitive: true,
      caption: join(family || p?.childMeta) || input.schoolName || 'School fees',
      icon: 'dollar-sign',
      target: screen('Accounts'),
      chips: [
        { id: 'attendance', label: 'Attendance', value: pct(p?.attendancePct), target: screen('Attendance') },
        { id: 'pocket', label: 'Pocket money', value: kesShort(p?.pocket), sensitive: true, target: screen('Accounts') },
      ],
    };
  }

  if (persona === 'teacher') {
    const t = input.teacher;
    const next = t?.nextLesson;
    return {
      kicker: 'Lessons today',
      value: count(t?.lessonsToday),
      sensitive: false,
      caption: next
        ? join(`Next ${next.time}`, next.subject, next.className)
        : t?.lessonsToday === 0
          ? 'No more lessons today'
          : input.schoolName || 'Your timetable',
      icon: 'calendar',
      target: screen('TeacherTimetable'),
      chips: [
        { id: 'classes', label: 'My classes', value: count(t?.classes), target: screen('TeacherTimetable') },
        t?.students
          ? { id: 'students', label: 'Learners', value: count(t.students), target: screen('TeacherTimetable') }
          : { id: 'workload', label: 'Subjects', value: count(t?.workloads), target: screen('TeacherTimetable') },
      ],
    };
  }

  if (persona === 'school_admin') {
    const o = input.office;
    const rate =
      o?.collected != null && o?.invoiced ? Math.round((o.collected / o.invoiced) * 100) : null;
    if (input.isFinance) {
      return {
        kicker: 'Fees collected',
        value: kes(o?.collected),
        sensitive: true,
        caption:
          join(
            'This year',
            rate != null ? `${rate}% of invoiced` : null,
            o?.receipts != null ? `${o.receipts.toLocaleString()} receipts` : null,
          ),
        icon: 'dollar-sign',
        target: screen('AdminAccounts'),
        chips: [
          { id: 'outstanding', label: 'Outstanding', value: kesShort(o?.outstanding), sensitive: true, target: screen('AdminAccounts') },
          { id: 'invoiced', label: 'Invoiced', value: kesShort(o?.invoiced), sensitive: true, target: screen('AdminAccounts') },
        ],
      };
    }
    return {
      kicker: 'Fees collected',
      value: kes(o?.collected),
      sensitive: true,
      caption:
        join(
          o?.outstanding != null ? `${kesShort(o.outstanding)} outstanding` : null,
          rate != null ? `${rate}% collected` : null,
        ) || input.schoolName || 'This year',
      icon: 'dollar-sign',
      target: screen('AdminAccounts'),
      chips: [
        { id: 'learners', label: 'Learners', value: count(o?.learners), target: screen('AdminStudents') },
        { id: 'staff', label: 'Staff', value: count(o?.staff), target: screen('AdminTeachers') },
      ],
    };
  }

  if (persona === 'security') {
    const s = input.security;
    return {
      kicker: 'Active trip',
      value: s?.tripActive ? 'On a run' : 'None',
      sensitive: false,
      caption: s?.tripActive
        ? join(s.tripKind?.replace(/_/g, ' '), s.route) || 'Trip in progress'
        : 'Start one from Trips',
      icon: 'navigation',
      target: screen('SecurityHome'),
      chips: [
        s?.boarded != null
          ? { id: 'boarded', label: 'Boarded', value: count(s.boarded), target: screen('SecurityHome') }
          : { id: 'gate', label: 'Gate today', value: count(s?.gateToday), target: screen('SecurityDailyAttendance') },
        { id: 'vehicle', label: s?.route || 'Vehicle', value: s?.vehicle || DASH, target: screen('SecurityHome') },
      ],
    };
  }

  if (persona === 'super_admin') {
    return {
      kicker: 'Schools on Tukua',
      value: count(input.superAdmin?.schools),
      sensitive: false,
      caption: 'Open a school to work in it',
      icon: 'grid',
      target: screen('SuperAdminSchools'),
      chips: [tokensChip(input.tokens)],
    };
  }

  // Individual (no school).
  const courses = input.individual?.coursesInProgress;
  return {
    kicker: 'AI tokens',
    value: input.tokens == null ? DASH : formatTokensShort(input.tokens),
    sensitive: false,
    caption: 'Tukua balance · tap to top up',
    icon: 'cpu',
    target: TOKENS_TARGET,
    chips:
      courses != null
        ? [{ id: 'courses', label: 'Courses', value: `${courses} in progress`, target: COURSES_TARGET }]
        : [{ id: 'courses', label: 'Courses', value: 'Browse', target: COURSES_TARGET }],
  };
}
