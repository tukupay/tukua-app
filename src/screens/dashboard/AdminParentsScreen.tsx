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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminParents(debounced || undefined, 1, 40);
      setParents(res.parents);
      setTotal(res.total || res.parents.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('AdminParents', msg);
      setError(msg);
      setParents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debounced]);

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
              void load(true);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Parents</ModuleKicker>
        <ModuleScreenHeader
          title="Parent directory"
          description={`Native list from Nest GET /parents. ${deskHint}`}
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
              <Text style={[styles.th, styles.colCode]}>Code</Text>
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
                  <Text style={[styles.td, styles.colCode]} numberOfLines={1}>
                    {row.phone_number || '—'}
                  </Text>
                  <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                    {parentName(row)}
                  </Text>
                  <Text style={[styles.td, styles.colMeta]} numberOfLines={1}>
                    {row.relationship || row.email || '—'}
                  </Text>
                </ModuleGlassCard>
              </Pressable>
            ))}
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
  count: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  linked: { marginTop: 6, fontSize: 12, color: Colors.brandGreen },
  linkedMuted: { marginTop: 6, fontSize: 12, color: Colors.mutedForeground, fontStyle: 'italic' },
  openDesk: { marginTop: 8, fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
