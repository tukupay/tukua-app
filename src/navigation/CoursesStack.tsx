import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoursesScreen } from '../screens/CoursesScreen';
import { WebAppScreen } from '../screens/WebAppScreen';
import { Colors } from '../theme/yana';
import { useAppTheme } from '../context/AppThemeContext';
import { FLOATING_HEADER_BODY } from '../constants/layout';

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
  const navigation = useNavigation<NativeStackNavigationProp<CoursesStackParamList>>();
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();

  return (
    <View style={{ flex: 1 }}>
      <WebAppScreen path={path} label={route.params?.title || 'Course'} />
      {navigation.canGoBack() ? (
        <TouchableOpacity
          style={[
            courseWebStyles.backBtn,
            { top: insets.top + FLOATING_HEADER_BODY + 8, borderColor: `${palette.primary}99` },
          ]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to courses"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={palette.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const courseWebStyles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 60,
    elevation: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10,61,46,0.55)',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});

/** Native course list + in-app WebView for full course features (lessons, pay, quizzes). */
export function CoursesStack() {
  const { palette } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        animation: 'slide_from_right',
        animationDuration: 220,
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.foreground,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.muted },
        headerLeft: navigation.canGoBack()
          ? () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={styles.back}
              >
                <Ionicons name="chevron-back" size={24} color={palette.primary} />
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
