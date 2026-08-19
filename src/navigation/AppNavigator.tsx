import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';
import { rootNavigationRef } from './rootNavigation';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { useAppTheme } from '../context/AppThemeContext';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { DashboardBackground } from '../components/dashboard/DashboardBackground';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['tukua://', 'https://tukua.ai', 'https://www.tukua.ai'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (v: string) => v,
          type: (v: string) => v,
          expires_at: (v: string) => v,
          email: (v: string) => v,
        },
      },
      Login: 'sign-in',
      Register: 'register',
      Main: {
        path: '',
      },
    },
  },
};

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  // Desk (Nest) is optional — only Dashboard uses it. Chat login is Nest JWT (+ optional WebViews).
  // School picker overlays inside MainTabs so header + bottom nav stay mounted.
  const { deskReady, schoolsReady } = useDeskAuth();

  if (loading || !deskReady || (isAuthenticated && !schoolsReady)) {
    return (
      <View style={styles.gate}>
        <DashboardBackground patternOnly liquid />
        <ActivityIndicator size="large" color="#15411D" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
      {/* Always reachable via App Links / tukua:// whether logged in or out */}
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { navigationTheme, palette } = useAppTheme();
  return (
    <View style={[styles.root, { backgroundColor: palette.muted }]}>
      <NavigationContainer ref={rootNavigationRef} linking={linking} theme={navigationTheme}>
        <MobileErrorBoundary>
          <RootNavigator />
        </MobileErrorBoundary>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
