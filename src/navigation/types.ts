import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ProfileStackParamList } from './ProfileStack';

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

export type AboutStackParamList = {
  AboutHome: undefined;
  PublicWeb: { path: string; title: string };
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
  Events: undefined;
  Meetings: undefined;
  MeetingRoom: { title: string; roomUrl: string };
  Assessments: undefined;
  Teachers: undefined;
  Library: undefined;
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
  SecurityHome: undefined;
  SecurityFaceEnroll: undefined;
  SecurityDailyAttendance: undefined;
  FaceSelfEnroll: undefined;
  GateQr: undefined;
  GateCheckIn: undefined;
  JoinSchool: { firstLogin?: boolean } | undefined;
  FeaturePlaceholder: {
    title: string;
    description: string;
    apiHint?: string;
  };
};

export type MainTabParamList = {
  Chat: undefined;
  Courses: undefined;
  Dashboard: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};
