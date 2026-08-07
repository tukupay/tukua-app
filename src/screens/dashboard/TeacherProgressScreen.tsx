/**
 * Teacher progress — outstanding class×subject mark entry rows (T29).
 */
import React, { useCallback, useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchMarksEntryStatus, fetchTeacherExams, type DeskExam } from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherProgress'>;

type EntryRow = {
  exam_id?: string;
  class_id?: string;
  class_name?: string;
  subject_name?: string;
  pending_count?: number;
  total_count?: number;
};

function unwrapRows(data: unknown): EntryRow[] {
  if (Array.isArray(data)) return data as EntryRow[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of ['rows', 'items', 'entry_status']) {
      if (Array.isArray(obj[k])) return obj[k] as EntryRow[];
    }
  }
  return [];
}

function examLabel(e: DeskExam): string {
  return e.name || [e.term, e.academic_year ?? e.academicyear].filter(Boolean).join(' · ') || 'Exam';
}

export function TeacherProgressScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [exams, setExams] = useState<DeskExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const [examList, statusRes] = await Promise.all([
        fetchTeacherExams(15),
        fetchMarksEntryStatus(),
      ]);
      setExams(examList);
      setRows(unwrapRows(statusRes));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('TeacherProgress', msg);
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const examTitle = (examId?: string) => {
    const ex = exams.find((e) => e.id === examId);
    return ex ? examLabel(ex) : 'Exam';
  };

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
        <ModuleKicker>Progress</ModuleKicker>
        <ModuleScreenHeader
          title="Mark entry progress"
          description="Tap a row to open the marks grid for that class."
        />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load progress" body={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          <ModuleEmpty
            title="All caught up"
            body="No outstanding mark entry rows — or the school has not published entry status yet."
            onRetry={() => navigation.navigate('EnterMarks')}
          />
        ) : (
          rows.map((r, i) => {
            const examId = String(r.exam_id ?? exams[0]?.id ?? '');
            const classId = r.class_id ? String(r.class_id) : undefined;
            const pending = r.pending_count ?? r.total_count;
            return (
              <Pressable
                key={`${examId}-${classId ?? i}`}
                onPress={() => {
                  if (!examId) return;
                  navigation.navigate('EnterMarksEntry', {
                    examId,
                    title: examTitle(examId),
                    classId,
                  });
                }}>
                <ModuleGlassCard>
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="create-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.body}>
                      <Text style={styles.title}>{examTitle(examId)}</Text>
                      <Text style={styles.meta}>
                        {[r.class_name, r.subject_name].filter(Boolean).join(' · ') || 'Class'}
                        {pending != null ? ` · ${pending} pending` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                  </View>
                </ModuleGlassCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
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
