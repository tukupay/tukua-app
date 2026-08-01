import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { WebRegisterScreen } from '../screens/WebRegisterScreen';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';
import { MobileErrorBoundary } from '../components/MobileErrorBoundary';
import { DashboardBackground } from '../components/dashboard/DashboardBackground';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

/** Nested navigate into Dashboard stack from headers / push handlers. */
export function navigateDashboard(
  screen: string,
  params?: Record<string, unknown>,
) {
  if (!rootNavigationRef.isReady()) return;
  rootNavigationRef.navigate('Main', {
    // @ts-expect-error nested tab → stack
    screen: 'Dashboard',
    params: { screen, params },
  } as never);
}

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  // Desk (Nest) is optional — only Dashboard uses it. Chat login is Supabase.
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
          <Stack.Screen name="Register" component={WebRegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer ref={rootNavigationRef}>
      <MobileErrorBoundary>
        <RootNavigator />
      </MobileErrorBoundary>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
