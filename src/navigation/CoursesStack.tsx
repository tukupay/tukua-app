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

  return (
    <View style={{ flex: 1 }}>
      <WebAppScreen path={path} label={route.params?.title || 'Course'} />
      {navigation.canGoBack() ? (
        <TouchableOpacity
          style={[courseWebStyles.backBtn, { top: insets.top + FLOATING_HEADER_BODY + 8 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to courses"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const courseWebStyles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 45,
    elevation: 45,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(10,61,46,0.35)',
    backgroundColor: 'rgba(232,245,239,0.85)',
  },
});

/** Native course list + in-app WebView for full course features (lessons, pay, quizzes). */
export function CoursesStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        animation: 'slide_from_right',
        animationDuration: 220,
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
