import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchAdminTeachers, type AdminTeacherRow } from '../../lib/adminPortalApi';
import { isDeskWebModuleAvailable } from '../../lib/localHost';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdminTeachers'>;

function teacherName(row: AdminTeacherRow): string {
  if (row.full_name?.trim()) return row.full_name.trim();
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Teacher';
}

export function AdminTeachersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
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
      const res = await fetchAdminTeachers(debounced || undefined, 1, 40);
      setTeachers(res.teachers);
      setTotal(res.total || res.teachers.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('AdminTeachers', msg);
      setError(msg);
      setTeachers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debounced]);

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
              void load(true);
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
          teachers.map((t) => (
            <ModuleGlassCard key={t.id}>
              <Text style={styles.title}>{teacherName(t)}</Text>
              <Text style={styles.meta}>
                {[t.employee_number, t.status, t.user_is_active === 0 ? 'inactive' : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {t.email ? (
                <Pressable
                  style={styles.emailRow}
                  onPress={() => void Linking.openURL(`mailto:${t.email}`)}
                  hitSlop={6}>
                  <Ionicons name="mail" size={14} color={Colors.primary} />
                  <Text style={styles.email} numberOfLines={1}>
                    {t.email}
                  </Text>
                </Pressable>
              ) : null}
            </ModuleGlassCard>
          ))
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
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  email: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primary },
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
});
