import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { deskFetch } from '../../lib/deskApi';
import { seedParentDemoData } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

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
  }>;
};

function unwrapList(data: unknown): Incident[] {
  if (Array.isArray(data)) return data as Incident[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.incidents)) return obj.incidents as Incident[];
    if (Array.isArray(obj.items)) return obj.items as Incident[];
    if (Array.isArray(obj.data)) return obj.data as Incident[];
  }
  return [];
}

function asTextList(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
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

export function DisciplineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudent, selectedStudentId } = useDeskAuth();
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [analyzingCase, setAnalyzingCase] = useState<string | null>(null);
  const [analyzingStudent, setAnalyzingStudent] = useState<string | null>(null);
  const [analysisByKey, setAnalysisByKey] = useState<Record<string, string>>({});
  const [analysisError, setAnalysisError] = useState<Record<string, string>>({});

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = await deskFetch<unknown>('/discipline/incidents');
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
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (!selectedStudentId) return list;
    return list.filter((inc) =>
      (inc.students ?? []).some((s) => String(s.student_id ?? '') === selectedStudentId),
    );
  }, [items, selectedStudentId]);

  const seed = async () => {
    setSeeding(true);
    try {
      await seedParentDemoData();
      await load(true);
    } catch (e) {
      log.warn('Discipline', 'seed failed', String(e));
    } finally {
      setSeeding(false);
    }
  };

  const runCaseAnalyze = async (item: Incident) => {
    const caseNo = String(item.case_number ?? '').trim();
    if (!caseNo) {
      setAnalysisError((prev) => ({
        ...prev,
        [`case-${item.id}`]: 'Case number missing — cannot analyze.',
      }));
      return;
    }
    const key = `case-${caseNo}`;
    setAnalyzingCase(key);
    setAnalysisError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const res = await deskFetch<unknown>(
        `/discipline/cases/${encodeURIComponent(caseNo)}/analyze?use_ai=true`,
        { method: 'POST' },
      );
      setAnalysisByKey((prev) => ({ ...prev, [key]: extractAnalysisText(res) }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAnalysisError((prev) => ({ ...prev, [key]: msg }));
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
      const res = await deskFetch<unknown>(
        `/discipline/students/${encodeURIComponent(adm)}/analyze?use_ai=true`,
        { method: 'POST' },
      );
      setAnalysisByKey((prev) => ({ ...prev, [key]: extractAnalysisText(res) }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAnalysisError((prev) => ({ ...prev, [key]: msg }));
    } finally {
      setAnalyzingStudent(null);
    }
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
        <ModuleKicker>Discipline</ModuleKicker>
        <ModuleScreenHeader
          title={selectedStudent?.name ? `${selectedStudent.name}'s cases` : "Your children's cases"}
          description="Conduct records for the selected student."
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty
            title="Couldn't load discipline"
            body={
              /session expired|401|unauthorized/i.test(error)
                ? "School API session isn't accepted yet for this account. Stay here — Chat still works. Pull to retry."
                : error
            }
            onRetry={() => void load()}
          />
        ) : visible.length === 0 ? (
          <ModuleEmpty
            title="No cases on record"
            body="When the school logs a discipline incident for your child, it will show up here."
            onRetry={seeding ? undefined : () => void seed()}
          />
        ) : (
          visible.map((item, index) => {
            const key = String(item.id ?? item.case_number ?? index);
            const open = expanded === key;
            const caseNo = String(item.case_number ?? '').trim();
            const caseAnalysisKey = caseNo ? `case-${caseNo}` : '';
            const students = Array.isArray(item.students) ? item.students : [];
            const steps = asTextList(item.steps_taken);
            const recs = asTextList(item.recommendations);
            const narrative = String(
              item.case_narrative ?? item.description ?? item.case_summary ?? '',
            ).trim();

            return (
              <Pressable key={key} onPress={() => setExpanded(open ? null : key)}>
                <ModuleGlassCard>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={Colors.destructive} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={open ? 6 : 2}>
                        {item.title ||
                          item.case_summary ||
                          item.case_number ||
                          item.category_label ||
                          'Incident'}
                      </Text>
                      <Text style={styles.meta} numberOfLines={open ? 4 : 1}>
                        {[item.status, item.severity, item.category_label || item.category_name]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.mutedForeground}
                    />
                  </View>

                  {open ? (
                    <View style={styles.detail}>
                      {caseNo ? (
                        <Text style={styles.detailLine}>
                          <Text style={styles.detailLabel}>Case # </Text>
                          {caseNo}
                        </Text>
                      ) : null}
                      {(item.incident_date || item.created_at) ? (
                        <Text style={styles.detailLine}>
                          <Text style={styles.detailLabel}>Date </Text>
                          {String(item.incident_date ?? item.created_at ?? '').slice(0, 10)}
                        </Text>
                      ) : null}
                      {item.sentiment ? (
                        <Text style={styles.detailLine}>
                          <Text style={styles.detailLabel}>Sentiment </Text>
                          {item.sentiment}
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
                      {students.length ? (
                        <>
                          <Text style={styles.detailLabel}>Students involved</Text>
                          {students.map((s, i) => {
                            const adm = String(s.admission_number ?? '').trim();
                            const name = s.full_name || s.student_name || adm || 'Student';
                            const sk = adm ? `student-${adm}` : '';
                            return (
                              <View key={`${key}-stu-${i}`} style={styles.studentRow}>
                                <Text style={styles.studentName}>{name}</Text>
                                {adm ? (
                                  <Pressable
                                    style={styles.aiBtn}
                                    disabled={analyzingStudent === sk}
                                    onPress={(e) => {
                                      e.stopPropagation?.();
                                      void runStudentAnalyze(adm);
                                    }}>
                                    {analyzingStudent === sk ? (
                                      <ActivityIndicator size="small" color={Colors.brandGreenDark} />
                                    ) : (
                                      <>
                                        <Ionicons name="sparkles-outline" size={14} color={Colors.brandGreenDark} />
                                        <Text style={styles.aiBtnText}>AI student insight</Text>
                                      </>
                                    )}
                                  </Pressable>
                                ) : null}
                                {sk && analysisByKey[sk] ? (
                                  <Text style={styles.analysis}>{analysisByKey[sk]}</Text>
                                ) : null}
                                {sk && analysisError[sk] ? (
                                  <Text style={styles.analysisErr}>{analysisError[sk]}</Text>
                                ) : null}
                              </View>
                            );
                          })}
                        </>
                      ) : null}

                      {caseNo ? (
                        <Pressable
                          style={styles.aiBtnPrimary}
                          disabled={analyzingCase === caseAnalysisKey}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            void runCaseAnalyze(item);
                          }}>
                          {analyzingCase === caseAnalysisKey ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={16} color={Colors.white} />
                              <Text style={styles.aiBtnPrimaryText}>AI case analysis</Text>
                            </>
                          )}
                        </Pressable>
                      ) : null}
                      {caseAnalysisKey && analysisByKey[caseAnalysisKey] ? (
                        <Text style={styles.analysis}>{analysisByKey[caseAnalysisKey]}</Text>
                      ) : null}
                      {caseAnalysisKey && analysisError[caseAnalysisKey] ? (
                        <Text style={styles.analysisErr}>{analysisError[caseAnalysisKey]}</Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.tapHint}>Tap for full case detail</Text>
                  )}
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
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 14,
  },
  loader: { paddingVertical: 40, alignItems: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
  tapHint: { marginTop: 8, fontSize: 12, color: Colors.mutedForeground },
  detail: { marginTop: 12, gap: 6 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  detailLine: { fontSize: 13, color: Colors.ink },
  desc: { fontSize: 14, lineHeight: 20, color: Colors.mutedForeground },
  bullet: { fontSize: 13, lineHeight: 18, color: Colors.ink, paddingLeft: 4 },
  studentRow: { gap: 6, marginTop: 4 },
  studentName: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  aiBtnText: { fontSize: 12, fontWeight: '700', color: Colors.brandGreenDark },
  aiBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenDark,
  },
  aiBtnPrimaryText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  analysis: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
    backgroundColor: 'rgba(10,61,46,0.05)',
    padding: 10,
    borderRadius: 10,
  },
  analysisErr: { marginTop: 4, fontSize: 12, color: Colors.orange },
});
