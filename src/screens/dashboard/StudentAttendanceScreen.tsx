import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchStudentRecentAttendance, type StudentDayMark } from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentAttendance'>;

export function StudentAttendanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser, selectedStudentId } = useDeskAuth();
  const studentId = String(selectedStudentId ?? deskUser?.id ?? deskUser?.user_id ?? '').trim();

  const [marks, setMarks] = useState<StudentDayMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!studentId) {
      setError('Student profile not linked');
      setLoading(false);
      return;
    }
    if (!soft) setLoading(true);
    setError(null);
    try {
      const rows = await fetchStudentRecentAttendance(studentId, 14);
      setMarks(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('StudentAttendance', msg);
      setError(msg);
      setMarks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: floatingHeaderInset(insets.top),
            paddingBottom: moduleScrollBottomPad(insets.bottom),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Attendance</ModuleKicker>
        <ModuleScreenHeader title="My attendance" description="Recent gate check-ins (last 14 days)." />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load attendance" body={error} onRetry={() => void load()} />
        ) : marks.length === 0 ? (
          <ModuleEmpty
            title="No check-ins yet"
            body="When you scan at the school gate, entries will appear here."
          />
        ) : (
          marks.map((m, index) => {
            const key = `${m.marked_at}-${m.direction}-${index}`;
            const when = String(m.marked_at ?? '').slice(0, 16).replace('T', ' ');
            return (
              <ModuleGlassCard key={key}>
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={m.direction === 'out' ? 'log-out-outline' : 'log-in-outline'}
                      size={18}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.title}>{m.direction === 'out' ? 'Checked out' : 'Checked in'}</Text>
                    <Text style={styles.meta}>{[when, m.method, m.source].filter(Boolean).join(' · ')}</Text>
                  </View>
                </View>
              </ModuleGlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
});
