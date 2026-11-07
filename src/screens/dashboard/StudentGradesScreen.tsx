/**
 * Learner → Grades & progress: own exams (class scope) with the report summary per exam, and the trend line.
 *
 * Fixed 2026-11-07: the summary fields are `overall_mean` / `overall_grade` / `rank_in_class_by_marks` (the
 * screen read `mean_mark` / `mean_grade` / `rank_in_class`, so every card showed "—"); summaries load in
 * parallel instead of 12 calls one after another; the list is the learner's own exams, not the whole school's.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../context/AppThemeContext';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import {
  fetchStudentExamSummary,
  fetchStudentExams,
  fetchStudentOwnExams,
  fetchStudentPerformanceTrend,
  type StudentOwnExam,
  type StudentTrend,
} from '../../lib/studentPortalApi';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { INK, rgba } from '../../components/theme/ThemedPage';
import {
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  ShowMoreButton,
  StateCard,
  StatTile,
  StatusPill,
  SurfaceCard,
  fmtNum,
  num,
  useClientPager,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentGrades'>;

type ExamSummary = {
  mean: number | null;
  grade: string | null;
  points: number | null;
  total: number | null;
  rank: number | null;
  rankOf: number | null;
  subjects: number | null;
};

type ExamItem = { exam: StudentOwnExam; summary: ExamSummary | null; failed?: boolean };

export function examTitle(e: { name?: string | null; term?: string | null; academic_year?: string | null }): string {
  return e.name || [e.term, e.academic_year].filter(Boolean).join(' · ') || 'Exam';
}

/** Report summary row (either API spelling) → the numbers a card shows. */
export function toExamSummary(raw: Record<string, unknown> | null | undefined): ExamSummary | null {
  if (!raw) return null;
  const s = raw as Record<string, unknown>;
  return {
    mean: num(s.overall_mean ?? s.mean_mark ?? s.mean),
    grade: (s.overall_grade ?? s.mean_grade ?? null) ? String(s.overall_grade ?? s.mean_grade) : null,
    points: num(s.mean_grade_points),
    total: num(s.total_marks),
    rank: num(s.rank_in_class_by_marks ?? s.rank_in_class ?? s.class_position ?? s.position),
    rankOf: num(s.rank_out_of_class),
    subjects: num(s.subject_entered_count),
  };
}

function statusPill(e: StudentOwnExam): { label: string; tone: 'primary' | 'success' | 'neutral' | 'accent' } {
  if (e.is_current === true || e.is_current === 1) return { label: 'Current', tone: 'accent' };
  const st = String(e.marking_status ?? '').toLowerCase();
  if (st === 'closed') return { label: 'Closed', tone: 'neutral' };
  if (st === 'open') return { label: 'Marking', tone: 'primary' };
  return { label: e.marking_status || 'Exam', tone: 'neutral' };
}

/** Run `fn` over `items`, `limit` at a time. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export function StudentGradesScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const { deskUser, selectedStudentId } = useDeskAuth();
  const studentId = String(selectedStudentId ?? deskUser?.id ?? deskUser?.user_id ?? '').trim();

  const [items, setItems] = useState<ExamItem[]>([]);
  const [trend, setTrend] = useState<StudentTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pager = useClientPager(items, 8);

  const load = useCallback(
    async (soft = false) => {
      if (!studentId) {
        setError('Your learner profile is not linked to this account yet.');
        setLoading(false);
        return;
      }
      if (!soft) setLoading(true);
      setError(null);
      try {
        const [own, tr] = await Promise.all([
          fetchStudentOwnExams().catch(async () => ({
            exams: (await fetchStudentExams(30)).map((e) => ({
              id: e.id,
              name: e.name,
              term: e.term,
              academic_year: e.academic_year ?? e.academicyear ?? e.year,
              marking_status: e.marking_status,
            })) as StudentOwnExam[],
            currentExamId: null,
          })),
          fetchStudentPerformanceTrend(),
        ]);
        setTrend(tr);
        const exams = own.exams.slice(0, 24);
        const rows = await mapLimited(exams, 4, async (exam): Promise<ExamItem> => {
          try {
            const { summary } = await fetchStudentExamSummary(exam.id, studentId);
            const raw = summary as Record<string, unknown> | null;
            // Only ever this learner's own row.
            const mine = raw && (!raw.student_id || String(raw.student_id) === studentId) ? raw : null;
            return { exam, summary: toExamSummary(mine) };
          } catch {
            return { exam, summary: null, failed: true };
          }
        });
        setItems(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('StudentGrades', msg);
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const withMarks = items.filter((i) => i.summary?.mean != null).length;
  const latest = trend?.exams?.length ? trend.exams[trend.exams.length - 1] : null;

  return (
    <ModuleScrollPage
      title="Grades & progress"
      description="Your results per exam. Tap an exam for subject marks."
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(true);
      }}>
      {loading ? (
        <ListSkeleton rows={4} height={110} />
      ) : error ? (
        <ErrorState title="Couldn’t load your grades" message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <StateCard
          icon="school-outline"
          title="No exams yet"
          body="Your exams and report forms will show here once your school sets them up."
        />
      ) : (
        <>
          {latest && latest.overall_mean != null ? (
            <SurfaceCard style={styles.trendCard}>
              <View style={[styles.trendIcon, { backgroundColor: rgba(palette.secondary, 0.22) }]}>
                <Ionicons name="trending-up" size={20} color={palette.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.trendTitle}>
                  Latest mean {fmtNum(latest.overall_mean)}%
                  {latest.class_mean != null ? ` · class ${fmtNum(latest.class_mean)}%` : ''}
                </Text>
                {trend?.analysis?.trend_label ? (
                  <Text style={styles.trendBody}>{trend.analysis.trend_label}</Text>
                ) : null}
              </View>
            </SurfaceCard>
          ) : null}

          <SectionLabel>{`Exams · ${withMarks} with results`}</SectionLabel>
          {pager.visible.map(({ exam, summary, failed }) => {
            const pill = statusPill(exam);
            return (
              <SurfaceCard
                key={exam.id}
                accessibilityLabel={`Open ${examTitle(exam)}`}
                onPress={() => navigation.navigate('StudentExamDetail', { examId: exam.id, title: examTitle(exam) })}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.examTitle} numberOfLines={2}>
                      {examTitle(exam)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[exam.term, exam.academic_year, exam.exam_type].filter(Boolean).join(' · ') || 'Exam'}
                    </Text>
                  </View>
                  <StatusPill label={pill.label} tone={pill.tone} />
                  <Ionicons name="chevron-forward" size={18} color={MUTED_INK} />
                </View>
                {summary && summary.mean != null ? (
                  <View style={styles.stats}>
                    <StatTile label="Mean" value={`${fmtNum(summary.mean)}%`} />
                    <StatTile
                      label={summary.grade ? 'Grade' : 'Points'}
                      value={summary.grade ?? (summary.points != null ? fmtNum(summary.points, 2) : '—')}
                    />
                    <StatTile
                      label="Class rank"
                      value={summary.rank != null ? String(summary.rank) : '—'}
                      hint={summary.rankOf != null ? `of ${summary.rankOf}` : undefined}
                    />
                  </View>
                ) : (
                  <Text style={styles.noReport}>
                    {failed
                      ? 'Couldn’t load this result. Pull down to try again.'
                      : String(exam.marking_status ?? '').toLowerCase() === 'open'
                        ? 'Marking in progress — tap to see subjects marked so far.'
                        : 'No results for you in this exam.'}
                  </Text>
                )}
              </SurfaceCard>
            );
          })}
          {pager.hasMore ? <ShowMoreButton shown={pager.shown} total={pager.total} onPress={pager.showMore} /> : null}
        </>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  trendCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trendIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trendTitle: { fontSize: 15, fontWeight: '800', color: INK },
  trendBody: { marginTop: 3, fontSize: 12.5, lineHeight: 17, color: MUTED_INK },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  examTitle: { fontSize: 15.5, fontWeight: '800', color: INK },
  meta: { marginTop: 3, fontSize: 12, color: MUTED_INK },
  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  noReport: { marginTop: 10, fontSize: 13, lineHeight: 18, color: MUTED_INK },
});
