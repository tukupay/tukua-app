import React, { useCallback, useState } from 'react';
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
import { ModuleBackBar, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { createAdminStudent } from '../../lib/adminPortalApi';
import { useDialog } from '../../context/DialogContext';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdmitStudent'>;

export function AdmitStudentScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [studentNumber, setStudentNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    const name = fullName.trim();
    if (name.length < 2) {
      setError('Enter the student full name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAdminStudent({
        full_name: name,
        gender: gender || undefined,
        student_number: studentNumber.trim() || undefined,
      });
      showDialog({
        title: 'Student admitted',
        message: `${name} was created. Assign class and learning areas on Desk if needed.`,
        variant: 'success',
      });
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('AdmitStudent', msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [fullName, gender, navigation, showDialog, studentNumber]);

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 18,
        }}
        keyboardShouldPersistTaps="handled">
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Admin</ModuleKicker>
        <ModuleScreenHeader title="Admit student" description="Creates a student via Nest POST /students." />

        <ModuleGlassCard>
          <Text style={styles.label}>Full name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Wanjiru Kamau"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Admission / student code</Text>
          <TextInput
            style={styles.input}
            value={studentNumber}
            onChangeText={setStudentNumber}
            placeholder="Optional — auto if blank"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="characters"
          />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chips}>
            {(['male', 'female'] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[styles.chip, gender === g && styles.chipOn]}>
                <Text style={[styles.chipText, gender === g && styles.chipTextOn]}>
                  {g === 'male' ? 'Male' : 'Female'}
                </Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <Pressable style={[styles.submit, saving && { opacity: 0.7 }]} onPress={() => void onSubmit()} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Admit student</Text>}
          </Pressable>
        </ModuleGlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  chips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.2)',
  },
  chipOn: { backgroundColor: Colors.brandGreenMid, borderColor: Colors.brandGreenMid },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  chipTextOn: { color: '#fff' },
  err: { color: '#b42318', marginTop: 10, fontSize: 13 },
  submit: {
    marginTop: 16,
    backgroundColor: Colors.brandGreenMid,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
