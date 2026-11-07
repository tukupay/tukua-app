import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BalancesScreen,
  DeleteAccountScreen,
  DocumentsScreen,
  IdVerificationScreen,
  MemoryScreen,
  PortfolioScreen,
  PreferencesScreen,
  ProfileEditScreen,
  ProfileHomeScreen,
  ThemesScreen,
} from '../screens/profile/ProfileScreens';
import { useAppTheme } from '../context/AppThemeContext';
import { AppTopBar } from '../components/navigation/AppTopBar';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileEdit: undefined;
  Documents: undefined;
  Portfolio: undefined;
  Memory: undefined;
  Preferences: undefined;
  ProfileThemes: undefined;
  Balances: undefined;
  IdVerification: undefined;
  DeleteAccount: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/** Fully native profile hub and account settings stack. */
export function ProfileStack() {
  const { palette } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'fade_from_bottom',
        animationDuration: 220,
        // The app's own top bar (same green, pattern and curve as NativeAppHeader), taking its height in
        // layout. The floating app header stays on top, so the back + title row sits right under it.
        header: ({ navigation, route, options, back }) => (
          <AppTopBar
            variant="stack"
            underAppHeader
            title={typeof options.title === 'string' ? options.title : route.name}
            // Opened straight from the app menu (no screen under it): back goes to the profile hub.
            onBack={() => (back ? navigation.goBack() : navigation.navigate('ProfileHome'))}
            pageColor={palette.muted}
          />
        ),
        contentStyle: { backgroundColor: palette.muted },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Memory" component={MemoryScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="ProfileThemes" component={ThemesScreen} options={{ title: 'Themes' }} />
      <Stack.Screen name="Balances" component={BalancesScreen} />
      <Stack.Screen name="IdVerification" component={IdVerificationScreen} options={{ title: 'ID verification' }} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Delete account' }} />
    </Stack.Navigator>
  );
}
