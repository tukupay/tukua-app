/**
 * Record discipline case — teacher native form (T24–T26).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useDialog } from '../../context/DialogContext';
import { createDisciplineCase, searchDisciplineStudents } from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'RecordDiscipline'>;

type StudentHit = {
  student_id?: string;
  id?: string;
  full_name?: string;
  admission_number?: string;
};

export function RecordDisciplineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const [category, setCategory] = useState('');
  const [narrative, setNarrative] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      setHits(await searchDisciplineStudents(trimmed));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const submit = async () => {
    const sid = selected?.student_id || selected?.id;
    if (!sid) {
      showDialog({ title: 'Select a student', message: 'Search and pick a student first.', variant: 'warning' });
      return;
    }
    if (!narrative.trim()) {
      showDialog({ title: 'Describe the incident', message: 'Enter what happened.', variant: 'warning' });
      return;
    }
    setSubmitting(true);
    setAnalysis(null);
    try {
      const res = await createDisciplineCase({
        student_id: sid,
        incident_date: incidentDate,
        category: category.trim() || 'General',
        narrative: narrative.trim(),
        witnesses: witnesses.trim() || undefined,
        use_ai: true,
      });
      const msg =
        (typeof (res as { analysis_report_md?: string }).analysis_report_md === 'string' &&
          (res as { analysis_report_md: string }).analysis_report_md) ||
        (typeof (res as { message?: string }).message === 'string' && (res as { message: string }).message) ||
        'Case recorded successfully.';
      setAnalysis(msg);
      showDialog({ title: 'Case recorded', message: 'The discipline case was submitted.', variant: 'success' });
    } catch (e) {
      showDialog({
        title: 'Could not save case',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled">
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Discipline</ModuleKicker>
        <ModuleScreenHeader title="Record case" description="Log a conduct incident for a student." />

        <ModuleGlassCard>
          <Text style={styles.label}>Student</Text>
          <TextInput
            value={selected ? selected.full_name || selected.admission_number || 'Student' : query}
            onChangeText={(t) => {
              setSelected(null);
              setQuery(t);
            }}
            placeholder="Search by name or admission #"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
          />
          {searching ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} /> : null}
          {hits.length > 0 && !selected ? (
            <View style={styles.hitList}>
              {hits.slice(0, 8).map((h, i) => (
                <Pressable
                  key={String(h.student_id ?? h.id ?? i)}
                  style={styles.hitRow}
                  onPress={() => {
                    setSelected(h);
                    setQuery(h.full_name || h.admission_number || '');
                    setHits([]);
                  }}>
                  <Text style={styles.hitName}>{h.full_name || 'Student'}</Text>
                  {h.admission_number ? (
                    <Text style={styles.hitAdm}>#{h.admission_number}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Date</Text>
          <TextInput
            value={incidentDate}
            onChangeText={setIncidentDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
          />
          <Text style={styles.label}>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Bullying, Uniform"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
          />
          <Text style={styles.label}>What happened</Text>
          <TextInput
            value={narrative}
            onChangeText={setNarrative}
            multiline
            placeholder="Describe the incident…"
            placeholderTextColor={Colors.mutedForeground}
            style={[styles.input, styles.multiline]}
          />
          <Text style={styles.label}>Witnesses (optional)</Text>
          <TextInput
            value={witnesses}
            onChangeText={setWitnesses}
            placeholder="Names of witnesses"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
          />

          {analysis ? <Text style={styles.analysis}>{analysis}</Text> : null}

          <Pressable
            style={[styles.submit, submitting && styles.submitDisabled]}
            disabled={submitting}
            onPress={() => void submit()}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Submit case</Text>
            )}
          </Pressable>
        </ModuleGlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  hitList: { marginTop: 8, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  hitRow: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  hitName: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  hitAdm: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  analysis: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.ink,
    backgroundColor: 'rgba(10,61,46,0.06)',
    padding: 10,
    borderRadius: 10,
  },
  submit: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
