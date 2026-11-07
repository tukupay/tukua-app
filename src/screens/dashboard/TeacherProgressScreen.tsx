/**
 * Teacher → Marks progress: for one exam, how far mark entry is per class × subject (entered / learners), with
 * the outstanding ones first. Tap a row to enter marks for that class.
 *
 * Fixed 2026-11-07: it always read the first exam in the list (an old closed one), so it said "All caught up"
 * while the current exam had classes outstanding; now it opens the current exam and has exam chips. The
 * "All caught up" card's button no longer says "Try again" while opening Enter Marks.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { useAppTheme } from '../../context/AppThemeContext';
import {
  fetchMarksEntryStatusAll,
  fetchTeacherExams,
  pickDefaultExam,
  type DeskExam,
  type MarksEntryStatusRow,
} from '../../lib/teacherPortalApi';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ChipRow,
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
  useClientPager,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherProgress'>;
type Filter = 'pending' | 'all';

function examLabel(e: DeskExam): string {
  return e.name || [e.term, e.academic_year ?? e.academicyear].filter(Boolean).join(' · ') || 'Exam';
}

export function TeacherProgressScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const [exams, setExams] = useState<DeskExam[]>([]);
  const [examId, setExamId] = useState<string | null>(null);
  const [rows, setRows] = useState<MarksEntryStatusRow[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const loadRows = useCallback(async (id: string, soft = false) => {
    const rid = ++reqId.current;
    if (!soft) setRowsLoading(true);
    setError(null);
    try {
      const list = await fetchMarksEntryStatusAll(id);
      if (rid !== reqId.current) return;
      setRows(list);
    } catch (e) {
      if (rid !== reqId.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('TeacherProgress', msg);
      setError(msg);
      setRows([]);
    } finally {
      if (rid === reqId.current) {
        setRowsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const list = await fetchTeacherExams(30);
        setExams(list);
        const pick = (examId && list.find((e) => e.id === examId)) || pickDefaultExam(list);
        if (!pick) {
          setRows([]);
          setExamId(null);
          return;
        }
        setExamId(pick.id);
        await loadRows(pick.id, true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('TeacherProgress', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [examId, loadRows],
  );

  useEffect(() => {
    void load();
    // first load only; exam chips call loadRows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          (b.pending_count ?? 0) - (a.pending_count ?? 0) ||
          String(a.class_name ?? '').localeCompare(String(b.class_name ?? '')) ||
          String(a.subject_name ?? '').localeCompare(String(b.subject_name ?? '')),
      ),
    [rows],
  );
  const pendingRows = useMemo(() => sorted.filter((r) => (r.pending_count ?? 0) > 0), [sorted]);
  const shownRows = filter === 'pending' ? pendingRows : sorted;
  const pager = useClientPager(shownRows, 20, `${examId}-${filter}`);

  const totals = useMemo(() => {
    let entered = 0;
    let total = 0;
    for (const r of rows) {
      entered += r.entered_count ?? 0;
      total += r.total_count ?? 0;
    }
    return { entered, total, done: rows.length - pendingRows.length };
  }, [rows, pendingRows.length]);

  const exam = exams.find((e) => e.id === examId) ?? null;
  const pct = totals.total ? Math.round((totals.entered / totals.total) * 100) : null;

  return (
    <ModuleScrollPage
      title="Marks progress"
      description="Mark entry per class and subject. Tap a row to enter marks."
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        if (examId) void loadRows(examId, true);
        else void load(true);
      }}>
      {loading ? (
        <ListSkeleton rows={5} height={64} />
      ) : error && !rows.length ? (
        <ErrorState title="Couldn’t load progress" message={error} onRetry={() => (examId ? void loadRows(examId) : void load())} />
      ) : exams.length === 0 ? (
        <StateCard icon="clipboard-outline" title="No exams yet" body="Exams created by the school office will show here." />
      ) : (
        <>
          <ChipRow
            value={examId ?? ''}
            onChange={(id) => {
              setExamId(id);
              void loadRows(id);
            }}
            options={exams.map((e) => ({ key: e.id, label: examLabel(e) }))}
          />
          {rowsLoading ? (
            <ListSkeleton rows={5} height={64} />
          ) : rows.length === 0 ? (
            <StateCard
              icon="grid-outline"
              title="No classes on this exam"
              body="This exam has no class and subject rows to mark yet."
              actionLabel="Open Enter marks"
              onAction={() => navigation.navigate('EnterMarks')}
            />
          ) : (
            <>
              <SurfaceCard>
                <View style={styles.stats}>
                  <StatTile label="Entered" value={pct != null ? `${pct}%` : '—'} hint={`${totals.entered} of ${totals.total}`} />
                  <StatTile label="Done" value={String(totals.done)} hint={`of ${rows.length} rows`} />
                  <StatTile label="Outstanding" value={String(pendingRows.length)} hint="rows" />
                </View>
                {exam && String(exam.marking_status ?? '').toLowerCase() === 'closed' ? (
                  <Text style={styles.note}>Marking is closed for this exam.</Text>
                ) : null}
              </SurfaceCard>

              <ChipRow<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { key: 'pending', label: 'Outstanding', count: pendingRows.length },
                  { key: 'all', label: 'All', count: rows.length },
                ]}
              />

              {shownRows.length === 0 ? (
                <StateCard
                  icon="checkmark-done-outline"
                  title="All caught up"
                  body="Every class and subject on this exam has its marks entered."
                />
              ) : (
                <>
                  <SectionLabel>{exam ? examLabel(exam) : 'Exam'}</SectionLabel>
                  {pager.visible.map((r, i) => {
                    const total = r.total_count ?? 0;
                    const entered = r.entered_count ?? 0;
                    const frac = total ? Math.min(1, entered / total) : 0;
                    const done = (r.pending_count ?? 0) === 0;
                    return (
                      <SurfaceCard
                        key={`${r.class_id ?? 'c'}-${r.subject_id ?? i}`}
                        accessibilityLabel={`Enter marks for ${r.class_name ?? 'class'} ${r.subject_name ?? ''}`}
                        onPress={() =>
                          examId &&
                          navigation.navigate('EnterMarksEntry', {
                            examId,
                            title: exam ? examLabel(exam) : 'Enter marks',
                            classId: r.class_id,
                          })
                        }>
                        <View style={styles.rowTop}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.title} numberOfLines={1}>
                              {r.subject_name || 'Subject'}
                            </Text>
                            <Text style={styles.meta} numberOfLines={1}>
                              {[r.class_name, r.teacher_name].filter(Boolean).join(' · ') || 'Class'}
                            </Text>
                          </View>
                          {done ? (
                            <StatusPill label="Done" tone="success" icon="checkmark" />
                          ) : (
                            <StatusPill label={`${r.pending_count} to enter`} tone="warning" />
                          )}
                          <Ionicons name="chevron-forward" size={18} color={MUTED_INK} />
                        </View>
                        <View style={[styles.bar, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${Math.round(frac * 100)}%`, backgroundColor: done ? '#067647' : palette.secondary },
                            ]}
                          />
                        </View>
                        <Text style={styles.barText}>
                          {entered} of {total} learners entered
                        </Text>
                      </SurfaceCard>
                    );
                  })}
                  {pager.hasMore ? <ShowMoreButton shown={pager.shown} total={pager.total} onPress={pager.showMore} /> : null}
                </>
              )}
            </>
          )}
        </>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  note: { marginTop: 10, fontSize: 12.5, color: MUTED_INK },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  bar: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barText: { marginTop: 5, fontSize: 11.5, color: MUTED_INK },
});
