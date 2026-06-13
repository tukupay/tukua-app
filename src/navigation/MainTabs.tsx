import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebAppScreen } from '../screens/WebAppScreen';
import { BiometricSetupModal } from '../components/auth/BiometricSetupModal';
import { NativeAppHeader } from '../components/navigation/NativeAppHeader';
import { AboutStack } from './AboutStack';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { TAB_PATHS, WebViewControlProvider, useWebViewControl } from '../context/WebViewControlContext';
import { useDialog } from '../context/DialogContext';
import { Colors } from '../theme/yana';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { biometricEnableMessage, enableBiometrics, setupBiometricsAfterLogin } from '../lib/biometrics';
import { getBiometricCredentials } from '../lib/biometricStorage';

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
  const tabBarHeight = TAB_BAR_BODY_HEIGHT + insets.bottom;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
  }, []);

  return (
    <Tab.Navigator
        initialRouteName="Chat"
        screenListeners={{
          state: (e) => {
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
          lazy: true,
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
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Chat: 'chatbubble-ellipses-outline',
              Courses: 'book-outline',
              About: 'information-circle-outline',
              Profile: 'person-outline',
            };
            return <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />;
          },
        })}>
        <Tab.Screen name="Chat" options={{ title: 'Chat' }}>
          {() => <WebAppScreen path="/chat" label="Chat" />}
        </Tab.Screen>
        <Tab.Screen name="Courses" options={{ title: 'Courses' }}>
          {() => <WebAppScreen path="/courses" label="Courses" />}
        </Tab.Screen>
        <Tab.Screen name="About" options={{ title: 'About' }} component={AboutStack} />
        <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
          {() => <WebAppScreen path="/profile" label="Profile" />}
        </Tab.Screen>
      </Tab.Navigator>
  );
}

export function MainTabs() {
  return (
    <SafeAreaProvider>
      <BiometricGate>
        <WebViewControlProvider>
          <SafeAreaView style={styles.shell} edges={['top']}>
            <NativeAppHeader />
            <MainTabNavigator />
          </SafeAreaView>
        </WebViewControlProvider>
      </BiometricGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: Colors.white },
  scene: {
    backgroundColor: Colors.white,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
