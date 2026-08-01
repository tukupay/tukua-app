import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebAppScreen } from '../screens/WebAppScreen';
import { CoursesScreen } from '../screens/CoursesScreen';
import { BiometricSetupModal } from '../components/auth/BiometricSetupModal';
import { NativeAppHeader } from '../components/navigation/NativeAppHeader';
import { AiTabIcon } from '../components/navigation/AiTabIcon';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { WebViewTabBridge } from '../components/WebViewTabBridge';
import { DashboardStack } from './DashboardStack';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { TAB_PATHS, WebViewControlProvider, useWebViewControl } from '../context/WebViewControlContext';
import { useDialog } from '../context/DialogContext';
import { Colors } from '../theme/yana';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { biometricEnableMessage, enableBiometrics, setupBiometricsAfterLogin } from '../lib/biometrics';
import { getBiometricCredentials } from '../lib/biometricStorage';
import { SchoolPickerScreen, ContextPickLoader } from '../screens/SchoolPickerScreen';
import { PushNotificationBootstrap } from '../components/notifications/PushNotificationBootstrap';

const Tab = createBottomTabNavigator<MainTabParamList>();

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { showDialog } = useDialog();
  const [showBioModal, setShowBioModal] = useState(false);
  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;
    (async () => {
      const already = await setupBiometricsAfterLogin(email);
      if (!already) {
        const creds = await getBiometricCredentials();
        if (!creds.enabled) setShowBioModal(true);
      }
    })();
  }, [email]);

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

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const { setActiveTabPath, notifyTabFocused } = useWebViewControl();
  const { profile } = useAuth();
  const profileWebPath = profile?.activationStatus === 'pending_payment' ? '/activate' : '/profile';
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + insets.bottom;

  useEffect(() => {
    hideSystemStatusBar();
    if (Platform.OS !== 'android') return;
    // Keep soft nav / gesture bar visible — only the top status bar is hidden.
    void NavigationBar.setVisibilityAsync('visible').catch(() => {});
    void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
    const focusPoll = setInterval(() => hideSystemStatusBar(), 700);
    return () => clearInterval(focusPoll);
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenListeners={{
        state: (e) => {
          hideSystemStatusBar();
          const state = e.data.state;
          if (!state) return;
          const route = state.routes[state.index]?.name as keyof MainTabParamList;
          const webPath = TAB_PATHS[route];
          if (webPath) {
            setActiveTabPath(webPath);
            notifyTabFocused(webPath);
          }
        },
      }}
      screenOptions={({ route }) => ({
        lazy: route.name !== 'Chat',
        unmountOnBlur: false,
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: Colors.primary,
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
            Dashboard: 'grid-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Chat" options={{ title: 'AI' }}>
        {() => (
          <>
            <WebViewTabBridge />
            <WebAppScreen path="/chat" label="AI" />
          </>
        )}
      </Tab.Screen>
      <Tab.Screen name="Courses" options={{ title: 'Courses' }} component={CoursesScreen} />
      <Tab.Screen name="Dashboard" options={{ title: 'Dashboard' }} component={DashboardStack} />
      <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
        {() => <WebAppScreen path={profileWebPath} label="Profile" key={profileWebPath} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function MainTabs() {
  const { session } = useAuth();
  const { needsSchoolPick, schoolsReady, deskReady } = useDeskAuth();
  const gating = Boolean(session) && (!deskReady || !schoolsReady);

  return (
    <SafeAreaProvider>
      <BiometricGate>
        <WebViewControlProvider>
          <View style={styles.shell}>
            <MainTabNavigator />
            <NativeAppHeader />
            <PushNotificationBootstrap />
            {gating ? (
              <ContextPickLoader />
            ) : needsSchoolPick ? (
              <SchoolPickerScreen />
            ) : null}
          </View>
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
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
