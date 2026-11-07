/**
 * Discipline — conduct records.
 * - student: own cases (GET /discipline/incidents answers only theirs).
 * - parent: cases for the selected child.
 * - teacher: cases they recorded (scope=mine); office (school_admin): the school's cases.
 * Staff can record a case and ask for an AI analysis; families only read.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { deskFetch } from '../../lib/deskApi';
import { fetchTeacherDisciplineIncidents } from '../../lib/teacherPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { INK, rgba } from '../../components/theme/ThemedPage';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleScrollPage,
  ShowMoreButton,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtDay,
  useClientPager,
  type PillTone,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Discipline'>;

type Incident = {
  id?: string;
  case_number?: string;
  title?: string;
  description?: string;
  case_narrative?: string;
  case_summary?: string;
  status?: string;
  severity?: string;
  sentiment?: string;
  incident_date?: string;
  created_at?: string;
  category_name?: string;
  category_label?: string;
  steps_taken?: string | string[] | null;
  recommendations?: string | string[] | null;
  analysis_report_md?: string | null;
  students?: Array<{
    full_name?: string;
    admission_number?: string;
    student_id?: string;
    student_name?: string;
    class_label?: string;
  }>;
};

type Filter = 'all' | 'concern' | 'positive';

function unwrapList(data: unknown): Incident[] {
  if (Array.isArray(data)) return data as Incident[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of ['incidents', 'items', 'data']) {
      if (Array.isArray(obj[k])) return (obj[k] as unknown[]).filter((x) => x && typeof x === 'object') as Incident[];
    }
  }
  return [];
}

function asTextList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? '')).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? '')).filter(Boolean);
  } catch {
    /* plain text */
  }
  return [s];
}

function extractAnalysisText(res: unknown): string {
  if (!res || typeof res !== 'object') return 'Analysis complete.';
  const obj = res as Record<string, unknown>;
  const data = obj.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const md = d.analysis_report_md ?? d.report_md ?? d.narrative;
    if (typeof md === 'string' && md.trim()) return md.trim();
  }
  const msg = obj.message ?? obj.analysis_report_md;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return 'Analysis complete — pull to refresh for updated case details.';
}

function isPositive(i: Incident): boolean {
  const s = `${i.sentiment ?? ''} ${i.category_label ?? i.category_name ?? ''} ${i.case_number ?? ''}`.toLowerCase();
  return /positive|commend|merit|award|praise/.test(s) || /-c-\d/.test(s);
}

function severityTone(sev?: string): PillTone {
  const s = String(sev ?? '').toLowerCase();
  if (s === 'high' || s === 'critical' || s === 'severe') return 'danger';
  if (s === 'medium' || s === 'moderate') return 'warning';
  return 'neutral';
}

function cap(s?: string | null): string {
  const v = String(s ?? '').trim().replace(/_/g, ' ');
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
}

export function DisciplineScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const { selectedStudent, selectedStudentId, persona, deskUser } = useDeskAuth();
  const isStudent = persona === 'student';
  const selfStudentId = isStudent
    ? String(selectedStudentId ?? deskUser?.id ?? deskUser?.user_id ?? '').trim()
    : selectedStudentId;
  const isStaff = persona === 'teacher' || persona === 'school_admin' || persona === 'super_admin';
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [analyzingCase, setAnalyzingCase] = useState<string | null>(null);
  const [analyzingStudent, setAnalyzingStudent] = useState<string | null>(null);
  const [analysisByKey, setAnalysisByKey] = useState<Record<string, string>>({});
  const [analysisError, setAnalysisError] = useState<Record<string, string>>({});

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data =
          persona === 'teacher'
            ? await fetchTeacherDisciplineIncidents()
            : await deskFetch<unknown>('/discipline/incidents');
        setItems(unwrapList(data));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Discipline', msg);
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [persona],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Staff lists carry no students; families' lists do — keep only the selected learner's cases.
  const scoped = useMemo(() => {
    if (!selfStudentId || isStaff) return items;
    return items.filter((inc) => {
      const studs = Array.isArray(inc.students) ? inc.students : [];
      return studs.length === 0 || studs.some((s) => String(s?.student_id ?? '') === selfStudentId);
    });
  }, [items, selfStudentId, isStaff]);

  const counts = useMemo(() => {
    const pos = scoped.filter(isPositive).length;
    return { all: scoped.length, positive: pos, concern: scoped.length - pos };
  }, [scoped]);

  const filtered = useMemo(() => {
    if (filter === 'positive') return scoped.filter(isPositive);
    if (filter === 'concern') return scoped.filter((i) => !isPositive(i));
    return scoped;
  }, [scoped, filter]);

  const pager = useClientPager(filtered, 15, `${filter}-${selfStudentId}`);

  const runCaseAnalyze = async (item: Incident) => {
    const caseNo = String(item.case_number ?? '').trim();
    if (!caseNo) return;
    const key = `case-${caseNo}`;
    setAnalyzingCase(key);
    setAnalysisError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const res = await deskFetch<unknown>(`/discipline/cases/${encodeURIComponent(caseNo)}/analyze?use_ai=true`, {
        method: 'POST',
      });
      setAnalysisByKey((prev) => ({ ...prev, [key]: extractAnalysisText(res) }));
    } catch (e) {
      setAnalysisError((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setAnalyzingCase(null);
    }
  };

  const runStudentAnalyze = async (admission: string) => {
    const adm = admission.trim();
    if (!adm) return;
    const key = `student-${adm}`;
    setAnalyzingStudent(key);
    setAnalysisError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const res = await deskFetch<unknown>(`/discipline/students/${encodeURIComponent(adm)}/analyze?use_ai=true`, {
        method: 'POST',
      });
      setAnalysisByKey((prev) => ({ ...prev, [key]: extractAnalysisText(res) }));
    } catch (e) {
      setAnalysisError((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setAnalyzingStudent(null);
    }
  };

  const title = isStudent
    ? 'My conduct record'
    : !isStaff && selectedStudent?.name
      ? `${selectedStudent.name}'s conduct`
      : persona === 'teacher'
        ? 'Cases I recorded'
        : 'Discipline cases';
  const description = isStudent
    ? 'Cases and commendations the school logged for you.'
    : !isStaff
      ? 'Conduct records and commendations for your child.'
      : 'Tap a case for the full detail.';

  return (
    <ModuleScrollPage
      title={title}
      description={description}
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(true);
      }}
      headerRight={
        isStaff ? (
          <Pressable
            onPress={() => navigation.navigate('RecordDiscipline')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.recordBtn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.recordText}>Record case</Text>
          </Pressable>
        ) : undefined
      }>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState title="Couldn’t load conduct records" message={error} onRetry={() => void load()} />
      ) : scoped.length === 0 ? (
        <StateCard
          icon="shield-checkmark-outline"
          title="No cases on record"
          body={
            isStudent
              ? 'Nothing on file. Cases and commendations the school logs for you will show here.'
              : isStaff
                ? persona === 'teacher'
                  ? 'Cases you record will show here.'
                  : 'No discipline cases recorded yet.'
                : 'Nothing on file for your child. Cases and commendations will show here.'
          }
        />
      ) : (
        <>
          <ChipRow<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'concern', label: 'Cases', count: counts.concern },
              { key: 'positive', label: 'Commendations', count: counts.positive },
            ]}
          />
          {filtered.length === 0 ? (
            <StateCard icon="filter-outline" title="Nothing in this filter" body="Try another filter above." />
          ) : null}
          {pager.visible.map((item, index) => {
            const key = String(item.id ?? item.case_number ?? index);
            const open = expanded === key;
            const positive = isPositive(item);
            const caseNo = String(item.case_number ?? '').trim();
            const caseKey = caseNo ? `case-${caseNo}` : '';
            const students = Array.isArray(item.students) ? item.students : [];
            const steps = asTextList(item.steps_taken);
            const recs = asTextList(item.recommendations);
            const narrative = String(item.case_narrative ?? item.description ?? item.case_summary ?? '').trim();
            const when = item.incident_date || item.created_at;
            return (
              <SurfaceCard key={key} onPress={() => setExpanded(open ? null : key)}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: positive ? 'rgba(6,118,71,0.10)' : 'rgba(180,35,24,0.08)' },
                    ]}>
                    <Ionicons
                      name={positive ? 'ribbon-outline' : 'shield-outline'}
                      size={18}
                      color={positive ? '#067647' : '#B42318'}
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={open ? 6 : 2}>
                      {item.title || item.case_summary || item.category_label || item.case_number || 'Incident'}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[when ? fmtDay(when) : null, item.category_label || item.category_name].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={styles.pills}>
                      {positive ? <StatusPill label="Commendation" tone="success" /> : null}
                      {!positive && item.severity ? (
                        <StatusPill label={cap(item.severity)} tone={severityTone(item.severity)} />
                      ) : null}
                      {item.status ? <StatusPill label={cap(item.status)} tone="primary" /> : null}
                    </View>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED_INK} />
                </View>
                {open ? (
                  <View style={styles.detail}>
                    {caseNo ? (
                      <Text style={styles.detailLine}>
                        <Text style={styles.detailLabel}>Case # </Text>
                        {caseNo}
                      </Text>
                    ) : null}
                    {narrative ? (
                      <>
                        <Text style={styles.detailLabel}>Details</Text>
                        <Text style={styles.desc}>{narrative}</Text>
                      </>
                    ) : null}
                    {steps.length ? (
                      <>
                        <Text style={styles.detailLabel}>Steps taken</Text>
                        {steps.map((s, i) => (
                          <Text key={`${key}-step-${i}`} style={styles.bullet}>
                            • {s}
                          </Text>
                        ))}
                      </>
                    ) : null}
                    {recs.length ? (
                      <>
                        <Text style={styles.detailLabel}>Recommendations</Text>
                        {recs.map((r, i) => (
                          <Text key={`${key}-rec-${i}`} style={styles.bullet}>
                            • {r}
                          </Text>
                        ))}
                      </>
                    ) : null}
                    {students.length && (isStaff || !selfStudentId) ? (
                      <>
                        <Text style={styles.detailLabel}>Students involved</Text>
                        {students.map((s, i) => {
                          const adm = String(s?.admission_number ?? '').trim();
                          const name = s?.full_name || s?.student_name || adm || 'Student';
                          const sk = adm ? `student-${adm}` : '';
                          return (
                            <View key={`${key}-stu-${i}`} style={styles.studentRow}>
                              <Text style={styles.studentName}>
                                {name}
                                {s?.class_label ? <Text style={styles.meta}>{`  ${s.class_label}`}</Text> : null}
                              </Text>
                              {isStaff && adm ? (
                                <Pressable
                                  style={[styles.aiBtn, { borderColor: rgba(palette.primary, 0.2) }]}
                                  disabled={analyzingStudent === sk}
                                  onPress={() => void runStudentAnalyze(adm)}>
                                  {analyzingStudent === sk ? (
                                    <ActivityIndicator size="small" color={palette.primary} />
                                  ) : (
                                    <>
                                      <Ionicons name="sparkles-outline" size={14} color={palette.primary} />
                                      <Text style={[styles.aiBtnText, { color: palette.primary }]}>AI student insight</Text>
                                    </>
                                  )}
                                </Pressable>
                              ) : null}
                              {sk && analysisByKey[sk] ? <Text style={styles.analysis}>{analysisByKey[sk]}</Text> : null}
                              {sk && analysisError[sk] ? <Text style={styles.analysisErr}>{analysisError[sk]}</Text> : null}
                            </View>
                          );
                        })}
                      </>
                    ) : null}
                    {isStaff && caseNo ? (
                      <Pressable
                        style={[styles.aiBtnPrimary, { backgroundColor: palette.primary }]}
                        disabled={analyzingCase === caseKey}
                        onPress={() => void runCaseAnalyze(item)}>
                        {analyzingCase === caseKey ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={16} color={palette.secondary} />
                            <Text style={styles.aiBtnPrimaryText}>AI case analysis</Text>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                    {caseKey && analysisByKey[caseKey] ? <Text style={styles.analysis}>{analysisByKey[caseKey]}</Text> : null}
                    {caseKey && analysisError[caseKey] ? (
                      <Text style={styles.analysisErr}>{analysisError[caseKey]}</Text>
                    ) : null}
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
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: INK },
  meta: { marginTop: 3, fontSize: 12, color: MUTED_INK },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  detail: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', gap: 4 },
  detailLine: { fontSize: 13, color: INK },
  detailLabel: { marginTop: 6, fontSize: 11, fontWeight: '800', color: MUTED_INK, textTransform: 'uppercase', letterSpacing: 0.4 },
  desc: { fontSize: 14, lineHeight: 20, color: INK },
  bullet: { fontSize: 13.5, lineHeight: 19, color: INK },
  studentRow: { paddingVertical: 6, gap: 6 },
  studentName: { fontSize: 14, fontWeight: '700', color: INK },
  aiBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 32,
  },
  aiBtnText: { fontSize: 12, fontWeight: '700' },
  aiBtnPrimary: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  aiBtnPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  analysis: { marginTop: 6, fontSize: 13, lineHeight: 19, color: INK, backgroundColor: 'rgba(0,0,0,0.03)', padding: 10, borderRadius: 10 },
  analysisErr: { marginTop: 6, fontSize: 12.5, color: '#B42318' },
});
