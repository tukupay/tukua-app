import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchAdminStudents, type AdminStudentRow } from '../../lib/adminPortalApi';
import { isDeskWebModuleAvailable } from '../../lib/localHost';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdminStudents'>;

const PAGE_SIZE = 40;

function studentName(row: AdminStudentRow): string {
  if (row.full_name?.trim()) return row.full_name.trim();
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Student';
}

export function AdminStudentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (soft = false, nextPage = 1, append = false) => {
      if (append) setLoadingMore(true);
      else if (!soft) setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminStudents(debounced || undefined, nextPage, PAGE_SIZE);
        const batch = res.students;
        setStudents((prev) => (append ? [...prev, ...batch] : batch));
        const reported = res.total || 0;
        if (reported > 0) setTotal(reported);
        else if (!append) setTotal(batch.length);
        else setTotal((prev) => prev + batch.length);
        setHasMore(batch.length >= PAGE_SIZE && (reported <= 0 || nextPage * PAGE_SIZE < reported));
        setPage(nextPage);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('AdminStudents', msg);
        setError(msg);
        if (!append) setStudents([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [debounced],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
              void load(true, 1, false);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Admin</ModuleKicker>
        <ModuleScreenHeader
          title="Students"
          description={total ? `${total} enrolled · search by name or admission no.` : 'Student records'}
        />

        <Pressable
          style={styles.admitBtn}
          onPress={() => navigation.navigate('AdmitStudent')}
        >
          <Text style={styles.admitBtnText}>+ Admit student</Text>
        </Pressable>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search students…"
          placeholderTextColor={Colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load students" body={error} onRetry={() => void load()} />
        ) : students.length === 0 ? (
          <ModuleEmpty
            title="No students found"
            body={debounced ? 'Try a different search term.' : 'No student records for this school yet.'}
          />
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.colNum]}>#</Text>
              <Text style={[styles.th, styles.colCode]}>Code</Text>
              <Text style={[styles.th, styles.colName]}>Full name</Text>
              <Text style={[styles.th, styles.colMeta]}>Class</Text>
            </View>
            {students.map((s, idx) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  if (!isDeskWebModuleAvailable() || !s.id) return;
                  navigation.navigate('DeskModule', {
                    title: studentName(s),
                    deskPath: `/admin/students/${s.id}`,
                    description: 'Student detail & edit on Desk.',
                  });
                }}>
                <ModuleGlassCard style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNum]}>{idx + 1}</Text>
                  <Text style={[styles.td, styles.colCode]} numberOfLines={1}>
                    {s.student_number || '—'}
                  </Text>
                  <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                    {studentName(s)}
                  </Text>
                  <Text style={[styles.td, styles.colMeta]} numberOfLines={1}>
                    {s.class_name || s.status || '—'}
                  </Text>
                </ModuleGlassCard>
              </Pressable>
            ))}
            {hasMore ? (
              <Pressable
                style={styles.loadMore}
                disabled={loadingMore}
                onPress={() => void load(true, page + 1, true)}>
                {loadingMore ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.loadMoreText}>Load more</Text>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { marginTop: 24 },
  search: {
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  tableHead: { flexDirection: 'row', gap: 6, paddingHorizontal: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 8 },
  th: { fontSize: 10, fontWeight: '800', color: Colors.mutedForeground, textTransform: 'uppercase' },
  td: { fontSize: 13, color: Colors.brandGreenDark },
  colNum: { width: 24 },
  colCode: { width: 64 },
  colName: { flex: 1, fontWeight: '700' },
  colMeta: { width: 72, fontSize: 12, color: Colors.mutedForeground },
  admitBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenMid,
  },
  admitBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  deskHint: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 10 },
  openDesk: { marginTop: 6, fontSize: 11, color: Colors.primary, fontWeight: '600' },
  loadMore: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenMid,
    minWidth: 120,
    alignItems: 'center',
  },
  loadMoreText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
});
