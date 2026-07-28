import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardBackground, GreenPattern } from '../../components/dashboard/DashboardBackground';
import { GlassPanel } from '../../components/dashboard/Glass';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import {
  fetchParentAttendance,
  ParentAttendanceRecord,
  ParentAttendanceSummary,
} from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Attendance'>;

const HERO_GREEN = '#15411D';

function pct(present: number, total: number): string {
  if (!total) return '—';
  return `${Math.round((present / total) * 100)}%`;
}

function statusTone(raw?: string | null): { label: string; color: string; bg: string } {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('absent')) return { label: 'Absent', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' };
  if (s.includes('late')) return { label: 'Late', color: '#D97706', bg: 'rgba(217,119,6,0.12)' };
  return { label: 'Present', color: '#059669', bg: 'rgba(5,150,105,0.12)' };
}

export function AttendanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const [summary, setSummary] = useState<ParentAttendanceSummary[]>([]);
  const [records, setRecords] = useState<ParentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = await fetchParentAttendance(selectedStudentId);
        setSummary(data?.summary ?? []);
        setRecords(data?.records ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Attendance', msg);
        setError(msg);
        setSummary([]);
        setRecords([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const activeSummary = useMemo(() => {
    if (!selectedStudentId) return summary[0] ?? null;
    return summary.find((s) => s.student_id === selectedStudentId) ?? summary[0] ?? null;
  }, [summary, selectedStudentId]);

  const recentRecords = useMemo(() => {
    if (!selectedStudentId) return records.slice(0, 30);
    return records.filter((r) => r.student_id === selectedStudentId).slice(0, 30);
  }, [records, selectedStudentId]);

  const stats = activeSummary ?? {
    student_id: selectedStudentId ?? '',
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  };

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
        <Text style={styles.title}>Attendance summary</Text>
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `Recent attendance for ${selectedStudent.name}.`
            : 'Recent attendance for the selected student.'}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error ? (
          <ModuleEmpty title="Could not load attendance" body={error} onRetry={() => void load()} />
        ) : (
          <>
            <View style={styles.heroElevate}>
              <View style={styles.heroCard}>
                <GreenPattern darker />
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(21,65,29,0.35)', 'rgba(0,109,105,0.55)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <View style={styles.heroHead}>
                    <View style={styles.heroIconBox}>
                      <Ionicons name="people" size={22} color={HERO_GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroKicker}>Attendance rate</Text>
                      <Text style={styles.heroValue}>{pct(stats.present, stats.total)}</Text>
                      <Text style={styles.heroSub}>
                        {stats.total} days tracked · last 60 records
                      </Text>
                    </View>
                  </View>
                  <View style={styles.heroSplit}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatLabel}>Present</Text>
                      <Text style={styles.heroStatValue}>{stats.present}</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatLabel}>Absent</Text>
                      <Text style={styles.heroStatValue}>{stats.absent}</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatLabel}>Late</Text>
                      <Text style={styles.heroStatValue}>{stats.late}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.section}>Recent days</Text>
            {recentRecords.length === 0 ? (
              <Text style={styles.sub}>No attendance records yet.</Text>
            ) : (
              recentRecords.map((r, i) => {
                const tone = statusTone(r.status ?? r.attendance_status);
                const date = String(r.attendance_date ?? '').slice(0, 10) || '—';
                return (
                  <ModuleGlassCard key={String(r.id ?? `${date}-${i}`)}>
                    <View style={styles.row}>
                      <Text style={styles.date}>{date}</Text>
                      <Text style={[styles.badge, { color: tone.color, backgroundColor: tone.bg }]}>
                        {tone.label}
                      </Text>
                    </View>
                  </ModuleGlassCard>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4 },
  section: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  heroElevate: {
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heroCard: { borderRadius: 16, overflow: 'hidden', minHeight: 148 },
  heroContent: { padding: 16, zIndex: 1 },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  heroValue: { marginTop: 2, fontSize: 26, fontWeight: '800', color: Colors.white },
  heroSub: { marginTop: 2, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  heroSplit: { flexDirection: 'row', gap: 8 },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 12,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatValue: { marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.white },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
