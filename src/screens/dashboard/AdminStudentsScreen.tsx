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
      const res = await fetchAdminStudents(debounced || undefined, 1, 40);
      setStudents(res.students);
      setTotal(res.total || res.students.length);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('AdminStudents', msg);
      setError(msg);
      setStudents([]);
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
          title="Students"
          description={total ? `${total} enrolled · search by name or admission no.` : 'Student records'}
        />

        {isDeskWebModuleAvailable() ? (
          <Pressable
            style={styles.admitBtn}
            onPress={() =>
              navigation.navigate('DeskModule', {
                title: 'Admit student',
                deskPath: '/admin/students?admit=1',
                description: 'Full create/edit wizard on Desk Admin → Students.',
              })
            }>
            <Text style={styles.admitBtnText}>+ Admit / edit on Desk</Text>
          </Pressable>
        ) : (
          <Text style={styles.deskHint}>
            Create and edit students on Desk Admin (set EXPO_PUBLIC_DESK_WEB_URL to :3250).
          </Text>
        )}

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
          students.map((s) => (
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
              <ModuleGlassCard>
                <Text style={styles.title}>{studentName(s)}</Text>
                <Text style={styles.meta}>
                  {[s.student_number, s.class_name, s.gender, s.status || (s.is_active === 0 ? 'inactive' : null)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                {isDeskWebModuleAvailable() ? (
                  <Text style={styles.openDesk}>Tap for Desk detail →</Text>
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
});
