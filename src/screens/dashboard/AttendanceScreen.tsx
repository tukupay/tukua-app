/**
 * Parent → Attendance: the selected child's daily register (rate, present / late / absent, day by day),
 * loaded in pages. With no child selected, chips pick one of the linked children.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AttendanceHistory } from '../../components/attendance/AttendanceHistory';
import { ChipRow, ListSkeleton, ModuleScrollPage } from '../../components/ui/ModuleKit';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { fetchParentAttendancePage, fetchParentChildren } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Attendance'>;

export function AttendanceScreen({ navigation }: Props) {
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const [kids, setKids] = useState<Array<{ id: string; name: string }>>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [kidsReady, setKidsReady] = useState(!!selectedStudentId);

  // No child selected app-wide: offer the linked children here (first one by default).
  useEffect(() => {
    if (selectedStudentId) return;
    let alive = true;
    fetchParentChildren()
      .then((res) => {
        if (!alive) return;
        const list = (res?.children ?? [])
          .map((c) => ({
            id: String((c as { student_id?: string; id?: string }).student_id ?? (c as { id?: string }).id ?? ''),
            name: String((c as { full_name?: string }).full_name ?? 'Child').split(' ')[0] || 'Child',
          }))
          .filter((c) => c.id);
        setKids(list);
        setPickedId((p) => p ?? list[0]?.id ?? null);
      })
      .catch(() => {
        /* the page itself shows the error */
      })
      .finally(() => {
        if (alive) setKidsReady(true);
      });
    return () => {
      alive = false;
    };
  }, [selectedStudentId]);

  const studentId = selectedStudentId ?? pickedId;
  const loadPage = useCallback(
    (offset: number, limit: number) => fetchParentAttendancePage(studentId, { offset, limit }),
    [studentId],
  );
  const childName =
    selectedStudent?.name ?? kids.find((k) => k.id === pickedId)?.name ?? null;

  // Wait for the child list so the first page is one child's register, not every child's mixed together.
  if (!selectedStudentId && !kidsReady) {
    return (
      <ModuleScrollPage title="Attendance" description="Daily register for your child." onBack={() => navigation.goBack()}>
        <ListSkeleton rows={5} height={56} />
      </ModuleScrollPage>
    );
  }

  return (
    <AttendanceHistory
      title="Attendance"
      description={childName ? `Daily register for ${childName}.` : 'Daily register for your child.'}
      onBack={() => navigation.goBack()}
      loadPage={loadPage}
      reloadKey={studentId ?? 'all'}
      summaryStudentId={studentId}
      aboveSummary={
        !selectedStudentId && kids.length > 1 ? (
          <ChipRow
            value={pickedId ?? kids[0].id}
            onChange={setPickedId}
            options={kids.map((k) => ({ key: k.id, label: k.name }))}
          />
        ) : null
      }
    />
  );
}
