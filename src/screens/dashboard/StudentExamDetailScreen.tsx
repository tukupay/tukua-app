/**
 * Learner → one exam's report form: totals, ranks, comments and per-subject marks (with the class average when
 * the school has computed it). Loads only the learner's own row (`?rows=none`; the full class sheet was ~650 KB).
 * Subjects the learner does not take are folded away instead of showing a column of empty cards.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { fetchStudentReportForm } from '../../lib/studentPortalApi';
import { useAppTheme } from '../../context/AppThemeContext';
import { INK } from '../../components/theme/ThemedPage';
import {
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  StateCard,
  StatTile,
  StatusPill,
  SurfaceCard,
  fmtNum,
  num,
  type PillTone,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentExamDetail'>;

type SubjectCell = {
  marks?: number | string | null;
  grade?: string | null;
  max_marks?: number | string | null;
  marks_percentage?: number | string | null;
  status?: string | null;
  rank_in_class?: number | string | null;
  comment?: string | null;
};

type SubjectLine = {
  key: string;
  name: string;
  marks: number | null;
  max: number | null;
  pct: number | null;
  grade: string | null;
  rank: number | null;
  classMean: number | null;
  comment: string | null;
};

function gradeTone(pct: number | null): PillTone {
  if (pct == null) return 'neutral';
  if (pct >= 75) return 'success';
  if (pct >= 50) return 'primary';
  if (pct >= 35) return 'warning';
  return 'danger';
}

export function StudentExamDetailScreen({ route, navigation }: Props) {
  const { examId, title } = route.params;
  const { palette } = useAppTheme();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchStudentReportForm>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUntaken, setShowUntaken] = useState(false);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        setData(await fetchStudentReportForm(examId));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('StudentExamDetail', msg);
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [examId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const row = data?.row ?? null;

  const { taken, untaken } = useMemo(() => {
    const cols = data?.subjectColumns ?? [];
    const cells = (Array.isArray(row?.subjects) ? row!.subjects : []) as SubjectCell[];
    const agg = data?.aggregates;
    const classSubjects = Array.isArray(agg?.class_subjects) ? agg!.class_subjects : [];
    const classId = String((row as Record<string, unknown> | null)?.class_id ?? '');
    const lines: SubjectLine[] = cols.map((col, idx) => {
      const cell = cells[idx] ?? {};
      const marks = num(cell.marks);
      const max = num(cell.max_marks);
      const pct = num(cell.marks_percentage) ?? (marks != null && max ? (marks / max) * 100 : null);
      const cm = classSubjects.find(
        (c) => String(c.subject_id ?? '') === String(col.id ?? '') && (!classId || String(c.class_id ?? '') === classId),
      );
      return {
        key: String(col.id ?? col.code ?? idx),
        name: col.name || col.code || 'Subject',
        marks,
        max,
        pct,
        grade: cell.grade ? String(cell.grade) : null,
        rank: num(cell.rank_in_class),
        classMean: num(cm?.mean_marks),
        comment: cell.comment ? String(cell.comment) : null,
      };
    });
    return { taken: lines.filter((l) => l.marks != null), untaken: lines.filter((l) => l.marks == null) };
  }, [data, row]);

  const r = (row ?? {}) as Record<string, unknown>;
  const mean = num(r.mean ?? r.overall_percentage);
  const total = num(r.total_marks);
  const possible = num(r.total_possible_marks);
  const rankC = num(r.rank_in_class);
  const rankCOf = num(r.rank_out_of_class);
  const rankL = num(r.rank_in_level);
  const rankLOf = num(r.rank_out_of_level);
  const grade = r.overall_grade ? String(r.overall_grade) : null;
  const teacherComment = r.class_teacher_comment ? String(r.class_teacher_comment) : null;
  const principalComment = r.principal_comment ? String(r.principal_comment) : null;

  return (
    <ModuleScrollPage
      title={title || 'Exam results'}
      description={[data?.exam?.term, data?.exam?.academic_year].filter(Boolean).map(String).join(' · ') || 'Your report form'}
      onBack={() => navigation.goBack()}
      backLabel="Grades"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(true);
      }}>
      {loading ? (
        <ListSkeleton rows={6} height={56} />
      ) : error ? (
        <ErrorState title="Couldn’t load this exam" message={error} onRetry={() => void load()} />
      ) : !row ? (
        <StateCard
          icon="document-text-outline"
          title="No results for you yet"
          body="Your marks for this exam have not been entered or published yet."
          actionLabel="Check again"
          onAction={() => void load()}
        />
      ) : (
        <>
          <SurfaceCard>
            <View style={styles.stats}>
              <StatTile label="Mean" value={mean != null ? `${fmtNum(mean)}%` : '—'} hint={grade ?? undefined} />
              <StatTile
                label="Total"
                value={total != null ? fmtNum(total, 0) : '—'}
                hint={possible ? `of ${fmtNum(possible, 0)}` : undefined}
              />
            </View>
            <View style={[styles.stats, { marginTop: 8 }]}>
              <StatTile
                label="Class rank"
                value={rankC != null ? String(rankC) : '—'}
                hint={rankCOf != null ? `of ${rankCOf}` : undefined}
              />
              <StatTile
                label="Level rank"
                value={rankL != null ? String(rankL) : '—'}
                hint={rankLOf != null ? `of ${rankLOf}` : undefined}
              />
            </View>
          </SurfaceCard>

          {teacherComment || principalComment ? (
            <SurfaceCard>
              {teacherComment ? (
                <View>
                  <Text style={[styles.commentLabel, { color: palette.primary }]}>Class teacher</Text>
                  <Text style={styles.comment}>{teacherComment}</Text>
                </View>
              ) : null}
              {principalComment ? (
                <View style={teacherComment ? { marginTop: 10 } : undefined}>
                  <Text style={[styles.commentLabel, { color: palette.primary }]}>Principal</Text>
                  <Text style={styles.comment}>{principalComment}</Text>
                </View>
              ) : null}
            </SurfaceCard>
          ) : null}

          <SectionLabel>{`Subjects · ${taken.length}`}</SectionLabel>
          {taken.length === 0 ? (
            <StateCard icon="create-outline" title="No subject marks yet" body="Subject marks appear as teachers enter them." />
          ) : (
            <SurfaceCard style={styles.listCard}>
              {taken.map((s, i) => (
                <View key={s.key} style={[styles.subjectRow, i > 0 && styles.divider]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.subjectName} numberOfLines={2}>
                      {s.name}
                    </Text>
                    <Text style={styles.subjectMeta} numberOfLines={1}>
                      {[
                        s.rank != null ? `Rank ${s.rank}` : null,
                        s.classMean != null ? `Class avg ${fmtNum(s.classMean)}` : null,
                        s.comment && s.comment.length <= 28 ? s.comment : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || ' '}
                    </Text>
                  </View>
                  <View style={styles.markCol}>
                    <Text style={styles.mark}>
                      {fmtNum(s.marks)}
                      {s.max != null ? <Text style={styles.markMax}>/{fmtNum(s.max, 0)}</Text> : null}
                    </Text>
                    {s.grade ? <StatusPill label={s.grade} tone={gradeTone(s.pct)} /> : null}
                  </View>
                </View>
              ))}
            </SurfaceCard>
          )}

          {untaken.length ? (
            <Pressable onPress={() => setShowUntaken((v) => !v)} style={styles.untakenToggle} accessibilityRole="button">
              <Text style={styles.untakenText}>
                {showUntaken ? 'Hide' : 'Show'} {untaken.length} subject{untaken.length === 1 ? '' : 's'} without marks
              </Text>
              <Ionicons name={showUntaken ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED_INK} />
            </Pressable>
          ) : null}
          {showUntaken && untaken.length ? (
            <SurfaceCard style={styles.listCard}>
              {untaken.map((s, i) => (
                <View key={s.key} style={[styles.subjectRow, i > 0 && styles.divider]}>
                  <Text style={[styles.subjectName, { flex: 1, color: MUTED_INK }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={styles.subjectMeta}>—</Text>
                </View>
              ))}
            </SurfaceCard>
          ) : null}
        </>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  commentLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  comment: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: INK },
  listCard: { paddingVertical: 2, paddingHorizontal: 14 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E1D3' },
  subjectName: { fontSize: 14.5, fontWeight: '700', color: INK },
  subjectMeta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  markCol: { alignItems: 'flex-end', gap: 4 },
  mark: { fontSize: 17, fontWeight: '800', color: INK },
  markMax: { fontSize: 12, fontWeight: '600', color: MUTED_INK },
  untakenToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  untakenText: { fontSize: 13, fontWeight: '700', color: MUTED_INK },
});
