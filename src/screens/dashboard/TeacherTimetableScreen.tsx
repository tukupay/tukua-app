/**
 * Timetable — teachers: GET /timetable/teacher/:teacherId; learners: GET /students/me/timetable.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchTeacherTimetable } from '../../lib/teacherPortalApi';
import { deskFetch } from '../../lib/deskApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherTimetable'>;

type TimetableEntry = {
  id?: string;
  day_of_week?: number | string;
  period_name?: string;
  period_start?: string;
  period_end?: string;
  period_start_time?: string;
  period_end_time?: string;
  period_sort_order?: number;
  start_time?: string;
  end_time?: string;
  subject_name?: string;
  class_name?: string;
  room?: string;
  classroom_name?: string;
  teacher_name?: string;
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The API sends "MON".."SUN" (older rows 0-6); both become 0 = Monday. */
function dayIndex(entry: TimetableEntry): number {
  const raw = entry.day_of_week;
  const n = Number(raw);
  if (raw !== '' && raw != null && !Number.isNaN(n)) return n >= 0 && n <= 6 ? n : 0;
  const i = DAY_NAMES.findIndex((d) => String(raw ?? '').toLowerCase().startsWith(d.toLowerCase()));
  return i >= 0 ? i : 0;
}

function startOf(entry: TimetableEntry): string {
  return String(entry.period_start_time || entry.period_start || entry.start_time || '');
}

function unwrapEntries(data: unknown): TimetableEntry[] {
  if (Array.isArray(data)) return data as TimetableEntry[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of ['entries', 'items', 'data']) {
      if (Array.isArray(obj[k])) return obj[k] as TimetableEntry[];
    }
  }
  return [];
}

function dayLabel(entry: TimetableEntry) {
  return DAY_NAMES[dayIndex(entry)] ?? 'Day';
}

function timeLabel(entry: TimetableEntry) {
  const start = startOf(entry);
  const end = entry.period_end_time || entry.period_end || entry.end_time || '';
  if (start && end) return `${String(start).slice(0, 5)} – ${String(end).slice(0, 5)}`;
  if (start) return String(start).slice(0, 5);
  return entry.period_name || '';
}

export function TeacherTimetableScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser, persona } = useDeskAuth();
  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [dayFilter, setDayFilter] = useState(0);

  const load = useCallback(
    async (soft = false) => {
      if (persona !== 'student' && !teacherId) {
        setError('Teacher profile not linked');
        setLoading(false);
        return;
      }
      if (!soft) setLoading(true);
      setError(null);
      try {
        // A learner's own class comes from the server (there is no picked child for a learner;
        // the old code read a classId that never existed and always said "Class not linked").
        const data =
          persona === 'student'
            ? await deskFetch<{ entries?: TimetableEntry[] }>('/students/me/timetable')
            : await fetchTeacherTimetable(teacherId);
        setEntries(unwrapEntries(data));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('TeacherTimetable', msg);
        setError(msg);
        setEntries([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [persona, teacherId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<number, TimetableEntry[]>();
    for (const e of entries) {
      const key = dayIndex(e);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const [, list] of map) {
      list.sort((a, b) => startOf(a).localeCompare(startOf(b)));
    }
    return map;
  }, [entries]);

  // Week view in school order (Mon → Sun, then by period start), not database order.
  const weekSorted = useMemo(
    () => [...entries].sort((a, b) => dayIndex(a) - dayIndex(b) || startOf(a).localeCompare(startOf(b))),
    [entries],
  );
  const visible = view === 'day' ? byDay.get(dayFilter) ?? [] : weekSorted;

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.primary}
          />
        }>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Timetable</ModuleKicker>
        <ModuleScreenHeader
          title={persona === 'student' ? 'My timetable' : 'My timetable'}
          description={
            persona === 'student'
              ? 'Your class schedule for the week.'
              : 'Teaching periods for your assigned classes.'
          }
        />

        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, view === 'week' && styles.toggleActive]}
            onPress={() => setView('week')}>
            <Text style={[styles.toggleText, view === 'week' && styles.toggleTextActive]}>Week</Text>
          </Pressable>
          <Pressable
            style={[styles.toggle, view === 'day' && styles.toggleActive]}
            onPress={() => setView('day')}>
            <Text style={[styles.toggleText, view === 'day' && styles.toggleTextActive]}>Day</Text>
          </Pressable>
        </View>

        {view === 'day' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPicker}>
            {DAY_NAMES.map((name, i) => (
              <Pressable
                key={name}
                style={[styles.dayChip, dayFilter === i && styles.dayChipActive]}
                onPress={() => setDayFilter(i)}>
                <Text style={[styles.dayChipText, dayFilter === i && styles.dayChipTextActive]}>{name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load timetable" body={error} onRetry={() => void load()} />
        ) : visible.length === 0 ? (
          <ModuleEmpty
            title="No periods scheduled"
            body="When the school publishes your timetable, periods will appear here."
          />
        ) : (
          visible.map((e, i) => (
            <ModuleGlassCard key={String(e.id ?? i)}>
              <Text style={styles.periodTime}>{timeLabel(e)}</Text>
              <Text style={styles.subject}>{e.subject_name || 'Subject'}</Text>
              <Text style={styles.meta}>
                {[dayLabel(e), persona === 'student' ? e.teacher_name : e.class_name, e.classroom_name || e.room]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </ModuleGlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  toggleActive: { backgroundColor: 'rgba(10,61,46,0.12)' },
  toggleText: { fontWeight: '600', color: Colors.mutedForeground },
  toggleTextActive: { color: Colors.primary },
  dayPicker: { marginBottom: 12, maxHeight: 44 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  dayChipActive: { backgroundColor: Colors.primary },
  dayChipText: { fontWeight: '600', color: Colors.mutedForeground },
  dayChipTextActive: { color: '#fff' },
  periodTime: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, textTransform: 'uppercase' },
  subject: { marginTop: 4, fontSize: 16, fontWeight: '700', color: Colors.ink },
  meta: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
});
