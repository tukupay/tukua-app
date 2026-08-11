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
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { deskRoleLabel, SUPER_ADMIN_MOBILE_HATS } from '../../lib/deskRoles';
import { fetchSchoolsRegistry, searchSchoolsDirectory, type SchoolRegistryRow } from '../../lib/adminPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SuperAdminSchools'>;

function schoolMeta(row: SchoolRegistryRow): string {
  return [row.code, row.city || row.county, row.type, row.is_active === 0 ? 'inactive' : null]
    .filter(Boolean)
    .join(' · ');
}

export function SuperAdminSchoolsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { adoptSchoolRole } = useDeskAuth();
  const switchMode = route.params?.impersonate === true;

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [schools, setSchools] = useState<SchoolRegistryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSchool, setPendingSchool] = useState<SchoolRegistryRow | null>(null);
  const [adopting, setAdopting] = useState(false);

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

  const onPickSchool = (school: SchoolRegistryRow) => {
    if (!switchMode) return;
    setPendingSchool(school);
  };

  const onPickRole = async (role: string) => {
    if (!pendingSchool) return;
    setAdopting(true);
    try {
      await adoptSchoolRole({
        schoolId: pendingSchool.id,
        schoolName: pendingSchool.name,
        role,
      });
      navigation.popToTop();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Could not switch', msg);
    } finally {
      setAdopting(false);
    }
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
        <ModuleBackBar
          onBack={() => {
            if (pendingSchool) {
              setPendingSchool(null);
              return;
            }
            navigation.goBack();
          }}
        />
        <ModuleKicker>Platform</ModuleKicker>
        <ModuleScreenHeader
          title={
            pendingSchool
              ? `Use as… · ${pendingSchool.name}`
              : switchMode
                ? 'Switch school & role'
                : 'Schools registry'
          }
          description={
            pendingSchool
              ? 'Teacher · Security · Parent · Student · Individual (native dashboards)'
              : switchMode
                ? 'Pick a school, then a mobile role. Security stays available.'
                : total
                  ? `${total} schools · GET /schools or /schools/search`
                  : 'Search schools by name or code'
          }
        />

        {pendingSchool ? (
          <View style={styles.roleList}>
            {SUPER_ADMIN_MOBILE_HATS.map((role) => (
              <Pressable
                key={role}
                style={({ pressed }) => [styles.roleBtn, pressed && styles.roleBtnPressed]}
                disabled={adopting}
                onPress={() => void onPickRole(role)}>
                <Ionicons
                  name={role === 'security' ? 'shield-checkmark' : 'person'}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.roleBtnText}>{deskRoleLabel(role)}</Text>
              </Pressable>
            ))}
            {adopting ? <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} /> : null}
          </View>
        ) : (
          <>
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
                <Pressable key={s.id} disabled={!switchMode} onPress={() => onPickSchool(s)}>
                  <ModuleGlassCard>
                    <Text style={styles.title}>{s.name}</Text>
                    <Text style={styles.meta}>{schoolMeta(s)}</Text>
                    {switchMode ? (
                      <View style={styles.impRow}>
                        <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
                        <Text style={styles.impText}>Choose role at this school</Text>
                      </View>
                    ) : null}
                  </ModuleGlassCard>
                </Pressable>
              ))
            )}
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
  impRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  impText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  roleList: { gap: 10, marginTop: 8 },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.12)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  roleBtnPressed: { opacity: 0.85 },
  roleBtnText: { fontSize: 16, fontWeight: '700', color: Colors.brandGreenDark },
});
