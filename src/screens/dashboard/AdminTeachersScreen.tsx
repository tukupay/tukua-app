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
import { fetchAdminTeachers, type AdminTeacherRow } from '../../lib/adminPortalApi';
import { isDeskWebModuleAvailable } from '../../lib/localHost';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdminTeachers'>;

const PAGE_SIZE = 40;

function teacherName(row: AdminTeacherRow): string {
  if (row.full_name?.trim()) return row.full_name.trim();
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Teacher';
}

function teacherMeta(row: AdminTeacherRow): string {
  const phone = String(row.phone_number || '').trim();
  if (phone) return phone;
  return row.status || (row.user_is_active === 0 ? 'inactive' : 'active');
}

export function AdminTeachersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
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
        const res = await fetchAdminTeachers(debounced || undefined, nextPage, PAGE_SIZE);
        const batch = res.teachers;
        setTeachers((prev) => (append ? [...prev, ...batch] : batch));
        const reported = res.total || 0;
        if (reported > 0) setTotal(reported);
        else if (!append) setTotal(batch.length);
        else setTotal((prev) => prev + batch.length);
        setHasMore(batch.length >= PAGE_SIZE && (reported <= 0 || nextPage * PAGE_SIZE < reported));
        setPage(nextPage);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('AdminTeachers', msg);
        setError(msg);
        if (!append) setTeachers([]);
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
          title="Teachers"
          description={
            total
              ? `${total} staff · workload CRUD on Desk Admin → Teachers`
              : 'Staff & workload — assign subjects on Desk'
          }
        />

        {isDeskWebModuleAvailable() ? (
          <Pressable
            style={styles.deskBtn}
            onPress={() =>
              navigation.navigate('DeskModule', {
                title: 'Teachers & workload',
                deskPath: '/admin/teachers',
                description: 'Create teachers and assign class × subject workloads on Desk.',
              })
            }>
            <Text style={styles.deskBtnText}>Open Desk teachers & workload</Text>
          </Pressable>
        ) : (
          <Text style={styles.deskHint}>
            Workload assign/edit is Desk-only (set EXPO_PUBLIC_DESK_WEB_URL to :3250).
          </Text>
        )}

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search teachers…"
          placeholderTextColor={Colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load teachers" body={error} onRetry={() => void load()} />
        ) : teachers.length === 0 ? (
          <ModuleEmpty
            title="No teachers found"
            body={debounced ? 'Try a different search term.' : 'No teacher records for this school yet.'}
          />
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.colNum]}>#</Text>
              <Text style={[styles.th, styles.colCode]}>Code</Text>
              <Text style={[styles.th, styles.colName]}>Full name</Text>
              <Text style={[styles.th, styles.colMeta]}>Phone</Text>
            </View>
            {teachers.map((t, idx) => (
              <ModuleGlassCard key={t.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colNum]}>{idx + 1}</Text>
                <Text style={[styles.td, styles.colCode]} numberOfLines={1}>
                  {t.employee_number || '—'}
                </Text>
                <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                  {teacherName(t)}
                </Text>
                <Text style={[styles.td, styles.colMeta]} numberOfLines={1}>
                  {teacherMeta(t)}
                </Text>
              </ModuleGlassCard>
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
  tableHead: { flexDirection: 'row', gap: 6, paddingHorizontal: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 8 },
  th: { fontSize: 10, fontWeight: '800', color: Colors.mutedForeground, textTransform: 'uppercase' },
  td: { fontSize: 13, color: Colors.brandGreenDark },
  colNum: { width: 24 },
  colCode: { width: 64 },
  colName: { flex: 1, fontWeight: '700' },
  colMeta: { width: 88, fontSize: 11, color: Colors.mutedForeground },
  deskBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenMid,
  },
  deskBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  deskHint: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 10 },
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
