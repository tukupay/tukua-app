import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  BalancesScreen,
  DocumentsScreen,
  MemoryScreen,
  PortfolioScreen,
  PreferencesScreen,
  ProfileEditScreen,
  ProfileHomeScreen,
  ThemesScreen,
} from '../screens/profile/ProfileScreens';
import { Colors } from '../theme/yana';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileEdit: undefined;
  Documents: undefined;
  Portfolio: undefined;
  Memory: undefined;
  Preferences: undefined;
  ProfileThemes: undefined;
  Balances: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/** Fully native profile hub and account settings stack. */
export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.foreground,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        headerLeft: navigation.canGoBack()
          ? () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={styles.back}
              >
                <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
              </TouchableOpacity>
            )
          : undefined,
      })}
    >
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Memory" component={MemoryScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="ProfileThemes" component={ThemesScreen} options={{ title: 'Themes' }} />
      <Stack.Screen name="Balances" component={BalancesScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  back: { marginLeft: 4, padding: 4 },
});
