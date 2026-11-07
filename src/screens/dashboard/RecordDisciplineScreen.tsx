/**
 * Record a discipline case (teachers, staff and the office).
 *
 * POST /discipline/cases/analyze takes admission numbers + one narrative (+ notify_parent, use_ai) and
 * works out category / severity / steps itself. The phone puts the date, category, severity, action
 * taken and witnesses into that narrative so the record keeps them; office roles (who may PATCH) then
 * set category / severity / action taken on the saved case to exactly what was picked.
 * (The old form posted student_id / category / narrative, which the API's whitelist refused.)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { KeyboardAwareScroll } from '../../components/auth/KeyboardAwareScroll';
import { INK, ThemedPage } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  MUTED_INK,
  ModuleHeading,
  SelectField,
  StatusPill,
  SurfaceCard,
  friendlyError,
  useModulePadding,
} from '../../components/ui/ModuleKit';
import { FieldLabel, FormInput, OptionPills, PrimaryButton, ReportText } from '../../components/discipline/DisciplineParts';
import {
  COMMON_DISCIPLINE_CATEGORIES,
  DISCIPLINE_SEVERITIES,
  cap,
  fetchDisciplineCategoryNames,
  isDisciplineOffice,
  recordDisciplineCase,
  searchDisciplineStudentsList,
  todayIso,
  updateDisciplineIncident,
  type RecordCaseResult,
  type StudentHit,
} from '../../lib/disciplineApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'RecordDiscipline'>;

type DateChoice = 'today' | 'yesterday' | 'other';

function validIsoDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, da] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(y, mo - 1, da);
  return d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === da && y > 2000 && v <= todayIso();
}

export function RecordDisciplineScreen({ navigation, route }: Props) {
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const { persona, activeRoles } = useDeskAuth();
  const office = isDisciplineOffice(activeRoles, persona);
  const pad = useModulePadding();

  const preset = route.params?.admissionNumber
    ? [
        {
          id: route.params.admissionNumber,
          admission_number: route.params.admissionNumber,
          name: route.params.name || route.params.admissionNumber,
          class_label: route.params.classLabel,
        } as StudentHit,
      ]
    : [];

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentHit[]>(preset);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<string>('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [otherDate, setOtherDate] = useState('');
  const [narrative, setNarrative] = useState('');
  const [action, setAction] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [notifyParent, setNotifyParent] = useState(true);
  const [useAi, setUseAi] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<(RecordCaseResult & { adjusted: boolean }) | null>(null);

  const isCommendationCase = /commend|merit|award|praise/i.test(category);

  useEffect(() => {
    void fetchDisciplineCategoryNames().then(setCategories);
  }, []);

  const categoryOptions = useMemo(
    () => [...new Set([...categories, ...COMMON_DISCIPLINE_CATEGORIES])].map((n) => ({ key: n, label: n })),
    [categories],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError(null);
      return undefined;
    }
    const t = setTimeout(() => {
      setSearching(true);
      searchDisciplineStudentsList(q, 10)
        .then((list) => {
          setHits(list);
          setSearchError(null);
        })
        .catch((e) => {
          setHits([]);
          setSearchError(friendlyError(e instanceof Error ? e.message : String(e)));
        })
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });

  const incidentDate = dateChoice === 'today' ? todayIso() : dateChoice === 'yesterday' ? todayIso(1) : otherDate.trim();

  const reset = () => {
    setSelected([]);
    setQuery('');
    setCategory('');
    setSeverity('');
    setDateChoice('today');
    setOtherDate('');
    setNarrative('');
    setAction('');
    setWitnesses('');
    setNotifyParent(true);
    setErrors({});
    setResult(null);
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!selected.length) errs.students = 'Pick at least one learner.';
    if (!category) errs.category = 'Choose a category.';
    if (!isCommendationCase && !severity) errs.severity = 'Choose how serious it was.';
    if (!validIsoDate(incidentDate)) errs.date = 'Use a date like 2026-11-08 (not in the future).';
    if (narrative.trim().length < 10) errs.narrative = 'Describe what happened (at least a sentence).';
    setErrors(errs);
    if (Object.keys(errs).length) {
      showDialog({ title: 'Check the form', message: Object.values(errs)[0], variant: 'warning' });
      return;
    }

    const lines = [
      `Date of incident: ${incidentDate}`,
      `Category: ${category}`,
      !isCommendationCase && severity ? `Severity (recorder's assessment): ${cap(severity)}` : null,
      '',
      `What happened: ${narrative.trim()}`,
      action.trim() ? `Action taken: ${action.trim()}` : null,
      witnesses.trim() ? `Witnesses: ${witnesses.trim()}` : null,
    ].filter((l) => l !== null) as string[];
    const caseNarrative = lines.join('\n').slice(0, 12000);

    setSubmitting(true);
    try {
      const res = await recordDisciplineCase({
        admission_numbers: selected.map((s) => s.admission_number),
        case_narrative: caseNarrative,
        notify_parent: notifyParent,
        use_ai: useAi,
      });
      // Office roles may correct the server's classification to what was picked.
      let adjusted = false;
      if (office && res.incident_id) {
        try {
          const actionLines = action
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          await updateDisciplineIncident(res.incident_id, {
            category_label: category,
            ...(isCommendationCase ? { sentiment: 'positive', severity: 'low' } : { severity }),
            ...(actionLines.length ? { steps_taken: JSON.stringify(actionLines) } : {}),
          });
          adjusted = true;
        } catch {
          /* the case is saved; the server's own classification stays */
        }
      }
      setResult({ ...res, adjusted });
    } catch (e) {
      showDialog({
        title: 'Could not save the case',
        message: friendlyError(e instanceof Error ? e.message : String(e)),
        variant: 'warning',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <ThemedPage>
        <KeyboardAwareScroll
          contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom, paddingHorizontal: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}>
          <ModuleHeading title="Case recorded" onBack={() => navigation.goBack()} />
          <SurfaceCard>
            <View style={styles.successHead}>
              <View style={[styles.successIcon, { backgroundColor: 'rgba(6,118,71,0.10)' }]}>
                <Ionicons name="checkmark-circle" size={30} color="#067647" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Saved{result.case_number ? ` as ${result.case_number}` : ''}</Text>
                <Text style={styles.successMeta}>
                  {selected.map((s) => s.name).join(', ')}
                  {notifyParent ? ' · parent will be notified' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.pills}>
              <StatusPill label={result.adjusted ? category : cap(result.category) || category} tone="primary" />
              {result.adjusted && !isCommendationCase && severity ? (
                <StatusPill label={`${cap(severity)} severity`} tone="warning" />
              ) : result.severity ? (
                <StatusPill label={`${cap(result.severity)} severity`} tone="warning" />
              ) : null}
            </View>
            {!office ? (
              <Text style={styles.hint}>
                The school office reviews the case and may adjust its category or severity.
              </Text>
            ) : null}
          </SurfaceCard>
          {result.report_md ? (
            <SurfaceCard>
              <Text style={styles.reportTitle}>Case write-up</Text>
              <ReportText text={result.report_md} />
            </SurfaceCard>
          ) : null}
          {result.incident_id ? (
            <PrimaryButton
              label="View case"
              icon="document-text-outline"
              onPress={() => navigation.replace('DisciplineDetail', { id: result.incident_id ?? undefined })}
            />
          ) : null}
          <PrimaryButton label="Record another case" icon="add" tone="outline" onPress={reset} />
        </KeyboardAwareScroll>
      </ThemedPage>
    );
  }

  return (
    <ThemedPage>
      <KeyboardAwareScroll
        contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        revealMargin={40}>
        <ModuleHeading
          title="Record case"
          description="Log a conduct incident or a commendation for one or more learners."
          onBack={() => navigation.goBack()}
        />

        <SurfaceCard style={{ marginTop: 12 }}>
          <FieldLabel required>Learner(s)</FieldLabel>
          {selected.length ? (
            <View style={styles.selectedWrap}>
              {selected.map((s) => (
                <View key={s.admission_number} style={[styles.selectedChip, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.selectedName, { color: palette.primary }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.selectedMeta} numberOfLines={1}>
                      {[s.admission_number, s.class_label && s.class_label !== '—' ? s.class_label : null].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelected((l) => l.filter((x) => x.admission_number !== s.admission_number))}
                    hitSlop={10}
                    accessibilityLabel={`Remove ${s.name}`}>
                    <Ionicons name="close-circle" size={18} color={palette.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <FormInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              clearError('students');
            }}
            placeholder={selected.length ? 'Add another learner…' : 'Search by name or admission number'}
            autoCorrect={false}
            error={errors.students}
          />
          {searching ? <ActivityIndicator color={palette.primary} style={{ marginTop: 8 }} /> : null}
          {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
          {!searching && query.trim().length >= 2 && hits.length === 0 && !searchError ? (
            <Text style={styles.hint}>No learner matches “{query.trim()}”.</Text>
          ) : null}
          {hits.length > 0 ? (
            <View style={[styles.hitList, { borderColor: rgba(palette.primary, 0.12) }]}>
              {hits.map((h) => {
                const already = selected.some((s) => s.admission_number === h.admission_number);
                return (
                  <Pressable
                    key={h.id}
                    disabled={already}
                    style={({ pressed }) => [styles.hitRow, pressed && { opacity: 0.7 }, already && { opacity: 0.5 }]}
                    onPress={() => {
                      setSelected((l) => [...l, h]);
                      setQuery('');
                      setHits([]);
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hitName}>{h.name}</Text>
                      <Text style={styles.selectedMeta}>
                        {[h.admission_number, h.class_label && h.class_label !== '—' ? h.class_label : null].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name={already ? 'checkmark' : 'add-circle-outline'} size={20} color={palette.primary} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <FieldLabel required>Date of incident</FieldLabel>
          <OptionPills<DateChoice>
            options={['today', 'yesterday', 'other']}
            labels={{ today: 'Today', yesterday: 'Yesterday', other: 'Another day' }}
            value={dateChoice}
            onChange={(v) => {
              setDateChoice(v);
              clearError('date');
            }}
          />
          {dateChoice === 'other' ? (
            <View style={{ marginTop: 8 }}>
              <FormInput
                value={otherDate}
                onChangeText={(t) => {
                  setOtherDate(t);
                  clearError('date');
                }}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                error={errors.date}
              />
            </View>
          ) : null}

          <FieldLabel required>Category / offence</FieldLabel>
          <SelectField
            label="Category"
            icon="pricetag-outline"
            value={category}
            placeholder="Choose a category"
            onChange={(v) => {
              setCategory(v);
              clearError('category');
            }}
            options={categoryOptions}
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          {!isCommendationCase ? (
            <>
              <FieldLabel required>Severity</FieldLabel>
              <OptionPills
                options={DISCIPLINE_SEVERITIES}
                value={severity as (typeof DISCIPLINE_SEVERITIES)[number] | ''}
                onChange={(v) => {
                  setSeverity(v);
                  clearError('severity');
                }}
              />
              {errors.severity ? <Text style={styles.errorText}>{errors.severity}</Text> : null}
            </>
          ) : null}

          <FieldLabel required>What happened</FieldLabel>
          <FormInput
            value={narrative}
            onChangeText={(t) => {
              setNarrative(t);
              clearError('narrative');
            }}
            multiline
            placeholder={isCommendationCase ? 'What the learner did well…' : 'Where, when and what happened…'}
            maxLength={9000}
            error={errors.narrative}
          />

          <FieldLabel>Action taken</FieldLabel>
          <FormInput
            value={action}
            onChangeText={setAction}
            multiline
            placeholder={'e.g. Spoken to by class teacher\nParent called'}
            maxLength={2000}
          />

          <FieldLabel>Witnesses</FieldLabel>
          <FormInput value={witnesses} onChangeText={setWitnesses} placeholder="Names (optional)" maxLength={500} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Notify parent</Text>
              <Text style={styles.switchHint}>Sends the parent an SMS / email about this case.</Text>
            </View>
            <Switch
              value={notifyParent}
              onValueChange={setNotifyParent}
              trackColor={{ true: palette.primary, false: '#D0D5DD' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>AI write-up</Text>
              <Text style={styles.switchHint}>Tukua AI drafts the case report (slower). Off saves a quick summary.</Text>
            </View>
            <Switch
              value={useAi}
              onValueChange={setUseAi}
              trackColor={{ true: palette.primary, false: '#D0D5DD' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SurfaceCard>

        <View style={{ marginTop: 14 }}>
          <PrimaryButton
            label={submitting && useAi ? 'Saving & writing report…' : 'Submit case'}
            icon="checkmark"
            busy={submitting}
            onPress={() => void submit()}
          />
        </View>
      </KeyboardAwareScroll>
    </ThemedPage>
  );
}

const styles = StyleSheet.create({
  selectedWrap: { gap: 8, marginBottom: 8 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedName: { fontSize: 14.5, fontWeight: '800' },
  selectedMeta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  hitList: { marginTop: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, backgroundColor: '#FFFFFF' },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  hitName: { fontWeight: '700', color: INK, fontSize: 14.5 },
  hint: { marginTop: 6, fontSize: 12, color: MUTED_INK, lineHeight: 17 },
  errorText: { marginTop: 4, fontSize: 12, color: '#B42318', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  switchTitle: { fontSize: 14.5, fontWeight: '700', color: INK },
  switchHint: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  successHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  successIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 17, fontWeight: '800', color: INK },
  successMeta: { marginTop: 3, fontSize: 12.5, color: MUTED_INK },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  reportTitle: { fontSize: 15, fontWeight: '800', color: INK, marginBottom: 6 },
});
