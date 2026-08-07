import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DashboardHomeScreen } from '../screens/dashboard/DashboardHomeScreen';
import { NotificationsScreen } from '../screens/dashboard/NotificationsScreen';
import { DeskModuleWebScreen } from '../screens/dashboard/DeskModuleWebScreen';
import { FeaturePlaceholderScreen } from '../screens/dashboard/FeaturePlaceholderScreen';
import { SchoolInfoScreen } from '../screens/dashboard/SchoolInfoScreen';
import { DisciplineScreen } from '../screens/dashboard/DisciplineScreen';
import { EventsScreen } from '../screens/dashboard/EventsScreen';
import { MeetingsScreen } from '../screens/dashboard/MeetingsScreen';
import { MeetingRoomScreen } from '../screens/dashboard/MeetingRoomScreen';
import { AssessmentsScreen } from '../screens/dashboard/AssessmentsScreen';
import { TeachersScreen } from '../screens/dashboard/TeachersScreen';
import { LibraryScreen } from '../screens/dashboard/LibraryScreen';
import { AccountsScreen } from '../screens/dashboard/AccountsScreen';
import { ReceiptViewScreen } from '../screens/dashboard/ReceiptViewScreen';
import { TransportScreen } from '../screens/dashboard/TransportScreen';
import { AttendanceScreen } from '../screens/dashboard/AttendanceScreen';
import { BursaryScreen } from '../screens/dashboard/BursaryScreen';
import { SecurityHomeScreen } from '../screens/dashboard/SecurityHomeScreen';
import { JoinSchoolScreen } from '../screens/dashboard/JoinSchoolScreen';
import { EnterMarksScreen } from '../screens/dashboard/EnterMarksScreen';
import { TeacherMarksheetScreen } from '../screens/dashboard/TeacherMarksheetScreen';
import { TeacherClassesScreen } from '../screens/dashboard/TeacherClassesScreen';
import { TeacherReportsScreen } from '../screens/dashboard/TeacherReportsScreen';
import { StudentGradesScreen } from '../screens/dashboard/StudentGradesScreen';
import { StudentAssignmentsScreen } from '../screens/dashboard/StudentAssignmentsScreen';
import { StudentAttendanceScreen } from '../screens/dashboard/StudentAttendanceScreen';
import { ApprovalsScreen } from '../screens/dashboard/ApprovalsScreen';
import { AdminStudentsScreen } from '../screens/dashboard/AdminStudentsScreen';
import { AdminTeachersScreen } from '../screens/dashboard/AdminTeachersScreen';
import { SchoolOverviewScreen } from '../screens/dashboard/SchoolOverviewScreen';
import { AdminAccountsScreen } from '../screens/dashboard/AdminAccountsScreen';
import { SuperAdminHubScreen } from '../screens/dashboard/SuperAdminHubScreen';
import { SuperAdminSchoolsScreen } from '../screens/dashboard/SuperAdminSchoolsScreen';
import { DashboardStackParamList } from './types';
import { Colors } from '../theme/yana';
import { useAppTheme } from '../context/AppThemeContext';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

/** Camera / ML Kit screens — load on demand so cold start does not pull expo-camera. */
const lazyCamera = {
  SecurityFaceEnroll: () =>
    require('../screens/dashboard/SecurityFaceEnrollScreen').SecurityFaceEnrollScreen,
  SecurityDailyAttendance: () =>
    require('../screens/dashboard/SecurityDailyAttendanceScreen').SecurityDailyAttendanceScreen,
  FaceSelfEnroll: () =>
    require('../screens/dashboard/FaceSelfEnrollScreen').FaceSelfEnrollScreen,
  GateQr: () => require('../screens/dashboard/GateQrScreen').GateQrScreen,
  GateCheckIn: () => require('../screens/dashboard/GateCheckInScreen').GateCheckInScreen,
};

export function DashboardStack() {
  const { palette } = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
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
                style={styles.back}>
                <Ionicons name="chevron-back" size={24} color={palette.primary} />
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
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', headerShown: false }}
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
        name="Meetings"
        component={MeetingsScreen}
        options={{ title: 'Meetings', headerShown: false }}
      />
      <Stack.Screen
        name="MeetingRoom"
        component={MeetingRoomScreen}
        options={{ title: 'Tukua Meet', headerShown: false }}
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
        name="ReceiptView"
        component={ReceiptViewScreen}
        options={{ title: 'Receipt', headerShown: false }}
      />
      <Stack.Screen
        name="Transport"
        component={TransportScreen}
        options={{ title: 'Transport', headerShown: false }}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: 'Attendance', headerShown: false }}
      />
      <Stack.Screen
        name="Bursary"
        component={BursaryScreen}
        options={{ title: 'Bursary', headerShown: false }}
      />
      <Stack.Screen
        name="SecurityHome"
        component={SecurityHomeScreen}
        options={{ title: 'Security', headerShown: false }}
      />
      <Stack.Screen
        name="SecurityFaceEnroll"
        getComponent={lazyCamera.SecurityFaceEnroll}
        options={{ title: 'Face enroll', headerShown: false }}
      />
      <Stack.Screen
        name="SecurityDailyAttendance"
        getComponent={lazyCamera.SecurityDailyAttendance}
        options={{ title: 'Daily attendance', headerShown: false }}
      />
      <Stack.Screen
        name="FaceSelfEnroll"
        getComponent={lazyCamera.FaceSelfEnroll}
        options={{ title: 'My face', headerShown: false }}
      />
      <Stack.Screen
        name="GateQr"
        getComponent={lazyCamera.GateQr}
        options={{ title: 'Gate QR', headerShown: false }}
      />
      <Stack.Screen
        name="GateCheckIn"
        getComponent={lazyCamera.GateCheckIn}
        options={{ title: 'Gate check-in', headerShown: false }}
      />
      <Stack.Screen
        name="JoinSchool"
        component={JoinSchoolScreen}
        options={{ title: 'Join school', headerShown: false }}
      />
      <Stack.Screen
        name="EnterMarks"
        component={EnterMarksScreen}
        options={{ title: 'Enter marks', headerShown: false }}
      />
      <Stack.Screen
        name="TeacherMarksheet"
        component={TeacherMarksheetScreen}
        options={({ route }) => ({ title: route.params.title, headerShown: false })}
      />
      <Stack.Screen
        name="TeacherClasses"
        component={TeacherClassesScreen}
        options={{ title: 'My classes', headerShown: false }}
      />
      <Stack.Screen
        name="TeacherReports"
        component={TeacherReportsScreen}
        options={{ title: 'Reports', headerShown: false }}
      />
      <Stack.Screen
        name="StudentGrades"
        component={StudentGradesScreen}
        options={{ title: 'My grades', headerShown: false }}
      />
      <Stack.Screen
        name="StudentAssignments"
        component={StudentAssignmentsScreen}
        options={{ title: 'Assignments', headerShown: false }}
      />
      <Stack.Screen
        name="StudentAttendance"
        component={StudentAttendanceScreen}
        options={{ title: 'Attendance', headerShown: false }}
      />
      <Stack.Screen
        name="Approvals"
        component={ApprovalsScreen}
        options={{ title: 'Approvals', headerShown: false }}
      />
      <Stack.Screen
        name="AdminStudents"
        component={AdminStudentsScreen}
        options={{ title: 'Students', headerShown: false }}
      />
      <Stack.Screen
        name="AdminTeachers"
        component={AdminTeachersScreen}
        options={{ title: 'Teachers', headerShown: false }}
      />
      <Stack.Screen
        name="SchoolOverview"
        component={SchoolOverviewScreen}
        options={{ title: 'School overview', headerShown: false }}
      />
      <Stack.Screen
        name="AdminAccounts"
        component={AdminAccountsScreen}
        options={{ title: 'Accounts', headerShown: false }}
      />
      <Stack.Screen
        name="SuperAdminHub"
        component={SuperAdminHubScreen}
        options={{ title: 'Platform hub', headerShown: false }}
      />
      <Stack.Screen
        name="SuperAdminSchools"
        component={SuperAdminSchoolsScreen}
        options={{ title: 'Schools', headerShown: false }}
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
