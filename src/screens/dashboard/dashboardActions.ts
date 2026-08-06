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

    | 'JoinSchool';

  accent?: string;

};



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
  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'home', nativeScreen: 'SchoolInfo', accent: '#15411D' },
  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB' },
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

    id: 'assignments',

    title: 'Assignments',

    value: '—',

    subtitle: 'Completed',

    subtitleValue: 'This term',

    colors: ['#062820', '#0F5C42'],

    icon: 'file-text',

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

  { id: 'face-enroll', title: 'My face', description: 'Enroll your face for boarding', icon: 'user', nativeScreen: 'FaceSelfEnroll', accent: '#0E7490' },

  { id: 'my-grades', title: 'My Grades', description: 'View assessments & grades', icon: 'award', deskPath: '/student/my-grades', accent: '#1F8B4C' },

  { id: 'my-assignments', title: 'My Assignments', description: 'View & submit work', icon: 'file-text', deskPath: '/student/assignments', accent: '#2563EB' },

  { id: 'my-timetable', title: 'My Timetable', description: 'Class schedules', icon: 'calendar', deskPath: '/student/timetable', accent: '#D97706' },

  { id: 'elearning', title: 'E-Learning', description: 'Courses & materials', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },

  { id: 'my-progress', title: 'My Progress', description: 'Track performance', icon: 'trending-up', deskPath: '/student/my-grades', accent: '#059669' },

  { id: 'my-attendance', title: 'My Attendance', description: 'View attendance', icon: 'users', deskPath: '/student/attendance', accent: '#0891B2' },

  { id: 'my-discipline', title: 'My Discipline', description: 'Conduct records', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },

  { id: 'pocket-money', title: 'Pocket Money', description: 'Wallet & transactions', icon: 'pocket', deskPath: '/student/pocket-money', accent: '#7C3AED' },

  { id: 'school-fees', title: 'School Fees', description: 'Pay fees online', icon: 'dollar-sign', deskPath: '/student/school-fees', accent: '#059669' },

  { id: 'school-events', title: 'School Events', description: 'Upcoming activities', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },

  { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },

  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E' },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB' },

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
  { id: 'attendance-scanner', title: 'My gate check-in', description: 'Scan gate QR for yourself', icon: 'camera', nativeScreen: 'GateCheckIn', accent: '#0891B2' },
  { id: 'enter-marks', title: 'Enter Marks', description: 'Grade assessments', icon: 'edit-3', deskPath: '/teacher/enter-marks', accent: '#1F8B4C' },
  { id: 'class-lists', title: 'Class Lists', description: 'View class rosters', icon: 'users', deskPath: '/teacher/classes', accent: '#2563EB' },
  { id: 'my-timetable', title: 'My Timetable', description: 'Teaching periods', icon: 'calendar', deskPath: '/teacher/calendar/timetable?scope=mine', accent: '#D97706' },
  { id: 'events', title: 'Events', description: 'School activities', icon: 'calendar', nativeScreen: 'Events', accent: '#EA580C' },
  { id: 'meetings', title: 'Meetings', description: 'Join school video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  { id: 'elearning', title: 'E-Learning', description: 'Instructor studio', icon: 'monitor', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },
  { id: 'library', title: 'Library', description: 'Digital books', icon: 'book', deskPath: '/teacher/library', accent: '#4F46E5' },
  { id: 'discipline', title: 'Discipline', description: 'My cases', icon: 'shield', nativeScreen: 'Discipline', accent: '#DC2626' },
  { id: 'reports', title: 'Reports', description: 'Mark sheets & forms', icon: 'file-text', deskPath: '/teacher/assessment/reports', accent: '#4E74F9' },
  { id: 'progress', title: 'Progress', description: 'Fill marks hub', icon: 'trending-up', deskPath: '/teacher/assessment/assessments', accent: '#059669' },
  { id: 'comms', title: 'Communicate', description: 'SMS / email', icon: 'message-circle', deskPath: '/bulksms', accent: '#7C3AED' },
  { id: 'my-profile', title: 'My Profile', description: 'Account settings', icon: 'user', deskPath: '/teacher/profile', accent: '#059669' },
  { id: 'school-info', title: 'School Info', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E' },
  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB' },
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

  { id: 'daily-attendance', title: 'Daily attendance', description: 'Mark students · teachers · staff (face · QR · search)', icon: 'check-square', nativeScreen: 'SecurityDailyAttendance', accent: '#0891B2' },

  { id: 'trips', title: 'Trips & board', description: 'Start trip · GPS · board students', icon: 'navigation', nativeScreen: 'SecurityHome', accent: '#0E7490' },

  { id: 'gate-qr', title: 'Gate QR display', description: 'Show rotating QR for staff check-in', icon: 'grid', nativeScreen: 'GateQr', accent: '#7C3AED' },

  { id: 'face-enroll', title: 'Face enroll', description: 'Save faces for students · staff · teachers', icon: 'user', nativeScreen: 'SecurityFaceEnroll', accent: '#2563EB' },

  { id: 'school-info', title: 'School', description: 'About your school', icon: 'info', nativeScreen: 'SchoolInfo', accent: '#0A3D2E' },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB' },

];



export const SCHOOL_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = [
  { id: 'attendance-scanner', title: 'My gate check-in', description: 'Scan gate QR for yourself (staff)', icon: 'camera', nativeScreen: 'GateCheckIn', accent: '#0891B2' },
  { id: 'meetings', title: 'Meetings', description: 'Schedule & host video meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  { id: 'face-enroll', title: 'Face enroll', description: 'Students · teachers · staff', icon: 'user', deskPath: '/transport/face-enroll', accent: '#0E7490' },
  { id: 'admin', title: 'Admin', description: 'Settings & users', icon: 'settings', deskPath: '/admin', accent: '#0A3D2E' },
  { id: 'students', title: 'Students', description: 'Student records', icon: 'book', deskPath: '/admin/students', accent: '#1F8B4C' },
  { id: 'parents', title: 'Parents', description: 'Parent accounts', icon: 'users', deskPath: '/admin/parents', accent: '#2563EB' },
  { id: 'teachers', title: 'Teachers', description: 'Staff & workload', icon: 'user', deskPath: '/admin/teachers', accent: '#D97706' },
  { id: 'classes', title: 'Classes', description: 'Classes & rooms', icon: 'home', deskPath: '/admin/classes', accent: '#7C3AED' },
  { id: 'assessment', title: 'Assessment', description: 'Exams & marks', icon: 'clipboard', deskPath: '/assessment', accent: '#0D9488' },
  { id: 'comms', title: 'Communication', description: 'SMS & email', icon: 'mail', deskPath: '/bulksms', accent: '#4F46E5' },
  { id: 'accounts', title: 'Accounts', description: 'Fees & finance', icon: 'dollar-sign', deskPath: '/accounts', accent: '#059669' },
  { id: 'discipline', title: 'Discipline', description: 'Incidents', icon: 'shield', deskPath: '/discipline', accent: '#DC2626' },
  { id: 'calendar', title: 'Calendar', description: 'Timetable', icon: 'calendar', deskPath: '/calendar', accent: '#EA580C' },
  { id: 'elearning', title: 'E-Learning', description: 'Courses', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0891B2' },
];



/** Platform superadmin — mirrors web AdminLayout categories (Tukua SPA routes). */
export const SUPER_ADMIN_DASHBOARD_ACTIONS: DashboardAction[] = [
  // Overview
  { id: 'hub', title: 'Dashboard', description: 'Company overview', icon: 'grid', tukuaPath: '/superadmin', accent: '#0A3D2E' },
  { id: 'analytics', title: 'Analytics', description: 'Platform metrics', icon: 'trending-up', tukuaPath: '/superadmin/analytics', accent: '#2563EB' },
  { id: 'registration', title: 'Registration', description: 'Signup monitor', icon: 'shield', tukuaPath: '/superadmin/registration-monitor', accent: '#DC2626' },
  // People
  { id: 'users', title: 'Users', description: 'Accounts & roles', icon: 'users', tukuaPath: '/superadmin/users', accent: '#D97706' },
  { id: 'course-staff', title: 'Course mentors', description: 'Instructors & guests', icon: 'user', tukuaPath: '/superadmin/course-staff', accent: '#7C3AED' },
  { id: 'feedback', title: 'Feedback', description: 'User feedback', icon: 'message-circle', tukuaPath: '/superadmin/feedback', accent: '#0284C7' },
  // Money
  { id: 'revenue', title: 'Revenue', description: 'Token topups & pricing', icon: 'dollar-sign', tukuaPath: '/superadmin/revenue', accent: '#059669' },
  { id: 'referrals', title: 'Course referrals', description: 'Promo & share links', icon: 'gift', tukuaPath: '/superadmin/course-referrals', accent: '#EA580C' },
  // Platform
  { id: 'apps', title: 'Apps', description: 'Connected apps', icon: 'layers', tukuaPath: '/superadmin/apps', accent: '#4F46E5' },
  { id: 'releases', title: 'Releases', description: 'Desk builds', icon: 'upload', tukuaPath: '/superadmin/releases', accent: '#0E7490' },
  { id: 'storage', title: 'Storage', description: 'Media & files', icon: 'monitor', tukuaPath: '/superadmin/storage', accent: '#0891B2' },
  { id: 'knowledge', title: 'Knowledge', description: 'RAG docs', icon: 'book', tukuaPath: '/superadmin/knowledge', accent: '#1F8B4C' },
  { id: 'ai-engine', title: 'Tukua AI', description: 'Providers & models', icon: 'cpu', tukuaPath: '/superadmin/ai-providers', accent: '#7C3AED' },
  // Content & access
  { id: 'content', title: 'Content sources', description: 'Scraping & ops', icon: 'globe', tukuaPath: '/superadmin/content', accent: '#0D9488' },
  { id: 'org-access', title: 'Org roles', description: 'Roles & modules', icon: 'settings', tukuaPath: '/superadmin/org-access', accent: '#0A3D2E' },
  { id: 'meetings', title: 'Meetings', description: 'All school meetings', icon: 'video', nativeScreen: 'Meetings', accent: '#0284C7' },
  { id: 'emails', title: 'Emails', description: 'Bulk email', icon: 'mail', tukuaPath: '/superadmin/emails', accent: '#4F46E5' },
  { id: 'sms', title: 'SMS', description: 'Bulk SMS', icon: 'message-circle', tukuaPath: '/superadmin/sms', accent: '#7C3AED' },
  // Schools & learning
  { id: 'schools', title: 'Schools', description: 'Registry', icon: 'home', tukuaPath: '/superadmin/schools/list', accent: '#1F8B4C' },
  { id: 'schools-overview', title: 'Schools overview', description: 'Tenant overview', icon: 'grid', tukuaPath: '/superadmin/schools', accent: '#0A3D2E' },
  { id: 'curriculum', title: 'Curriculum', description: 'Levels & learning areas', icon: 'layers', tukuaPath: '/superadmin/curriculum', accent: '#D97706' },
  { id: 'elearning', title: 'Courses', description: 'Browse & manage catalog', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },
  { id: 'admin-courses', title: 'Course admin', description: 'Publish & pricing', icon: 'edit-3', tukuaPath: '/superadmin/courses', accent: '#0891B2' },
  // Settings
  { id: 'settings', title: 'Settings', description: 'Platform settings', icon: 'settings', tukuaPath: '/superadmin/settings', accent: '#64748B' },
];



export const INDIVIDUAL_DASHBOARD_ACTIONS: DashboardAction[] = [

  { id: 'courses', title: 'Courses', description: 'Browse & learn', icon: 'book-open', tukuaPath: '/courses', tukuaTab: 'Courses', accent: '#0D9488' },

  { id: 'profile', title: 'Profile', description: 'Account & balances', icon: 'user', tukuaPath: '/profile', tukuaTab: 'Profile', accent: '#1F8B4C' },

  { id: 'join-school', title: 'Join school', description: 'Request to join a school', icon: 'log-in', nativeScreen: 'JoinSchool', accent: '#2563EB' },

];

