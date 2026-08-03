import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CoursesScreen } from '../screens/CoursesScreen';
import { WebAppScreen } from '../screens/WebAppScreen';
import { Colors } from '../theme/yana';

export type CoursesStackParamList = {
  CoursesHome: undefined;
  CourseWeb: { path: string; title?: string };
};

const Stack = createNativeStackNavigator<CoursesStackParamList>();

function CourseWebScreen({
  route,
}: {
  route: { params: CoursesStackParamList['CourseWeb'] };
}) {
  const path = route.params?.path || '/courses';
  return <WebAppScreen path={path} label={route.params?.title || 'Course'} />;
}

/** Native course list + in-app WebView for full course features (lessons, pay, quizzes). */
export function CoursesStack() {
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
      <Stack.Screen
        name="CoursesHome"
        component={CoursesScreen}
        options={{ headerShown: false, title: 'Courses' }}
      />
      <Stack.Screen
        name="CourseWeb"
        component={CourseWebScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Course',
          // Floating NativeAppHeader already clears the top — no second stack header (was a big gap).
          headerShown: false,
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  back: { marginLeft: 4, padding: 4 },
});
