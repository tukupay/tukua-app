/**
 * Learner → My attendance: own daily register (`GET /students/me/attendance`), rate + day-by-day rows in pages.
 * (Was "last 14 days" of check-ins only, so a learner whose last record was older saw nothing, and absent days
 * never showed.)
 */
import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AttendanceHistory } from '../../components/attendance/AttendanceHistory';
import { fetchStudentAttendancePage } from '../../lib/studentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentAttendance'>;

export function StudentAttendanceScreen({ navigation }: Props) {
  const loadPage = useCallback(
    (offset: number, limit: number) => fetchStudentAttendancePage({ offset, limit }),
    [],
  );
  return (
    <AttendanceHistory
      title="My attendance"
      description="Your daily register: present, late and absent days."
      onBack={() => navigation.goBack()}
      loadPage={loadPage}
      emptyBody="When you are marked at school (register, gate or face check-in), your days will show here."
    />
  );
}
