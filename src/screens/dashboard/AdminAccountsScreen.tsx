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
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchAccountsDashboard, type AccountsDashboardOverview } from '../../lib/adminPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'AdminAccounts'>;

function kes(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return 'KES —';
  return `KES ${Math.round(n).toLocaleString()}`;
}

export function AdminAccountsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<AccountsDashboardOverview | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const data = await fetchAccountsDashboard();
      setOverview(data?.overview);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('AdminAccounts', msg);
      setError(msg);
      setOverview(undefined);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = overview
    ? [
        { label: 'Invoiced', value: kes(overview.invoiced) },
        { label: 'Collected', value: kes(overview.collected) },
        { label: 'Outstanding', value: kes(overview.outstanding) },
        { label: 'Expenses', value: kes(overview.expense_total) },
        { label: 'Net position', value: kes(overview.net_position) },
        { label: 'Receipts', value: overview.receipt_count != null ? String(overview.receipt_count) : '—' },
      ]
    : [];

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
        <ModuleKicker>Finance</ModuleKicker>
        <ModuleScreenHeader
          title="Accounts summary"
          description="Cached dashboard · GET /accounts/dashboard"
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error ? (
          <ModuleEmpty title="Couldn't load accounts" body={error} onRetry={() => void load()} />
        ) : !overview ? (
          <ModuleEmpty
            title="No finance stats"
            body="Run POST /accounts/dashboard/refresh on Desk web, or post fees/receipts first."
          />
        ) : (
          <View style={styles.grid}>
            {cards.map((c) => (
              <ModuleGlassCard key={c.label}>
                <Text style={styles.label}>{c.label}</Text>
                <Text style={styles.value}>{c.value}</Text>
              </ModuleGlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { marginTop: 24 },
  grid: { gap: 10 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, textTransform: 'uppercase' },
  value: { marginTop: 6, fontSize: 18, fontWeight: '800', color: Colors.brandGreenDark },
});
