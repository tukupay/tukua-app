import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  generateExamMarks,
  listAssessmentMarks,
  patchAssessmentMark,
  type AssessmentMarkRow,
  type TeacherWorkload,
} from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherMarksheet'>;

type DraftRow = AssessmentMarkRow & { draft?: string; dirty?: boolean };

const PAGE = 40;

export function TeacherMarksheetScreen({ route, navigation }: Props) {
  const { examId, title, classId: initialClassId } = route.params;
  const insets = useSafeAreaInsets();
  const { deskUser } = useDeskAuth();
  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [classId, setClassId] = useState<string | null>(initialClassId ?? null);
  const [allRows, setAllRows] = useState<DraftRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of workloads) {
      if (w.class_id) map.set(w.class_id, w.class_name || 'Class');
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [workloads]);

  const load = useCallback(
    async (soft = false, nextClassId?: string | null) => {
      if (!soft) setLoading(true);
      setError(null);
      setToast(null);
      const cid = nextClassId !== undefined ? nextClassId : classId;
      try {
        let wl = workloads;
        if (teacherId && wl.length === 0) {
          wl = await fetchMyTeacherWorkloads(teacherId);
          setWorkloads(wl);
          if (!cid && wl[0]?.class_id) {
            setClassId(wl[0].class_id);
          }
        }
        const resolvedClass = cid ?? wl[0]?.class_id ?? undefined;
        let marks = await listAssessmentMarks(examId, resolvedClass);
        if (marks.length === 0) {
          await generateExamMarks(examId);
          marks = await listAssessmentMarks(examId, resolvedClass);
        }
        setAllRows(
          marks.map((m) => ({
            ...m,
            draft: m.marks != null && m.marks !== '' ? String(m.marks) : '',
            dirty: false,
          })),
        );
        setVisibleCount(PAGE);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('TeacherMarksheet', msg);
        setError(msg);
        setAllRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [classId, examId, teacherId, workloads],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const visible = allRows.slice(0, visibleCount);
  const dirtyCount = allRows.filter((r) => r.dirty).length;

  const setDraft = (id: string, draft: string) => {
    setAllRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, draft, dirty: true } : r)),
    );
  };

  const save = async () => {
    const ops = allRows.filter((r) => r.dirty && r.id);
    if (!ops.length) {
      setToast('Nothing to save.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let ok = 0;
      for (const row of ops) {
        const raw = String(row.draft ?? '').trim();
        const marks = raw === '' ? null : Number(raw);
        if (raw !== '' && !Number.isFinite(marks)) {
          throw new Error(`Invalid score for ${row.student_name || row.admission_number || 'student'}.`);
        }
        await patchAssessmentMark(row.id, { marks });
        ok += 1;
      }
      setToast(`Marks saved (${ok}).`);
      await load(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const focusNext = (index: number) => {
    const next = visible[index + 1];
    if (next?.id) inputRefs.current[next.id]?.focus();
  };

  const activeClassName =
    classOptions.find((c) => c.id === classId)?.name ??
    workloads.find((w) => w.class_id === classId)?.class_name;

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <View style={{ flex: 1, paddingTop: floatingHeaderInset(insets.top) }}>
        <View style={styles.headerPad}>
          <ModuleBackBar onBack={() => navigation.goBack()} />
          <ModuleKicker>Enter marks</ModuleKicker>
          <ModuleScreenHeader title={title} description="Edit scores, then Save. Press Next to move down." />
          {classOptions.length > 0 ? (
            <Pressable style={styles.pickerBtn} onPress={() => setPicker(true)}>
              <Text style={styles.pickerLabel}>Class</Text>
              <Text style={styles.pickerValue}>{activeClassName || 'Select class'}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
            </Pressable>
          ) : null}
          {toast ? <Text style={styles.toast}>{toast}</Text> : null}
          {error && !loading ? <Text style={styles.errInline}>{error}</Text> : null}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error && allRows.length === 0 ? (
          <View style={styles.headerPad}>
            <ModuleEmpty title="Couldn't load marks" body={error} onRetry={() => void load()} />
          </View>
        ) : allRows.length === 0 ? (
          <View style={styles.headerPad}>
            <ModuleEmpty
              title="No mark rows yet"
              body="Generate rows for this exam and class, then enter scores."
              onRetry={() => void load()}
            />
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item, i) => item.id || String(i)}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: moduleScrollBottomPad(insets.bottom) + 72,
            }}
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
            onEndReached={() => {
              if (visibleCount < allRows.length) {
                setVisibleCount((n) => Math.min(n + PAGE, allRows.length));
              }
            }}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              visibleCount < allRows.length ? (
                <Text style={styles.more}>Loading more…</Text>
              ) : (
                <Text style={styles.more}>
                  {allRows.length} learner{allRows.length === 1 ? '' : 's'}
                </Text>
              )
            }
            renderItem={({ item, index }) => (
              <ModuleGlassCard>
                <Text style={styles.name}>
                  {index + 1}. {item.student_name || item.admission_number || 'Student'}
                </Text>
                <Text style={styles.meta}>
                  {[item.admission_number, item.grade].filter(Boolean).join(' · ')}
                </Text>
                <TextInput
                  ref={(r) => {
                    if (item.id) inputRefs.current[item.id] = r;
                  }}
                  value={item.draft ?? ''}
                  onChangeText={(t) => setDraft(item.id, t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => focusNext(index)}
                  placeholder="Score"
                  placeholderTextColor={Colors.mutedForeground}
                  style={styles.scoreInput}
                />
              </ModuleGlassCard>
            )}
          />
        )}

        <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={[styles.saveBtn, (saving || dirtyCount === 0) && { opacity: 0.55 }]}
            disabled={saving || dirtyCount === 0}
            onPress={() => void save()}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>
                Save{dirtyCount ? ` (${dirtyCount})` : ''}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Class</Text>
            {classOptions.map((c) => (
              <Pressable
                key={c.id}
                style={styles.modalRow}
                onPress={() => {
                  setClassId(c.id);
                  setPicker(false);
                  void load(false, c.id);
                }}>
                <Text style={styles.modalRowText}>{c.name}</Text>
                {classId === c.id ? <Ionicons name="checkmark" size={18} color={Colors.primary} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  headerPad: { paddingHorizontal: 18 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pickerLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
  pickerValue: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.ink },
  name: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
  scoreInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  more: { textAlign: 'center', color: Colors.mutedForeground, paddingVertical: 12, fontWeight: '600' },
  toast: { color: Colors.primary, fontWeight: '700', marginBottom: 8 },
  errInline: { color: '#B91C1C', fontWeight: '600', marginBottom: 8 },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink, marginBottom: 10 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalRowText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.ink },
});
