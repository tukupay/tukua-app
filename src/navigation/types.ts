import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ProfileStackParamList } from './ProfileStack';
import type { CoursesStackParamList } from './CoursesStack';
import type { DisciplineIncident } from '../lib/disciplineApi';
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  /** Always available (logged in or out) — opened via App Links / tukua:// */
  ResetPassword: {
    token?: string;
    type?: string;
    expires_at?: string;
    email?: string;
  } | undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Notifications: undefined;
  DeskModule: {
    title: string;
    deskPath: string;
    description?: string;
  };
  SchoolInfo: undefined;
  Discipline: undefined;
  /** One case: `incident` is the list row (shown at once), `id` fetches the full record for staff. */
  DisciplineDetail: { id?: string; incident?: DisciplineIncident };
  /** A learner's conduct history (staff); without an admission number it opens on a search. */
  DisciplineStudent: { admissionNumber?: string; name?: string } | undefined;
  EditDisciplineIncident: { incident: DisciplineIncident };
  Events: undefined;
  Meetings: undefined;
  MeetingRoom: { title: string; roomUrl: string; meetingId?: string; participantId?: string };
  Assessments: undefined;
  /** Parent: one child's report form for one exam, drawn natively (summary shown at once, subjects fetched). */
  ParentReportForm: {
    studentId: string;
    examId: string;
    initial?: import('../lib/parentPortalApi').ParentReportForm;
    /** Web print page (/parent/assessments/print?...) for the "Full school layout" link. */
    webPath?: string;
  };
  Teachers: undefined;
  Library: undefined;
  Clubs: undefined;
  Accounts: undefined;
  ReceiptView: {
    receipt: Record<string, unknown>;
    studentName?: string;
    schoolName?: string;
    admissionNumber?: string | null;
    className?: string | null;
  };
  Transport: undefined;
  Attendance: undefined;
  Bursary: undefined;
  /** Refer & earn: own link, target, course links, who joined. */
  Referral: undefined;
  SecurityHome: undefined;
  /** Every school vehicle on one map (school admins and security staff). */
  FleetMap: undefined;
  SecurityFaceEnroll: undefined;
  SecurityDailyAttendance: undefined;
  FaceSelfEnroll: undefined;
  GateQr: undefined;
  GateCheckIn: undefined;
  JoinSchool: { firstLogin?: boolean; preferRole?: 'parent' | 'teacher' | 'student' | 'staff' } | undefined;
  FeaturePlaceholder: {
    title: string;
    description: string;
    apiHint?: string;
  };
  EnterMarks: undefined;
  ScanMarksheet: undefined;
  TeacherMarksheet: { examId: string; title: string; classId?: string };
  EnterMarksEntry: { examId: string; title: string; classId?: string };
  TeacherClasses: undefined;
  TeacherReports: undefined;
  StudentGrades: undefined;
  StudentExamDetail: { examId: string; title: string };
  StudentAssignments: undefined;
  StudentAttendance: undefined;
  StudentPocketMoney: undefined;
  Approvals: undefined;
  AdmitStudent: undefined;
  AdminStudents: undefined;
  AdminTeachers: undefined;
  AdminParents: undefined;
  SchoolOverview: undefined;
  AdminAccounts: undefined;
  SuperAdminHub: undefined;
  SuperAdminSchools: { impersonate?: boolean } | undefined;
  TukuaPayHome: undefined;
  TukuaPayDeposit: undefined;
  TukuaPaySend: undefined;
  TukuaPayBank: undefined;
  TukuaPayKyc: undefined;
  TeacherTimetable: undefined;
  RecordDiscipline: { admissionNumber?: string; name?: string; classLabel?: string } | undefined;
  TeacherProgress: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Courses: NavigatorScreenParams<CoursesStackParamList> | undefined;
  Content: undefined;
  Dashboard: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};
