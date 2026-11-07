/**
 * Parent → one child's report form for one exam, drawn natively (owner, 2026-11-08: the web print page took
 * far too long). Shows the summary the Exams screen already has at once, then fills in the subject table from
 * GET /parents/me/report-form (one small request). "Download PDF / Share" builds the PDF on the phone
 * (expo-print + expo-sharing). If the API does not have the route yet (404) the summary stays, with the
 * "Full school layout" link to the web print page as the fallback.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { fetchParentReportForm, type ParentReportForm } from '../../lib/parentPortalApi';
import { positionText, shareReportFormPdf } from '../../lib/reportFormPdf';
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

type Props = NativeStackScreenProps<DashboardStackParamList, 'ParentReportForm'>;

export function ParentReportFormScreen({ navigation, route }: Props) {
  const { studentId, examId, initial, webPath } = route.params;
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const [form, setForm] = useState<ParentReportForm | null>(initial ?? null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsMissing, setSubjectsMissing] = useState(false);
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
    setLoadingSubjects(true);
    setError(null);
    const t0 = Date.now();
    try {
      const data = await fetchParentReportForm(studentId, examId);
      if (!alive.current) return;
      log.info('ReportForm', 'loaded', { ms: Date.now() - t0, subjects: data?.subjects?.length ?? 0 });
      // Keep what the Exams screen already knew where the API has nothing (e.g. school name).
      setForm((prev) => ({
        school: { ...(prev?.school ?? {}), ...stripNulls(data?.school ?? {}) },
        student: { ...(prev?.student ?? { id: studentId }), ...stripNulls(data?.student ?? {}) } as ParentReportForm['student'],
        exam: (data?.exam ?? prev?.exam ?? null) as ParentReportForm['exam'],
        summary: { ...(prev?.summary ?? {}), ...stripNulls(data?.summary ?? {}) },
        subjects: data?.subjects ?? [],
      }));
      setSubjectsMissing(false);
    } catch (e) {
      if (!alive.current) return;
      const status = (e as { statusCode?: number })?.statusCode;
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('ReportForm', msg, { status });
      if (status === 404 && initial) {
        // Route not deployed yet: the summary-only report stays, plus the web layout link.
        setSubjectsMissing(true);
      } else if (!initial) {
        setError(msg);
      } else {
        setSubjectsMissing(true);
      }
    } finally {
      if (alive.current) {
        setLoadingSubjects(false);
        setRefreshing(false);
      }
    }
  }, [studentId, examId, initial]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWebLayout = () => {
    if (!webPath) return;
    navigation.navigate('DeskModule', {
      title: 'Report form',
      deskPath: webPath,
      description: 'The school’s full report layout.',
    });
  };

  const onShare = async () => {
    if (!form || sharing) return;
    setSharing(true);
    try {
      await shareReportFormPdf(form, palette.primary);
    } catch (e) {
      log.warn('ReportForm', 'PDF failed', String(e));
      showDialog({ title: 'Could not create PDF', message: e instanceof Error ? e.message : String(e), variant: 'warning' });
    } finally {
      setSharing(false);
    }
  };

  const school = form?.school ?? {};
  const st = form?.student;
  const ex = form?.exam;
  const sm = form?.summary ?? {};
  const subjects = form?.subjects ?? [];
  const isOpen = String(ex?.marking_status ?? '').toLowerCase() === 'open';

  return (
    <ModuleScrollPage
      title="Report form"
      description={st?.full_name ? `${st.full_name}${ex?.name ? ` · ${ex.name}` : ''}` : undefined}
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}>
      {!form ? (
        error ? (
          <ErrorState title="Couldn’t load the report form" message={error} onRetry={() => void load()} />
        ) : (
          <ListSkeleton rows={3} height={120} />
        )
      ) : (
        <>
          <SurfaceCard>
            <View style={styles.schoolRow}>
              {school.logo_url ? (
                <Image source={{ uri: school.logo_url }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={[styles.logo, styles.logoFallback, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                  <Ionicons name="school-outline" size={22} color={palette.primary} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.schoolName, { color: palette.primary }]} numberOfLines={2}>
                  {school.name || 'School report'}
                </Text>
                <Text style={styles.formTitle}>Learner report form</Text>
              </View>
            </View>
            <View style={[styles.rule, { backgroundColor: palette.primary }]} />
            <View style={styles.metaGrid}>
              <Meta label="Learner" value={st?.full_name} wide />
              <Meta label="Adm. no." value={st?.admission_number} />
              <Meta label="Class" value={st?.class_name} />
              <Meta label="Exam" value={ex?.name} wide />
              <Meta label="Term" value={ex?.term} />
              <Meta label="Year" value={ex?.academic_year} />
            </View>
            {isOpen ? (
              <View style={{ marginTop: 8 }}>
                <StatusPill label="Marking in progress — marks may change" tone="accent" />
              </View>
            ) : null}
          </SurfaceCard>

          <SectionLabel>Subjects</SectionLabel>
          <SurfaceCard style={{ paddingHorizontal: 0, paddingVertical: 4 }}>
            {loadingSubjects && !subjects.length ? (
              <View style={styles.subjectsLoading}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.muted}>Loading subject marks…</Text>
              </View>
            ) : subjects.length ? (
              <>
                <View style={[styles.tr, styles.th]}>
                  <Text style={[styles.thText, styles.colSubject]}>Subject</Text>
                  <Text style={[styles.thText, styles.colNum]}>Marks</Text>
                  <Text style={[styles.thText, styles.colNum]}>Grade</Text>
                  <Text style={[styles.thText, styles.colNum]}>Pts</Text>
                </View>
                {subjects.map((s, i) => (
                  <View
                    key={`${s.subject_id ?? s.subject}-${i}`}
                    style={[styles.tr, i % 2 === 1 && { backgroundColor: rgba(palette.primary, 0.03) }]}>
                    <View style={styles.colSubject}>
                      <Text style={styles.subject} numberOfLines={2}>
                        {s.subject}
                      </Text>
                      {s.remark ? <Text style={styles.remark}>{s.remark}</Text> : null}
                    </View>
                    <Text style={[styles.cell, styles.colNum]}>
                      {s.marks != null ? fmtNum(s.marks, Number.isInteger(s.marks) ? 0 : 1) : '—'}
                      {s.max_marks ? <Text style={styles.muted}>/{fmtNum(s.max_marks, 0)}</Text> : null}
                    </Text>
                    <Text style={[styles.cell, styles.colNum, { fontWeight: '800', color: palette.primary }]}>{s.grade || '—'}</Text>
                    <Text style={[styles.cell, styles.colNum]}>{s.points != null ? fmtNum(s.points, 0) : '—'}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.muted, { padding: 14 }]}>
                {subjectsMissing
                  ? 'Subject marks are not available in the app yet. Open the full school layout below for the subject table.'
                  : isOpen
                    ? 'No subject marks entered yet — marking is still in progress.'
                    : 'No subject marks for this exam.'}
              </Text>
            )}
          </SurfaceCard>

          <SectionLabel>Summary</SectionLabel>
          <View style={styles.stats}>
            <StatTile
              label="Total"
              value={sm.total_marks != null ? fmtNum(sm.total_marks, 0) : '—'}
              hint={sm.total_possible ? `of ${fmtNum(sm.total_possible, 0)}` : sm.subject_count != null ? `${sm.subject_count} subjects` : undefined}
            />
            <StatTile label="Mean" value={sm.overall_mean != null ? `${fmtNum(sm.overall_mean)}%` : '—'} />
            <StatTile label="Mean grade" value={sm.overall_grade || '—'} hint={sm.mean_grade_points != null ? `${fmtNum(sm.mean_grade_points, 2)} pts` : undefined} />
          </View>
          <View style={[styles.stats, { marginTop: 8 }]}>
            <StatTile label="Class position" value={positionText(sm.rank_in_class, sm.rank_out_of_class)} />
            <StatTile label="Level position" value={positionText(sm.rank_in_level, sm.rank_out_of_level)} />
          </View>
          <View style={[styles.stats, { marginTop: 8 }]}>
            <StatTile label="Class mean" value={sm.class_mean_marks != null ? `${fmtNum(sm.class_mean_marks)}%` : '—'} />
            <StatTile label="Level mean" value={sm.level_mean_marks != null ? `${fmtNum(sm.level_mean_marks)}%` : '—'} />
          </View>

          {sm.class_teacher_comment || sm.principal_comment ? (
            <SurfaceCard style={{ marginTop: 10 }}>
              {sm.class_teacher_comment ? (
                <View>
                  <Text style={[styles.commentLabel, { color: palette.primary }]}>Class teacher</Text>
                  <Text style={styles.comment}>{sm.class_teacher_comment}</Text>
                </View>
              ) : null}
              {sm.principal_comment ? (
                <View style={sm.class_teacher_comment ? { marginTop: 10 } : undefined}>
                  <Text style={[styles.commentLabel, { color: palette.primary }]}>Principal</Text>
                  <Text style={styles.comment}>{sm.principal_comment}</Text>
                </View>
              ) : null}
            </SurfaceCard>
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
                <Text style={styles.primaryText}>Download PDF / Share</Text>
              </>
            )}
          </Pressable>
          {webPath ? (
            <Pressable onPress={openWebLayout} accessibilityRole="link" style={styles.linkBtn}>
              <Ionicons name="open-outline" size={14} color={palette.primary} />
              <Text style={[styles.linkText, { color: palette.primary }]}>Full school layout</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </ModuleScrollPage>
  );
}

function Meta({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <View style={[styles.meta, wide && styles.metaWide]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
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
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12 },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  schoolName: { fontSize: 17, fontWeight: '800' },
  formTitle: { marginTop: 2, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: MUTED_INK },
  rule: { height: 2, borderRadius: 1, marginVertical: 12, opacity: 0.8 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  meta: { width: '50%', paddingRight: 8 },
  metaWide: { width: '100%' },
  metaLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, color: MUTED_INK },
  metaValue: { marginTop: 2, fontSize: 14, fontWeight: '700', color: INK },
  subjectsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9 },
  th: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DAD5' },
  thText: { fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, color: MUTED_INK },
  colSubject: { flex: 1, minWidth: 0, paddingRight: 8 },
  colNum: { width: 58, textAlign: 'center' },
  subject: { fontSize: 13.5, fontWeight: '700', color: INK },
  remark: { marginTop: 2, fontSize: 11.5, color: MUTED_INK, fontStyle: 'italic' },
  cell: { fontSize: 13.5, color: INK },
  muted: { fontSize: 12.5, color: MUTED_INK },
  stats: { flexDirection: 'row', gap: 8 },
  commentLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  comment: { marginTop: 3, fontSize: 13.5, lineHeight: 19, color: INK },
  primaryBtn: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  linkText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
