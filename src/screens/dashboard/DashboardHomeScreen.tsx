import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAuth } from '../../context/AuthContext';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { CardChip, MenuCard, MenuItem, PatternTiles, rgba } from '../../components/dashboard/DashboardKit';
import { ProfileAvatar } from '../../components/navigation/ProfileAvatar';
import { deskFetch } from '../../lib/deskApi';
import { isDeskErpPath, isDeskWebModuleAvailable, getWebBaseUrl } from '../../lib/localHost';
import {
  fetchParentAccountsStatement,
  fetchParentPocketMoney,
} from '../../lib/parentPortalApi';
import {
  fetchDailyStudentAttendance,
  fetchSecurityActiveTrip,
  fetchSecurityAssignment,
  type SecurityAssignment,
  type SecurityTripRun,
} from '../../lib/transportApi';
import { formatTokensShort } from '../../components/navigation/TokenBalancePill';
import { useRegisterTabJumper } from '../../hooks/useRegisterTabJumper';
import { useAppTheme } from '../../context/AppThemeContext';
import { useTokenGate } from '../../context/TokenGateContext';
import {
  DashboardAction,
  FeatherIconName,
  HeroStat,
  INDIVIDUAL_DASHBOARD_ACTIONS,
  PARENT_DASHBOARD_ACTIONS,
  PARENT_HERO,
  SCHOOL_ADMIN_DASHBOARD_ACTIONS,
  SCHOOL_ADMIN_HERO,
  SECURITY_DASHBOARD_ACTIONS,
  SECURITY_HERO,
  STUDENT_DASHBOARD_ACTIONS,
  STUDENT_HERO,
  SUPER_ADMIN_DASHBOARD_ACTIONS,
  TEACHER_DASHBOARD_ACTIONS,
  TEACHER_HERO,
} from './dashboardActions';
import { DeskPersona, holdsAnyRole } from '../../lib/deskRoles';
import { fetchAccountsDashboard, fetchSchoolDashboardAnalytics } from '../../lib/adminPortalApi';
import { fetchClasses, fetchMyTeacherWorkloads, fetchTeacherStats } from '../../lib/teacherPortalApi';
import {
  fetchStudentAssignments,
  fetchStudentExams,
  fetchStudentFees,
  fetchStudentProfile,
  fetchStudentRecentAttendance,
  fetchStudentExamSummary,
  resolveStudentRecordId,
  tryFetchStudentPocketBalance,
} from '../../lib/studentPortalApi';
import { DASHBOARD_ACTION_MODULE, schoolHasModule } from '../../lib/schoolModules';

type ActionSection = {
  id: string;
  title: string;
  actions: DashboardAction[];
};

/** Part of GET /students/me/overview (the figures Desk shows too). */
type StudentOverview = {
  fees?: { balance?: number };
  attendance?: { rate?: number | null };
  grades?: { latest?: { mean?: number | null; grade?: string | null } | null };
};

const TILE_ICON_SIZE = 26;
/** Shortcuts per card (two rows of four, as TukuPay's Instant Pay). */
const PER_CARD = 8;
const PER_ROW = 4;

/** Filled Ionicons — heavier weight than Feather strokes for dashboard tiles. */
const TILE_ICON: Partial<Record<FeatherIconName, keyof typeof Ionicons.glyphMap>> = {
  info: 'information-circle',
  'dollar-sign': 'cash',
  'credit-card': 'card',
  'plus-circle': 'add-circle',
  repeat: 'swap-horizontal',
  'book-open': 'book',
  monitor: 'laptop',
  book: 'library',
  shield: 'shield',
  users: 'people',
  calendar: 'calendar',
  'file-text': 'document-text',
  layers: 'layers',
  award: 'ribbon',
  'trending-up': 'trending-up',
  'edit-3': 'create',
  clipboard: 'clipboard',
  'message-circle': 'chatbubble',
  user: 'person',
  settings: 'settings',
  home: 'home',
  mail: 'mail',
  grid: 'grid',
  pocket: 'wallet',
  clock: 'time',
  navigation: 'navigate',
  upload: 'cloud-upload',
  camera: 'camera',
  map: 'map',
  'map-pin': 'location',
  'check-square': 'checkbox',
  gift: 'gift',
  cpu: 'hardware-chip',
  globe: 'globe',
  video: 'videocam',
  heart: 'heart',
  'log-in': 'log-in',
  'file-plus': 'document',
  'user-plus': 'person-add',
  'check-circle': 'checkmark-circle',
  'user-check': 'person-circle',
};

/** Outline set for hero header (sits on green card). */
const HERO_ICON: Partial<Record<FeatherIconName, keyof typeof Ionicons.glyphMap>> = {
  info: 'information-circle-outline',
  'dollar-sign': 'cash-outline',
  'credit-card': 'card-outline',
  'plus-circle': 'add-circle-outline',
  repeat: 'swap-horizontal-outline',
  'book-open': 'book-outline',
  monitor: 'laptop-outline',
  book: 'library-outline',
  shield: 'shield-outline',
  users: 'people-outline',
  calendar: 'calendar-outline',
  'file-text': 'document-text-outline',
  layers: 'layers-outline',
  award: 'ribbon-outline',
  'trending-up': 'trending-up-outline',
  'edit-3': 'create-outline',
  clipboard: 'clipboard-outline',
  'message-circle': 'chatbubble-outline',
  user: 'person-outline',
  settings: 'settings-outline',
  home: 'home-outline',
  mail: 'mail-outline',
  grid: 'grid-outline',
  pocket: 'wallet-outline',
  clock: 'time-outline',
  navigation: 'navigate-outline',
  upload: 'cloud-upload-outline',
  camera: 'camera-outline',
  map: 'map-outline',
  'map-pin': 'location-outline',
  'check-square': 'checkbox-outline',
  gift: 'gift-outline',
  cpu: 'hardware-chip-outline',
  globe: 'globe-outline',
  video: 'videocam-outline',
  heart: 'heart-outline',
};

function PlainIcon({
  name,
  size,
  color,
}: {
  name: FeatherIconName;
  size: number;
  color: string;
}) {
  const ion = TILE_ICON[name];
  if (ion) return <Ionicons name={ion} size={size} color={color} />;
  return <Feather name={name} size={size} color={color} />;
}

function HeroPlainIcon({
  name,
  size,
  color,
}: {
  name: FeatherIconName;
  size: number;
  color: string;
}) {
  const ion = HERO_ICON[name];
  if (ion) return <Ionicons name={ion} size={size} color={color} />;
  return <Feather name={name} size={size} color={color} />;
}
const SECTION_TITLES = ['Essentials', 'Academic Life', 'Explore', 'More', 'Extras'];

function actionsForPersona(persona: DeskPersona): DashboardAction[] {
  switch (persona) {
    case 'parent':
      return PARENT_DASHBOARD_ACTIONS;
    case 'student':
      return STUDENT_DASHBOARD_ACTIONS;
    case 'teacher':
      return TEACHER_DASHBOARD_ACTIONS;
    case 'security':
      return SECURITY_DASHBOARD_ACTIONS;
    case 'school_admin':
      return SCHOOL_ADMIN_DASHBOARD_ACTIONS;
    case 'super_admin':
      return SUPER_ADMIN_DASHBOARD_ACTIONS;
    default:
      return INDIVIDUAL_DASHBOARD_ACTIONS;
  }
}

function heroForPersona(persona: DeskPersona): HeroStat[] {
  switch (persona) {
    case 'parent':
      return PARENT_HERO;
    case 'student':
      return STUDENT_HERO;
    case 'teacher':
      return TEACHER_HERO;
    case 'security':
      return SECURITY_HERO;
    case 'school_admin':
      return SCHOOL_ADMIN_HERO;
    default:
      return PARENT_HERO.slice(0, 3);
  }
}

/** Keep every action — chunk into cards of two rows of four (never drop Bulk Pay etc.). */
function sectionsForActions(actions: DashboardAction[]): ActionSection[] {
  const chunks: DashboardAction[][] = [];
  for (let i = 0; i < actions.length; i += PER_CARD) chunks.push(actions.slice(i, i + PER_CARD));
  return chunks.map((chunk, index) => ({
    id: `section-${index}`,
    title: SECTION_TITLES[index] ?? `More ${index + 1}`,
    actions: chunk,
  }));
}

/** Rows of four for a section card. */
function rowsOf<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += PER_ROW) rows.push(items.slice(i, i + PER_ROW));
  return rows;
}

export function DashboardHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const { palette } = useAppTheme();
  const { profile, session } = useAuth();
  const { navigate, jumpToTab } = useWebViewControl();
  useRegisterTabJumper();
  const {
    persona,
    personaLabel,
    deskUser,
    deskReady,
    deskToken,
    selectedSchool,
    selectedStudent,
    selectedStudentId,
    linkedStudents,
    schools,
    requestSchoolChange,
    schoolRoleOptions,
    activeRoles: heldRoles,
  } = useDeskAuth();
  const { guardDashboardAction } = useTokenGate();
  const heroGreen = palette.primary;

  // The person's own roles behind the hat (a bursar on the office hat holds "bursar", not
  // "school_admin"), so office tiles match what the server lets them open.
  const activeRoles = useMemo(() => heldRoles.map((r) => String(r).toLowerCase()), [heldRoles]);

  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [teacherHero, setTeacherHero] = useState<{
    class_count?: number;
    student_count?: number;
    workload_count?: number;
    school_name?: string;
  } | null>(null);
  const [studentHero, setStudentHero] = useState<{
    grade?: string;
    attendancePct?: number | null;
    admissionLabel?: string | null;
    className?: string | null;
    pocketBalance?: number | null;
    pocketLabel?: string | null;
    feesLabel?: string | null;
    assignmentsLabel?: string | null;
  } | null>(null);

  const baseActions = useMemo(() => actionsForPersona(persona), [persona]);
  const actions = useMemo(() => {
    const schoolModules = selectedSchool?.enabledModules ?? schools[0]?.enabledModules ?? null;
    return baseActions.filter((action) => {
      if (action.requireAnyRole?.length && !holdsAnyRole(activeRoles, action.requireAnyRole)) {
        return false;
      }
      if (action.requireClassTeacher && !isClassTeacher && !holdsAnyRole(activeRoles, ['class_teacher'])) {
        return false;
      }
      const mod = DASHBOARD_ACTION_MODULE[action.id] ?? 'core';
      if (!schoolHasModule(schoolModules, mod)) return false;
      return true;
    });
  }, [activeRoles, baseActions, isClassTeacher, selectedSchool?.enabledModules, schools]);
  const sections = useMemo(() => sectionsForActions(actions), [actions]);
  const baseHero = useMemo(() => heroForPersona(persona), [persona]);

  const [tokens, setTokens] = useState<number | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [feeBalance, setFeeBalance] = useState<number | null>(null);
  const [familyFees, setFamilyFees] = useState<number | null>(null);
  const [officeHero, setOfficeHero] = useState<{ learners?: number; collected?: number; outstanding?: number } | null>(null);
  const [pocketBalance, setPocketBalance] = useState<number | null>(null);
  const [securityAssignment, setSecurityAssignment] = useState<SecurityAssignment | null>(null);
  const [securityActiveTrip, setSecurityActiveTrip] = useState<SecurityTripRun | null>(null);
  const [securityBoardedTotal, setSecurityBoardedTotal] = useState<number | null>(null);
  const [securityAttendanceToday, setSecurityAttendanceToday] = useState<number | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  // Eye toggle on the hero card (hides the figures, as on a bank card).
  const [hideValues, setHideValues] = useState(false);

  const avatarUrl = useMemo(() => {
    if (selectedStudent) {
      return selectedStudent.avatarUrl || null;
    }
    return (
      profile?.avatarUrl ||
      (session?.user?.user_metadata?.avatar_url as string | undefined) ||
      (session?.user?.user_metadata?.profile_image_url as string | undefined) ||
      null
    );
  }, [profile, session, selectedStudent]);

  const loadTokens = useCallback(async () => {
    if (!deskToken) {
      setTokens(null);
      return;
    }
    setTokensLoading(true);
    try {
      const data = await deskFetch<{ balance?: number; tokens?: number }>('/comms/tokens/balance');
      const value =
        typeof data?.balance === 'number'
          ? data.balance
          : typeof data?.tokens === 'number'
            ? data.tokens
            : null;
      setTokens(value);
    } catch {
      setTokens(null);
    } finally {
      setTokensLoading(false);
    }
  }, [deskToken]);

  const latestStudentRef = useRef<string | null | undefined>(selectedStudentId);
  latestStudentRef.current = selectedStudentId;

  const loadStudentBalances = useCallback(async () => {
    if (!deskToken || persona !== 'parent' || !selectedStudentId) {
      setFeeBalance(null);
      setPocketBalance(null);
      return;
    }
    const forStudent = selectedStudentId;
    try {
      const [accounts, pocket, family] = await Promise.allSettled([
        fetchParentAccountsStatement(selectedStudentId),
        fetchParentPocketMoney(selectedStudentId),
        // No student_id → one balance row per linked child.
        deskFetch<{ balances?: Array<{ balance?: number }> }>('/parents/me/accounts-statement'),
      ]);
      if (forStudent !== latestStudentRef.current) return; // parent switched child meanwhile
      if (accounts.status === 'fulfilled') {
        const rows = accounts.value?.balances ?? [];
        const total = rows.reduce((sum, b) => sum + (Number(b.balance ?? 0) || 0), 0);
        setFeeBalance(rows.length ? total : 0);
      } else {
        setFeeBalance(null);
      }
      setFamilyFees(
        family.status === 'fulfilled'
          ? (family.value?.balances ?? []).reduce((sum, b) => sum + Math.max(0, Number(b.balance ?? 0) || 0), 0)
          : null,
      );
      if (pocket.status === 'fulfilled') {
        const wallets = pocket.value?.wallets ?? [];
        const total = wallets.reduce((sum, w) => sum + (Number(w.balance ?? 0) || 0), 0);
        setPocketBalance(wallets.length ? total : 0);
      } else {
        setPocketBalance(null);
      }
    } catch {
      setFeeBalance(null);
      setPocketBalance(null);
    }
  }, [deskToken, persona, selectedStudentId]);

  const loadSecurityHero = useCallback(async () => {
    if (!deskToken || persona !== 'security') {
      setSecurityAssignment(null);
      setSecurityActiveTrip(null);
      setSecurityBoardedTotal(null);
      setSecurityAttendanceToday(null);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [assignRes, tripRes, attRes] = await Promise.allSettled([
        fetchSecurityAssignment(),
        fetchSecurityActiveTrip(),
        fetchDailyStudentAttendance({ date: today, page: 1, limit: 1 }),
      ]);
      setSecurityAssignment(assignRes.status === 'fulfilled' ? assignRes.value?.assignment ?? null : null);
      if (tripRes.status === 'fulfilled') {
        setSecurityActiveTrip(tripRes.value?.trip ?? null);
        setSecurityBoardedTotal(
          typeof tripRes.value?.boarded_total === 'number' ? tripRes.value.boarded_total : null,
        );
      } else {
        setSecurityActiveTrip(null);
        setSecurityBoardedTotal(null);
      }
      if (attRes.status === 'fulfilled') {
        const total =
          (attRes.value as { total?: number; count?: number })?.total ??
          (attRes.value as { count?: number })?.count ??
          ((attRes.value as { students?: unknown[] })?.students?.length ?? null);
        setSecurityAttendanceToday(typeof total === 'number' ? total : null);
      } else {
        setSecurityAttendanceToday(null);
      }
    } catch {
      setSecurityAssignment(null);
      setSecurityActiveTrip(null);
      setSecurityBoardedTotal(null);
      setSecurityAttendanceToday(null);
    }
  }, [deskToken, persona]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  // School office hero: roll + fees, both from cached server dashboards (one request each, in parallel).
  useEffect(() => {
    if (!deskToken || persona !== 'school_admin') {
      setOfficeHero(null);
      return;
    }
    let cancelled = false;
    const schoolId = String(selectedSchool?.id ?? deskUser?.school_id ?? '').trim();
    void (async () => {
      const [acc, school] = await Promise.allSettled([
        fetchAccountsDashboard(),
        schoolId ? fetchSchoolDashboardAnalytics(schoolId) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const o = acc.status === 'fulfilled' ? acc.value?.overview : undefined;
      const t = school.status === 'fulfilled' ? school.value?.totals : undefined;
      setOfficeHero({
        learners: t?.students_active ?? t?.students,
        collected: o?.collected,
        outstanding: o?.outstanding,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [deskToken, persona, selectedSchool?.id, deskUser?.school_id]);

  useEffect(() => {
    void loadStudentBalances();
  }, [loadStudentBalances]);

  useEffect(() => {
    void loadSecurityHero();
  }, [loadSecurityHero]);

  useEffect(() => {
    if (!deskToken || persona !== 'teacher') {
      setTeacherHero(null);
      setIsClassTeacher(false);
      return;
    }
    const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();
    let cancelled = false;
    void (async () => {
      try {
        const [stats, workloads, classes] = await Promise.allSettled([
          fetchTeacherStats(),
          teacherId ? fetchMyTeacherWorkloads(teacherId) : Promise.resolve([]),
          fetchClasses(80),
        ]);
        if (cancelled) return;
        const raw =
          stats.status === 'fulfilled'
            ? ((stats.value as { stats?: Record<string, unknown> })?.stats ??
                (stats.value as Record<string, unknown>))
            : {};
        const wl = workloads.status === 'fulfilled' ? workloads.value : [];
        const cls = classes.status === 'fulfilled' ? classes.value : [];
        const classIds = new Set(wl.map((w) => w.class_id).filter(Boolean));
        const classCount = Number(raw.class_count ?? classIds.size) || classIds.size;
        const workloadCount = Number(raw.workload_count ?? wl.length) || wl.length;
        const studentCount =
          Number(raw.student_count ?? 0) ||
          0;
        setTeacherHero({
          class_count: classCount,
          student_count: studentCount,
          workload_count: workloadCount,
          school_name: selectedSchool?.name,
        });
        const ct = cls.some((c) => {
          const tid = String(
            (c as { class_teacher_user_id?: string; class_teacher_id?: string }).class_teacher_user_id ||
              (c as { class_teacher_id?: string }).class_teacher_id ||
              '',
          );
          return tid && teacherId && tid === teacherId;
        });
        const roleCt = activeRoles.some(
          (r) => r.includes('class_teacher') || r.includes('class-teacher'),
        );
        setIsClassTeacher(ct || roleCt);
      } catch {
        if (!cancelled) setTeacherHero(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeRoles,
    deskToken,
    deskUser?.id,
    deskUser?.user_id,
    persona,
    selectedSchool?.name,
  ]);

  useEffect(() => {
    if (!deskToken || persona !== 'student') {
      setStudentHero(null);
      return;
    }
    const sid = resolveStudentRecordId(deskUser) || String(selectedStudentId ?? '').trim();
    let cancelled = false;
    void (async () => {
      try {
        const [profile, exams, att, pocket, assignments, fees, overviewRes] = await Promise.allSettled([
          sid ? fetchStudentProfile(sid) : Promise.resolve(null),
          fetchStudentExams(5),
          sid ? fetchStudentRecentAttendance(sid, 14) : Promise.resolve([]),
          sid ? tryFetchStudentPocketBalance(sid) : Promise.resolve(null),
          sid ? fetchStudentAssignments(sid) : Promise.resolve({ assignments: [] }),
          fetchStudentFees(),
          // Same figures as Desk (fees for this financial year, attendance with late counted as present,
          // latest results); the older calls above stay as the fallback for an API without it.
          deskFetch<StudentOverview>('/students/me/overview'),
        ]);
        const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
        const prof = profile.status === 'fulfilled' ? profile.value : null;
        const examList = exams.status === 'fulfilled' ? exams.value : [];
        const attRows = att.status === 'fulfilled' ? att.value : [];
        const pocketBal = pocket.status === 'fulfilled' ? pocket.value : null;
        const assignmentRows =
          assignments.status === 'fulfilled' ? assignments.value?.assignments ?? [] : [];
        const feeRow = fees.status === 'fulfilled' ? fees.value : null;
        const feeBal = feeRow?.balance;
        const presentDays = new Set(attRows.map((m) => String(m.marked_at ?? '').slice(0, 10))).size;
        let gradeLabel = examList.length ? 'See grades' : 'No grades yet';
        if (examList[0]?.id && sid) {
          try {
            const { summary } = await fetchStudentExamSummary(examList[0].id, sid);
            const mean = summary?.mean_grade ?? summary?.mean_mark;
            if (mean != null && String(mean).trim()) {
              gradeLabel = String(mean).trim();
            }
          } catch {
            /* keep fallback */
          }
        }
        if (cancelled) return;
        const latest = overview?.grades?.latest;
        if (latest?.mean != null) gradeLabel = `${latest.mean}%${latest.grade ? ` · ${latest.grade}` : ''}`;
        // Homework still to hand in (handed-in or marked work is not "pending").
        const pendingCount = assignmentRows.filter((a) => {
          const st = String(a.status ?? a.submission_status ?? '').toLowerCase();
          return !/(complete|submit|grade|done)/.test(st);
        }).length;
        const overviewFees = overview?.fees?.balance;
        setStudentHero({
          grade: gradeLabel,
          attendancePct:
            overview?.attendance?.rate != null
              ? Math.round(overview.attendance.rate)
              : attRows.length
                ? Math.min(100, Math.round((presentDays / 14) * 100))
                : null,
          admissionLabel:
            prof?.student_number || prof?.admission_number
              ? `#${prof.student_number || prof.admission_number}`
              : null,
          className: prof?.class_name || prof?.current_class || null,
          pocketBalance: pocketBal,
          pocketLabel:
            pocketBal != null ? `KES ${pocketBal.toLocaleString()}` : 'Office / parent only',
          feesLabel:
            overviewFees != null && Number.isFinite(Number(overviewFees))
              ? `KES ${Number(overviewFees).toLocaleString()}`
              : feeBal != null && Number.isFinite(Number(feeBal))
                ? `KES ${Number(feeBal).toLocaleString()}`
                : 'See School Fees',
          assignmentsLabel: String(pendingCount),
        });
      } catch {
        if (!cancelled) setStudentHero(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deskToken, deskUser, persona, selectedStudentId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 64, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const onPressAction = useCallback(
    (action: DashboardAction) => {
      guardDashboardAction(action, () => {
        if (action.nativeScreen) {
          const screen = action.nativeScreen;
          if (screen === 'SuperAdminSchools') {
            navigation.navigate(
              'SuperAdminSchools',
              (action.nativeParams ?? undefined) as { impersonate?: boolean } | undefined,
            );
          } else {
            navigation.navigate(screen as never);
          }
          return;
        }
        // SA Users: Desk /superadmin/schools/users when Desk Web is up; else Nest JWT SPA
        // on non-Amplify hosts only (tukua.ai live Amplify 401s staging Nest JWT).
        if (action.id === 'users' && action.deskPath) {
          if (isDeskWebModuleAvailable()) {
            navigation.navigate('DeskModule', {
              title: action.title,
              deskPath: action.deskPath,
              description: action.description,
            });
            return;
          }
          try {
            const host = new URL(getWebBaseUrl()).hostname.toLowerCase();
            if (host !== 'tukua.ai' && host !== 'www.tukua.ai') {
              navigate('/superadmin/users');
              return;
            }
          } catch {
            /* fall through */
          }
          navigation.navigate('FeaturePlaceholder', {
            title: action.title,
            description:
              'Users needs Desk Web (EXPO_PUBLIC_DESK_WEB_URL → :3250) for Schools → Users, or EXPO_PUBLIC_WEB_URL pointing at a Nest JWT SPA. Live tukua.ai returns 401 with staging tokens.',
            apiHint: action.deskPath,
          });
          return;
        }
        if (action.deskPath && isDeskWebModuleAvailable()) {
          navigation.navigate('DeskModule', {
            title: action.title,
            deskPath: action.deskPath,
            description: action.description,
          });
          return;
        }
        if (action.tukuaPath) {
          if (action.tukuaTab === 'Courses' || action.tukuaTab === 'Profile') {
            jumpToTab(action.tukuaTab);
            navigate(action.tukuaPath, action.tukuaTab === 'Courses' ? '/courses' : '/profile');
            return;
          }
          navigate(action.tukuaPath);
          return;
        }
        if (action.deskPath) {
          const path = action.deskPath.startsWith('/') ? action.deskPath : `/${action.deskPath}`;
          if (isDeskErpPath(path) && !isDeskWebModuleAvailable()) {
            navigation.navigate('FeaturePlaceholder', {
              title: action.title,
              description:
                'Desk WebView is not configured (tukua.ai has no /teacher or /admin routes). Use native tiles or set EXPO_PUBLIC_DESK_WEB_URL to Desk Vite :3250.',
              apiHint: action.deskPath,
            });
            return;
          }
          navigation.navigate('DeskModule', {
            title: action.title,
            deskPath: action.deskPath,
            description: action.description,
          });
          return;
        }
        navigation.navigate('FeaturePlaceholder', {
          title: action.title,
          description: action.description,
          apiHint: action.deskPath,
        });
      });
    },
    [guardDashboardAction, jumpToTab, navigate, navigation],
  );

  const parentFirstName = useMemo(() => {
    const full =
      [deskUser?.first_name, deskUser?.last_name].filter(Boolean).join(' ') ||
      profile?.fullName ||
      deskUser?.email ||
      profile?.email ||
      'Welcome';
    return full.split(/\s+/)[0] || 'there';
  }, [deskUser, profile]);

  const userDisplayName = useMemo(() => {
    const full = [deskUser?.first_name, deskUser?.last_name].filter(Boolean).join(' ').trim();
    return full || deskUser?.email || profile?.fullName || profile?.email || parentFirstName;
  }, [deskUser, parentFirstName, profile]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // A child linked at two schools appears once per school: count each child once.
  const childCount = useMemo(() => new Set(linkedStudents.map((s) => s.id)).size, [linkedStudents]);
  const tokensLabel = formatTokensShort(tokens ?? 0);
  const showSwitch =
    childCount > 1 ||
    schools.length > 1 ||
    schoolRoleOptions.length > 1 ||
    (linkedStudents.length === 0 && schools.length >= 1);

  /** Parent dashboard: selected student is the hero identity. */
  const headerName = selectedStudent?.name || selectedSchool?.name || parentFirstName;
  const headerMeta = useMemo(() => {
    if (selectedStudent) {
      return [
        selectedStudent.className,
        selectedStudent.admissionNumber ? `#${selectedStudent.admissionNumber}` : null,
        selectedStudent.schoolName,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (selectedSchool?.name) return personaLabel;
    return personaLabel;
  }, [personaLabel, selectedSchool?.name, selectedStudent]);

  const roleIconName = useMemo((): keyof typeof Ionicons.glyphMap => {
    switch (persona) {
      case 'security':
        return 'shield-checkmark';
      case 'parent':
        return 'people';
      case 'teacher':
        return 'school';
      case 'student':
        return 'person';
      case 'school_admin':
        return 'briefcase';
      case 'super_admin':
        return 'sparkles';
      default:
        return 'person-circle';
    }
  }, [persona]);

  const avatarLabel = selectedStudent?.name || parentFirstName;
  const onAvatarPress = useCallback(() => {
    if (selectedStudent && showSwitch) {
      void requestSchoolChange();
      return;
    }
    jumpToTab('Profile');
  }, [jumpToTab, requestSchoolChange, selectedStudent, showSwitch]);

  const kesLabel = (n: number | null) =>
    n == null ? 'KES —' : `KES ${n.toLocaleString()}`;

  const heroStats = useMemo(() => {
    // With one child "Family fees" repeats that child's fee balance — show it only for families.
    const next = baseHero
      .filter((s) => !(persona === 'parent' && s.id === 'total' && childCount <= 1))
      .map((s) => ({ ...s }));
    if (persona === 'parent') {
      const fees = next.find((s) => s.id === 'fees');
      const pocket = next.find((s) => s.id === 'pocket');
      const total = next.find((s) => s.id === 'total');
      if (fees) {
        fees.value = kesLabel(feeBalance);
        fees.subtitleValue = selectedStudent?.name || 'Outstanding';
      }
      if (pocket) {
        pocket.value = kesLabel(pocketBalance);
        pocket.subtitleValue = selectedStudent?.name || 'Available';
      }
      if (total) {
        // Fees owed across every linked child (pocket money is savings, never added to a debt).
        total.value = kesLabel(familyFees);
        total.subtitleValue = childCount ? `${childCount} ${childCount === 1 ? 'child' : 'children'}` : 'Outstanding';
      }
    }
    if (persona === 'school_admin' && officeHero) {
      const learners = next.find((s) => s.id === 'learners');
      const collected = next.find((s) => s.id === 'collected');
      const outstanding = next.find((s) => s.id === 'outstanding');
      if (learners) {
        learners.value = officeHero.learners != null ? officeHero.learners.toLocaleString() : '—';
        learners.subtitleValue = selectedSchool?.name || 'Active roll';
      }
      if (collected) collected.value = kesLabel(officeHero.collected ?? null);
      if (outstanding) outstanding.value = kesLabel(officeHero.outstanding ?? null);
    }
    if (persona === 'security') {
      const active = next.find((s) => s.id === 'active-trip');
      const boarded = next.find((s) => s.id === 'boarded');
      const assignmentStat = next.find((s) => s.id === 'assignment');
      if (active) {
        const onTrip = securityActiveTrip?.status === 'active';
        active.value = onTrip ? 'Active' : 'None';
        active.subtitleValue = onTrip
          ? securityActiveTrip?.trip_kind?.replace(/_/g, ' ') ?? 'On run'
          : 'Start from Trips';
      }
      if (boarded) {
        boarded.value =
          securityBoardedTotal != null
            ? String(securityBoardedTotal)
            : securityAttendanceToday != null
              ? String(securityAttendanceToday)
              : '—';
        boarded.subtitleValue =
          securityBoardedTotal != null
            ? 'This trip'
            : securityAttendanceToday != null
              ? 'Gate today'
              : 'Students';
        boarded.title = securityBoardedTotal != null ? 'Boarded' : 'Today attendance';
      }
      if (assignmentStat) {
        assignmentStat.value = securityAssignment?.vehicle_name ?? '—';
        assignmentStat.subtitleValue = securityAssignment?.route_name ?? 'Unassigned';
      }
    }
    if (persona === 'teacher' && teacherHero) {
      const classes = next.find((s) => s.id === 'classes');
      const students = next.find((s) => s.id === 'students');
      const workload = next.find((s) => s.id === 'workload');
      if (classes) {
        classes.value =
          teacherHero.class_count != null ? String(teacherHero.class_count) : '—';
        classes.subtitleValue = teacherHero.school_name || 'Assigned';
      }
      if (students) {
        students.value =
          teacherHero.student_count != null ? String(teacherHero.student_count) : '—';
      }
      if (workload) {
        workload.value =
          teacherHero.workload_count != null ? String(teacherHero.workload_count) : '—';
        workload.subtitleValue = 'Class × Subject';
      }
    }
    if (persona === 'student' && studentHero) {
      const grade = next.find((s) => s.id === 'grade');
      const attendance = next.find((s) => s.id === 'attendance');
      const pendingFees = next.find((s) => s.id === 'pending-fees');
      const pocket = next.find((s) => s.id === 'pocket');
      const pending = next.find((s) => s.id === 'pending');
      if (grade && studentHero.grade) grade.value = studentHero.grade;
      if (grade && studentHero.admissionLabel) {
        grade.subtitleValue = studentHero.admissionLabel;
      }
      if (grade && studentHero.className) {
        grade.subtitle = studentHero.className;
      }
      if (attendance && studentHero.attendancePct != null) {
        attendance.value = `${studentHero.attendancePct}%`;
      } else if (attendance) {
        attendance.value = '—%';
        attendance.subtitleValue = 'No marks yet';
      }
      if (pendingFees && studentHero.feesLabel) {
        pendingFees.value = studentHero.feesLabel;
        pendingFees.subtitleValue = 'School fees';
      }
      if (pocket && studentHero.pocketLabel) {
        pocket.value = studentHero.pocketLabel;
        pocket.subtitleValue =
          studentHero.pocketBalance != null ? 'Wallet balance' : 'Ask the school office';
      }
      if (pending && studentHero.assignmentsLabel) {
        pending.value = studentHero.assignmentsLabel;
        pending.subtitleValue =
          studentHero.assignmentsLabel === '0' ? 'None yet' : 'Due soon';
      }
    }
    return next;
  }, [
    baseHero,
    persona,
    feeBalance,
    familyFees,
    officeHero,
    childCount,
    selectedSchool?.name,
    pocketBalance,
    selectedStudent?.name,
    securityActiveTrip,
    securityAssignment,
    securityAttendanceToday,
    securityBoardedTotal,
    teacherHero,
    studentHero,
  ]);

  const primaryHero = heroStats[0];
  const secondaryHero = heroStats.slice(1, 3);

  const green = palette.primary;
  const yellow = palette.secondary;
  const masked = (v: string) => (hideValues ? '••••••' : v);
  const schoolLine = selectedSchool?.name || schools[0]?.name || 'Tukua';

  if (!deskReady) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.muted }]}>
        <DashboardBackground patternOnly liquid />
        <PatternTiles />
        <ActivityIndicator color={heroGreen} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.muted }]}>
      {/* Flat warm-neutral page with the faint maths pattern (no glows, no gradients). */}
      <DashboardBackground patternOnly liquid />
      <PatternTiles />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {/* Identity — selected student (parent) or school / profile */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.avatarHit}
              onPress={onAvatarPress}
              accessibilityLabel={
                selectedStudent ? 'Change student' : 'Open profile'
              }>
              <ProfileAvatar name={avatarLabel} uri={avatarUrl} size={48} />
            </Pressable>
            <View style={styles.topTextCol}>
              <Text style={styles.greeting} numberOfLines={1}>
                {greeting}, {parentFirstName}
              </Text>
              <Text style={styles.contextTitle} numberOfLines={1}>
                {headerName}
              </Text>
              {headerMeta ? (
                <View style={styles.contextMetaRow}>
                  {!selectedStudent ? (
                    <Ionicons name={roleIconName} size={13} color={Colors.mutedForeground} style={{ marginRight: 4 }} />
                  ) : null}
                  <Text style={styles.contextMeta} numberOfLines={1}>
                    {headerMeta}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications">
                <Ionicons name="notifications-outline" size={18} color={green} />
              </Pressable>
              {/* One switcher: both old buttons opened the same school → role → child picker. */}
              {showSwitch ? (
                <Pressable
                  style={styles.headerIconBtn}
                  onPress={() => void requestSchoolChange()}
                  accessibilityRole="button"
                  accessibilityLabel={
                    childCount > 1
                      ? 'Switch child, school or role'
                      : 'Switch school or role'
                  }>
                  <Ionicons name="swap-horizontal" size={18} color={green} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Role chip + signed-in user */}
          <View style={styles.roleRow}>
            <View style={styles.roleIdentityCol}>
              <Text style={styles.userName} numberOfLines={1}>
                {userDisplayName}
              </Text>
              <View style={styles.roleChipRow}>
                <View style={[styles.roleChip, { backgroundColor: rgba(green, 0.08) }]}>
                  <Ionicons name={roleIconName} size={12} color={green} style={{ marginRight: 4 }} />
                  <Text style={[styles.roleChipText, { color: green }]}>{personaLabel}</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={[styles.tokenChip, { backgroundColor: rgba(yellow, 0.16), borderColor: rgba(yellow, 0.45) }]}
              onPress={() => navigate('/profile/balances', '/profile')}
              accessibilityRole="button"
              accessibilityLabel={`Tokens ${tokensLabel}`}>
              <Ionicons name="diamond" size={12} color={green} />
              {tokensLoading ? (
                <ActivityIndicator size="small" color={green} />
              ) : (
                <Text style={[styles.tokenChipText, { color: green }]}>{tokensLabel}</Text>
              )}
            </Pressable>
          </View>

          {/* Hero — bank-card style: flat dark green, yellow accents, rings top-right. No gradient. */}
          <View style={[styles.heroCard, { backgroundColor: green, boxShadow: `0px 8px 16px ${rgba(green, 0.28)}` }]}>
            <View pointerEvents="none" style={styles.heroRingFill} />
            <View pointerEvents="none" style={styles.heroRingLine} />
            <View pointerEvents="none" style={[styles.heroRingAccent, { borderColor: rgba(yellow, 0.22) }]} />
            <View pointerEvents="none" style={styles.heroRim} />

            <View style={styles.heroContent}>
              {/* School line + persona chip, the hero icon where a card brand sits */}
              <View style={styles.heroTopRow}>
                <View style={styles.heroTopLeft}>
                  <Text style={styles.heroSchool} numberOfLines={1}>
                    {schoolLine}
                  </Text>
                  <View style={[styles.heroChipPill, { backgroundColor: rgba(yellow, 0.24) }]}>
                    <Text style={[styles.heroChipPillText, { color: yellow }]} numberOfLines={1}>
                      {personaLabel.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroIconBox}>
                  <HeroPlainIcon name={primaryHero.icon} size={18} color={yellow} />
                </View>
              </View>

              {/* Chip + the primary stat's context line, like the number on a card */}
              <View style={styles.heroChipRow}>
                <CardChip color={yellow} />
                <Text style={styles.heroCardLine} numberOfLines={1}>
                  {primaryHero.subtitle} · {primaryHero.subtitleValue}
                </Text>
              </View>

              {/* Main figure with the eye toggle */}
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroKicker}>{primaryHero.title.toUpperCase()}</Text>
                <Pressable
                  onPress={() => setHideValues((v) => !v)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={hideValues ? 'Show figures' : 'Hide figures'}
                  style={styles.heroEye}>
                  <Ionicons name={hideValues ? 'eye-off-outline' : 'eye-outline'} size={12} color="rgba(255,255,255,0.92)" />
                </Pressable>
              </View>
              <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                {masked(primaryHero.value)}
              </Text>

              {/* Footer: the other figures as pills */}
              {secondaryHero.length ? (
                <View style={styles.heroFooter}>
                  {secondaryHero.map((stat) => (
                    <Pressable
                      key={stat.id}
                      style={({ pressed }) => [styles.heroStat, pressed && { opacity: 0.75 }]}
                      onPress={() => {
                        if (stat.id === 'fees' || stat.id === 'pocket') {
                          navigation.navigate('Accounts');
                        } else {
                          navigate('/profile/balances', '/profile');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${stat.title} ${stat.value}`}>
                      <Text style={[styles.heroStatLabel, { color: yellow }]} numberOfLines={1}>
                        {stat.title.toUpperCase()}
                      </Text>
                      <Text style={styles.heroStatValue} numberOfLines={1}>
                        {masked(stat.value)}
                      </Text>
                      <Text style={styles.heroStatSub} numberOfLines={1}>
                        {stat.subtitleValue}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {persona === 'student' && studentHero ? (
            <View style={styles.studentMetricsRow}>
              {/* Pocket money and fees are already on the card above; only the rest goes here. */}
              {[
                { label: 'Assignments', value: studentHero.assignmentsLabel ?? '—' },
                {
                  label: 'Attendance',
                  value:
                    studentHero.attendancePct != null ? `${studentHero.attendancePct}%` : '—%',
                },
              ].map((m) => (
                <View key={m.label} style={styles.studentMetric}>
                  <View style={[styles.studentMetricMark, { backgroundColor: yellow }]} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.studentMetricLabel}>{m.label.toUpperCase()}</Text>
                    <Text style={[styles.studentMetricValue, { color: green }]} numberOfLines={1}>
                      {m.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Shortcut cards — two rows of four, alternating solid green / yellow-tinted tiles */}
          {sections.map((section) => (
            <MenuCard key={section.id} title={section.title} style={styles.sectionCard}>
              <View style={styles.cardRows}>
                {rowsOf(section.actions).map((row, rowIndex) => (
                  <View key={`${section.id}-r${rowIndex}`} style={styles.tileRow}>
                    {row.map((action, colIndex) => (
                      <MenuItem
                        key={action.id}
                        label={action.title}
                        solid={(rowIndex + colIndex) % 2 === 0}
                        onPress={() => onPressAction(action)}
                        accessibilityLabel={`${action.title}. ${action.description}`}
                        accessibilityHint={action.description}
                        renderIcon={(c) => <PlainIcon name={action.icon} size={TILE_ICON_SIZE} color={c} />}
                      />
                    ))}
                    {row.length < PER_ROW
                      ? Array.from({ length: PER_ROW - row.length }).map((_, i) => (
                          <View key={`pad-${section.id}-${rowIndex}-${i}`} style={styles.tilePad} />
                        ))
                      : null}
                  </View>
                ))}
              </View>
            </MenuCard>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const H_PAD = 16;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: H_PAD },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarHit: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EBE7',
  },
  topTextCol: { flex: 1, minWidth: 0 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EBE7',
  },
  greeting: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  contextTitle: {
    marginTop: 1,
    fontFamily: 'Roboto_700Bold',
    fontSize: 18,
    color: '#1D1B20',
  },
  contextMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.mutedForeground,
    flexShrink: 1,
  },
  contextMetaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  roleIdentityCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#1D1B20',
  },
  roleChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tokenChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    minHeight: 188,
  },
  heroRingFill: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroRingLine: {
    position: 'absolute',
    top: -30,
    right: -90,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroRingAccent: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  heroRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroTopLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSchool: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  heroChipPill: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  heroChipPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  heroIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  heroCardLine: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.82)',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  heroKicker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.9,
    color: 'rgba(255,255,255,0.6)',
    marginRight: 6,
  },
  heroEye: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 23,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  heroFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroStat: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroStatLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  heroStatValue: {
    marginTop: 3,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  heroStatSub: {
    marginTop: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  sectionCard: {
    marginBottom: 14,
  },
  cardRows: { gap: 14 },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tilePad: { flex: 1 },
  studentMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  studentMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#E6ECE9',
  },
  studentMetricMark: { width: 3, height: 28, borderRadius: 2 },
  studentMetricLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
    color: Colors.mutedForeground,
  },
  studentMetricValue: {
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
});
