import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebAppScreen } from '../screens/WebAppScreen';
import { BiometricSetupModal } from '../components/auth/BiometricSetupModal';
import { NativeAppHeader } from '../components/navigation/NativeAppHeader';
import { ChatTabChrome } from '../components/navigation/ChatTabChrome';
import { AiTabIcon } from '../components/navigation/AiTabIcon';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { WebViewTabBridge } from '../components/WebViewTabBridge';
import { DashboardStack } from './DashboardStack';
import { CoursesStack } from './CoursesStack';
import { ProfileStack } from './ProfileStack';
import { ContentScreen } from '../screens/ContentScreen';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { TAB_PATHS, WebViewControlProvider, useWebViewControl } from '../context/WebViewControlContext';
import { useDialog } from '../context/DialogContext';
import { useAppTheme } from '../context/AppThemeContext';
import { Colors } from '../theme/yana';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { biometricEnableMessage, enableBiometrics, setupBiometricsAfterLogin } from '../lib/biometrics';
import { getBiometricCredentials } from '../lib/biometricStorage';
import { SchoolPickerScreen, ContextPickLoader } from '../screens/SchoolPickerScreen';
import { PushNotificationBootstrap } from '../components/notifications/PushNotificationBootstrap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateDashboard } from './rootNavigation';
import { JOIN_PROMPT_SEEN_KEY } from '../screens/dashboard/JoinSchoolScreen';
import { listMyMemberships } from '../lib/joinRequestApi';
import { TokenGateProvider, useTokenGate } from '../context/TokenGateContext';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { TAB_SLIDE_TRANSITION_SPEC, TabSwipeLayout, tabSlideInterpolator } from './TabSwipe';

const Tab = createBottomTabNavigator<MainTabParamList>();

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { showDialog } = useDialog();
  const [showBioModal, setShowBioModal] = useState(false);
  const email = session?.user?.email;
  const skipNativeAuth = Platform.OS === 'web';

  useEffect(() => {
    if (skipNativeAuth || !email) return;
    (async () => {
      const already = await setupBiometricsAfterLogin(email);
      if (!already) {
        const creds = await getBiometricCredentials();
        if (!creds.enabled) setShowBioModal(true);
      }
    })();
  }, [email, skipNativeAuth]);

  const handleEnableBiometrics = async () => {
    if (!email) return;
    const result = await enableBiometrics(email);
    hideSystemStatusBar();
    setShowBioModal(false);
    if (result.ok) {
      showDialog({
        title: 'Biometrics enabled',
        message: 'You can use fingerprint or face unlock on the login screen next time.',
        variant: 'success',
        icon: 'finger-print-outline',
      });
      return;
    }
    showDialog({
      title: 'Could not enable biometrics',
      message: biometricEnableMessage(result.reason),
      variant: 'warning',
      icon: 'finger-print-outline',
    });
  };

  return (
    <>
      {children}
      <BiometricSetupModal
        visible={showBioModal}
        onDismiss={() => setShowBioModal(false)}
        onEnable={() => void handleEnableBiometrics()}
      />
    </>
  );
}

/** How long after the Dashboard first renders before the AI chat WebView starts loading in the background. */
const CHAT_PRELOAD_DELAY_MS = 900;

/**
 * AI tab: mounted in the background shortly after the Dashboard (the default tab) has rendered, so the
 * chat WebView has already loaded and signed in by the time the user taps AI. Mounts at once if opened first.
 */
function ChatTabScreen() {
  const focused = useIsFocused();
  const [mounted, setMounted] = useState(focused);

  useEffect(() => {
    if (mounted) return;
    if (focused) {
      setMounted(true);
      return;
    }
    // A short delay lets the Dashboard paint first (InteractionManager is deprecated in this RN).
    const timer = setTimeout(() => setMounted(true), CHAT_PRELOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focused, mounted]);

  if (!mounted) return <View style={styles.chatPlaceholder} />;
  return (
    <>
      <WebViewTabBridge />
      <WebAppScreen path="/chat" label="AI" />
    </>
  );
}

function MainTabNavigator({
  onTabChange,
}: {
  onTabChange: (tab: keyof MainTabParamList) => void;
}) {
  const insets = useSafeAreaInsets();
  const { setActiveTabPath, notifyTabFocused } = useWebViewControl();
  const { guardTab } = useTokenGate();
  const { palette } = useAppTheme();
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + insets.bottom;

  // No school is fine: the Dashboard tab then shows the personal dashboard (with a Join school tile),
  // so it is never blocked here — only the token gate applies.
  const tabPressGuard = useCallback(
    (tab: keyof MainTabParamList) => ({
      tabPress: (e: { preventDefault: () => void }) => {
        if (!guardTab(tab)) e.preventDefault();
      },
    }),
    [guardTab],
  );

  // Dashboard is the first tab: the shared web-tab state starts on '/chat', so point it at the dashboard.
  useEffect(() => {
    setActiveTabPath('/dashboard');
  }, [setActiveTabPath]);

  useEffect(() => {
    hideSystemStatusBar();
    if (Platform.OS !== 'android') return;
    // Keep soft nav / gesture bar visible — only the top status bar is hidden.
    void NavigationBar.setVisibilityAsync('visible').catch(() => {});
    // setButtonStyleAsync was replaced by setStyle in the navigation bar module.
    try {
      NavigationBar.setStyle('dark');
    } catch {
      /* not supported on this device */
    }
    const focusPoll = setInterval(() => hideSystemStatusBar(), 700);
    return () => clearInterval(focusPoll);
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(p) => <FloatingTabBar {...p} />}
      // Swipe left/right between tabs (full page on native tabs, screen edges on WebView tabs) — TabSwipe.tsx.
      screenLayout={({ route, children }) => <TabSwipeLayout route={route}>{children}</TabSwipeLayout>}
      screenListeners={{
        state: (e) => {
          hideSystemStatusBar();
          const state = e.data.state;
          if (!state) return;
          const route = state.routes[state.index]?.name as keyof MainTabParamList;
          onTabChange(route);
          const webPath = TAB_PATHS[route];
          if (webPath) {
            setActiveTabPath(webPath);
            notifyTabFocused(webPath);
          } else {
            // Native tabs (Dashboard, Content): clear the web tab so chat-only header controls hide.
            setActiveTabPath(`/${String(route).toLowerCase()}`);
          }
        },
      }}
      screenOptions={({ route }) => ({
        // Chat preloads itself in the background (ChatTabScreen); the other web tabs load on first open.
        lazy: route.name !== 'Chat',
        unmountOnBlur: false,
        headerShown: false,
        // Tab changes (tap or swipe) slide the pages sideways like a pager.
        animation: 'shift',
        transitionSpec: TAB_SLIDE_TRANSITION_SPEC,
        sceneStyleInterpolator: tabSlideInterpolator,
        sceneStyle: [styles.scene, { backgroundColor: palette.muted }],
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.border,
          backgroundColor: Colors.white,
          elevation: 12,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Chat') {
            return <AiTabIcon focused={focused} size={size} />;
          }
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Courses: 'book-outline',
            Content: 'play-circle-outline',
            Dashboard: 'grid-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}>
      {/* Dashboard first and default; AI second (preloaded in the background), then Courses & Exams. */}
      <Tab.Screen name="Dashboard" options={{ title: 'Dashboard' }} component={DashboardStack} listeners={tabPressGuard('Dashboard')} />
      <Tab.Screen name="Chat" options={{ title: 'AI' }} component={ChatTabScreen} listeners={tabPressGuard('Chat')} />
      {/* Tukua Connect parked for next release — tab hidden */}
      <Tab.Screen name="Courses" options={{ title: 'Courses & Exams' }} component={CoursesStack} listeners={tabPressGuard('Courses')} />
      <Tab.Screen name="Content" options={{ title: 'Content' }} component={ContentScreen} listeners={tabPressGuard('Content')} />
      <Tab.Screen name="Profile" options={{ title: 'Profile' }} component={ProfileStack} listeners={tabPressGuard('Profile')} />
    </Tab.Navigator>
  );
}

export function MainTabs() {
  const { session } = useAuth();
  const {
    needsSchoolPick,
    schoolsReady,
    deskReady,
    schools,
    contextSkipped,
    selectedRole,
    linkedStudents,
    persona,
  } = useDeskAuth();
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const gating = Boolean(session) && (!deskReady || !schoolsReady);
  const [focusedTab, setFocusedTab] = useState<keyof MainTabParamList>('Dashboard');
  const onboardingPrompted = useRef(false);

  useEffect(() => {
    onboardingPrompted.current = false;
  }, [session?.user?.id]);

  /**
   * One gentle, dismissible nudge (never a forced screen) for a teacher with no workload or a parent
   * with no child linked. Shown once per account and role on this device; students and everyone
   * else are never pushed to join a school — many just use AI and courses.
   */
  const nudgeOnce = useCallback(
    async (kind: 'teacher' | 'parent') => {
      const uid = session?.user?.id;
      if (!uid) return;
      const key = `${JOIN_PROMPT_SEEN_KEY}:${uid}:${kind}`;
      try {
        if (await AsyncStorage.getItem(key)) return;
        await AsyncStorage.setItem(key, '1');
      } catch {
        return;
      }
      showDialog({
        title: kind === 'teacher' ? 'Add what you teach?' : 'Link your child?',
        message:
          kind === 'teacher'
            ? 'Add your subjects and classes so your school dashboard fills in. You can do it any time from Dashboard → Join school.'
            : "Find your child's school to see their results, fees and attendance. You can do it any time from Dashboard → Join school.",
        variant: 'info',
        icon: 'school-outline',
        buttons: [
          { text: 'Not now', style: 'cancel' },
          {
            text: kind === 'teacher' ? 'Add subjects' : 'Find school',
            style: 'default',
            onPress: () => navigateDashboard('JoinSchool', { preferRole: kind }),
          },
        ],
      });
    },
    [session?.user?.id, showDialog],
  );

  useEffect(() => {
    if (!session || gating || needsSchoolPick || !schoolsReady) return;
    if (contextSkipped) return;
    if (onboardingPrompted.current) return;

    let cancelled = false;
    void (async () => {
      try {
        const role = String(selectedRole || persona || '').toLowerCase();
        const schoolRoles = schools.flatMap((s) => (s.roles || []).map((r) => String(r).toLowerCase()));
        const isTeacher =
          role === 'teacher' ||
          role === 'class_teacher' ||
          schoolRoles.some((r) => r === 'teacher' || r === 'class_teacher');
        const isParent =
          role === 'parent' || schoolRoles.some((r) => r === 'parent' || r === 'guardian');

        // Students / individuals: joining a school is optional — no redirect, no prompt.
        if (!isTeacher && !isParent) return;

        const mem = await listMyMemberships().catch(() => ({ memberships: [] as any[] }));
        if (cancelled) return;
        const list = Array.isArray(mem.memberships) ? mem.memberships : [];

        if (isTeacher) {
          const teacherMems = list.filter((m) =>
            (m.roles || []).some((r: string) => {
              const x = String(r).toLowerCase();
              return x === 'teacher' || x === 'class_teacher';
            }),
          );
          const hasWorkload =
            teacherMems.some((m) => Number(m.workload_count ?? 0) > 0) ||
            teacherMems.some((m) => String(m.detail || '').toLowerCase().startsWith('teaching:'));
          if (!hasWorkload) {
            onboardingPrompted.current = true;
            await nudgeOnce('teacher');
            return;
          }
        }

        if (isParent) {
          const hasStudent =
            (linkedStudents?.length ?? 0) > 0 ||
            list.some(
              (m) =>
                (m.roles || []).some((r: string) => String(r).toLowerCase() === 'parent') &&
                Number(m.linked_student_count ?? 0) > 0,
            );
          if (!hasStudent) {
            // SchoolPicker already blocks parent dashboards when kids=0; if no school yet, open join.
            if (schools.length === 0) {
              onboardingPrompted.current = true;
              await nudgeOnce('parent');
            }
            return;
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    session,
    gating,
    needsSchoolPick,
    schoolsReady,
    schools,
    contextSkipped,
    selectedRole,
    linkedStudents,
    persona,
    nudgeOnce,
  ]);

  return (
    <SafeAreaProvider>
      <BiometricGate>
        <WebViewControlProvider>
          <TokenGateProvider>
            <View style={[styles.shell, { backgroundColor: palette.muted }]}>
              <MainTabNavigator onTabChange={setFocusedTab} />
              {Platform.OS !== 'web' ? <NativeAppHeader /> : null}
              {Platform.OS !== 'web' && focusedTab === 'Chat' ? <ChatTabChrome /> : null}
              {Platform.OS !== 'web' ? <PushNotificationBootstrap /> : null}
              {gating ? (
                <ContextPickLoader />
              ) : needsSchoolPick ? (
                <SchoolPickerScreen />
              ) : null}
            </View>
          </TokenGateProvider>
        </WebViewControlProvider>
      </BiometricGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: Colors.background },
  scene: {
    backgroundColor: Colors.background,
  },
  chatPlaceholder: { flex: 1 },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
