/**
 * Dashboard tiles per persona — Feather icons (modern stroke set via Expo).
 *
 * Each persona has titled sections: "Quick access" first (the most-used actions for that kind of user,
 * max 8, Courses always there, Tukua AI present but never first), then related modules grouped together.
 * `*_DASHBOARD_ACTIONS` are the same tiles flattened in section order (Quick access first).
 */

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

const NOTIFICATIONS_ACTION: DashboardAction = {
  id: 'notifications',
  title: 'Notifications',
  description: 'Alerts & updates',
  icon: 'bell',
  nativeScreen: 'Notifications',
  accent: '#0F766E',
  tokenGated: false,
};

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

export type HeroStat = {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  subtitleValue: string;
  colors: [string, string];
  icon: FeatherIconName;
};

// ─── Parent ────────────────────────────────────────────────────────────────────────────────────

export const PARENT_HERO: HeroStat[] = [
  { id: 'total', title: 'Family fees', value: 'KES —', subtitle: 'All children', subtitleValue: 'Outstanding', colors: ['#059669', '#0EA5E9'], icon: 'credit-card' },
  { id: 'fees', title: 'Fee Balance', value: 'KES —', subtitle: 'School fees', subtitleValue: 'Outstanding', colors: ['#0284C7', '#38BDF8'], icon: 'dollar-sign' },
  { id: 'pocket', title: 'Pocket Money', value: 'KES —', subtitle: 'Wallet', subtitleValue: 'Available', colors: ['#F59E0B', '#F97316'], icon: 'pocket' },
];

export const PARENT_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      { id: 'school-fees', title: 'School Fees', description: 'Pay · invoices · bank slips', icon: 'credit-card', nativeScreen: 'Accounts', accent: '#059669' },
      { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
      { id: 'assessments', title: 'Exams & results', description: 'Exams, report cards & slips', icon: 'clipboard', nativeScreen: 'Assessments', accent: '#0EA5E9' },
      TUKUA_AI_ACTION,
      coursesAction('Courses for you & your child'),
      { id: 'attendance', title: 'Attendance', description: 'View attendance', icon: 'check-square', nativeScreen: 'Attendance', accent: '#14B8A6' },
      { id: 'transport', title: 'Transport', description: 'Track bus · live location', icon: 'navigation', nativeScreen: 'Transport', accent: '#0E7490' },
      { id: 'events', title: 'Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#F59E0B' },
    ],
  },
  {
    id: 'school-life',
    title: 'School life',
    actions: [
      { id: 'teachers', title: 'Teachers', description: "Your child's teachers", icon: 'users', nativeScreen: 'Teachers', accent: '#6366F1' },
      { id: 'clubs', title: 'Clubs', description: 'Register · club notes', icon: 'award', nativeScreen: 'Clubs', accent: '#E11D48' },
      { id: 'discipline', title: 'Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#EF4444' },
      { id: 'library', title: 'Library', description: 'Borrow & return statement', icon: 'book', nativeScreen: 'Library', accent: '#8B5CF6' },
      { id: 'bursary', title: 'Bursary', description: 'Kitty & contributions', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
    ],
  },
  {
    id: 'connect',
    title: 'Stay connected',
    actions: [
      { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
      NOTIFICATIONS_ACTION,
      { id: 'school-info', title: 'My school', description: 'About · join another school', icon: 'home', nativeScreen: 'SchoolInfo', accent: '#15411D', tokenGated: false },
      REFER_EARN_ACTION,
    ],
  },
];
export const PARENT_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(PARENT_DASHBOARD_SECTIONS);

// ─── Student ───────────────────────────────────────────────────────────────────────────────────

export const STUDENT_HERO: HeroStat[] = [
  { id: 'grade', title: 'Current Grade', value: '—', subtitle: 'Student ID', subtitleValue: '—', colors: ['#0A3D2E', '#0F5C42'], icon: 'award' },
  { id: 'pocket', title: 'Pocket Money', value: 'KES —', subtitle: 'Wallet', subtitleValue: 'Available', colors: ['#0F5C42', '#E85D04'], icon: 'credit-card' },
  { id: 'pending-fees', title: 'School fees', value: '—', subtitle: 'Balance', subtitleValue: 'View in School Fees', colors: ['#062820', '#0F5C42'], icon: 'dollar-sign' },
  { id: 'attendance', title: 'Attendance', value: '—%', subtitle: 'This Term', subtitleValue: 'On Track', colors: ['#0A3D2E', '#E85D04'], icon: 'trending-up' },
  { id: 'pending', title: 'Pending Work', value: '—', subtitle: 'Due Soon', subtitleValue: 'Action Required', colors: ['#E85D04', '#F48C06'], icon: 'clock' },
];

export const STUDENT_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      coursesAction('Courses & materials'),
      { id: 'my-assignments', title: 'Assignments', description: 'Homework & classwork', icon: 'clipboard', nativeScreen: 'StudentAssignments', accent: '#6366F1' },
      { id: 'my-timetable', title: 'My Timetable', description: 'Class schedules', icon: 'calendar', nativeScreen: 'TeacherTimetable', accent: '#D97706' },
      TUKUA_AI_ACTION,
      { id: 'my-grades', title: 'Grades & progress', description: 'Results, rank & report forms', icon: 'award', nativeScreen: 'StudentGrades', accent: '#1F8B4C' },
      { id: 'school-fees', title: 'School Fees', description: 'Pay fees online', icon: 'dollar-sign', nativeScreen: 'Accounts', accent: '#059669' },
      { id: 'pocket-money', title: 'Pocket Money', description: 'Wallet (read-only)', icon: 'pocket', nativeScreen: 'StudentPocketMoney', accent: '#7C3AED' },
      { id: 'tukua-pay', title: 'Tukua Pay', description: 'Balances · deposit · send', icon: 'credit-card', nativeScreen: 'TukuaPayHome', accent: '#0EA5E9', tokenGated: false },
    ],
  },
  {
    id: 'school-life',
    title: 'School life',
    actions: [
      { id: 'my-attendance', title: 'My Attendance', description: 'View attendance', icon: 'users', nativeScreen: 'StudentAttendance', accent: '#0891B2' },
      { id: 'school-events', title: 'School Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
      { id: 'clubs', title: 'Clubs', description: 'My clubs · notes', icon: 'award', nativeScreen: 'Clubs', accent: '#E11D48' },
      { id: 'my-discipline', title: 'My Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },
      { id: 'face-enroll', title: 'My face', description: 'Enroll your face for boarding', icon: 'user', nativeScreen: 'FaceSelfEnroll', accent: '#0E7490' },
      { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
    ],
  },
  {
    id: 'connect',
    title: 'Stay connected',
    actions: [
      { id: 'meetings', title: 'Meetings', description: 'Video calls — not event QR scan', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
      NOTIFICATIONS_ACTION,
      { id: 'school-info', title: 'My school', description: 'About · join another school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },
      REFER_EARN_ACTION,
    ],
  },
];
export const STUDENT_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(STUDENT_DASHBOARD_SECTIONS);

// ─── Teacher ───────────────────────────────────────────────────────────────────────────────────

export const TEACHER_HERO: HeroStat[] = [
  { id: 'classes', title: 'My Classes', value: '—', subtitle: 'School', subtitleValue: 'Assigned', colors: ['#0A3D2E', '#0F5C42'], icon: 'users' },
  { id: 'students', title: 'Total Students', value: '—', subtitle: 'Across classes', subtitleValue: 'Active', colors: ['#0F5C42', '#E85D04'], icon: 'book' },
  { id: 'workload', title: 'Workload', value: '—', subtitle: 'Class × Subject', subtitleValue: 'Assigned', colors: ['#062820', '#0F5C42'], icon: 'clipboard' },
];

const OFFICE_ROLES = ['school_admin', 'principal', 'deputy_principal', 'admin'];

/** Every tile a teacher or school-office user can have, by id (sections below pick from here). */
const T = {
  tukuaPay: { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
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
  bursary: { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
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
  profile: { id: 'my-profile', title: 'My Profile', description: 'Account settings', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#059669' },
  schoolInfo: { id: 'school-info', title: 'My school', description: 'About · join another school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },
} satisfies Record<string, DashboardAction>;

export const TEACHER_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [T.timetable, T.enterMarks, T.courses, TUKUA_AI_ACTION, T.gateCheckIn, T.classLists, T.reports, T.tukuaPay],
  },
  { id: 'classroom', title: 'Classroom', actions: [T.scanMarks, T.progress, T.discipline, T.library] },
  // Principals / office staff on the teacher hat: each tile keeps its own role gate.
  { id: 'office', title: 'School office', actions: [T.approvals, T.overview, T.students, T.teachers, T.parents, T.accounts] },
  // Teachers and principals: refer learners and parents (owner, 2026-10-17).
  {
    id: 'community',
    title: 'School life & account',
    actions: [T.events, T.meetings, NOTIFICATIONS_ACTION, T.bursary, T.schoolInfo, T.profile, REFER_EARN_ACTION],
  },
];
export const TEACHER_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(TEACHER_DASHBOARD_SECTIONS);

// ─── Security ──────────────────────────────────────────────────────────────────────────────────

export const SECURITY_HERO: HeroStat[] = [
  { id: 'active-trip', title: 'Active trip', value: '—', subtitle: 'Status', subtitleValue: 'No run', colors: ['#0A3D2E', '#0F5C42'], icon: 'navigation' },
  { id: 'boarded', title: 'Boarded today', value: '—', subtitle: 'Students', subtitleValue: 'This trip', colors: ['#0F5C42', '#E85D04'], icon: 'users' },
  { id: 'assignment', title: 'Assignment', value: '—', subtitle: 'Vehicle', subtitleValue: 'Route', colors: ['#062820', '#0F5C42'], icon: 'map-pin' },
];

export const SECURITY_DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'quick',
    title: 'Quick access',
    actions: [
      { id: 'daily-attendance', title: 'Daily attendance', description: 'Mark students · teachers · staff (face · QR · search)', icon: 'check-square', nativeScreen: 'SecurityDailyAttendance', accent: '#0891B2' },
      { id: 'trips', title: 'Trips & board', description: 'Start trip · GPS · board students', icon: 'navigation', nativeScreen: 'SecurityHome', accent: '#0E7490' },
      coursesAction(),
      TUKUA_AI_ACTION,
      { id: 'fleet-map', title: 'Fleet map', description: 'Every vehicle · live position · paths', icon: 'map-pin', nativeScreen: 'FleetMap', accent: '#2563EB' },
      { id: 'gate-qr', title: 'Gate QR display', description: 'Show rotating QR for staff check-in', icon: 'grid', nativeScreen: 'GateQr', accent: '#7C3AED' },
      { id: 'face-enroll', title: 'Face enroll', description: 'Save faces for students · staff · teachers', icon: 'user', nativeScreen: 'SecurityFaceEnroll', accent: '#2563EB' },
      { id: 'tukua-pay', title: 'Tukua Pay', description: 'Staff wallet & tokens', icon: 'credit-card', nativeScreen: 'TukuaPayHome', accent: '#0EA5E9', tokenGated: false },
    ],
  },
  {
    id: 'more',
    title: 'School & account',
    actions: [
      NOTIFICATIONS_ACTION,
      { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
      { id: 'school-info', title: 'My school', description: 'About · join another school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },
    ],
  },
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
    actions: [T.overview, T.approvals, T.courses, TUKUA_AI_ACTION, T.students, T.accounts, T.teachers, T.tukuaPay],
  },
  {
    id: 'school',
    title: 'People & school life',
    actions: [T.parents, T.fleetMap, T.events, T.meetings, T.discipline, T.library, T.bursary, T.gateCheckIn],
  },
  {
    id: 'classroom',
    title: 'Classroom',
    actions: [T.enterMarks, T.scanMarks, T.classLists, T.timetable, T.reports, T.progress].map(teachingOnly),
  },
  { id: 'account', title: 'Account', actions: [NOTIFICATIONS_ACTION, T.profile, T.schoolInfo, REFER_EARN_ACTION] },
];
export const SCHOOL_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = flattenDashboardSections(SCHOOL_ADMIN_DASHBOARD_SECTIONS);

export const SCHOOL_ADMIN_HERO: HeroStat[] = [
  { id: 'learners', title: 'Learners', value: '—', subtitle: 'School', subtitleValue: 'Active roll', colors: ['#0A3D2E', '#0F5C42'], icon: 'users' },
  { id: 'collected', title: 'Fees collected', value: 'KES —', subtitle: 'This year', subtitleValue: 'Receipts', colors: ['#059669', '#0EA5E9'], icon: 'dollar-sign' },
  { id: 'outstanding', title: 'Outstanding', value: 'KES —', subtitle: 'Fee balances', subtitleValue: 'To collect', colors: ['#B45309', '#F59E0B'], icon: 'alert-circle' },
];

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
      { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
      TUKUA_AI_ACTION,
      NOTIFICATIONS_ACTION,
      { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
      { id: 'profile', title: 'Profile', description: 'Account & balances', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#1F8B4C', tokenGated: false },
      { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },
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
      { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
      { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },
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
      { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
      NOTIFICATIONS_ACTION,
      { id: 'profile', title: 'Profile', description: 'Account & balances', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#1F8B4C', tokenGated: false },
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
