/**
 * Parent → class analysis for one child's class and one exam, drawn natively (owner, 2026-11-08: the web
 * print page never finished loading in the app). Aggregates only — class and level means, learner counts,
 * grade distribution, stream means, and per-subject class/level means next to the child's own marks. No
 * other learner's name or marks reach the phone.
 *
 * Shows what the Exams screen already knows (class/level mean, class size) at once, then fills the rest from
 * GET /parents/me/class-analysis. If the API does not have the route yet (404) the summary stays.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { fetchParentClassAnalysis, type ParentClassAnalysis } from '../../lib/parentPortalApi';
import { shareClassAnalysisPdf } from '../../lib/classAnalysisPdf';
import { log } from '../../lib/logger';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  StatTile,
  StatusPill,
  SurfaceCard,
  fmtNum,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'ParentClassAnalysis'>;

const UP = '#0F6B3E';
const DOWN = '#B42318';

const pct = (v?: number | null) => (v != null ? `${fmtNum(v)}%` : '—');
const posText = (pos?: number | null, of?: number | null) => (pos == null ? '—' : of ? `${pos} of ${of}` : String(pos));

export function ParentClassAnalysisScreen({ navigation, route }: Props) {
  const { studentId, examId, initial } = route.params;
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const [data, setData] = useState<ParentClassAnalysis | null>(initial ?? null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const t0 = Date.now();
    try {
      const res = await fetchParentClassAnalysis(studentId, examId);
      if (!alive.current) return;
      log.info('ClassAnalysis', 'loaded', { ms: Date.now() - t0, subjects: res?.subjects?.length ?? 0 });
      setData((prev) => ({
        ...(res ?? {}),
        // The API does not send the school; keep what the Exams screen knew.
        school: res?.school ?? prev?.school ?? null,
        student: { ...(prev?.student ?? { id: studentId }), ...stripNulls(res?.student ?? {}) } as ParentClassAnalysis['student'],
        exam: (res?.exam ?? prev?.exam ?? null) as ParentClassAnalysis['exam'],
      }));
      setMissing(false);
    } catch (e) {
      if (!alive.current) return;
      const status = (e as { statusCode?: number })?.statusCode;
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('ClassAnalysis', msg, { status });
      // 404 = route not deployed yet (or nothing for this exam): keep the summary the Exams screen gave.
      if (initial && (status === 404 || status == null || status >= 500)) setMissing(true);
      else setError(msg);
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [studentId, examId, initial]);

  useEffect(() => {
    void load();
  }, [load]);

  const onShare = async () => {
    if (!data || sharing) return;
    setSharing(true);
    try {
      await shareClassAnalysisPdf(data, palette.primary);
    } catch (e) {
      log.warn('ClassAnalysis', 'PDF failed', String(e));
      showDialog({ title: 'Could not create PDF', message: e instanceof Error ? e.message : String(e), variant: 'warning' });
    } finally {
      setSharing(false);
    }
  };

  const st = data?.student;
  const ex = data?.exam;
  const cls = data?.class ?? {};
  const lvl = data?.level ?? {};
  const me = data?.child ?? {};
  const subjects = data?.subjects ?? [];
  const dist = cls.grade_distribution ?? [];
  const streams = lvl.streams ?? [];
  const distMax = Math.max(1, ...dist.map((d) => d.count));
  const isOpen = String(ex?.marking_status ?? '').toLowerCase() === 'open';
  const childName = st?.full_name?.split(' ')[0] || 'Your child';

  return (
    <ModuleScrollPage
      title="Class analysis"
      description={[st?.class_name, ex?.name].filter(Boolean).join(' · ') || undefined}
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}>
      {!data ? (
        error ? (
          <ErrorState title="Couldn’t load the class analysis" message={error} onRetry={() => void load()} />
        ) : (
          <ListSkeleton rows={3} height={120} />
        )
      ) : (
        <>
          <SurfaceCard>
            <View style={styles.headRow}>
              <View style={[styles.headIcon, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                <Ionicons name="bar-chart-outline" size={20} color={palette.primary} />
              </View>
              <View style={styles.flexText}>
                <Text style={[styles.headTitle, { color: palette.primary }]} numberOfLines={2}>
                  {st?.class_name || 'Class'}
                  {lvl.name && lvl.name !== st?.class_name ? ` · ${lvl.name}` : ''}
                </Text>
                <Text style={styles.headSub} numberOfLines={2}>
                  {[ex?.name, ex?.term, ex?.academic_year].filter(Boolean).join(' · ') || 'Exam'}
                </Text>
              </View>
            </View>
            {isOpen ? (
              <View style={{ marginTop: 10 }}>
                <StatusPill label="Marking in progress — figures may change" tone="accent" />
              </View>
            ) : null}
            <Text style={styles.privacy}>Aggregates only — no other learner is named or shown.</Text>
          </SurfaceCard>

          <SectionLabel>Class</SectionLabel>
          <View style={styles.stats}>
            <StatTile label="Learners" value={cls.learners != null ? String(cls.learners) : '—'} />
            <StatTile label="Class mean" value={pct(cls.mean)} hint={cls.mean_points != null ? `${fmtNum(cls.mean_points, 2)} pts` : undefined} />
            <StatTile label="Level mean" value={pct(lvl.mean)} hint={lvl.learners ? `${lvl.learners} learners` : undefined} />
          </View>

          <SectionLabel>{childName}</SectionLabel>
          <View style={styles.stats}>
            <StatTile label="Mean" value={pct(me.mean)} hint={me.grade ?? undefined} />
            <StatTile label="Class pos." value={posText(me.position_in_class, cls.learners)} />
            <StatTile label="Level pos." value={posText(me.position_in_level, lvl.learners)} />
          </View>
          {me.mean != null && cls.mean != null ? (
            <Text style={[styles.compare, { color: me.mean >= cls.mean ? UP : DOWN }]}>
              {me.mean >= cls.mean
                ? `${fmtNum(me.mean - cls.mean)} points above the class mean`
                : `${fmtNum(cls.mean - me.mean)} points below the class mean`}
            </Text>
          ) : null}

          {loading && !subjects.length ? (
            <SurfaceCard style={{ marginTop: 10 }}>
              <View style={styles.loadingRow}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.muted}>Loading subject means…</Text>
              </View>
            </SurfaceCard>
          ) : missing && !subjects.length ? (
            <SurfaceCard style={{ marginTop: 10 }}>
              <Text style={styles.muted}>
                Subject means and the grade distribution are not available in the app yet. The class and level means
                above are up to date.
              </Text>
            </SurfaceCard>
          ) : null}

          {subjects.length ? (
            <>
              <SectionLabel>Subjects</SectionLabel>
              <SurfaceCard style={{ paddingHorizontal: 0, paddingVertical: 4 }}>
                <View style={[styles.tr, styles.th]}>
                  <Text style={[styles.thText, styles.colSubject]}>Subject</Text>
                  <Text style={[styles.thText, styles.colNum]} numberOfLines={1}>
                    {childName.length > 7 ? 'Child' : childName}
                  </Text>
                  <Text style={[styles.thText, styles.colNum]}>Class</Text>
                  <Text style={[styles.thText, styles.colDiff]}>±</Text>
                </View>
                {subjects.map((s, i) => {
                  const diff = s.my_marks != null && s.class_mean != null ? s.my_marks - s.class_mean : null;
                  return (
                    <View
                      key={`${s.subject_id ?? s.subject}-${i}`}
                      style={[styles.tr, i % 2 === 1 && { backgroundColor: rgba(palette.primary, 0.03) }]}>
                      <View style={styles.colSubject}>
                        <Text style={styles.subject} numberOfLines={3}>
                          {s.subject}
                        </Text>
                        {s.level_mean != null ? (
                          <Text style={styles.subHint} numberOfLines={1}>
                            Level {fmtNum(s.level_mean)}
                            {s.max_marks ? ` / ${fmtNum(s.max_marks, 0)}` : ''}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.colNumBox}>
                        <Text style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>
                          {s.my_marks != null ? fmtNum(s.my_marks, Number.isInteger(s.my_marks) ? 0 : 1) : '—'}
                        </Text>
                        {s.my_grade ? (
                          <Text style={[styles.grade, { color: palette.primary }]} numberOfLines={1}>
                            {s.my_grade}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.cell, styles.colNum]} numberOfLines={1} adjustsFontSizeToFit>
                        {s.class_mean != null ? fmtNum(s.class_mean) : '—'}
                      </Text>
                      <Text
                        style={[styles.cell, styles.colDiff, { fontWeight: '800', color: diff == null ? MUTED_INK : diff >= 0 ? UP : DOWN }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit>
                        {diff == null ? '—' : `${diff >= 0 ? '+' : ''}${fmtNum(diff)}`}
                      </Text>
                    </View>
                  );
                })}
              </SurfaceCard>
            </>
          ) : null}

          {dist.length ? (
            <>
              <SectionLabel>Grade distribution</SectionLabel>
              <SurfaceCard>
                {dist.map((d) => {
                  const mine = me.grade && d.grade === me.grade;
                  return (
                    <View key={d.grade} style={styles.distRow}>
                      <Text style={[styles.distGrade, mine && { color: palette.primary }]} numberOfLines={1}>
                        {d.grade}
                      </Text>
                      <View style={[styles.distTrack, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                        <View
                          style={[
                            styles.distFill,
                            { width: `${Math.max(4, Math.round((d.count / distMax) * 100))}%`, backgroundColor: palette.primary },
                            !mine && { opacity: 0.55 },
                          ]}
                        />
                      </View>
                      <Text style={styles.distCount} numberOfLines={1}>
                        {d.count}
                      </Text>
                    </View>
                  );
                })}
                {me.grade ? <Text style={[styles.muted, { marginTop: 6 }]}>Darker bar: {childName}’s grade ({me.grade}).</Text> : null}
              </SurfaceCard>
            </>
          ) : null}

          {streams.length > 1 ? (
            <>
              <SectionLabel>{lvl.name ? `Classes in ${lvl.name}` : 'Classes in the level'}</SectionLabel>
              <SurfaceCard style={{ paddingVertical: 4 }}>
                {streams.map((s, i) => (
                  <View key={s.class_id ?? i} style={[styles.streamRow, i > 0 && styles.streamBorder]}>
                    <Text style={[styles.streamName, s.is_my_class && { color: palette.primary }]} numberOfLines={2}>
                      {s.class_name || 'Class'}
                      {s.is_my_class ? '  ·  yours' : ''}
                    </Text>
                    <Text style={styles.streamMeta} numberOfLines={1}>
                      {s.learners ?? '—'} · {pct(s.mean)}
                    </Text>
                  </View>
                ))}
              </SurfaceCard>
            </>
          ) : null}

          <Pressable
            onPress={() => void onShare()}
            disabled={sharing}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: palette.primary }, (pressed || sharing) && { opacity: 0.85 }]}>
            {sharing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText} numberOfLines={1}>
                  Download PDF / Share
                </Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </ModuleScrollPage>
  );
}

function stripNulls<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v != null && v !== '') (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flexText: { flex: 1, minWidth: 0 },
  headTitle: { fontSize: 17, fontWeight: '800' },
  headSub: { marginTop: 2, fontSize: 12.5, color: MUTED_INK },
  privacy: { marginTop: 10, fontSize: 11.5, color: MUTED_INK },
  stats: { flexDirection: 'row', gap: 8 },
  compare: { marginTop: 8, fontSize: 12.5, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muted: { fontSize: 12.5, color: MUTED_INK, flexShrink: 1 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9 },
  th: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DAD5' },
  thText: { fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, color: MUTED_INK },
  colSubject: { flex: 1, minWidth: 0, paddingRight: 6 },
  colNum: { width: 54, textAlign: 'center' },
  colNumBox: { width: 54, alignItems: 'center' },
  colDiff: { width: 48, textAlign: 'right' },
  subject: { fontSize: 13.5, fontWeight: '700', color: INK },
  subHint: { marginTop: 2, fontSize: 11, color: MUTED_INK },
  cell: { fontSize: 13.5, color: INK, textAlign: 'center' },
  grade: { fontSize: 11.5, fontWeight: '800' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  distGrade: { width: 40, fontSize: 13.5, fontWeight: '800', color: INK },
  distTrack: { flex: 1, minWidth: 0, height: 10, borderRadius: 5, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 5 },
  distCount: { width: 34, textAlign: 'right', fontSize: 13, fontWeight: '700', color: INK },
  streamRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  streamBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E5E0' },
  streamName: { flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: '700', color: INK },
  streamMeta: { flexShrink: 0, fontSize: 12.5, color: MUTED_INK },
  primaryBtn: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, flexShrink: 1 },
});
