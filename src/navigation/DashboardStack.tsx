import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DashboardHomeScreen } from '../screens/dashboard/DashboardHomeScreen';
import { DeskModuleWebScreen } from '../screens/dashboard/DeskModuleWebScreen';
import { FeaturePlaceholderScreen } from '../screens/dashboard/FeaturePlaceholderScreen';
import { SchoolInfoScreen } from '../screens/dashboard/SchoolInfoScreen';
import { DisciplineScreen } from '../screens/dashboard/DisciplineScreen';
import { EventsScreen } from '../screens/dashboard/EventsScreen';
import { AssessmentsScreen } from '../screens/dashboard/AssessmentsScreen';
import { TeachersScreen } from '../screens/dashboard/TeachersScreen';
import { LibraryScreen } from '../screens/dashboard/LibraryScreen';
import { AccountsScreen } from '../screens/dashboard/AccountsScreen';
import { TransportScreen } from '../screens/dashboard/TransportScreen';
import { DashboardStackParamList } from './types';
import { Colors } from '../theme/yana';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
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
                style={styles.back}>
                <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
              </TouchableOpacity>
            )
          : undefined,
      })}>
      <Stack.Screen
        name="DashboardHome"
        component={DashboardHomeScreen}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Stack.Screen
        name="DeskModule"
        component={DeskModuleWebScreen}
        options={({ route }) => ({ title: route.params.title, headerShown: false })}
      />
      <Stack.Screen
        name="SchoolInfo"
        component={SchoolInfoScreen}
        options={{ title: 'School information', headerShown: false }}
      />
      <Stack.Screen
        name="Discipline"
        component={DisciplineScreen}
        options={{ title: 'Discipline', headerShown: false }}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: 'Events', headerShown: false }}
      />
      <Stack.Screen
        name="Assessments"
        component={AssessmentsScreen}
        options={{ title: 'Assessments', headerShown: false }}
      />
      <Stack.Screen
        name="Teachers"
        component={TeachersScreen}
        options={{ title: 'Teachers', headerShown: false }}
      />
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: 'Library', headerShown: false }}
      />
      <Stack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: 'Accounts', headerShown: false }}
      />
      <Stack.Screen
        name="Transport"
        component={TransportScreen}
        options={{ title: 'Transport', headerShown: false }}
      />
      <Stack.Screen
        name="FeaturePlaceholder"
        component={FeaturePlaceholderScreen}
        options={({ route }) => ({ title: route.params.title, headerShown: false })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  back: { marginRight: 4, padding: 4 },
});
