/**
 * Scan marksheet — camera/OCR → preview table → batch save (overwrite).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import {
  fetchMyTeacherWorkloads,
  fetchTeacherExams,
  scanMarksheetAnalyze,
  scanMarksheetSave,
  type DeskExam,
  type ScanMarkRow,
  type TeacherWorkload,
} from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'ScanMarksheet'>;

type PreviewRow = ScanMarkRow & { key: string };

export function ScanMarksheetScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser } = useDeskAuth();
  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();

  const [exams, setExams] = useState<DeskExam[]>([]);
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [examId, setExamId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of workloads) {
      if (w.class_id) map.set(w.class_id, w.class_name || 'Class');
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [workloads]);

  const laOptions = useMemo(() => {
    if (!classId) return [] as { id: string; name: string }[];
    const map = new Map<string, string>();
    for (const w of workloads) {
      if (w.class_id === classId && w.subject_id) {
        map.set(w.subject_id, w.subject_name || 'Learning area');
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [workloads, classId]);

  const boot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ex, wl] = await Promise.all([
        fetchTeacherExams(),
        teacherId ? fetchMyTeacherWorkloads(teacherId) : Promise.resolve([] as TeacherWorkload[]),
      ]);
      setExams(ex);
      setWorkloads(wl);
      if (!examId && ex[0]?.id) setExamId(String(ex[0].id));
      const firstClass = wl.find((w) => w.class_id)?.class_id;
      if (!classId && firstClass) setClassId(firstClass);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [classId, examId, teacherId]);

  useEffect(() => {
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!classId) return;
    const first = laOptions[0]?.id;
    if (first && (!subjectId || !laOptions.some((o) => o.id === subjectId))) {
      setSubjectId(first);
    }
  }, [classId, laOptions, subjectId]);

  const pickImage = async (fromCamera: boolean) => {
    setError(null);
    setInfo(null);
    if (!examId || !classId || !subjectId) {
      setError('Select exam, class, and learning area before taking a photo.');
      return;
    }
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Camera or photo library permission is required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.7,
          base64: true,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          base64: true,
          allowsEditing: false,
        });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setImageBase64(asset.base64 || null);
    setRows([]);
  };

  const analyze = async () => {
    if (!examId || !classId || !subjectId || !imageBase64) {
      setError('Take or choose a photo first.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setInfo(null);
    try {
      const data = await scanMarksheetAnalyze({
        exam_id: examId,
        class_id: classId,
        subject_id: subjectId,
        image_base64: imageBase64,
        max_marks: 100,
      });
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setSubjectName(String(data?.subject_name || ''));
      setRows(
        list.map((r, i) => ({
          ...r,
          key: `${r.admission_number || 'row'}-${i}`,
        })),
      );
      setInfo(
        `Found ${data?.parsed_count ?? list.length} rows · matched ${data?.matched_count ?? 0} students. Review then Save.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('ScanMarksheet', msg);
      if (/500|vision|openrouter|image|configured|api.?key/i.test(msg)) {
        setError(
          'Could not analyze the image. Staging may be missing a vision API key, or the photo was unreadable — try again with a clearer sheet.',
        );
      } else {
        setError(msg || 'Could not analyze the image.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async () => {
    if (!examId || !subjectId || !rows.length) {
      setError('Nothing to save — analyze a marksheet first.');
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const data = await scanMarksheetSave({
        exam_id: examId,
        subject_id: subjectId,
        max_marks: 100,
        rows: rows.map(({ key: _k, ...r }) => r),
      });
      const added = Number(data?.added ?? 0);
      const updated = Number(data?.updated ?? 0);
      const failed = Number(data?.failed ?? 0);
      setInfo(
        `Saved: ${added} added, ${updated} updated/overwritten, ${failed} failed` +
          (data?.errors?.length ? ` — ${data.errors.slice(0, 2).join('; ')}` : ''),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const examOptions = exams.map((e) => ({
    id: String(e.id),
    name: e.name || 'Exam',
  }));

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <View style={{ paddingTop: floatingHeaderInset(insets.top), paddingHorizontal: 16 }}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Assessments</ModuleKicker>
        <ModuleScreenHeader
          title="Scan marksheet"
          description="Select exam, class and learning area, photograph the sheet, review names, then Save."
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{
            paddingBottom: moduleScrollBottomPad(insets.bottom) + 88,
            paddingHorizontal: 16,
          }}
          ListHeaderComponent={
            <View>
              <ModuleKicker>Exam</ModuleKicker>
              <ChipRow options={examOptions} selected={examId} onSelect={setExamId} />
              <ModuleKicker>Class</ModuleKicker>
              <ChipRow
                options={classOptions}
                selected={classId}
                onSelect={(id) => {
                  setClassId(id);
                  setSubjectId(null);
                }}
              />
              <ModuleKicker>Learning area</ModuleKicker>
              <ChipRow options={laOptions} selected={subjectId} onSelect={setSubjectId} />

              <View style={styles.actions}>
                <Pressable style={styles.btn} onPress={() => void pickImage(true)}>
                  <Text style={styles.btnText}>Open camera</Text>
                </Pressable>
                <Pressable style={styles.btnSecondary} onPress={() => void pickImage(false)}>
                  <Text style={styles.btnTextSec}>Photo library</Text>
                </Pressable>
              </View>

              {imageUri ? (
                <ModuleGlassCard>
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                  <Pressable
                    style={[styles.btn, analyzing && { opacity: 0.7 }]}
                    onPress={() => void analyze()}
                    disabled={analyzing}
                  >
                    <Text style={styles.btnText}>{analyzing ? 'Analyzing…' : 'Analyze image'}</Text>
                  </Pressable>
                </ModuleGlassCard>
              ) : null}

              {subjectName ? (
                <Text style={styles.meta}>Subject: {subjectName}</Text>
              ) : null}
              {error ? <Text style={styles.err}>{error}</Text> : null}
              {info ? <Text style={styles.ok}>{info}</Text> : null}
              {rows.length > 0 ? (
                <Text style={styles.tableHead}># · Admission · Name · Marks</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !imageUri && !error ? (
              <ModuleEmpty
                title="No scan yet"
                body="Choose exam, class and learning area, then open the camera."
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <ModuleGlassCard>
              <Text style={styles.rowText}>
                {index + 1}. #{item.admission_number || '—'} ·{' '}
                {item.student_name || 'Name not matched'} ·{' '}
                {item.marks == null ? '—' : String(item.marks)}
              </Text>
              {!item.student_user_id ? (
                <Text style={styles.warn}>No student match for this admission number</Text>
              ) : null}
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={item.marks == null ? '' : String(item.marks)}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, '');
                  setRows((prev) =>
                    prev.map((r) =>
                      r.key === item.key
                        ? { ...r, marks: cleaned === '' ? null : Number(cleaned) }
                        : r,
                    ),
                  );
                }}
                placeholder="Edit marks"
                placeholderTextColor={Colors.mutedForeground}
              />
            </ModuleGlassCard>
          )}
        />
      )}

      {rows.length > 0 ? (
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={() => void save()}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save marks'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: { id: string; name: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!options.length) {
    return <Text style={styles.muted}>Nothing available</Text>;
  }
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.id === selected;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(o.id)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={2}>
              {o.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chips: { flexDirection: 'column', gap: 8, marginTop: 6, marginBottom: 12 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(10,61,46,0.12)',
    width: '100%',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.ink, fontSize: 15, fontWeight: '600' },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(10,61,46,0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnTextSec: { color: Colors.primary, fontWeight: '700' },
  image: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10 },
  meta: { color: Colors.mutedForeground, marginBottom: 6, marginTop: 8 },
  err: { color: '#B91C1C', marginBottom: 8, fontWeight: '600' },
  ok: { color: Colors.primary, marginBottom: 8, fontWeight: '600' },
  tableHead: { color: Colors.ink, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  rowText: { color: Colors.ink, fontWeight: '600', marginBottom: 6 },
  warn: { color: '#B45309', fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.ink,
    backgroundColor: '#fff',
  },
  saveBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  muted: { color: Colors.mutedForeground, marginBottom: 12 },
});
