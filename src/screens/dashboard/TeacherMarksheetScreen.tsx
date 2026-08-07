import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import {
  fetchExamMarksheet,
  fetchMyTeacherWorkloads,
  type MarksheetRow,
  type TeacherWorkload,
} from '../../lib/teacherPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherMarksheet'>;

export function TeacherMarksheetScreen({ route, navigation }: Props) {
  const { examId, title, classId: initialClassId } = route.params;
  const insets = useSafeAreaInsets();
  const { deskUser } = useDeskAuth();
  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();

  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [classId, setClassId] = useState<string | null>(initialClassId ?? null);
  const [rows, setRows] = useState<MarksheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const cid = nextClassId !== undefined ? nextClassId : classId;
      try {
        if (teacherId && workloads.length === 0) {
          const wl = await fetchMyTeacherWorkloads(teacherId);
          setWorkloads(wl);
          if (!cid && wl[0]?.class_id) setClassId(wl[0].class_id);
        }
        const resolvedClass = cid ?? workloads[0]?.class_id ?? undefined;
        const data = await fetchExamMarksheet(examId, resolvedClass);
        const list = Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data?.students)
            ? data.students
            : [];
        setRows(list);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('TeacherMarksheet', msg);
        setError(msg);
        setRows([]);
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

  const activeClassName =
    classOptions.find((c) => c.id === classId)?.name ?? workloads.find((w) => w.class_id === classId)?.class_name;

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
        <ModuleKicker>Marksheet</ModuleKicker>
        <ModuleScreenHeader title={title} description="Learner totals for your class scope." />

        {classOptions.length > 1 ? (
          <Pressable style={styles.pickerBtn} onPress={() => setPicker(true)}>
            <Text style={styles.pickerLabel}>Class</Text>
            <Text style={styles.pickerValue}>{activeClassName || 'All classes'}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load marksheet" body={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          <ModuleEmpty
            title="No marks yet"
            body="Marks appear here once entered for this exam and class."
          />
        ) : (
          rows.map((row, index) => {
            const key = String(row.student_id ?? row.admission_number ?? index);
            return (
              <ModuleGlassCard key={key}>
                <Text style={styles.name}>{row.student_name || row.admission_number || 'Student'}</Text>
                <Text style={styles.meta}>{[row.class_name, row.admission_number].filter(Boolean).join(' · ')}</Text>
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Mean</Text>
                    <Text style={styles.statValue}>{row.mean_mark != null ? String(row.mean_mark) : '—'}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Grade</Text>
                    <Text style={styles.statValue}>{row.mean_grade || '—'}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Rank</Text>
                    <Text style={styles.statValue}>
                      {row.rank_in_class != null && row.rank_out_of_class != null
                        ? `${row.rank_in_class}/${row.rank_out_of_class}`
                        : row.rank_in_class != null
                          ? String(row.rank_in_class)
                          : '—'}
                    </Text>
                  </View>
                </View>
              </ModuleGlassCard>
            );
          })
        )}
      </ScrollView>

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
  content: { paddingHorizontal: 18 },
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
  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  statValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: Colors.brandGreenDark },
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
