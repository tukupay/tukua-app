/**
 * Teacher → Reports: shortcuts (marks progress, report forms & mark sheets, discipline) and the exams list.
 * Tap an exam to see its class results (mean per class from the exam's class × subject aggregates, loaded only
 * when opened), then open the full results / report forms on the school site or enter marks.
 *
 * Fixed 2026-11-07: it pre-loaded the aggregates of 8 exams (~100 KB each) just to print "N aggregate row(s)";
 * the Attendance chip opened the parents' attendance page (403 for staff); every exam opened the marks *entry*
 * grid. Dashboard theme, exams in batches.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { useAppTheme } from '../../context/AppThemeContext';
import { fetchExamAggregates, fetchTeacherExams, pickDefaultExam, type DeskExam } from '../../lib/teacherPortalApi';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  ShowMoreButton,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtNum,
  friendlyError,
  num,
  useClientPager,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherReports'>;

type ClassResult = { classId: string; className: string; mean: number | null; subjects: number; entered: number; best?: string; weakest?: string };
type ExamResults = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ok'; classes: ClassResult[] };

function examLabel(e: DeskExam): string {
  return e.name || [e.term, e.academic_year ?? e.academicyear ?? e.year].filter(Boolean).join(' · ') || 'Exam';
}

function examPill(e: DeskExam): { label: string; tone: 'accent' | 'primary' | 'neutral' } {
  const cur = (e as { is_current?: unknown }).is_current;
  if (cur === true || cur === 1) return { label: 'Current', tone: 'accent' };
  const st = String(e.marking_status ?? '').toLowerCase();
  if (st === 'open') return { label: 'Marking', tone: 'primary' };
  if (st === 'closed') return { label: 'Closed', tone: 'neutral' };
  return { label: e.marking_status || 'Exam', tone: 'neutral' };
}

/** class × subject aggregate rows → one line per class (mean of subject means, strongest / weakest subject). */
function toClassResults(rows: Array<Record<string, unknown>>): ClassResult[] {
  const by = new Map<string, { name: string; means: Array<{ s: string; m: number }>; entered: number }>();
  for (const r of rows) {
    const id = String(r.class_id ?? '');
    if (!id) continue;
    const g = by.get(id) ?? { name: String(r.class_name ?? 'Class'), means: [], entered: 0 };
    const m = num(r.mean_marks);
    if (m != null) g.means.push({ s: String(r.subject_name ?? 'Subject'), m });
    g.entered = Math.max(g.entered, num(r.entered_count) ?? 0);
    by.set(id, g);
  }
  return [...by.entries()]
    .map(([classId, g]) => {
      const sorted = [...g.means].sort((a, b) => b.m - a.m);
      return {
        classId,
        className: g.name,
        mean: g.means.length ? g.means.reduce((a, x) => a + x.m, 0) / g.means.length : null,
        subjects: g.means.length,
        entered: g.entered,
        best: sorted[0]?.s,
        weakest: sorted.length > 1 ? sorted[sorted.length - 1].s : undefined,
      };
    })
    .sort((a, b) => a.className.localeCompare(b.className));
}

export function TeacherReportsScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const [exams, setExams] = useState<DeskExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ExamResults>>({});
  const pager = useClientPager(exams, 10);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const list = await fetchTeacherExams(40);
      setExams(list);
      setResults({});
      setOpenId((prev) => prev ?? pickDefaultExam(list)?.id ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('TeacherReports', msg);
      setError(msg);
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadResults = useCallback(async (examId: string) => {
    setResults((r) => ({ ...r, [examId]: { state: 'loading' } }));
    try {
      const res = await fetchExamAggregates(examId);
      setResults((r) => ({ ...r, [examId]: { state: 'ok', classes: toClassResults(res.aggregates ?? []) } }));
    } catch (e) {
      setResults((r) => ({ ...r, [examId]: { state: 'error', message: e instanceof Error ? e.message : String(e) } }));
    }
  }, []);

  useEffect(() => {
    if (openId && !results[openId]) void loadResults(openId);
  }, [openId, results, loadResults]);

  const shortcuts = useMemo(
    () => [
      { key: 'progress', icon: 'trending-up' as const, label: 'Marks progress', sub: 'Outstanding entry', onPress: () => navigation.navigate('TeacherProgress') },
      {
        key: 'forms',
        icon: 'documents-outline' as const,
        label: 'Report forms',
        sub: 'Mark sheets · print',
        onPress: () =>
          navigation.navigate('DeskModule', {
            title: 'Report forms',
            deskPath: '/teacher/assessment/reports',
            description: 'Report forms, mark sheets and merit lists.',
          }),
      },
      { key: 'enter', icon: 'create-outline' as const, label: 'Enter marks', sub: 'By class & subject', onPress: () => navigation.navigate('EnterMarks') },
      { key: 'discipline', icon: 'shield-outline' as const, label: 'Discipline', sub: 'Cases & conduct', onPress: () => navigation.navigate('Discipline') },
    ],
    [navigation],
  );

  return (
    <ModuleScrollPage
      title="Reports"
      description="Exam results by class, report forms and mark sheets."
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(true);
      }}>
      <View style={styles.grid}>
        {shortcuts.map((s) => (
          <SurfaceCard key={s.key} style={styles.shortcut} onPress={s.onPress} accessibilityLabel={s.label}>
            <View style={[styles.shortIcon, { backgroundColor: rgba(palette.primary, 0.07) }]}>
              <Ionicons name={s.icon} size={18} color={palette.primary} />
            </View>
            <Text style={styles.shortLabel} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={styles.shortSub} numberOfLines={1}>
              {s.sub}
            </Text>
          </SurfaceCard>
        ))}
      </View>

      <SectionLabel>Exams</SectionLabel>
      {loading ? (
        <ListSkeleton rows={4} height={64} />
      ) : error ? (
        <ErrorState title="Couldn’t load exams" message={error} onRetry={() => void load()} />
      ) : exams.length === 0 ? (
        <StateCard icon="clipboard-outline" title="No exams yet" body="Exams created by the school office will show here." />
      ) : (
        <>
          {pager.visible.map((exam) => {
            const open = openId === exam.id;
            const res = results[exam.id];
            const pill = examPill(exam);
            return (
              <SurfaceCard key={exam.id}>
                <Pressable
                  onPress={() => setOpenId(open ? null : exam.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  style={styles.examHead}>
                  <View style={[styles.examIcon, { backgroundColor: rgba(palette.primary, 0.07) }]}>
                    <Ionicons name="document-text-outline" size={18} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.examTitle} numberOfLines={2}>
                      {examLabel(exam)}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[exam.term, exam.academic_year ?? exam.academicyear ?? exam.year, exam.exam_type].filter(Boolean).join(' · ') || 'Exam'}
                    </Text>
                  </View>
                  <StatusPill label={pill.label} tone={pill.tone} />
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED_INK} />
                </Pressable>

                {open ? (
                  <View style={styles.body}>
                    {!res || res.state === 'loading' ? (
                      <View style={styles.inlineLoad}>
                        <ActivityIndicator color={palette.primary} />
                        <Text style={styles.meta}>Loading class results…</Text>
                      </View>
                    ) : res.state === 'error' ? (
                      <View style={styles.inlineLoad}>
                        <Text style={styles.meta}>{friendlyError(res.message)}</Text>
                        <Pressable onPress={() => void loadResults(exam.id)} hitSlop={8}>
                          <Text style={[styles.link, { color: palette.primary }]}>Retry</Text>
                        </Pressable>
                      </View>
                    ) : res.classes.length === 0 ? (
                      <Text style={styles.meta}>No results computed for this exam yet.</Text>
                    ) : (
                      res.classes.map((c, i) => (
                        <View key={c.classId} style={[styles.classRow, i > 0 && styles.divider]}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.className} numberOfLines={1}>
                              {c.className}
                            </Text>
                            <Text style={styles.meta} numberOfLines={1}>
                              {[
                                `${c.subjects} subject${c.subjects === 1 ? '' : 's'}`,
                                c.best ? `Best ${c.best}` : null,
                                c.weakest ? `Weakest ${c.weakest}` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </Text>
                          </View>
                          <Text style={styles.classMean}>{c.mean != null ? `${fmtNum(c.mean)}%` : '—'}</Text>
                        </View>
                      ))
                    )}
                    <View style={styles.actions}>
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}
                        onPress={() =>
                          navigation.navigate('DeskModule', {
                            title: examLabel(exam),
                            deskPath: `/teacher/assessment/exam/${encodeURIComponent(exam.id)}`,
                            description: 'Mark sheet, analysis and report forms for this exam.',
                          })
                        }>
                        <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Full results</Text>
                      </Pressable>
                      {String(exam.marking_status ?? '').toLowerCase() !== 'closed' ? (
                        <Pressable
                          style={({ pressed }) => [styles.actionBtn, { backgroundColor: rgba(palette.primary, 0.07) }, pressed && { opacity: 0.85 }]}
                          onPress={() => navigation.navigate('TeacherMarksheet', { examId: exam.id, title: examLabel(exam) })}>
                          <Ionicons name="create-outline" size={16} color={palette.primary} />
                          <Text style={[styles.actionText, { color: palette.primary }]}>Enter marks</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : null}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  shortcut: { flexBasis: '47%', flexGrow: 1, marginBottom: 0, paddingVertical: 12 },
  shortIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shortLabel: { fontSize: 14, fontWeight: '800', color: INK },
  shortSub: { marginTop: 2, fontSize: 11.5, color: MUTED_INK },
  examHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  examIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  examTitle: { fontSize: 15, fontWeight: '800', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  body: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E1D3', paddingTop: 4 },
  inlineLoad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  link: { fontSize: 13, fontWeight: '800' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E1D3' },
  className: { fontSize: 14, fontWeight: '700', color: INK },
  classMean: { fontSize: 16, fontWeight: '800', color: INK },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 11 },
  actionText: { fontWeight: '800', fontSize: 13.5 },
});
