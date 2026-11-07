/**
 * One discipline case.
 * - Families (parent, student) see the row from the list (it already carries the learner links).
 * - Staff re-read GET /discipline/incidents/:id for learners and attachments; staff can run the AI
 *   case analysis and open a learner's history.
 * - Office roles (server: PATCH / DELETE are theirs only) can edit, resolve, close, reopen or delete.
 */
import React, { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleScrollPage,
  SectionLabel,
  StatusPill,
  SurfaceCard,
  fmtDay,
  friendlyError,
} from '../../components/ui/ModuleKit';
import { PrimaryButton, ReportText } from '../../components/discipline/DisciplineParts';
import {
  analyzeDisciplineCase,
  asTextList,
  cap,
  deleteDisciplineIncident,
  getDisciplineIncident,
  incidentTitle,
  incidentWhen,
  isClosedStatus,
  isCommendation,
  isDisciplineOffice,
  severityTone,
  statusTone,
  studentName,
  updateDisciplineIncident,
  type DisciplineIncident,
} from '../../lib/disciplineApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'DisciplineDetail'>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function DisciplineDetailScreen({ navigation, route }: Props) {
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const { persona, activeRoles } = useDeskAuth();
  const isStaff = persona === 'teacher' || persona === 'school_admin' || persona === 'super_admin';
  const office = isStaff && isDisciplineOffice(activeRoles, persona);
  const id = route.params?.id ?? route.params?.incident?.id;

  const [row, setRow] = useState<DisciplineIncident | null>(route.params?.incident ?? null);
  const [loading, setLoading] = useState(!route.params?.incident && !!id);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    // Families already have the full row from their list (and the detail route is staff/parent only).
    if (!id || (!isStaff && route.params?.incident)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const full = await getDisciplineIncident(id);
      setRow((prev) => ({ ...(prev ?? {}), ...full }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, isStaff, route.params?.incident]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const setStatus = async (status: string, label: string) => {
    if (!id) return;
    setBusy(status);
    try {
      const next = await updateDisciplineIncident(id, { status });
      setRow((prev) => ({ ...(prev ?? {}), ...next, status: next.status ?? status }));
      showDialog({ title: label, message: `Case ${row?.case_number ?? ''} is now ${cap(status).toLowerCase()}.`, variant: 'success' });
    } catch (e) {
      showDialog({ title: 'Could not update the case', message: friendlyError(e instanceof Error ? e.message : String(e)), variant: 'warning' });
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () => {
    if (!id) return;
    showDialog({
      title: 'Delete this case?',
      message: `Case ${row?.case_number ?? ''} and its learner links will be removed for good. Learners' ratings are not recalculated.`,
      variant: 'danger',
      icon: 'trash-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy('delete');
              try {
                await deleteDisciplineIncident(id);
                navigation.goBack();
              } catch (e) {
                showDialog({ title: 'Could not delete', message: friendlyError(e instanceof Error ? e.message : String(e)), variant: 'warning' });
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    });
  };

  const runAnalysis = async () => {
    const caseNo = String(row?.case_number ?? '').trim();
    if (!caseNo) return;
    setBusy('ai');
    setAnalysisError(null);
    try {
      setAnalysis(await analyzeDisciplineCase(caseNo));
    } catch (e) {
      setAnalysisError(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
    }
  };

  const item = row;
  const positive = item ? isCommendation(item) : false;
  const when = item ? incidentWhen(item) : undefined;
  const students = Array.isArray(item?.students) ? item!.students! : [];
  const steps = asTextList(item?.steps_taken);
  const recs = asTextList(item?.recommendations);
  const narrative = String(item?.case_narrative ?? item?.description ?? '').trim();
  const closed = isClosedStatus(item?.status);
  const attachments = Array.isArray(item?.attachments) ? item!.attachments! : [];

  return (
    <ModuleScrollPage
      title={item ? incidentTitle(item) : 'Discipline case'}
      description={item?.case_number ? `Case ${item.case_number}` : undefined}
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={
        isStaff
          ? () => {
              setRefreshing(true);
              void load();
            }
          : undefined
      }>
      {loading ? (
        <ListSkeleton rows={3} height={90} />
      ) : !item ? (
        <ErrorState title="Couldn’t open this case" message={error} onRetry={() => void load()} />
      ) : (
        <View style={{ gap: 12 }}>
          <SurfaceCard>
            <View style={styles.pills}>
              {positive ? <StatusPill label="Commendation" tone="success" icon="ribbon-outline" /> : null}
              {!positive && item.severity ? (
                <StatusPill label={`${cap(item.severity)} severity`} tone={severityTone(item.severity)} />
              ) : null}
              {item.status ? <StatusPill label={cap(item.status)} tone={statusTone(item.status)} /> : null}
            </View>
            <InfoRow label="Date" value={when ? fmtDay(when, { weekday: true, year: true }) : null} />
            <InfoRow label="Category" value={item.category_label || item.category_name || null} />
            <InfoRow label="Case number" value={item.case_number || null} />
            {isStaff ? (
              <InfoRow
                label="Parent notified"
                value={
                  item.parent_notified_at
                    ? fmtDay(item.parent_notified_at, { year: true })
                    : item.notify_parent === false || item.notify_parent === 0
                      ? 'Not requested'
                      : 'Requested'
                }
              />
            ) : null}
            {item.recorded_by_name ? <InfoRow label="Recorded by" value={item.recorded_by_name} /> : null}
            {item.updated_at && item.updated_at !== item.created_at ? (
              <InfoRow label="Last updated" value={fmtDay(item.updated_at, { year: true })} />
            ) : null}
          </SurfaceCard>

          {error && isStaff ? <Text style={styles.warn}>{friendlyError(error)}</Text> : null}

          {narrative ? (
            <>
              <SectionLabel>What happened</SectionLabel>
              <SurfaceCard>
                <Text style={styles.body}>{narrative}</Text>
              </SurfaceCard>
            </>
          ) : null}

          {steps.length ? (
            <>
              <SectionLabel>Action taken</SectionLabel>
              <SurfaceCard>
                {steps.map((s, i) => (
                  <Text key={`step-${i}`} style={styles.bullet}>
                    •  {s}
                  </Text>
                ))}
              </SurfaceCard>
            </>
          ) : null}

          {recs.length ? (
            <>
              <SectionLabel>Recommendations</SectionLabel>
              <SurfaceCard>
                {recs.map((r, i) => (
                  <Text key={`rec-${i}`} style={styles.bullet}>
                    •  {r}
                  </Text>
                ))}
              </SurfaceCard>
            </>
          ) : null}

          {students.length ? (
            <>
              <SectionLabel>{students.length === 1 ? 'Learner' : `Learners (${students.length})`}</SectionLabel>
              {students.map((s, i) => {
                const adm = String(s.admission_number ?? '').trim();
                const delta = Number(s.points_delta);
                const content = (
                  <View style={styles.studentRow}>
                    <View style={[styles.avatar, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                      <Ionicons name="person-outline" size={16} color={palette.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {studentName(s)}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {[adm ? `Adm ${adm}` : null, s.class_label].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    {Number.isFinite(delta) && delta !== 0 ? (
                      <StatusPill label={`${delta > 0 ? '+' : ''}${delta} pts`} tone={delta > 0 ? 'success' : 'danger'} />
                    ) : null}
                    {isStaff && adm ? <Ionicons name="chevron-forward" size={16} color={MUTED_INK} /> : null}
                  </View>
                );
                return isStaff && adm ? (
                  <SurfaceCard
                    key={`stu-${i}`}
                    accessibilityLabel={`Open ${studentName(s)}'s conduct history`}
                    onPress={() => navigation.navigate('DisciplineStudent', { admissionNumber: adm, name: studentName(s) })}>
                    {content}
                  </SurfaceCard>
                ) : (
                  <SurfaceCard key={`stu-${i}`}>{content}</SurfaceCard>
                );
              })}
            </>
          ) : null}

          {attachments.length ? (
            <>
              <SectionLabel>Attachments</SectionLabel>
              <SurfaceCard>
                {attachments.map((a, i) => (
                  <Pressable
                    key={a.id ?? `att-${i}`}
                    onPress={() => a.file_url && void Linking.openURL(a.file_url)}
                    accessibilityRole="link"
                    style={styles.attachRow}>
                    <Ionicons name="attach" size={16} color={palette.primary} />
                    <Text style={[styles.attachText, { color: palette.primary }]} numberOfLines={1}>
                      {a.file_name || a.attachment_type || 'Attachment'}
                    </Text>
                  </Pressable>
                ))}
              </SurfaceCard>
            </>
          ) : null}

          {!isStaff ? (
            <Text style={styles.note}>
              Questions about this record? Talk to the class teacher or the school office.
            </Text>
          ) : null}

          {isStaff && item.analysis_report_md ? (
            <SurfaceCard onPress={() => setShowReport((v) => !v)} accessibilityLabel="Show the case report">
              <View style={styles.reportHead}>
                <Ionicons name="document-text-outline" size={18} color={palette.primary} />
                <Text style={styles.reportTitle}>Case report</Text>
                <Ionicons name={showReport ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED_INK} />
              </View>
              {showReport ? (
                <View style={{ marginTop: 10 }}>
                  <ReportText text={item.analysis_report_md} />
                </View>
              ) : null}
            </SurfaceCard>
          ) : null}

          {isStaff && item.case_number ? (
            <View style={{ gap: 8 }}>
              <PrimaryButton
                label="AI case analysis"
                icon="sparkles"
                busy={busy === 'ai'}
                disabled={!!busy && busy !== 'ai'}
                onPress={() => void runAnalysis()}
              />
              {analysisError ? <Text style={styles.warn}>{analysisError}</Text> : null}
              {analysis ? (
                <SurfaceCard>
                  <ReportText text={analysis} />
                </SurfaceCard>
              ) : null}
            </View>
          ) : null}

          {office && id ? (
            <>
              <SectionLabel>Manage case</SectionLabel>
              <View style={styles.actions}>
                <View style={styles.actionCell}>
                  <PrimaryButton
                    label="Edit"
                    icon="create-outline"
                    tone="outline"
                    disabled={!!busy}
                    onPress={() => navigation.navigate('EditDisciplineIncident', { incident: item })}
                  />
                </View>
                {closed ? (
                  <View style={styles.actionCell}>
                    <PrimaryButton
                      label="Reopen"
                      icon="refresh"
                      tone="outline"
                      busy={busy === 'under_review'}
                      disabled={!!busy}
                      onPress={() => void setStatus('under_review', 'Case reopened')}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.actionCell}>
                      <PrimaryButton
                        label="Resolve"
                        icon="checkmark-circle-outline"
                        busy={busy === 'resolved'}
                        disabled={!!busy}
                        onPress={() => void setStatus('resolved', 'Case resolved')}
                      />
                    </View>
                    <View style={styles.actionCell}>
                      <PrimaryButton
                        label="Close"
                        icon="lock-closed-outline"
                        tone="outline"
                        busy={busy === 'closed'}
                        disabled={!!busy}
                        onPress={() => void setStatus('closed', 'Case closed')}
                      />
                    </View>
                  </>
                )}
              </View>
              <PrimaryButton
                label="Delete case"
                icon="trash-outline"
                tone="danger"
                busy={busy === 'delete'}
                disabled={!!busy}
                onPress={confirmDelete}
              />
            </>
          ) : isStaff ? (
            <Text style={styles.note}>
              The principal, deputy or discipline master can edit, resolve or close this case.
            </Text>
          ) : null}
        </View>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: MUTED_INK },
  infoValue: { flexShrink: 1, textAlign: 'right', fontSize: 13.5, fontWeight: '700', color: INK },
  body: { fontSize: 14.5, lineHeight: 21, color: INK },
  bullet: { fontSize: 14, lineHeight: 21, color: INK },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 14.5, fontWeight: '700', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  attachText: { flex: 1, fontSize: 14, fontWeight: '600' },
  reportHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: INK },
  actions: { flexDirection: 'row', gap: 8 },
  actionCell: { flex: 1 },
  note: { fontSize: 12.5, lineHeight: 18, color: MUTED_INK, textAlign: 'center', paddingHorizontal: 8 },
  warn: { fontSize: 12.5, color: '#B42318' },
});
