/**
 * Dashboard tiles per persona — Feather icons (modern stroke set via Expo).
 *
 * Each persona has titled sections: "Quick access" first (the most-used actions for that kind of user,
 * by importance and use, max 8, Courses always there, Tukua AI present but never first), then related
 * modules grouped together. TukuaPay sits in the last rows and "Join school" is the very last tile on
 * every persona (owner, 2026-11-07). No Notifications tile: the header bell opens it.
 * `*_DASHBOARD_ACTIONS` are the same tiles flattened in section order (Quick access first).
 */

import { Colors } from '../../theme/yana';

export type FeatherIconName = keyof typeof import('@expo/vector-icons').Feather.glyphMap;

export type DashboardAction = {
  id: string;
  title: string;
  description: string;
  icon: FeatherIconName;
  deskPath?: string;
  tukuaPath?: string;
  tukuaTab?: 'Courses' | 'Profile';
  nativeScreen?:
    | 'Referral'
    | 'SchoolInfo'
    | 'Notifications'
    | 'Discipline'
    | 'Events'
    | 'Meetings'
    | 'Assessments'
    | 'Transport'
    | 'Teachers'
    | 'Library'
    | 'Clubs'
    | 'Accounts'
    | 'Attendance'
    | 'Bursary'
    | 'SecurityHome'
    | 'FleetMap'
    | 'SecurityFaceEnroll'
    | 'SecurityDailyAttendance'
    | 'FaceSelfEnroll'
    | 'GateQr'
    | 'GateCheckIn'
    | 'JoinSchool'
    | 'EnterMarks'
    | 'ScanMarksheet'
    | 'TeacherMarksheet'
    | 'TeacherClasses'
    | 'TeacherReports'
    | 'TeacherTimetable'
    | 'TeacherProgress'
    | 'RecordDiscipline'
    | 'TukuaPayHome'
    | 'TukuaPayDeposit'
    | 'TukuaPaySend'
    | 'TukuaPayBank'
    | 'TukuaPayKyc'
    | 'StudentGrades'
    | 'StudentAssignments'
    | 'StudentAttendance'
    | 'StudentPocketMoney'
    | 'Approvals'
    | 'AdmitStudent'
    | 'AdminStudents'
    | 'AdminTeachers'
    | 'AdminParents'
    | 'SchoolOverview'
    | 'AdminAccounts'
    | 'SuperAdminHub'
    | 'SuperAdminSchools';
  /** When set, tile is shown only if the active role list matches (substring). */
  requireAnyRole?: string[];
  /** Hide tile unless class-teacher hat / workload gate in DashboardHome. */
  requireClassTeacher?: boolean;
  /** Params for native stack screens (e.g. SuperAdminSchools impersonate mode). */
  nativeParams?: Record<string, unknown>;
  accent?: string;
  /** When false, zero-token gate allows this tile (e.g. profile, join school). */
  tokenGated?: boolean;
};

/** A titled group of tiles on the dashboard (rendered as one card, at most 8 tiles). */
export type DashboardSection = {
  id: string;
  title: string;
  actions: DashboardAction[];
};

/**
 * Tukua AI: opens the AI chat tab. Uses the existing `tukuaPath` route, which focuses the Chat tab.
 * Sits inside Quick access (never first). Feather 'zap' renders as Ionicons 'sparkles' on the dashboard.
 */
export const TUKUA_AI_ACTION: DashboardAction = {
  id: 'tukua-ai',
  title: 'Tukua AI',
  description: 'Ask anything · jobs, courses, exams, school',
  icon: 'zap',
  tukuaPath: '/chat',
  accent: '#15411D',
};

/** Courses tab (browse, my courses, instructor studio). Same route the old E-Learning tile used. */
function coursesAction(description = 'Browse & continue learning'): DashboardAction {
  return {
    id: 'courses',
    title: 'Courses',
    description,
    icon: 'book-open',
    tukuaPath: '/courses',
    tukuaTab: 'Courses',
    accent: '#0D9488',
  };
}

const REFER_EARN_ACTION: DashboardAction = {
  id: 'refer-earn',
  title: 'Refer & Earn',
  description: 'Share your link · earn per sign-up',
  icon: 'gift',
  nativeScreen: 'Referral',
  tokenGated: false,
  accent: '#D97706',
};

/** True when a zero balance should block this dashboard tile. */
export function isDashboardActionTokenGated(action: DashboardAction): boolean {
  if (action.tokenGated === false) return false;
  if (action.id === 'profile' || action.id === 'join-school' || action.id === 'school-info') {
    return false;
  }
  return true;
}

/** Sections → one flat list (Quick access first), dropping repeated ids. */
export function flattenDashboardSections(sections: DashboardSection[]): DashboardAction[] {
  const seen = new Set<string>();
  const out: DashboardAction[] = [];
  for (const section of sections) {
    for (const action of section.actions) {
      if (seen.has(action.id)) continue;
      seen.add(action.id);
      out.push(action);
    }
  }
  return out;
}

// ─── Shared tail tiles ─────────────────────────────────────────────────────────────────────────
// Owner, 2026-11-07: on every persona TukuaPay sits in the last rows and "Join school" is the very
// last tile. Notifications has no tile any more (the bell in the dashboard header opens it).

const TUKUA_PAY_ACTION: DashboardAction = {
  id: 'tukua-pay',
  title: 'Tukua Pay',
  description: 'Wallet · deposit · send',
  icon: 'smartphone',
  nativeScreen: 'TukuaPayHome',
  tokenGated: false,
  accent: Colors.primary,
};

const JOIN_SCHOOL_ACTION: DashboardAction = {
  id: 'join-school',
  title: 'Join school',
  description: 'Add a role · join another school',
  icon: 'log-in',
  nativeScreen: 'JoinSchool',
  accent: '#2563EB',
  tokenGated: false,
};

const MY_SCHOOL_ACTION: DashboardAction = {
  id: 'school-info',
  title: 'My school',
  description: 'About your school',
  icon: 'home',
  nativeScreen: 'SchoolInfo',
  accent: Colors.primary,
  tokenGated: false,
};

const PROFILE_ACTION: DashboardAction = {
  id: 'my-profile',
  title: 'My Profile',
  description: 'Account & balances',
  icon: 'user',
  tukuaPath: '/profile',
  tukuaTab: 'Profile',
  accent: '#059669',
  tokenGated: false,
};

const BURSARY_ACTION: DashboardAction = { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' };

/** Last section on every school persona: account tiles, then TukuaPay, then Join school (last). */
function accountAndWalletSection(lead: DashboardAction[]): DashboardSection {
  return { id: 'account-wallet', title: 'Account & wallet', actions: [...lead, TUKUA_PAY_ACTION, JOIN_SCHOOL_ACTION] };
}

// ─── Parent ────────────────────────────────────────────────────────────────────────────────────

export const PARENT_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      { id: 'school-fees', title: 'School Fees', description: 'Pay · invoices · bank slips', icon: 'credit-card', nativeScreen: 'Accounts', accent: '#059669' },
      { id: 'assessments', title: 'Exams & results', description: 'Exams, report cards & slips', icon: 'clipboard', nativeScreen: 'Assessments', accent: '#0EA5E9' },
      { id: 'attendance', title: 'Attendance', description: 'View attendance', icon: 'check-square', nativeScreen: 'Attendance', accent: '#14B8A6' },
      { id: 'transport', title: 'Transport', description: 'Track bus · live location', icon: 'navigation', nativeScreen: 'Transport', accent: '#0E7490' },
      coursesAction('Courses for you & your child'),
      TUKUA_AI_ACTION,
      { id: 'events', title: 'Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#F59E0B' },
      { id: 'teachers', title: 'Teachers', description: "Your child's teachers", icon: 'users', nativeScreen: 'Teachers', accent: '#6366F1' },
    ],
  },
  {
    id: 'school-life',
    title: 'School life',
    actions: [
      { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
      { id: 'clubs', title: 'Clubs', description: 'Register · club notes', icon: 'award', nativeScreen: 'Clubs', accent: '#E11D48' },
      { id: 'discipline', title: 'Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#EF4444' },
      { id: 'library', title: 'Library', description: 'Borrow & return statement', icon: 'book', nativeScreen: 'Library', accent: '#8B5CF6' },
      { ...BURSARY_ACTION, description: 'Kitty & contributions' },
    ],
  },
  accountAndWalletSection([MY_SCHOOL_ACTION, REFER_EARN_ACTION]),
];
export const PARENT_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(PARENT_DASHBOARD_SECTIONS);

// ─── Student ───────────────────────────────────────────────────────────────────────────────────

export const STUDENT_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      { id: 'my-assignments', title: 'Assignments', description: 'Homework & classwork', icon: 'clipboard', nativeScreen: 'StudentAssignments', accent: '#6366F1' },
      { id: 'my-timetable', title: 'My Timetable', description: 'Class schedules', icon: 'calendar', nativeScreen: 'TeacherTimetable', accent: '#D97706' },
      { id: 'my-grades', title: 'Grades & progress', description: 'Results, rank & report forms', icon: 'award', nativeScreen: 'StudentGrades', accent: '#1F8B4C' },
      coursesAction('Courses & materials'),
      TUKUA_AI_ACTION,
      { id: 'my-attendance', title: 'My Attendance', description: 'View attendance', icon: 'check-square', nativeScreen: 'StudentAttendance', accent: '#0891B2' },
      { id: 'school-fees', title: 'School Fees', description: 'Pay fees online', icon: 'dollar-sign', nativeScreen: 'Accounts', accent: '#059669' },
      { id: 'school-events', title: 'School Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
    ],
  },
  {
    id: 'school-life',
    title: 'School life',
    actions: [
      { id: 'clubs', title: 'Clubs', description: 'My clubs · notes', icon: 'award', nativeScreen: 'Clubs', accent: '#E11D48' },
      { id: 'meetings', title: 'Meetings', description: 'Video calls — not event QR scan', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
      { id: 'my-discipline', title: 'My Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },
      { id: 'face-enroll', title: 'My face', description: 'Enroll your face for boarding', icon: 'user', nativeScreen: 'FaceSelfEnroll', accent: '#0E7490' },
      BURSARY_ACTION,
    ],
  },
  accountAndWalletSection([
    MY_SCHOOL_ACTION,
    REFER_EARN_ACTION,
    { id: 'pocket-money', title: 'Pocket Money', description: 'Wallet (read-only)', icon: 'pocket', nativeScreen: 'StudentPocketMoney', accent: '#7C3AED' },
  ]),
];
export const STUDENT_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(STUDENT_DASHBOARD_SECTIONS);

// ─── Teacher ───────────────────────────────────────────────────────────────────────────────────

const OFFICE_ROLES = ['school_admin', 'principal', 'deputy_principal', 'admin'];

/** Every tile a teacher or school-office user can have, by id (sections below pick from here). */
const T = {
  gateCheckIn: { id: 'attendance-scanner', title: 'My gate check-in', description: 'Scan gate QR for yourself', icon: 'camera', nativeScreen: 'GateCheckIn', accent: '#0891B2' },
  enterMarks: { id: 'enter-marks', title: 'Enter Marks', description: 'Grade assessments', icon: 'edit-3', nativeScreen: 'EnterMarks', accent: '#1F8B4C' },
  scanMarks: { id: 'scan-marks', title: 'Scan marksheet', description: 'Photo → AI extracts & batch-saves marks', icon: 'camera', nativeScreen: 'ScanMarksheet', accent: '#059669' },
  classLists: { id: 'class-lists', title: 'Class Lists', description: 'View & enroll (class teacher)', icon: 'users', nativeScreen: 'TeacherClasses', accent: '#2563EB', requireClassTeacher: true },
  timetable: { id: 'my-timetable', title: 'My Timetable', description: 'Teaching periods', icon: 'calendar', nativeScreen: 'TeacherTimetable', accent: '#D97706' },
  reports: { id: 'reports', title: 'Reports', description: 'Mark sheets · progress · forms', icon: 'file-text', nativeScreen: 'TeacherReports', accent: '#4E74F9' },
  progress: { id: 'progress', title: 'Marks progress', description: 'Outstanding mark entry', icon: 'trending-up', nativeScreen: 'TeacherProgress', accent: '#0F766E' },
  events: { id: 'events', title: 'Events', description: 'View & save to calendar', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
  meetings: { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  courses: coursesAction('Learn · instructor studio'),
  library: { id: 'library', title: 'Library', description: 'Digital books', icon: 'book', nativeScreen: 'Library', accent: '#4F46E5', requireAnyRole: ['librarian'] },
  discipline: { id: 'discipline', title: 'Discipline', description: 'Record & see my cases', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },
  // School admin / principal — existing stack screens, role-gated only
  approvals: { id: 'approvals', title: 'Approvals', description: 'Join requests & admissions', icon: 'check-circle', nativeScreen: 'Approvals', accent: '#CA8A04', requireAnyRole: ['school_admin', 'principal'] },
  overview: { id: 'school-overview', title: 'School overview', description: 'Roll & staff snapshot', icon: 'home', nativeScreen: 'SchoolOverview', accent: '#0F766E', requireAnyRole: OFFICE_ROLES },
  students: { id: 'admin-students', title: 'Students', description: 'Directory & admit', icon: 'user-plus', nativeScreen: 'AdminStudents', accent: '#2563EB', requireAnyRole: [...OFFICE_ROLES, 'registrar'] },
  teachers: { id: 'admin-teachers', title: 'Teachers', description: 'Staff directory', icon: 'users', nativeScreen: 'AdminTeachers', accent: '#4F46E5', requireAnyRole: OFFICE_ROLES },
  parents: { id: 'admin-parents', title: 'Parents', description: 'Guardian directory', icon: 'heart', nativeScreen: 'AdminParents', accent: '#DB2777', requireAnyRole: OFFICE_ROLES },
  accounts: {
    id: 'admin-accounts',
    title: 'Accounts',
    description: 'Fees · invoices · reports',
    icon: 'dollar-sign',
    nativeScreen: 'AdminAccounts',
    accent: '#047857',
    requireAnyRole: ['bursar', 'accountant', 'accounts_clerk', 'finance_officer', 'school_admin', 'principal', 'admin'],
  },
  // Fleet map: the server's transport roles (TRANSPORT_BOARDING_ROLES) — not a deputy or a bursar alone.
  fleetMap: { id: 'fleet-map', title: 'Fleet map', description: 'Every vehicle · live position · paths', icon: 'map-pin', nativeScreen: 'FleetMap', accent: '#2563EB', requireAnyRole: ['school_admin', 'principal', 'admin', 'staff', 'security'] },
} satisfies Record<string, DashboardAction>;

export const TEACHER_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    // Class Lists only shows for class teachers; the tiles after it shift up.
    actions: [T.timetable, T.enterMarks, T.classLists, T.scanMarks, T.courses, TUKUA_AI_ACTION, T.reports, T.gateCheckIn],
  },
  { id: 'classroom', title: 'Classroom & school life', actions: [T.progress, T.discipline, T.events, T.meetings, T.library, BURSARY_ACTION] },
  // Principals / office staff on the teacher hat: each tile keeps its own role gate.
  { id: 'office', title: 'School office', actions: [T.approvals, T.overview, T.students, T.teachers, T.parents, T.accounts] },
  // Teachers and principals: refer learners and parents (owner, 2026-10-17).
  accountAndWalletSection([MY_SCHOOL_ACTION, PROFILE_ACTION, REFER_EARN_ACTION]),
];
export const TEACHER_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(TEACHER_DASHBOARD_SECTIONS);

// ─── Security ──────────────────────────────────────────────────────────────────────────────────

export const SECURITY_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      { id: 'daily-attendance', title: 'Daily attendance', description: 'Mark students · teachers · staff (face · QR · search)', icon: 'check-square', nativeScreen: 'SecurityDailyAttendance', accent: '#0891B2' },
      { id: 'trips', title: 'Trips & board', description: 'Start trip · GPS · board students', icon: 'navigation', nativeScreen: 'SecurityHome', accent: '#0E7490' },
      { id: 'gate-qr', title: 'Gate QR display', description: 'Show rotating QR for staff check-in', icon: 'grid', nativeScreen: 'GateQr', accent: '#7C3AED' },
      { id: 'face-enroll', title: 'Face enroll', description: 'Save faces for students · staff · teachers', icon: 'user', nativeScreen: 'SecurityFaceEnroll', accent: '#2563EB' },
      { id: 'fleet-map', title: 'Fleet map', description: 'Every vehicle · live position · paths', icon: 'map-pin', nativeScreen: 'FleetMap', accent: '#2563EB' },
      coursesAction(),
      TUKUA_AI_ACTION,
      { id: 'events', title: 'Events', description: 'School events & check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
    ],
  },
  accountAndWalletSection([MY_SCHOOL_ACTION, BURSARY_ACTION]),
];
export const SECURITY_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(SECURITY_DASHBOARD_SECTIONS);

// ─── School office (principal, deputy, admin, bursar, registrar) ───────────────────────────────

/** Classroom tools only for people who also teach. */
const teachingOnly = (a: DashboardAction): DashboardAction => ({ ...a, requireAnyRole: ['teacher', 'class_teacher'] });

/**
 * Admin tools first, then shared school tools; classroom tools only for people who also teach.
 * Every admin tile keeps its own requireAnyRole gate.
 */
export const SCHOOL_ADMIN_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [T.overview, T.approvals, T.students, T.accounts, T.teachers, T.parents, T.courses, TUKUA_AI_ACTION],
  },
  {
    id: 'school',
    title: 'School life',
    actions: [T.events, T.meetings, T.fleetMap, T.discipline, T.library, BURSARY_ACTION, T.gateCheckIn],
  },
  {
    id: 'classroom',
    title: 'Classroom',
    actions: [T.timetable, T.enterMarks, T.scanMarks, T.classLists, T.reports, T.progress].map(teachingOnly),
  },
  accountAndWalletSection([MY_SCHOOL_ACTION, PROFILE_ACTION, REFER_EARN_ACTION]),
];
export const SCHOOL_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(SCHOOL_ADMIN_DASHBOARD_SECTIONS);

// ─── Super admin (mobile: switch into a school + hat, no company hub) ───────────────────────────

export const SUPER_ADMIN_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      {
        id: 'switch-school-role',
        title: 'Switch school & role',
        description: 'Use as teacher · security · parent · student at any school',
        icon: 'user-check',
        nativeScreen: 'SuperAdminSchools',
        nativeParams: { impersonate: true },
        accent: '#DC2626',
        tokenGated: false,
      },
      coursesAction(),
      TUKUA_AI_ACTION,
      BURSARY_ACTION,
      // Second row: account, then TukuaPay, then Join school last.
      PROFILE_ACTION,
      REFER_EARN_ACTION,
      TUKUA_PAY_ACTION,
      JOIN_SCHOOL_ACTION,
    ],
  },
];
export const SUPER_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(SUPER_ADMIN_DASHBOARD_SECTIONS);

// ─── Individual (no school yet) ────────────────────────────────────────────────────────────────

export const INDIVIDUAL_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      coursesAction(),
      TUKUA_AI_ACTION,
      {
        id: 'admin-accounts',
        title: 'Accounts',
        description: 'Fees · invoices · reports',
        icon: 'dollar-sign',
        nativeScreen: 'AdminAccounts',
        accent: '#047857',
        requireAnyRole: ['bursar', 'accountant', 'accounts_clerk', 'finance_officer'],
      },
      BURSARY_ACTION,
      // Second row: account, then TukuaPay, then Join school last.
      PROFILE_ACTION,
      REFER_EARN_ACTION,
      TUKUA_PAY_ACTION,
      JOIN_SCHOOL_ACTION,
    ],
  },
];
export const INDIVIDUAL_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(INDIVIDUAL_DASHBOARD_SECTIONS);

/** Titled sections for a persona (DashboardHome can render these instead of chunking the flat list). */
export function dashboardSectionsForPersona(persona: string | null | undefined): DashboardSection[] {
  switch (persona) {
    case 'parent':
      return PARENT_DASHBOARD_SECTIONS;
    case 'student':
      return STUDENT_DASHBOARD_SECTIONS;
    case 'teacher':
      return TEACHER_DASHBOARD_SECTIONS;
    case 'security':
      return SECURITY_DASHBOARD_SECTIONS;
    case 'school_admin':
      return SCHOOL_ADMIN_DASHBOARD_SECTIONS;
    case 'super_admin':
      return SUPER_ADMIN_DASHBOARD_SECTIONS;
    default:
      return INDIVIDUAL_DASHBOARD_SECTIONS;
  }
}
