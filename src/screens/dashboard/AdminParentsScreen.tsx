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
import { fetchAdminParents, type AdminParentRow } from '../../lib/adminPortalApi';
import { isDeskWebModuleAvailable } from '../../lib/localHost';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdminParents'>;

const PAGE_SIZE = 40;

function parentName(row: AdminParentRow): string {
  if (row.full_name?.trim()) return row.full_name.trim();
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Parent';
}

export function AdminParentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [parents, setParents] = useState<AdminParentRow[]>([]);
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
        const res = await fetchAdminParents(debounced || undefined, nextPage, PAGE_SIZE);
        const batch = res.parents;
        setParents((prev) => (append ? [...prev, ...batch] : batch));
        const reported = res.total || 0;
        if (reported > 0) setTotal(reported);
        else if (!append) setTotal(batch.length);
        else setTotal((prev) => prev + batch.length);
        setHasMore(batch.length >= PAGE_SIZE && (reported <= 0 || nextPage * PAGE_SIZE < reported));
        setPage(nextPage);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('AdminParents', msg);
        setError(msg);
        if (!append) setParents([]);
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

  const deskHint = isDeskWebModuleAvailable()
    ? 'Full parent edit, join requests, and linking live on Desk Admin → Parents.'
    : 'Join requests and parent linking need Desk Admin (set EXPO_PUBLIC_DESK_WEB_URL to :3250).';

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
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Parents</ModuleKicker>
        <ModuleScreenHeader
          title="Parent directory"
          description={
            total
              ? `${total} parents · Nest GET /parents. ${deskHint}`
              : `Native list from Nest GET /parents. ${deskHint}`
          }
        />

        <TextInput
          style={styles.search}
          placeholder="Search name, email, phone…"
          placeholderTextColor={Colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load parents" body={error} onRetry={() => void load()} />
        ) : parents.length === 0 ? (
          <ModuleEmpty title="No parents found" body="Try a different search or pull to refresh." />
        ) : (
          <>
            <View style={styles.tableHead}>
              <Text style={[styles.th, styles.colNum]}>#</Text>
              <Text style={[styles.th, styles.colName]}>Full name</Text>
              <Text style={[styles.th, styles.colMeta]}>Phone</Text>
            </View>
            {parents.map((row, idx) => (
              <Pressable
                key={row.id}
                onPress={() => {
                  if (!isDeskWebModuleAvailable() || !row.id) return;
                  navigation.navigate('DeskModule', {
                    title: parentName(row),
                    deskPath: `/admin/parents/${row.id}`,
                    description: 'Parent detail, linking, and join requests on Desk.',
                  });
                }}>
                <ModuleGlassCard style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNum]}>{idx + 1}</Text>
                  <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                    {parentName(row)}
                  </Text>
                  <Text style={[styles.td, styles.colMeta]} numberOfLines={1}>
                    {row.phone_number || row.email || '—'}
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
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: Colors.white,
  },
  loader: { paddingVertical: 40, alignItems: 'center' },
  tableHead: { flexDirection: 'row', gap: 6, paddingHorizontal: 4, marginBottom: 6 },
  tableRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 8 },
  th: { fontSize: 10, fontWeight: '800', color: Colors.mutedForeground, textTransform: 'uppercase' },
  td: { fontSize: 13, color: Colors.brandGreenDark },
  colNum: { width: 24 },
  colName: { flex: 1, fontWeight: '700' },
  colMeta: { width: 100, fontSize: 11, color: Colors.mutedForeground },
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
