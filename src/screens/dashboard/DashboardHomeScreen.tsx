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
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
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
  fetchParentAttendance,
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
  INDIVIDUAL_DASHBOARD_ACTIONS,
  PARENT_DASHBOARD_ACTIONS,
  SCHOOL_ADMIN_DASHBOARD_ACTIONS,
  SECURITY_DASHBOARD_ACTIONS,
  STUDENT_DASHBOARD_ACTIONS,
  SUPER_ADMIN_DASHBOARD_ACTIONS,
  TEACHER_DASHBOARD_ACTIONS,
  dashboardSectionsForPersona,
} from './dashboardActions';
import { buildHeroContent, summariseToday, type HeroLesson, type HeroTarget } from './heroContent';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DeskPersona, holdsAnyRole } from '../../lib/deskRoles';
import { fetchAccountsDashboard, fetchSchoolDashboardAnalytics, fetchSchoolsRegistry } from '../../lib/adminPortalApi';
import {
  fetchClasses,
  fetchMyTeacherWorkloads,
  fetchTeacherStats,
  fetchTeacherTimetable,
} from '../../lib/teacherPortalApi';
import {
  fetchStudentAssignments,
  fetchStudentExams,
  fetchStudentFees,
  fetchStudentProfile,
  fetchStudentRecentAttendance,
  fetchStudentExamSummary,
  resolveStudentRecordId,
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
  bell: 'notifications',
  smartphone: 'phone-portrait',
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
  zap: 'sparkles',
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
  const bottomBarSpace = useBottomBarSpace();
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

  // The person's own roles behind the hat (a bursar on the office hat holds "bursar", not
  // "school_admin"), so office tiles match what the server lets them open.
  const activeRoles = useMemo(() => heldRoles.map((r) => String(r).toLowerCase()), [heldRoles]);

  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [teacherHero, setTeacherHero] = useState<{
    class_count?: number;
    student_count?: number;
    workload_count?: number;
    lessons_today?: number | null;
    next_lesson?: HeroLesson | null;
  } | null>(null);
  const [studentHero, setStudentHero] = useState<{
    grade?: string | null;
    attendancePct?: number | null;
    className?: string | null;
    fees?: number | null;
    pendingAssignments?: number | null;
    lessonsToday?: number | null;
    nextLesson?: HeroLesson | null;
    coursesInProgress?: number | null;
  } | null>(null);

  const baseActions = useMemo(() => actionsForPersona(persona), [persona]);
  const actionAllowed = useCallback(
    (action: DashboardAction) => {
      const schoolModules = selectedSchool?.enabledModules ?? schools[0]?.enabledModules ?? null;
      if (action.requireAnyRole?.length && !holdsAnyRole(activeRoles, action.requireAnyRole)) {
        return false;
      }
      if (action.requireClassTeacher && !isClassTeacher && !holdsAnyRole(activeRoles, ['class_teacher'])) {
        return false;
      }
      const mod = DASHBOARD_ACTION_MODULE[action.id] ?? 'core';
      if (!schoolHasModule(schoolModules, mod)) return false;
      return true;
    },
    [activeRoles, isClassTeacher, selectedSchool?.enabledModules, schools],
  );
  const actions = useMemo(() => baseActions.filter(actionAllowed), [baseActions, actionAllowed]);
  /** Titled groups per user type (Quick access first); falls back to cards of eight. */
  const sections = useMemo<ActionSection[]>(() => {
    const grouped = dashboardSectionsForPersona(persona)
      .map((sec, i) => ({ id: `section-${i}`, title: sec.title, actions: sec.actions.filter(actionAllowed) }))
      .filter((sec) => sec.actions.length > 0);
    return grouped.length ? grouped : sectionsForActions(actions);
  }, [persona, actionAllowed, actions]);

  const [tokens, setTokens] = useState<number | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [feeBalance, setFeeBalance] = useState<number | null>(null);
  const [familyFees, setFamilyFees] = useState<number | null>(null);
  const [officeHero, setOfficeHero] = useState<{
    learners?: number;
    staff?: number;
    collected?: number;
    outstanding?: number;
    invoiced?: number;
    receipts?: number;
  } | null>(null);
  const [parentAttendancePct, setParentAttendancePct] = useState<number | null>(null);
  const [saSchools, setSaSchools] = useState<number | null>(null);
  const [myCourses, setMyCourses] = useState<number | null>(null);
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
      setParentAttendancePct(null);
      return;
    }
    const forStudent = selectedStudentId;
    try {
      const [accounts, pocket, family, attendance] = await Promise.allSettled([
        fetchParentAccountsStatement(selectedStudentId),
        fetchParentPocketMoney(selectedStudentId),
        // No student_id → one balance row per linked child.
        deskFetch<{ balances?: Array<{ balance?: number }> }>('/parents/me/accounts-statement'),
        fetchParentAttendance(selectedStudentId),
      ]);
      if (forStudent !== latestStudentRef.current) return; // parent switched child meanwhile
      if (attendance.status === 'fulfilled') {
        const rows = attendance.value?.summary ?? [];
        const row = rows.find((r) => String(r.student_id) === String(forStudent)) ?? (rows.length === 1 ? rows[0] : null);
        // Late counts as present (as on Desk).
        setParentAttendancePct(
          row && row.total > 0 ? Math.round(((Number(row.present) + Number(row.late || 0)) / row.total) * 100) : null,
        );
      } else {
        setParentAttendancePct(null);
      }
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
      const staff =
        t?.staff != null || t?.teachers != null ? Number(t?.staff ?? 0) + Number(t?.teachers ?? 0) : undefined;
      setOfficeHero({
        learners: t?.students_active ?? t?.students,
        staff,
        collected: o?.collected,
        outstanding: o?.outstanding,
        invoiced: o?.invoiced,
        receipts: o?.receipt_count,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [deskToken, persona, selectedSchool?.id, deskUser?.school_id]);

  useEffect(() => {
    void loadStudentBalances();
  }, [loadStudentBalances]);

  // Super admin: how many schools are on the platform (one row, read the total).
  useEffect(() => {
    if (!deskToken || persona !== 'super_admin') {
      setSaSchools(null);
      return;
    }
    let cancelled = false;
    fetchSchoolsRegistry(undefined, 1, 1)
      .then((r) => {
        if (!cancelled) setSaSchools(r.total || null);
      })
      .catch(() => {
        if (!cancelled) setSaSchools(null);
      });
    return () => {
      cancelled = true;
    };
  }, [deskToken, persona]);

  // Learners and individuals: e-learning courses still in progress (needs a school; 400 → unknown).
  useEffect(() => {
    if (persona !== 'student' && persona !== 'individual') {
      setMyCourses(null);
      return;
    }
    let cancelled = false;
    deskFetch<{ courses?: Array<{ progress_percent?: number }> }>('/elearning/my-courses?limit=50')
      .then((r) => {
        if (cancelled) return;
        const rows = Array.isArray(r?.courses) ? r.courses : [];
        setMyCourses(rows.filter((c) => Number(c.progress_percent ?? 0) < 100).length);
      })
      .catch(() => {
        if (!cancelled) setMyCourses(null);
      });
    return () => {
      cancelled = true;
    };
  }, [persona, deskToken]);

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
        const [stats, workloads, classes, timetable] = await Promise.allSettled([
          fetchTeacherStats(),
          teacherId ? fetchMyTeacherWorkloads(teacherId) : Promise.resolve([]),
          fetchClasses(80),
          teacherId ? fetchTeacherTimetable(teacherId) : Promise.resolve(null),
        ]);
        const today = summariseToday(timetable.status === 'fulfilled' ? timetable.value : null);
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
          lessons_today: today.lessonsToday,
          next_lesson: today.nextLesson,
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
        const [profile, exams, att, assignments, fees, overviewRes, timetable] = await Promise.allSettled([
          sid ? fetchStudentProfile(sid) : Promise.resolve(null),
          fetchStudentExams(5),
          sid ? fetchStudentRecentAttendance(sid, 14) : Promise.resolve([]),
          sid ? fetchStudentAssignments(sid) : Promise.resolve({ assignments: [] }),
          fetchStudentFees(),
          // Same figures as Desk (fees for this financial year, attendance with late counted as present,
          // latest results); the older calls above stay as the fallback for an API without it.
          deskFetch<StudentOverview>('/students/me/overview'),
          deskFetch<unknown>('/students/me/timetable'),
        ]);
        const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null;
        const prof = profile.status === 'fulfilled' ? profile.value : null;
        const examList = exams.status === 'fulfilled' ? exams.value : [];
        const attRows = att.status === 'fulfilled' ? att.value : [];
        const assignmentRows =
          assignments.status === 'fulfilled' ? assignments.value?.assignments ?? [] : [];
        const feeRow = fees.status === 'fulfilled' ? fees.value : null;
        const presentDays = new Set(attRows.map((m) => String(m.marked_at ?? '').slice(0, 10))).size;
        let gradeLabel: string | null = null;
        const latest = overview?.grades?.latest;
        if (latest?.mean != null) {
          gradeLabel = latest.grade ? String(latest.grade) : `${latest.mean}%`;
        } else if (examList[0]?.id && sid) {
          try {
            const { summary } = await fetchStudentExamSummary(examList[0].id, sid);
            const mean = summary?.mean_grade ?? summary?.mean_mark;
            if (mean != null && String(mean).trim()) gradeLabel = String(mean).trim();
          } catch {
            /* no grade line */
          }
        }
        if (cancelled) return;
        // Homework still to hand in (handed-in or marked work is not "pending").
        const pendingCount = assignmentRows.filter((a) => {
          const st = String(a.status ?? a.submission_status ?? '').toLowerCase();
          return !/(complete|submit|grade|done)/.test(st);
        }).length;
        const feeNum = Number(overview?.fees?.balance ?? feeRow?.balance ?? NaN);
        const today = summariseToday(timetable.status === 'fulfilled' ? timetable.value : null);
        setStudentHero({
          grade: gradeLabel,
          attendancePct:
            overview?.attendance?.rate != null
              ? Math.round(overview.attendance.rate)
              : attRows.length
                ? Math.min(100, Math.round((presentDays / 14) * 100))
                : null,
          className: prof?.class_name || prof?.current_class || null,
          fees: Number.isFinite(feeNum) ? feeNum : null,
          pendingAssignments: assignments.status === 'fulfilled' ? pendingCount : null,
          lessonsToday: today.lessonsToday,
          nextLesson: today.nextLesson,
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

  // Bursar / accountant on the office hat (and not also a principal or admin): money-first card.
  const isFinance = useMemo(
    () =>
      persona === 'school_admin' &&
      activeRoles.some((r) => /bursar|accountant|finance/.test(r)) &&
      !activeRoles.some((r) => /principal|deputy|head|school_admin|^admin$|director|registrar/.test(r)),
    [activeRoles, persona],
  );

  const hero = useMemo(
    () =>
      buildHeroContent({
        persona,
        isFinance,
        schoolName: selectedSchool?.name ?? schools[0]?.name ?? null,
        tokens,
        student: studentHero
          ? {
              fees: studentHero.fees ?? null,
              attendancePct: studentHero.attendancePct ?? null,
              pendingAssignments: studentHero.pendingAssignments ?? null,
              className: studentHero.className,
              grade: studentHero.grade,
              lessonsToday: studentHero.lessonsToday ?? null,
              nextLesson: studentHero.nextLesson ?? null,
              coursesInProgress: myCourses,
            }
          : null,
        parent: {
          childName: selectedStudent?.name,
          childMeta: [selectedStudent?.className, selectedStudent?.schoolName].filter(Boolean).join(' · ') || null,
          childCount,
          fees: feeBalance,
          pocket: pocketBalance,
          familyFees,
          attendancePct: parentAttendancePct,
        },
        teacher: teacherHero
          ? {
              classes: teacherHero.class_count ?? null,
              students: teacherHero.student_count ?? null,
              workloads: teacherHero.workload_count ?? null,
              lessonsToday: teacherHero.lessons_today ?? null,
              nextLesson: teacherHero.next_lesson ?? null,
            }
          : null,
        office: officeHero
          ? {
              learners: officeHero.learners ?? null,
              staff: officeHero.staff ?? null,
              collected: officeHero.collected ?? null,
              outstanding: officeHero.outstanding ?? null,
              invoiced: officeHero.invoiced ?? null,
              receipts: officeHero.receipts ?? null,
            }
          : null,
        security: {
          tripActive: securityActiveTrip?.status === 'active',
          tripKind: securityActiveTrip?.trip_kind ?? null,
          boarded: securityBoardedTotal,
          gateToday: securityAttendanceToday,
          vehicle: securityAssignment?.vehicle_name ?? null,
          route: securityAssignment?.route_name ?? null,
        },
        superAdmin: { schools: saSchools },
        individual: { coursesInProgress: myCourses },
      }),
    [
      persona,
      isFinance,
      selectedSchool?.name,
      schools,
      tokens,
      studentHero,
      myCourses,
      selectedStudent?.name,
      selectedStudent?.className,
      selectedStudent?.schoolName,
      childCount,
      feeBalance,
      pocketBalance,
      familyFees,
      parentAttendancePct,
      teacherHero,
      officeHero,
      securityActiveTrip,
      securityBoardedTotal,
      securityAttendanceToday,
      securityAssignment,
      saSchools,
    ],
  );

  const goHeroTarget = useCallback(
    (t: HeroTarget) => {
      if (t.kind === 'screen') {
        if (t.screen === 'SuperAdminSchools') navigation.navigate('SuperAdminSchools', undefined);
        else navigation.navigate(t.screen as never);
      } else if (t.kind === 'web') {
        if (t.tab === 'Courses') {
          jumpToTab('Courses');
          navigate(t.path, '/courses');
        } else {
          navigate(t.path, '/profile');
        }
      }
    },
    [jumpToTab, navigate, navigation],
  );

  const green = palette.primary;
  const yellow = palette.secondary;
  const masked = (v: string, sensitive = true) => (hideValues && sensitive ? '••••••' : v);
  const canSwitchChild = persona === 'parent' && childCount > 1;

  if (!deskReady) {
    return (
      <View style={[styles.root, { backgroundColor: palette.muted }]}>
        <DashboardBackground patternOnly liquid />
        <PatternTiles />
        <DashboardSkeleton topInset={floatingHeaderInset(insets.top)} />
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
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: bottomBarSpace + 16 },
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

          {/* Hero — compact bank card: flat dark green, yellow chip, subtle rings. Left: the main figure
              for this kind of user; right: two small stat chips. No gradient. */}
          <View style={[styles.heroCard, { backgroundColor: green, boxShadow: `0px 6px 14px ${rgba(green, 0.24)}` }]}>
            <View pointerEvents="none" style={styles.heroRingFill} />
            <View pointerEvents="none" style={styles.heroRingLine} />
            <View pointerEvents="none" style={[styles.heroRingAccent, { borderColor: rgba(yellow, 0.18) }]} />
            <View pointerEvents="none" style={styles.heroRim} />

            <View style={styles.heroContent}>
              <Pressable
                style={({ pressed }) => [styles.heroMain, pressed && { opacity: 0.85 }]}
                onPress={() => goHeroTarget(hero.target)}
                accessibilityRole="button"
                accessibilityLabel={`${hero.kicker} ${hero.value}. ${hero.caption}`}>
                <View style={styles.heroLabelRow}>
                  <CardChip color={yellow} scale={0.5} />
                  <Text style={styles.heroKicker} numberOfLines={1}>
                    {hero.kicker.toUpperCase()}
                  </Text>
                  <Pressable
                    onPress={() => setHideValues((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={hideValues ? 'Show figures' : 'Hide figures'}
                    style={styles.heroEye}>
                    <Ionicons name={hideValues ? 'eye-off-outline' : 'eye-outline'} size={11} color="rgba(255,255,255,0.92)" />
                  </Pressable>
                  {canSwitchChild ? (
                    <Pressable
                      onPress={() => void requestSchoolChange()}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Switch child"
                      style={[styles.heroEye, { marginLeft: 4 }]}>
                      <Ionicons name="swap-horizontal" size={11} color="rgba(255,255,255,0.92)" />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {masked(hero.value, hero.sensitive)}
                </Text>
                <View style={styles.heroCaptionRow}>
                  <HeroPlainIcon name={hero.icon} size={11} color={yellow} />
                  <Text style={styles.heroCaption} numberOfLines={1}>
                    {hero.caption}
                  </Text>
                </View>
              </Pressable>

              {hero.chips.length ? (
                <View style={styles.heroChips}>
                  {hero.chips.slice(0, 2).map((chip) => (
                    <Pressable
                      key={chip.id}
                      style={({ pressed }) => [styles.heroStat, pressed && { opacity: 0.75 }]}
                      onPress={() => goHeroTarget(chip.target)}
                      accessibilityRole="button"
                      accessibilityLabel={`${chip.label} ${chip.value}`}>
                      <Text style={[styles.heroStatLabel, { color: yellow }]} numberOfLines={1}>
                        {chip.label.toUpperCase()}
                      </Text>
                      <Text style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                        {masked(chip.value, Boolean(chip.sensitive))}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

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
  },
  heroRingFill: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  heroRingLine: {
    position: 'absolute',
    top: -20,
    right: -70,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroRingAccent: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
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
    borderColor: 'rgba(255,255,255,0.14)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroMain: { flex: 1, minWidth: 0 },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroKicker: {
    flexShrink: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
  },
  heroEye: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  heroCaptionRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroCaption: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
  },
  heroChips: {
    width: '38%',
    maxWidth: 150,
    gap: 6,
  },
  heroStat: {
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroStatLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8.5,
    letterSpacing: 0.5,
  },
  heroStatValue: {
    marginTop: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
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
});
