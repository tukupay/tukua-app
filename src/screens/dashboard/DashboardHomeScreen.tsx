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
import { LinearGradient } from 'expo-linear-gradient';
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
import { ProfileAvatar } from '../../components/navigation/ProfileAvatar';
import { deskFetch } from '../../lib/deskApi';
import { isDeskErpPath, isDeskWebModuleAvailable } from '../../lib/localHost';
import {
  fetchParentAccountsStatement,
  fetchParentPocketMoney,
} from '../../lib/parentPortalApi';
import {
  fetchSecurityActiveTrip,
  fetchSecurityAssignment,
  type SecurityAssignment,
  type SecurityTripRun,
} from '../../lib/transportApi';
import { formatTokensShort } from '../../components/navigation/TokenBalancePill';
import { useRegisterTabJumper } from '../../hooks/useRegisterTabJumper';
import { useAppTheme } from '../../context/AppThemeContext';
import { useTokenGate } from '../../context/TokenGateContext';
import type { ThemePalette } from '../../theme/schoolThemes';
import {
  DashboardAction,
  FeatherIconName,
  HeroStat,
  INDIVIDUAL_DASHBOARD_ACTIONS,
  PARENT_DASHBOARD_ACTIONS,
  PARENT_HERO,
  SECURITY_DASHBOARD_ACTIONS,
  SECURITY_HERO,
  SCHOOL_ADMIN_DASHBOARD_ACTIONS,
  STUDENT_DASHBOARD_ACTIONS,
  STUDENT_HERO,
  SUPER_ADMIN_DASHBOARD_ACTIONS,
  TEACHER_DASHBOARD_ACTIONS,
  TEACHER_HERO,
} from './dashboardActions';
import { DeskPersona } from '../../lib/deskRoles';
import { fetchClasses, fetchMyTeacherWorkloads, fetchTeacherStats } from '../../lib/teacherPortalApi';
import { fetchStudentExams, fetchStudentRecentAttendance } from '../../lib/studentPortalApi';

type ActionSection = {
  id: string;
  title: string;
  actions: DashboardAction[];
};

const TILE_SIZE = 52;
const ICON_SIZE = 30;

/** Mostly dark theme hues + occasional bright accent. */
function tileAccentFor(palette: ThemePalette, index: number): string {
  const darks = [
    palette.primary,
    palette.tertiary,
    '#1e293b',
    '#334155',
    '#0f172a',
    '#1f2937',
  ];
  const brights = [palette.secondary, '#F59E0B', '#0EA5E9'];
  if (index % 4 === 3) return brights[Math.floor(index / 4) % brights.length];
  return darks[index % darks.length];
}

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
  'file-plus': 'document-add',
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
    default:
      return PARENT_HERO.slice(0, 3);
  }
}

/** Keep every action — chunk into rows of 4 (never drop Bulk Pay etc.). */
function sectionsForActions(actions: DashboardAction[]): ActionSection[] {
  const chunks: DashboardAction[][] = [];
  for (let i = 0; i < actions.length; i += 4) chunks.push(actions.slice(i, i + 4));
  return chunks.map((chunk, index) => ({
    id: `section-${index}`,
    title: SECTION_TITLES[index] ?? `More ${index + 1}`,
    actions: chunk,
  }));
}

function ModuleTile({
  action,
  onPress,
  accent,
}: {
  action: DashboardAction;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${action.title}. ${action.description}`}
      accessibilityHint={action.description}>
      <View style={styles.tileIconWrap}>
        <PlainIcon name={action.icon} size={ICON_SIZE} color={accent} />
      </View>
      <View style={styles.tileLabelBox}>
        <Text style={styles.tileLabel} numberOfLines={2}>
          {action.title}
        </Text>
      </View>
    </Pressable>
  );
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
    selectedRole,
  } = useDeskAuth();
  const { guardDashboardAction } = useTokenGate();
  const heroGreen = palette.primary;

  const activeRoles = useMemo(() => {
    const fromSchool = selectedSchool?.roles ?? schools[0]?.roles ?? [];
    const list = selectedRole ? [selectedRole] : fromSchool;
    const fromUser = deskUser?.user_roles;
    const extra = Array.isArray(fromUser) ? fromUser : fromUser ? [fromUser] : [];
    return [...list, ...extra].map((r) => String(r).toLowerCase());
  }, [deskUser?.user_roles, schools, selectedRole, selectedSchool?.roles]);

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
    assignmentCount?: number | null;
  } | null>(null);

  const baseActions = useMemo(() => actionsForPersona(persona), [persona]);
  const actions = useMemo(() => {
    return baseActions.filter((action) => {
      if (action.requireAnyRole?.length) {
        const ok = action.requireAnyRole.some((need) =>
          activeRoles.some((r) => r.includes(need.toLowerCase())),
        );
        if (!ok) return false;
      }
      if (action.requireClassTeacher && !isClassTeacher) {
        const hasRole = activeRoles.some(
          (r) => r.includes('class_teacher') || r.includes('class-teacher'),
        );
        if (!hasRole) return false;
      }
      return true;
    });
  }, [activeRoles, baseActions, isClassTeacher]);
  const sections = useMemo(() => sectionsForActions(actions), [actions]);
  const baseHero = useMemo(() => heroForPersona(persona), [persona]);

  const [tokens, setTokens] = useState<number | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [feeBalance, setFeeBalance] = useState<number | null>(null);
  const [pocketBalance, setPocketBalance] = useState<number | null>(null);
  const [securityAssignment, setSecurityAssignment] = useState<SecurityAssignment | null>(null);
  const [securityActiveTrip, setSecurityActiveTrip] = useState<SecurityTripRun | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

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

  const loadStudentBalances = useCallback(async () => {
    if (!deskToken || persona !== 'parent' || !selectedStudentId) {
      setFeeBalance(null);
      setPocketBalance(null);
      return;
    }
    try {
      const [accounts, pocket] = await Promise.allSettled([
        fetchParentAccountsStatement(selectedStudentId),
        fetchParentPocketMoney(selectedStudentId),
      ]);
      if (accounts.status === 'fulfilled') {
        const rows = accounts.value?.balances ?? [];
        const total = rows.reduce((sum, b) => sum + (Number(b.balance ?? 0) || 0), 0);
        setFeeBalance(rows.length ? total : 0);
      } else {
        setFeeBalance(null);
      }
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
      return;
    }
    try {
      const [assignRes, tripRes] = await Promise.allSettled([
        fetchSecurityAssignment(),
        fetchSecurityActiveTrip(),
      ]);
      setSecurityAssignment(assignRes.status === 'fulfilled' ? assignRes.value?.assignment ?? null : null);
      setSecurityActiveTrip(tripRes.status === 'fulfilled' ? tripRes.value?.trip ?? null : null);
    } catch {
      setSecurityAssignment(null);
      setSecurityActiveTrip(null);
    }
  }, [deskToken, persona]);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

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
    void (async () => {
      try {
        const [stats, workloads, classes] = await Promise.allSettled([
          fetchTeacherStats(),
          teacherId ? fetchMyTeacherWorkloads(teacherId) : Promise.resolve([]),
          fetchClasses(80),
        ]);
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
          school_name: selectedSchool?.name || selectedSchool?.school_name,
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
        setTeacherHero(null);
      }
    })();
  }, [
    activeRoles,
    deskToken,
    deskUser?.id,
    deskUser?.user_id,
    persona,
    selectedSchool?.name,
    selectedSchool?.school_name,
  ]);

  useEffect(() => {
    if (!deskToken || persona !== 'student') {
      setStudentHero(null);
      return;
    }
    const sid = String(selectedStudentId ?? deskUser?.id ?? '').trim();
    void (async () => {
      try {
        const [exams, marks] = await Promise.allSettled([
          fetchStudentExams(5),
          sid ? fetchStudentRecentAttendance(sid, 14) : Promise.resolve([]),
        ]);
        const examList = exams.status === 'fulfilled' ? exams.value : [];
        const att = marks.status === 'fulfilled' ? marks.value : [];
        const presentDays = new Set(att.map((m) => String(m.marked_at ?? '').slice(0, 10))).size;
        setStudentHero({
          grade: examList.length ? 'See grades' : 'No grades yet',
          attendancePct: att.length ? Math.round((presentDays / 14) * 100) : null,
          assignmentCount: null,
        });
      } catch {
        setStudentHero(null);
      }
    })();
  }, [deskToken, deskUser?.id, persona, selectedStudentId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 64, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  const onPressAction = useCallback(
    (action: DashboardAction) => {
      if (action.id === 'exam-generator') {
        navigation.navigate('FeaturePlaceholder', {
          title: action.title,
          description: 'Exam generator is coming soon — e-learning exams will land here.',
        });
        return;
      }
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

  const tokensLabel = formatTokensShort(tokens ?? 0);
  const showSwitch = linkedStudents.length > 1 || (linkedStudents.length === 0 && schools.length > 1);

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
    const next = baseHero.map((s) => ({ ...s }));
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
        const sum =
          feeBalance != null || pocketBalance != null
            ? (feeBalance ?? 0) + (pocketBalance ?? 0)
            : null;
        total.value = kesLabel(sum);
        total.subtitleValue = selectedStudent?.name || 'Student balances';
      }
    }
    if (persona === 'security') {
      const active = next.find((s) => s.id === 'active-trip');
      const assignmentStat = next.find((s) => s.id === 'assignment');
      if (active) {
        const onTrip = securityActiveTrip?.status === 'active';
        active.value = onTrip ? 'Active' : 'None';
        active.subtitleValue = onTrip
          ? securityActiveTrip?.trip_kind?.replace(/_/g, ' ') ?? 'On run'
          : 'Start from Trips';
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
      const assignments = next.find((s) => s.id === 'assignments');
      if (grade && studentHero.grade) grade.value = studentHero.grade;
      if (attendance && studentHero.attendancePct != null) {
        attendance.value = `${studentHero.attendancePct}%`;
      }
      if (assignments && studentHero.assignmentCount != null) {
        assignments.value = String(studentHero.assignmentCount);
      }
    }
    return next;
  }, [
    baseHero,
    persona,
    feeBalance,
    pocketBalance,
    selectedStudent?.name,
    securityActiveTrip,
    securityAssignment,
    teacherHero,
    studentHero,
  ]);

  const primaryHero = heroStats[0];
  const secondaryHero = heroStats.slice(1, 3);

  if (!deskReady) {
    return (
      <View style={styles.centered}>
        <DashboardBackground patternOnly liquid />
        <ActivityIndicator color={heroGreen} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
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
              <ProfileAvatar name={avatarLabel} uri={avatarUrl} size={52} />
            </Pressable>
            <View style={styles.topTextCol}>
              <Text style={styles.greeting} numberOfLines={1}>
                {greeting}, {parentFirstName}
              </Text>
              <Text style={styles.contextTitle} numberOfLines={1}>
                {headerName}
              </Text>
              {headerMeta ? (
                <Text style={styles.contextMeta} numberOfLines={1}>
                  {headerMeta}
                </Text>
              ) : null}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications">
                <Ionicons name="notifications-outline" size={18} color={heroGreen} />
              </Pressable>
              {showSwitch ? (
                <>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={() => void requestSchoolChange()}
                    accessibilityRole="button"
                    accessibilityLabel={
                      linkedStudents.length > 0 ? 'Change student' : 'Change school'
                    }>
                    <Ionicons
                      name={linkedStudents.length > 0 ? 'people-outline' : 'school-outline'}
                      size={18}
                      color={heroGreen}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.headerIconBtn}
                    onPress={() => void requestSchoolChange()}
                    accessibilityRole="button"
                    accessibilityLabel="Switch context">
                    <Ionicons name="swap-horizontal" size={18} color={heroGreen} />
                  </Pressable>
                </>
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
                <View style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{personaLabel}</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={styles.tokenChip}
              onPress={() => navigate('/profile/balances', '/profile')}
              accessibilityRole="button"
              accessibilityLabel={`Tokens ${tokensLabel}`}>
              <Ionicons name="diamond" size={12} color={palette.secondary} />
              {tokensLoading ? (
                <ActivityIndicator size="small" color={heroGreen} />
              ) : (
                <Text style={styles.tokenChipText}>{tokensLabel}</Text>
              )}
            </Pressable>
          </View>

          {/* Hero balances — compact flat bank card */}
          <View style={styles.heroElevate}>
            <View style={styles.heroCard}>
              <LinearGradient
                pointerEvents="none"
                colors={[palette.primary, palette.tertiary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroHead}>
                  <View style={styles.heroIconBox}>
                    <HeroPlainIcon name={primaryHero.icon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.heroHeadText}>
                    <Text style={styles.heroKicker}>{primaryHero.title}</Text>
                    <Text style={styles.heroValue}>{primaryHero.value}</Text>
                    <Text style={styles.heroSub}>
                      {primaryHero.subtitle} · {primaryHero.subtitleValue}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroSplit}>
                  {secondaryHero.map((stat) => (
                    <Pressable
                      key={stat.id}
                      style={styles.heroStat}
                      onPress={() => {
                        if (stat.id === 'fees' || stat.id === 'pocket') {
                          navigation.navigate('Accounts');
                        } else {
                          navigate('/profile/balances', '/profile');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${stat.title} ${stat.value}`}>
                      <Text style={styles.heroStatLabel}>{stat.title}</Text>
                      <Text style={styles.heroStatValue} numberOfLines={1}>
                        {stat.value}
                      </Text>
                      <Text style={styles.heroStatSub} numberOfLines={1}>
                        {stat.subtitleValue}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Action grids — icons free of card containers */}
          {sections.map((section, sectionIndex) => (
            <View key={section.id} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionInner}>
                <View style={styles.tileRow}>
                  {section.actions.map((action, actionIndex) => (
                    <ModuleTile
                      key={action.id}
                      action={action}
                      accent={tileAccentFor(palette, sectionIndex * 4 + actionIndex)}
                      onPress={() => onPressAction(action)}
                    />
                  ))}
                  {section.actions.length < 4
                    ? Array.from({ length: 4 - section.actions.length }).map((_, i) => (
                        <View key={`pad-${section.id}-${i}`} style={styles.tilePad} />
                      ))
                    : null}
                </View>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const H_PAD = 16;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: H_PAD },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarHit: {
    borderRadius: 26,
    backgroundColor: Colors.white,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  topTextCol: { flex: 1, minWidth: 0 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.1)',
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  contextTitle: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
  },
  contextMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.mutedForeground,
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
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  roleChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(21,65,29,0.08)',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brandGreen,
    textTransform: 'capitalize',
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.1)',
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tokenChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
  heroElevate: {
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    // Flat bank-card look — no heavy elevation
    shadowOpacity: 0,
    elevation: 0,
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 118,
  },
  heroContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 1,
  },
  heroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeadText: { flex: 1, minWidth: 0 },
  heroKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  heroValue: {
    marginTop: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSub: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  heroSplit: {
    flexDirection: 'row',
    gap: 6,
  },
  heroStat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  heroStatSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  sectionBlock: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.ink,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionInner: {
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tilePad: { flex: 1 },
  tilePressed: { opacity: 0.7 },
  tileIconWrap: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabelBox: {
    marginTop: 8,
    height: 28,
    width: '100%',
    justifyContent: 'flex-start',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 13,
  },
});
