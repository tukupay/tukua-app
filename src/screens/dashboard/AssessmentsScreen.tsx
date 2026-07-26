import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { fetchParentAssessmentReports } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Assessments'>;

type ExamRow = {
  id: string;
  name?: string;
  term?: string;
  academic_year?: string;
  marking_status?: string;
  created_at?: string;
};

type ChildReport = {
  student_id?: string;
  admission_number?: string | null;
  full_name?: string;
  class_name?: string | null;
  report?: {
    mean_mark?: number | string | null;
    mean_grade?: string | null;
    total_marks?: number | string | null;
    position?: number | string | null;
    class_position?: number | string | null;
    principal_comment?: string | null;
    class_teacher_comment?: string | null;
  } | null;
};

type AssessmentPayload = {
  exam_id?: string | null;
  exam?: ExamRow | null;
  exams?: ExamRow[];
  years?: string[];
  children?: ChildReport[];
};

function examLabel(e?: ExamRow | null): string {
  if (!e) return 'Select exam';
  return (
    e.name ||
    [e.term, e.academic_year].filter(Boolean).join(' · ') ||
    'Exam'
  );
}

export function AssessmentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const [payload, setPayload] = useState<AssessmentPayload | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<'year' | 'exam' | null>(null);

  const load = useCallback(
    async (soft = false, nextExamId?: string | null) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = (await fetchParentAssessmentReports(
          nextExamId ?? examId ?? undefined,
          selectedStudentId,
        )) as AssessmentPayload;
        setPayload(data ?? {});
        const resolved = String(data?.exam_id ?? data?.exam?.id ?? '').trim() || null;
        if (resolved) setExamId(resolved);
        const y =
          String(data?.exam?.academic_year ?? '').trim() ||
          (data?.years?.[0] ? String(data.years[0]) : null);
        if (y && !year) setYear(y);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Assessments', msg);
        setError(msg);
        setPayload(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [examId, selectedStudentId, year],
  );

  useEffect(() => {
    void load();
    // initial load only — exam changes call load explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  const allExams = payload?.exams ?? [];
  const years = useMemo(() => {
    const fromApi = payload?.years ?? [];
    if (fromApi.length) return fromApi;
    return Array.from(
      new Set(allExams.map((e) => String(e.academic_year ?? '').trim()).filter(Boolean)),
    );
  }, [payload?.years, allExams]);

  const examsForYear = useMemo(() => {
    if (!year) return allExams;
    return allExams.filter((e) => String(e.academic_year ?? '') === year);
  }, [allExams, year]);

  const children = useMemo(() => {
    const all = payload?.children ?? [];
    if (!selectedStudentId) return all;
    const filtered = all.filter((c) => c.student_id === selectedStudentId);
    return filtered.length ? filtered : all;
  }, [payload?.children, selectedStudentId]);

  const selectYear = (y: string) => {
    setYear(y);
    setPicker(null);
    const inYear = allExams.filter((e) => String(e.academic_year ?? '') === y);
    const closed = inYear.filter((e) => String(e.marking_status ?? '').toLowerCase() === 'closed');
    const next = closed[0] ?? inYear[0];
    if (next?.id) {
      setExamId(next.id);
      void load(false, next.id);
    }
  };

  const selectExam = (id: string) => {
    setExamId(id);
    setPicker(null);
    void load(false, id);
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
        <ModuleKicker>Assessments</ModuleKicker>
        <Text style={styles.heading}>
          {selectedStudent?.name ? selectedStudent.name : 'Exam results'}
        </Text>

        {!loading && !error ? (
          <View style={styles.pickers}>
            <Pressable style={styles.pickerBtn} onPress={() => setPicker('year')}>
              <Text style={styles.pickerLabel}>Year</Text>
              <Text style={styles.pickerValue}>{year || 'All years'}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
            </Pressable>
            <Pressable style={styles.pickerBtn} onPress={() => setPicker('exam')}>
              <Text style={styles.pickerLabel}>Exam</Text>
              <Text style={styles.pickerValue} numberOfLines={1}>
                {examLabel(payload?.exam || examsForYear.find((e) => e.id === examId))}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty
            title="Couldn’t load results"
            body={
              /session expired|401|unauthorized/i.test(error)
                ? 'School API session isn’t accepted yet for this account. Pull to retry.'
                : error
            }
            onRetry={() => void load()}
          />
        ) : children.length === 0 ? (
          <ModuleEmpty
            title="No linked children"
            body="Once your children are linked at the school, their exam reports will show here."
          />
        ) : (
          children.map((child, index) => {
            const report = child.report;
            return (
              <ModuleGlassCard key={String(child.student_id ?? index)}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.name}>{child.full_name || 'Student'}</Text>
                    <Text style={styles.meta}>
                      {[child.class_name, child.admission_number].filter(Boolean).join(' · ') ||
                        'Linked student'}
                    </Text>
                  </View>
                </View>
                {report ? (
                  <View style={styles.stats}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Mean</Text>
                      <Text style={styles.statValue}>
                        {report.mean_mark != null ? String(report.mean_mark) : '—'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Grade</Text>
                      <Text style={styles.statValue}>{report.mean_grade || '—'}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Position</Text>
                      <Text style={styles.statValue}>
                        {report.class_position != null
                          ? String(report.class_position)
                          : report.position != null
                            ? String(report.position)
                            : '—'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noReport}>No report for this exam yet.</Text>
                )}
                {report?.class_teacher_comment ? (
                  <Text style={styles.comment}>Teacher: {report.class_teacher_comment}</Text>
                ) : null}
                {report?.principal_comment ? (
                  <Text style={styles.comment}>Principal: {report.principal_comment}</Text>
                ) : null}
              </ModuleGlassCard>
            );
          })
        )}
      </ScrollView>

      <Modal visible={picker != null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{picker === 'year' ? 'Academic year' : 'Exam'}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {picker === 'year'
                ? years.map((y) => (
                    <Pressable key={y} style={styles.modalRow} onPress={() => selectYear(y)}>
                      <Text style={styles.modalRowText}>{y}</Text>
                      {year === y ? (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      ) : null}
                    </Pressable>
                  ))
                : examsForYear.map((e) => (
                    <Pressable key={e.id} style={styles.modalRow} onPress={() => selectExam(e.id)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalRowText}>{examLabel(e)}</Text>
                        <Text style={styles.modalMeta}>
                          {[e.marking_status, e.term].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      {examId === e.id ? (
                        <Ionicons name="checkmark" size={18} color={Colors.primary} />
                      ) : null}
                    </Pressable>
                  ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 10,
  },
  pickers: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pickerBtn: {
    flex: 1,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  pickerValue: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.ink },
  loader: { paddingVertical: 40, alignItems: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
  stats: { flexDirection: 'row', marginTop: 14, gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  statValue: { marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.brandGreenDark },
  noReport: { marginTop: 12, fontSize: 13, color: Colors.mutedForeground },
  comment: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.mutedForeground,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink, marginBottom: 10 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 8,
  },
  modalRowText: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  modalMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
});
