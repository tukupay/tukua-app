/**
 * Edit a discipline case — office roles only (PATCH /discipline/incidents/:id; the server refuses others).
 * Sends only the fields that changed. Steps taken / recommendations are edited one per line and saved as
 * a JSON list, the shape the server writes when it records a case.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { KeyboardAwareScroll } from '../../components/auth/KeyboardAwareScroll';
import { INK, ThemedPage } from '../../components/theme/ThemedPage';
import { MUTED_INK, ModuleHeading, SelectField, SurfaceCard, friendlyError, useModulePadding } from '../../components/ui/ModuleKit';
import { FieldLabel, FormInput, OptionPills, PrimaryButton } from '../../components/discipline/DisciplineParts';
import {
  COMMON_DISCIPLINE_CATEGORIES,
  DISCIPLINE_SEVERITIES,
  DISCIPLINE_STATUSES,
  asTextList,
  fetchDisciplineCategoryNames,
  updateDisciplineIncident,
  type DisciplineIncidentPatch,
} from '../../lib/disciplineApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'EditDisciplineIncident'>;

const toLines = (raw: unknown) => asTextList(raw).join('\n');
const fromLines = (text: string) => {
  const list = text
    .split('\n')
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
  return list.length ? JSON.stringify(list) : '';
};

export function EditDisciplineIncidentScreen({ navigation, route }: Props) {
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const pad = useModulePadding();
  const inc = route.params.incident;

  const initial = useMemo(
    () => ({
      case_summary: String(inc.case_summary ?? ''),
      case_narrative: String(inc.case_narrative ?? inc.description ?? ''),
      category_label: String(inc.category_label ?? inc.category_name ?? ''),
      severity: String(inc.severity ?? '').toLowerCase(),
      status: String(inc.status ?? 'recorded').toLowerCase(),
      steps: toLines(inc.steps_taken),
      recs: toLines(inc.recommendations),
      notify: !(inc.notify_parent === false || inc.notify_parent === 0),
    }),
    [inc],
  );
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchDisciplineCategoryNames().then(setCategories);
  }, []);

  const categoryOptions = useMemo(() => {
    const names = [...new Set([form.category_label, ...categories, ...COMMON_DISCIPLINE_CATEGORIES].filter(Boolean))];
    return names.map((n) => ({ key: n, label: n }));
  }, [categories, form.category_label]);

  const statusOptions = useMemo(() => {
    const list: string[] = [...DISCIPLINE_STATUSES];
    if (form.status && !list.includes(form.status)) list.unshift(form.status);
    return list;
  }, [form.status]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k as string]) return e;
      const next = { ...e };
      delete next[k as string];
      return next;
    });
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.case_narrative.trim()) errs.case_narrative = 'Describe what happened.';
    if (form.case_narrative.length > 12000) errs.case_narrative = 'Keep the narrative under 12,000 characters.';
    if (form.case_summary.length > 2000) errs.case_summary = 'Keep the summary under 2,000 characters.';
    if (form.steps.length > 7000) errs.steps = 'Too long — shorten the steps taken.';
    if (form.recs.length > 7000) errs.recs = 'Too long — shorten the recommendations.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const patch: DisciplineIncidentPatch = {};
    if (form.case_summary.trim() !== initial.case_summary.trim()) patch.case_summary = form.case_summary.trim();
    if (form.case_narrative.trim() !== initial.case_narrative.trim()) patch.case_narrative = form.case_narrative.trim();
    if (form.category_label !== initial.category_label && form.category_label) patch.category_label = form.category_label;
    if (form.severity !== initial.severity && form.severity) patch.severity = form.severity;
    if (form.status !== initial.status && form.status) patch.status = form.status;
    if (form.steps.trim() !== initial.steps.trim()) patch.steps_taken = fromLines(form.steps);
    if (form.recs.trim() !== initial.recs.trim()) patch.recommendations = fromLines(form.recs);
    if (form.notify !== initial.notify) patch.notify_parent = form.notify;
    if (!Object.keys(patch).length) {
      showDialog({ title: 'Nothing changed', message: 'Change a field, then save.', variant: 'info' });
      return;
    }
    if (!inc.id) return;
    setSaving(true);
    try {
      await updateDisciplineIncident(inc.id, patch);
      showDialog({
        title: 'Case updated',
        message: `Your changes to case ${inc.case_number ?? ''} were saved.`,
        variant: 'success',
        buttons: [{ text: 'Done', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      showDialog({ title: 'Could not save', message: friendlyError(e instanceof Error ? e.message : String(e)), variant: 'warning' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedPage>
      <KeyboardAwareScroll
        contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        revealMargin={40}>
        <ModuleHeading
          title="Edit case"
          description={inc.case_number ? `Case ${inc.case_number}` : 'Update the case record.'}
          onBack={() => navigation.goBack()}
        />
        <SurfaceCard style={{ marginTop: 12 }}>
          <FieldLabel>Status</FieldLabel>
          <OptionPills options={statusOptions} value={form.status} onChange={(v) => set('status', v)} />

          <FieldLabel>Severity</FieldLabel>
          <OptionPills options={DISCIPLINE_SEVERITIES} value={form.severity} onChange={(v) => set('severity', v)} />

          <FieldLabel>Category / offence</FieldLabel>
          <SelectField
            label="Category"
            icon="pricetag-outline"
            value={form.category_label}
            onChange={(v) => set('category_label', v)}
            options={categoryOptions}
          />

          <FieldLabel>Summary</FieldLabel>
          <FormInput
            value={form.case_summary}
            onChangeText={(t) => set('case_summary', t)}
            placeholder="One line the parent and office see first"
            error={errors.case_summary}
            maxLength={2000}
          />

          <FieldLabel required>What happened</FieldLabel>
          <FormInput
            value={form.case_narrative}
            onChangeText={(t) => set('case_narrative', t)}
            multiline
            placeholder="Describe the incident"
            error={errors.case_narrative}
          />

          <FieldLabel>Action taken (one per line)</FieldLabel>
          <FormInput
            value={form.steps}
            onChangeText={(t) => set('steps', t)}
            multiline
            placeholder={'Spoken to by class teacher\nParent called'}
            error={errors.steps}
          />

          <FieldLabel>Recommendations (one per line)</FieldLabel>
          <FormInput
            value={form.recs}
            onChangeText={(t) => set('recs', t)}
            multiline
            placeholder="Follow-up with the counsellor"
            error={errors.recs}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Notify parent</Text>
              <Text style={styles.switchHint}>Marks the case for the parent SMS / email.</Text>
            </View>
            <Switch
              value={form.notify}
              onValueChange={(v) => set('notify', v)}
              trackColor={{ true: palette.primary, false: '#D0D5DD' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </SurfaceCard>
        <View style={{ marginTop: 14 }}>
          <PrimaryButton label="Save changes" icon="checkmark" busy={saving} onPress={() => void save()} />
        </View>
      </KeyboardAwareScroll>
    </ThemedPage>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  switchTitle: { fontSize: 14.5, fontWeight: '700', color: INK },
  switchHint: { marginTop: 2, fontSize: 12, color: MUTED_INK },
});
