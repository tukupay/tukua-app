import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useWebViewControl } from '../../context/WebViewControlContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchSchoolsRegistry, searchSchoolsDirectory, type SchoolRegistryRow } from '../../lib/adminPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SuperAdminSchools'>;

function schoolMeta(row: SchoolRegistryRow): string {
  return [row.code, row.city || row.county, row.type, row.is_active === 0 ? 'inactive' : null]
    .filter(Boolean)
    .join(' · ');
}

export function SuperAdminSchoolsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { navigate } = useWebViewControl();
  const impersonateMode = route.params?.impersonate === true;

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [schools, setSchools] = useState<SchoolRegistryRow[]>([]);
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
      if (debounced.length >= 2) {
        const res = await searchSchoolsDirectory(debounced, 30, 0);
        setSchools(res.schools);
        setTotal(res.schools.length);
      } else {
        const res = await fetchSchoolsRegistry(debounced || undefined, 1, 30);
        setSchools(res.schools);
        setTotal(res.total || res.schools.length);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('SuperAdminSchools', msg);
      setError(msg);
      setSchools([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const openImpersonateWeb = (school: SchoolRegistryRow) => {
    Alert.alert(
      `Open ${school.name}?`,
      'Full school-admin impersonation runs in Tukua web (localStorage session). This opens the super-admin schools list in the Chat web shell.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open web',
          onPress: () => {
            navigate('/superadmin/schools/list?impersonate=school_admin');
          },
        },
      ],
    );
  };

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
        <ModuleKicker>Platform</ModuleKicker>
        <ModuleScreenHeader
          title={impersonateMode ? 'Impersonate school admin' : 'Schools registry'}
          description={
            impersonateMode
              ? 'Pick a school · opens web impersonation flow'
              : total
                ? `${total} schools · GET /schools or /schools/search`
                : 'Search schools by name or code'
          }
        />

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search schools (min 2 chars for directory)…"
          placeholderTextColor={Colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load schools" body={error} onRetry={() => void load()} />
        ) : schools.length === 0 ? (
          <ModuleEmpty
            title="No schools found"
            body={debounced ? 'Try a different search term.' : 'Registry returned no rows.'}
          />
        ) : (
          schools.map((s) => (
            <Pressable
              key={s.id}
              disabled={!impersonateMode}
              onPress={() => impersonateMode && openImpersonateWeb(s)}>
              <ModuleGlassCard>
                <Text style={styles.title}>{s.name}</Text>
                <Text style={styles.meta}>{schoolMeta(s)}</Text>
                {impersonateMode ? (
                  <View style={styles.impRow}>
                    <Ionicons name="open-outline" size={14} color={Colors.primary} />
                    <Text style={styles.impText}>Open as school admin (web)</Text>
                  </View>
                ) : null}
              </ModuleGlassCard>
            </Pressable>
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
  impRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  impText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
