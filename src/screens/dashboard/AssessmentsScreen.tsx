/**
 * Parent → Exams & results: pick a year and exam, see each child's report summary, open the report form /
 * class analysis.
 *
 * Fixed 2026-11-07: the report fields are `overall_mean`, `overall_grade`, `mean_grade_points`,
 * `rank_in_class_by_marks` (the screen read `mean_mark` / `mean_grade` / `rank_in_class`, so Mean, Grade and
 * Rank always showed "—"); dashboard theme; requests that finish late no longer overwrite a newer pick.
 *
 * 2026-11-08 (owner): year and exam are two dropdowns (themed bottom sheet). Year defaults to the year of the
 * current exam (else the newest); exam defaults to the open one, else the newest closed exam that year.
 * "Report form" opens the native ParentReportForm screen (summary at once, subjects from one small request,
 * PDF built on the phone) instead of the slow web print page, which stays there as "Full school layout".
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { fetchParentAssessmentReports, type ParentReportForm } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  SelectField,
  StateCard,
  StatTile,
  StatusPill,
  SurfaceCard,
  fmtNum,
  num,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Assessments'>;

type ExamRow = {
  id: string;
  name?: string;
  term?: string;
  academic_year?: string;
  marking_status?: string;
  is_current?: number | boolean | null;
  created_at?: string;
};

type ChildReport = {
  student_id?: string;
  admission_number?: string | null;
  full_name?: string;
  class_name?: string | null;
  school_name?: string | null;
  report?: Record<string, unknown> | null;
};

type AssessmentPayload = {
  exam_id?: string | null;
  exam?: ExamRow | null;
  exams?: ExamRow[];
  years?: string[];
  children?: ChildReport[];
};

function examLabel(e?: ExamRow | null): string {
  if (!e) return 'Exam';
  return e.name || [e.term, e.academic_year].filter(Boolean).join(' · ') || 'Exam';
}

const isCurrentExam = (e: ExamRow) => e.is_current === true || Number(e.is_current) === 1;
const isOpenExam = (e: ExamRow) => String(e.marking_status ?? '').toLowerCase() === 'open';

/** Newest first (the API already sends them that way; created_at keeps it true if not). */
function newestFirst(list: ExamRow[]): ExamRow[] {
  return [...list].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
}

/** Default year: the current exam's year, else the newest exam's year. */
function defaultYear(exams: ExamRow[], years: string[]): string | null {
  const cur = exams.find(isCurrentExam) ?? exams.find(isOpenExam);
  const y = String(cur?.academic_year ?? '').trim();
  if (y) return y;
  return String(newestFirst(exams)[0]?.academic_year ?? '').trim() || years[0] || null;
}

/** Default exam in a year: the open / current one, else the newest closed one, else the newest. */
function defaultExam(exams: ExamRow[], year: string | null): ExamRow | null {
  const inYear = newestFirst(year ? exams.filter((e) => String(e.academic_year ?? '').trim() === year) : exams);
  return (
    inYear.find((e) => isOpenExam(e) && isCurrentExam(e)) ??
    inYear.find(isOpenExam) ??
    inYear.find(isCurrentExam) ??
    inYear.find((e) => String(e.marking_status ?? '').toLowerCase() === 'closed') ??
    inYear[0] ??
    null
  );
}

/** A child's report row (either API spelling) → what the card shows. */
function readReport(r: Record<string, unknown>) {
  return {
    mean: num(r.overall_mean ?? r.mean_mark),
    grade: r.overall_grade ?? r.mean_grade ? String(r.overall_grade ?? r.mean_grade) : null,
    points: num(r.mean_grade_points),
    total: num(r.total_marks),
    subjects: num(r.subject_entered_count),
    rank: num(r.rank_in_class_by_marks ?? r.rank_in_class ?? r.class_position ?? r.position),
    rankOf: num(r.rank_out_of_class),
    levelRank: num(r.rank_in_level_marks ?? r.rank_in_level),
    levelOf: num(r.rank_out_of_level),
    classMean: num(r.class_mean_marks),
    levelMean: num(r.level_mean_marks),
    teacher: r.class_teacher_comment ? String(r.class_teacher_comment) : null,
    principal: r.principal_comment ? String(r.principal_comment) : null,
  };
}

export function AssessmentsScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const [payload, setPayload] = useState<AssessmentPayload | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (opts: { soft?: boolean; exam?: string | null; initial?: boolean } = {}): Promise<void> => {
      const id = ++reqId.current;
      if (!opts.soft) setLoading(true);
      setError(null);
      try {
        const data = ((await fetchParentAssessmentReports(opts.exam ?? undefined, selectedStudentId)) ??
          {}) as AssessmentPayload;
        if (id !== reqId.current) return;
        log.info('Assessments', 'loaded', {
          exams: Array.isArray(data.exams) ? data.exams.length : null,
          children: Array.isArray(data.children) ? data.children.length : null,
          examId: data.exam_id ?? null,
          selectedStudentId,
        });
        const list = Array.isArray(data.exams) ? data.exams.filter((e) => e && e.id) : [];
        const resolved = String(data.exam_id ?? data.exam?.id ?? '').trim() || null;
        if (opts.initial && !opts.exam && list.length) {
          // First load: the current exam's year and that year's open exam (else its newest closed one).
          const y = defaultYear(list, (data.years ?? []).map(String));
          const want = defaultExam(list, y);
          setYear(y);
          if (want?.id && want.id !== resolved) {
            setExamId(want.id);
            return load({ soft: opts.soft, exam: want.id });
          }
        }
        setPayload(data);
        if (resolved) setExamId(resolved);
        const y = String(data.exam?.academic_year ?? '').trim() || (data.years?.[0] ? String(data.years[0]) : null);
        if (y) setYear((prev) => prev ?? y);
      } catch (e) {
        if (id !== reqId.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Assessments', msg);
        setError(msg);
        setPayload(null);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    setYear(null);
    setExamId(null);
    void load({ initial: true });
  }, [load]);

  const allExams = useMemo(() => (Array.isArray(payload?.exams) ? payload!.exams.filter((e) => e && e.id) : []), [payload]);
  const years = useMemo(() => {
    const fromApi = (payload?.years ?? []).map(String).filter(Boolean);
    if (fromApi.length) return fromApi;
    return Array.from(new Set(allExams.map((e) => String(e.academic_year ?? '').trim()).filter(Boolean)));
  }, [payload?.years, allExams]);
  const examsForYear = useMemo(
    () => newestFirst(year ? allExams.filter((e) => String(e.academic_year ?? '').trim() === year) : allExams),
    [allExams, year],
  );
  const currentExam = payload?.exam ?? allExams.find((e) => e.id === examId) ?? null;

  const children = useMemo(() => {
    const all = Array.isArray(payload?.children) ? payload!.children : [];
    const filtered = selectedStudentId ? all.filter((c) => String(c.student_id ?? '') === selectedStudentId) : all;
    const source = filtered.length ? filtered : selectedStudentId ? [] : all;
    const seen = new Set<string>();
    return source.filter((c, index) => {
      const key = String(c.student_id ?? '').trim() || String(c.admission_number ?? '').trim() || `row-${index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [payload?.children, selectedStudentId]);

  const selectYear = (y: string) => {
    setYear(y);
    const next = defaultExam(allExams, y);
    if (next?.id && next.id !== examId) {
      setExamId(next.id);
      void load({ exam: next.id });
    }
  };

  const selectExam = (id: string) => {
    if (id === examId) return;
    setExamId(id);
    void load({ exam: id });
  };

  const openReportForm = (child: ChildReport) => {
    if (!examId || !child.student_id) return;
    const webPath = `/parent/assessments/print?exam_id=${encodeURIComponent(examId)}&student_id=${encodeURIComponent(
      String(child.student_id),
    )}&reportType=report_forms&title=${encodeURIComponent(`Report form — ${child.full_name || 'Student'}`)}`;
    // What this screen already has, so the report form draws at once; subjects arrive from one small request.
    const rep = child.report ? readReport(child.report) : null;
    const ex = currentExam ?? allExams.find((e) => e.id === examId) ?? null;
    const initial: ParentReportForm = {
      school: { name: child.school_name ?? null },
      student: {
        id: String(child.student_id),
        full_name: child.full_name ?? null,
        admission_number: child.admission_number ?? null,
        class_name: child.class_name ?? null,
      },
      exam: ex
        ? {
            id: ex.id,
            name: ex.name ?? null,
            term: ex.term ?? null,
            academic_year: ex.academic_year ?? null,
            marking_status: ex.marking_status ?? null,
          }
        : { id: examId },
      summary: rep
        ? {
            total_marks: rep.total,
            overall_mean: rep.mean,
            overall_grade: rep.grade,
            mean_grade_points: rep.points,
            subject_count: rep.subjects,
            rank_in_class: rep.rank,
            rank_out_of_class: rep.rankOf,
            rank_in_level: rep.levelRank,
            rank_out_of_level: rep.levelOf,
            class_mean_marks: rep.classMean,
            level_mean_marks: rep.levelMean,
            class_teacher_comment: rep.teacher,
            principal_comment: rep.principal,
          }
        : {},
      subjects: [],
    };
    navigation.navigate('ParentReportForm', { studentId: String(child.student_id), examId, initial, webPath });
  };

  const openClassAnalysis = (child: ChildReport) => {
    if (!examId) return;
    navigation.navigate('DeskModule', {
      title: 'Class analysis',
      deskPath: `/parent/assessments/print?exam_id=${encodeURIComponent(examId)}&reportType=class_performance&class_name=${encodeURIComponent(
        String(child.class_name || ''),
      )}&title=${encodeURIComponent('Class analysis')}`,
      description: 'Class means — no other learners’ raw scores.',
    });
  };

  return (
    <ModuleScrollPage
      title="Exams & results"
      description={
        selectedStudent?.name ? `Report forms for ${selectedStudent.name}.` : 'Your children’s report forms and class analysis.'
      }
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load({ soft: true, exam: examId });
      }}>
      {payload && !error && allExams.length ? (
        <View style={styles.pickers}>
          <SelectField
            label="Academic year"
            icon="calendar-outline"
            value={year ?? years[0] ?? null}
            onChange={selectYear}
            disabled={years.length < 2}
            options={years.map((y) => ({ key: y, label: y }))}
            style={styles.yearPicker}
          />
          <SelectField
            label="Exam"
            title={year ? `Exams · ${year}` : 'Exams'}
            icon="document-text-outline"
            value={examId}
            onChange={selectExam}
            options={examsForYear.map((e) => ({
              key: e.id,
              label: examLabel(e),
              hint: [e.term, e.academic_year].filter(Boolean).join(' · ') || null,
              badge: isOpenExam(e) ? 'Open' : null,
            }))}
            style={styles.examPicker}
          />
        </View>
      ) : null}

      {loading ? (
        <ListSkeleton rows={2} height={160} />
      ) : error ? (
        <ErrorState title="Couldn’t load results" message={error} onRetry={() => void load({ exam: examId })} />
      ) : allExams.length === 0 ? (
        <StateCard icon="school-outline" title="No exams yet" body="Exams and report forms will show here once the school sets them up." />
      ) : children.length === 0 ? (
        <StateCard
          icon="people-outline"
          title="No linked children"
          body="Once your children are linked at the school, their exam reports will show here."
        />
      ) : (
        <>
          {currentExam ? (
            <SectionLabel
              right={isOpenExam(currentExam) ? <StatusPill label="Marking in progress" tone="accent" /> : undefined}>
              {[examLabel(currentExam), currentExam.term].filter(Boolean).join(' · ')}
            </SectionLabel>
          ) : null}
          {children.map((child, index) => {
            const rep = child.report ? readReport(child.report) : null;
            const hasMarks = rep && (rep.mean != null || rep.total != null);
            return (
              <SurfaceCard key={`${String(child.student_id ?? 'x')}-${index}`}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                    <Text style={[styles.avatarText, { color: palette.primary }]}>
                      {String(child.full_name || 'S').trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {child.full_name || 'Student'}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[child.class_name, child.admission_number].filter(Boolean).join(' · ') || 'Linked learner'}
                    </Text>
                  </View>
                </View>

                {rep && hasMarks ? (
                  <>
                    <View style={styles.stats}>
                      <StatTile label="Mean" value={rep.mean != null ? `${fmtNum(rep.mean)}%` : '—'} hint={rep.grade ?? undefined} />
                      <StatTile
                        label="Total"
                        value={rep.total != null ? fmtNum(rep.total, 0) : '—'}
                        hint={rep.subjects != null ? `${rep.subjects} subjects` : undefined}
                      />
                      <StatTile
                        label="Class rank"
                        value={rep.rank != null ? String(rep.rank) : '—'}
                        hint={rep.rankOf != null ? `of ${rep.rankOf}` : undefined}
                      />
                    </View>
                    {rep.classMean != null || rep.levelMean != null || rep.levelOf != null ? (
                      <View style={[styles.stats, { marginTop: 8 }]}>
                        <StatTile label="Class mean" value={rep.classMean != null ? `${fmtNum(rep.classMean)}%` : '—'} />
                        <StatTile label="Level mean" value={rep.levelMean != null ? `${fmtNum(rep.levelMean)}%` : '—'} />
                        <StatTile
                          label="Level rank"
                          value={rep.levelRank != null ? String(rep.levelRank) : '—'}
                          hint={rep.levelOf != null ? `of ${rep.levelOf}` : undefined}
                        />
                      </View>
                    ) : null}
                    {rep.mean != null && rep.classMean != null ? (
                      <Text style={styles.compare}>
                        {rep.mean >= rep.classMean
                          ? `${fmtNum(rep.mean - rep.classMean)} points above the class mean`
                          : `${fmtNum(rep.classMean - rep.mean)} points below the class mean`}
                      </Text>
                    ) : null}
                    {rep.teacher ? (
                      <View style={styles.commentBox}>
                        <Text style={[styles.commentLabel, { color: palette.primary }]}>Class teacher</Text>
                        <Text style={styles.comment}>{rep.teacher}</Text>
                      </View>
                    ) : null}
                    {rep.principal ? (
                      <View style={styles.commentBox}>
                        <Text style={[styles.commentLabel, { color: palette.primary }]}>Principal</Text>
                        <Text style={styles.comment}>{rep.principal}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.noReport}>
                    {currentExam && isOpenExam(currentExam)
                      ? 'Marking is still in progress for this exam.'
                      : 'No report for this exam yet.'}
                  </Text>
                )}

                {examId && child.student_id ? (
                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [styles.actionBtn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}
                      onPress={() => openReportForm(child)}
                      accessibilityRole="button">
                      <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
                      <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Report form</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { backgroundColor: rgba(palette.primary, 0.07) },
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => openClassAnalysis(child)}
                      accessibilityRole="button">
                      <Ionicons name="bar-chart-outline" size={16} color={palette.primary} />
                      <Text style={[styles.actionText, { color: palette.primary }]}>Class analysis</Text>
                    </Pressable>
                  </View>
                ) : null}
              </SurfaceCard>
            );
          })}
        </>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  pickers: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  yearPicker: { flex: 0.85 },
  examPicker: { flex: 1.4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '800', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  compare: { marginTop: 10, fontSize: 12.5, color: MUTED_INK },
  commentBox: { marginTop: 10 },
  commentLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  comment: { marginTop: 3, fontSize: 13.5, lineHeight: 19, color: INK },
  noReport: { marginTop: 12, fontSize: 13, color: MUTED_INK },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  actionText: { fontWeight: '800', fontSize: 13.5 },
});
