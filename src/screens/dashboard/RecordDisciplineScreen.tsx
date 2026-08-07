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
import {
  createDisciplineCase,
  fetchDisciplineCategories,
  searchDisciplineStudents,
} from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'RecordDiscipline'>;

type StudentHit = {
  student_id?: string;
  id?: string;
  full_name?: string;
  admission_number?: string;
  class_name?: string;
  status?: string;
};

export function RecordDisciplineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentHit | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [category, setCategory] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const [narrative, setNarrative] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const cats = await fetchDisciplineCategories();
        setCategories(cats);
        if (cats[0]?.name && !category) setCategory(cats[0].name);
      } catch {
        setCategories([{ id: 'general', name: 'General' }]);
        if (!category) setCategory('General');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {selected ? (
            <View style={styles.studentCard}>
              <Text style={styles.cardName}>{selected.full_name || 'Student'}</Text>
              <Text style={styles.cardMeta}>
                Adm · {selected.admission_number || '—'}
                {selected.class_name ? ` · ${selected.class_name}` : ''}
              </Text>
              {selected.status ? (
                <Text style={styles.cardMeta}>Status · {selected.status}</Text>
              ) : null}
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
          <Pressable style={styles.dropdown} onPress={() => setCatOpen((v) => !v)}>
            <Text style={styles.dropdownText}>{category || 'Select category'}</Text>
            <Text style={styles.dropdownChevron}>{catOpen ? '▲' : '▼'}</Text>
          </Pressable>
          {catOpen ? (
            <View style={styles.dropList}>
              {categories.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.dropItem}
                  onPress={() => {
                    setCategory(c.name);
                    setCatOpen(false);
                  }}>
                  <Text style={styles.dropItemText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
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
  root: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  hitList: { marginTop: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  hitRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
  },
  hitName: { fontWeight: '700', color: Colors.ink },
  hitAdm: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  studentCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(10,61,46,0.12)',
  },
  cardName: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  cardMeta: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  dropdown: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { fontSize: 15, color: Colors.ink, fontWeight: '600' },
  dropdownChevron: { color: Colors.mutedForeground, fontSize: 12 },
  dropList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dropItem: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  dropItemText: { color: Colors.ink, fontWeight: '600' },
  analysis: { marginTop: 12, color: Colors.primary, fontSize: 13, lineHeight: 18 },
  submit: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
