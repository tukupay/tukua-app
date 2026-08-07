import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchSchoolDashboardAnalytics, type SchoolDashboardTotals } from '../../lib/adminPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SchoolOverview'>;

type StatRow = { label: string; value: string };

function statRows(totals: SchoolDashboardTotals | undefined): StatRow[] {
  if (!totals) return [];
  const fmt = (n?: number) => (n != null && Number.isFinite(n) ? String(n) : '—');
  return [
    { label: 'Students', value: fmt(totals.students_active ?? totals.students) },
    { label: 'Teachers', value: fmt(totals.teachers) },
    { label: 'Parents', value: fmt(totals.parents) },
    { label: 'Classes', value: fmt(totals.classes) },
    { label: 'Classrooms', value: fmt(totals.classrooms) },
    { label: 'Subjects', value: fmt(totals.subjects) },
    { label: 'Staff', value: fmt(totals.staff) },
    { label: 'Users', value: fmt(totals.users) },
  ].filter((r) => r.value !== '—' || r.label === 'Students');
}

export function SchoolOverviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedSchool, deskUser } = useDeskAuth();
  const schoolId = selectedSchool?.id || deskUser?.school_id || '';
  const schoolName = selectedSchool?.name || 'School';

  const [totals, setTotals] = useState<SchoolDashboardTotals | undefined>();
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!schoolId) {
      setError('No school selected');
      setLoading(false);
      return;
    }
    if (!soft) setLoading(true);
    setError(null);
    try {
      const data = await fetchSchoolDashboardAnalytics(String(schoolId));
      setTotals(data?.totals);
      setGeneratedAt(data?.generated_at ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('SchoolOverview', msg);
      setError(msg);
      setTotals(undefined);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = statRows(totals);

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
        <ModuleKicker>Admin</ModuleKicker>
        <ModuleScreenHeader
          title="School overview"
          description={`${schoolName} · GET /schools/:id/dashboard`}
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load overview" body={error} onRetry={() => void load()} />
        ) : rows.length === 0 ? (
          <ModuleEmpty
            title="No stats yet"
            body="Dashboard analytics returned empty totals. Sync school data on Desk web."
          />
        ) : (
          <>
            <View style={styles.grid}>
              {rows.map((row) => (
                <ModuleGlassCard key={row.label}>
                  <Text style={styles.statLabel}>{row.label}</Text>
                  <Text style={styles.statValue}>{row.value}</Text>
                </ModuleGlassCard>
              ))}
            </View>
            {generatedAt ? (
              <Text style={styles.footer}>Updated {new Date(generatedAt).toLocaleString()}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statLabel: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, textTransform: 'uppercase' },
  statValue: { marginTop: 6, fontSize: 22, fontWeight: '800', color: Colors.brandGreenDark },
  footer: { marginTop: 14, fontSize: 11, color: Colors.mutedForeground, textAlign: 'center' },
});
