/**

 * Parent / Teacher / Student dashboards — Feather icons (modern stroke set via Expo).

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
    | 'SchoolInfo'
    | 'Discipline'
    | 'Events'
    | 'Meetings'
    | 'Assessments'
    | 'Transport'
    | 'Teachers'
    | 'Library'
    | 'Accounts'
    | 'Attendance'
    | 'Bursary'
    | 'SecurityHome'
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
    | 'SuperAdminSchools'
    | 'TukuaPayHome'
    | 'TeacherTimetable'
    | 'RecordDiscipline';
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



/** True when a zero balance should block this dashboard tile. */
export function isDashboardActionTokenGated(action: DashboardAction): boolean {
  if (action.tokenGated === false) return false;
  if (action.id === 'profile' || action.id === 'join-school' || action.id === 'school-info') {
    return false;
  }
  return true;
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



export const PARENT_HERO: HeroStat[] = [
  {
    id: 'total',
    title: 'Total Balance',
    value: 'KES —',
    subtitle: 'Account',
    subtitleValue: 'Parent wallet',
    colors: ['#059669', '#0EA5E9'],
    icon: 'credit-card',
  },
  {
    id: 'fees',
    title: 'Fee Balance',
    value: 'KES —',
    subtitle: 'School fees',
    subtitleValue: 'Outstanding',
    colors: ['#0284C7', '#38BDF8'],
    icon: 'dollar-sign',
  },
  {
    id: 'pocket',
    title: 'Pocket Money',
    value: 'KES —',
    subtitle: 'Wallet',
    subtitleValue: 'Available',
    colors: ['#F59E0B', '#F97316'],
    icon: 'pocket',
  },
];

export const PARENT_DASHBOARD_ACTIONS: DashboardAction[] = [
  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
  { id: 'school-fees', title: 'School Fees', description: 'Pay · invoices · bank slips', icon: 'credit-card', nativeScreen: 'Accounts', accent: '#059669' },
  { id: 'assessments', title: 'Exams & assessments', description: 'Exams, report cards & slips', icon: 'clipboard', nativeScreen: 'Assessments', accent: '#0EA5E9' },
  { id: 'events', title: 'Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#F59E0B' },
  { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  { id: 'discipline', title: 'Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#EF4444' },
  { id: 'library', title: 'Library', description: 'Borrow & return statement', icon: 'book', nativeScreen: 'Library', accent: '#8B5CF6' },
  { id: 'attendance', title: 'Attendance', description: 'View attendance', icon: 'check-square', nativeScreen: 'Attendance', accent: '#14B8A6' },
  { id: 'teachers', title: 'Teachers', description: "Your child's teachers", icon: 'users', nativeScreen: 'Teachers', accent: '#6366F1' },
  { id: 'transport', title: 'Transport', description: 'Track bus · live location', icon: 'navigation', nativeScreen: 'Transport', accent: '#0E7490' },
  { id: 'bursary', title: 'Bursary', description: 'Kitty & contributions', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'home', nativeScreen: 'SchoolInfo', accent: '#15411D', tokenGated: false },
  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },
];



export const STUDENT_HERO: HeroStat[] = [

  {

    id: 'grade',

    title: 'Current Grade',

    value: '—',

    subtitle: 'Student ID',

    subtitleValue: '—',

    colors: ['#0A3D2E', '#0F5C42'],

    icon: 'award',

  },

  {

    id: 'pocket',

    title: 'Pocket Money',

    value: 'KES —',

    subtitle: 'Wallet',

    subtitleValue: 'Available',

    colors: ['#0F5C42', '#E85D04'],

    icon: 'credit-card',

  },

  {

    id: 'pending-fees',

    title: 'School fees',

    value: '—',

    subtitle: 'Balance',

    subtitleValue: 'View in School Fees',

    colors: ['#062820', '#0F5C42'],

    icon: 'dollar-sign',

  },

  {

    id: 'attendance',

    title: 'Attendance',

    value: '—%',

    subtitle: 'This Term',

    subtitleValue: 'On Track',

    colors: ['#0A3D2E', '#E85D04'],

    icon: 'trending-up',

  },

  {

    id: 'pending',

    title: 'Pending Work',

    value: '—',

    subtitle: 'Due Soon',

    subtitleValue: 'Action Required',

    colors: ['#E85D04', '#F48C06'],

    icon: 'clock',

  },

];



export const STUDENT_DASHBOARD_ACTIONS: DashboardAction[] = [
  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Balances · deposit · send', icon: 'credit-card', nativeScreen: 'TukuaPayHome', accent: '#0EA5E9', tokenGated: false },
  { id: 'face-enroll', title: 'My face', description: 'Enroll your face for boarding', icon: 'user', nativeScreen: 'FaceSelfEnroll', accent: '#0E7490' },

  { id: 'my-grades', title: 'My Grades', description: 'View assessments & grades', icon: 'award', nativeScreen: 'StudentGrades', accent: '#1F8B4C' },
  { id: 'my-assignments', title: 'Assignments', description: 'Homework & classwork', icon: 'clipboard', nativeScreen: 'StudentAssignments', accent: '#6366F1' },
  { id: 'my-timetable', title: 'My Timetable', description: 'Class schedules', icon: 'calendar', nativeScreen: 'TeacherTimetable', accent: '#D97706' },

  { id: 'elearning', title: 'E-Learning', description: 'Courses & materials', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },

  { id: 'my-progress', title: 'My Progress', description: 'Grades & rank summary', icon: 'trending-up', nativeScreen: 'StudentGrades', accent: '#059669' },

  { id: 'my-attendance', title: 'My Attendance', description: 'View attendance', icon: 'users', nativeScreen: 'StudentAttendance', accent: '#0891B2' },

  { id: 'my-discipline', title: 'My Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },

  { id: 'pocket-money', title: 'Pocket Money', description: 'Wallet (read-only)', icon: 'pocket', nativeScreen: 'StudentPocketMoney', accent: '#7C3AED' },

  { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },

  { id: 'school-fees', title: 'School Fees', description: 'Pay fees online', icon: 'dollar-sign', nativeScreen: 'Accounts', accent: '#059669' },

  { id: 'school-events', title: 'School Events', description: 'RSVP, pay & scan check-in', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },

  { id: 'meetings', title: 'Meetings', description: 'Video calls — not event QR scan', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },

  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },

];



export const TEACHER_HERO: HeroStat[] = [

  {

    id: 'classes',

    title: 'My Classes',

    value: '—',

    subtitle: 'School',

    subtitleValue: 'Assigned',

    colors: ['#0A3D2E', '#0F5C42'],

    icon: 'users',

  },

  {

    id: 'students',

    title: 'Total Students',

    value: '—',

    subtitle: 'Across classes',

    subtitleValue: 'Active',

    colors: ['#0F5C42', '#E85D04'],

    icon: 'book',

  },

  {

    id: 'workload',

    title: 'Workload',

    value: '—',

    subtitle: 'Class × Subject',

    subtitleValue: 'Assigned',

    colors: ['#062820', '#0F5C42'],

    icon: 'clipboard',

  },

];



export const TEACHER_DASHBOARD_ACTIONS: DashboardAction[] = [
  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
  { id: 'attendance-scanner', title: 'My gate check-in', description: 'Scan gate QR for yourself', icon: 'camera', nativeScreen: 'GateCheckIn', accent: '#0891B2' },
  { id: 'enter-marks', title: 'Enter Marks', description: 'Grade assessments', icon: 'edit-3', nativeScreen: 'EnterMarks', accent: '#1F8B4C' },
  { id: 'scan-marks', title: 'Scan marksheet', description: 'Photo → AI extracts & batch-saves marks', icon: 'camera', nativeScreen: 'ScanMarksheet', accent: '#059669' },
  { id: 'class-lists', title: 'Class Lists', description: 'View & enroll (class teacher)', icon: 'users', nativeScreen: 'TeacherClasses', accent: '#2563EB', requireClassTeacher: true },
  { id: 'my-timetable', title: 'My Timetable', description: 'Teaching periods', icon: 'calendar', nativeScreen: 'TeacherTimetable', accent: '#D97706' },
  { id: 'events', title: 'Events', description: 'View & save to calendar', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
  { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  { id: 'elearning', title: 'E-Learning', description: 'Instructor studio', icon: 'monitor', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },
  { id: 'library', title: 'Library', description: 'Digital books', icon: 'book', nativeScreen: 'Library', accent: '#4F46E5', requireAnyRole: ['librarian'] },
  { id: 'discipline', title: 'Discipline', description: 'Record & see my cases', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },
  { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
  { id: 'reports', title: 'Reports', description: 'Mark sheets & forms', icon: 'file-text', nativeScreen: 'TeacherReports', accent: '#4E74F9' },
  { id: 'progress', title: 'Progress', description: 'Outstanding mark entry', icon: 'trending-up', nativeScreen: 'TeacherProgress', accent: '#059669' },
  // School admin / principal — existing stack screens, role-gated only
  {
    id: 'approvals',
    title: 'Approvals',
    description: 'Join requests & admissions',
    icon: 'check-circle',
    nativeScreen: 'Approvals',
    accent: '#CA8A04',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin'],
  },
  {
    id: 'school-overview',
    title: 'School overview',
    description: 'Roll & staff snapshot',
    icon: 'home',
    nativeScreen: 'SchoolOverview',
    accent: '#0F766E',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin'],
  },
  {
    id: 'admin-students',
    title: 'Students',
    description: 'Directory & admit',
    icon: 'user-plus',
    nativeScreen: 'AdminStudents',
    accent: '#2563EB',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin', 'registrar'],
  },
  {
    id: 'admin-teachers',
    title: 'Teachers',
    description: 'Staff directory',
    icon: 'users',
    nativeScreen: 'AdminTeachers',
    accent: '#4F46E5',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin'],
  },
  {
    id: 'admin-parents',
    title: 'Parents',
    description: 'Guardian directory',
    icon: 'heart',
    nativeScreen: 'AdminParents',
    accent: '#DB2777',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin'],
  },
  {
    id: 'admit-student',
    title: 'Admit student',
    description: 'New admission',
    icon: 'user-check',
    nativeScreen: 'AdmitStudent',
    accent: '#059669',
    requireAnyRole: ['school_admin', 'principal', 'deputy', 'admin', 'registrar'],
  },
  {
    id: 'admin-accounts',
    title: 'Accounts',
    description: 'Fees · invoices · reports',
    icon: 'dollar-sign',
    nativeScreen: 'AdminAccounts',
    accent: '#047857',
    requireAnyRole: ['bursar', 'accountant', 'accounts_clerk', 'school_admin', 'principal', 'admin'],
  },
  { id: 'my-profile', title: 'My Profile', description: 'Account settings', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#059669' },
  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },
  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },
];

export const SECURITY_HERO: HeroStat[] = [

  {

    id: 'active-trip',

    title: 'Active trip',

    value: '—',

    subtitle: 'Status',

    subtitleValue: 'No run',

    colors: ['#0A3D2E', '#0F5C42'],

    icon: 'navigation',

  },

  {

    id: 'boarded',

    title: 'Boarded today',

    value: '—',

    subtitle: 'Students',

    subtitleValue: 'This trip',

    colors: ['#0F5C42', '#E85D04'],

    icon: 'users',

  },

  {

    id: 'assignment',

    title: 'Assignment',

    value: '—',

    subtitle: 'Vehicle',

    subtitleValue: 'Route',

    colors: ['#062820', '#0F5C42'],

    icon: 'map-pin',

  },

];



export const SECURITY_DASHBOARD_ACTIONS: DashboardAction[] = [
  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Staff wallet & tokens', icon: 'credit-card', nativeScreen: 'TukuaPayHome', accent: '#0EA5E9', tokenGated: false },
  { id: 'daily-attendance', title: 'Daily attendance', description: 'Mark students · teachers · staff (face · QR · search)', icon: 'check-square', nativeScreen: 'SecurityDailyAttendance', accent: '#0891B2' },

  { id: 'trips', title: 'Trips & board', description: 'Start trip · GPS · board students', icon: 'navigation', nativeScreen: 'SecurityHome', accent: '#0E7490' },

  { id: 'gate-qr', title: 'Gate QR display', description: 'Show rotating QR for staff check-in', icon: 'grid', nativeScreen: 'GateQr', accent: '#7C3AED' },

  { id: 'face-enroll', title: 'Face enroll', description: 'Save faces for students · staff · teachers', icon: 'user', nativeScreen: 'SecurityFaceEnroll', accent: '#2563EB' },

  { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },

  { id: 'school-info', title: 'School', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E', tokenGated: false },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },

];



export const SCHOOL_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = TEACHER_DASHBOARD_ACTIONS;

/** Super-admin on mobile: switch into a school + hat (no company hub). */
export const SUPER_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = [
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
  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },
  { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },
  { id: 'courses', title: 'Courses', description: 'Browse & learn', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },
  { id: 'profile', title: 'Profile', description: 'Account & balances', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#1F8B4C', tokenGated: false },
  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },
];



export const INDIVIDUAL_DASHBOARD_ACTIONS: DashboardAction[] = [

  { id: 'tukua-pay', title: 'Tukua Pay', description: 'Wallets · deposit · send', icon: 'smartphone', nativeScreen: 'TukuaPayHome', tokenGated: false, accent: '#0A3D2E' },

  {
    id: 'admin-accounts',
    title: 'Accounts',
    description: 'Fees · invoices · reports',
    icon: 'dollar-sign',
    nativeScreen: 'AdminAccounts',
    accent: '#047857',
    requireAnyRole: ['bursar', 'accountant', 'accounts_clerk'],
  },

  { id: 'bursary', title: 'Bursary', description: 'Kitty & programs', icon: 'gift', nativeScreen: 'Bursary', accent: '#EC4899' },

  { id: 'courses', title: 'Courses', description: 'Browse & learn', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },

  { id: 'profile', title: 'Profile', description: 'Account & balances', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#1F8B4C', tokenGated: false },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB', tokenGated: false },

];

