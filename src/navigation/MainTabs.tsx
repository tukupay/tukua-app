import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebAppScreen } from '../screens/WebAppScreen';
import { BiometricSetupModal } from '../components/auth/BiometricSetupModal';
import { NativeAppHeader } from '../components/navigation/NativeAppHeader';
import { WebViewTabBridge } from '../components/WebViewTabBridge';
import { AboutStack } from './AboutStack';
import { TAB_PATHS, WebViewControlProvider, useWebViewControl } from '../context/WebViewControlContext';
import { Colors } from '../theme/yana';
import { MainTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { enableBiometrics, setupBiometricsAfterLogin } from '../lib/biometrics';
import { getBiometricCredentials } from '../lib/biometricStorage';

const Tab = createBottomTabNavigator<MainTabParamList>();

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
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

  return (
    <>
      {children}
      <BiometricSetupModal
        visible={showBioModal}
        onDismiss={() => setShowBioModal(false)}
        onEnable={async () => {
          setShowBioModal(false);
          if (email) await enableBiometrics(email);
        }}
      />
    </>
  );
}

function MainTabNavigator() {
  const { setActiveTabPath } = useWebViewControl();

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenListeners={{
        state: (e) => {
          const state = e.data.state;
          if (!state) return;
          const route = state.routes[state.index]?.name as keyof MainTabParamList;
          const webPath = TAB_PATHS[route];
          if (webPath) setActiveTabPath(webPath);
        },
      }}
      screenOptions={({ route }) => ({
        lazy: true,
        unmountOnBlur: false,
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: styles.tabBar,
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
        {() => (
          <>
            <WebViewTabBridge />
            <WebAppScreen path="/chat" label="Chat" />
          </>
        )}
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
    <BiometricGate>
      <WebViewControlProvider>
        <SafeAreaView style={styles.shell} edges={['top']}>
          <NativeAppHeader />
          <MainTabNavigator />
        </SafeAreaView>
      </WebViewControlProvider>
    </BiometricGate>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: Colors.white },
  tabBar: {
    paddingBottom: 2,
    paddingTop: 2,
    height: 54,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
