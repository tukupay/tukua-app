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
import {
  fetchStudentPocketMoneyReadOnly,
  resolveStudentRecordId,
} from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentPocketMoney'>;

export function StudentPocketMoneyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser } = useDeskAuth();
  const studentId = resolveStudentRecordId(deskUser);

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!studentId) {
      setError('Student profile not linked');
      setLoading(false);
      return;
    }
    if (!soft) setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await fetchStudentPocketMoneyReadOnly(studentId);
      if (res.forbidden) {
        setForbidden(true);
        setBalance(null);
        setTransactions([]);
        return;
      }
      setBalance(res.balance);
      setTransactions(res.transactions);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('StudentPocketMoney', msg);
      setError(msg);
      setBalance(null);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

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
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Pocket money</ModuleKicker>
        <ModuleScreenHeader
          title="My wallet"
          description="Read-only balance — top-ups are handled by parents or the school office."
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : forbidden ? (
          <ModuleEmpty
            title="Office / parent only"
            body="Student accounts cannot open the canteen wallet on Nest yet. Ask a parent to view pocket money in their app, or visit the school office."
          />
        ) : error ? (
          <ModuleEmpty title="Couldn't load wallet" body={error} onRetry={() => void load()} />
        ) : (
          <>
            <ModuleGlassCard>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceValue}>
                {balance != null ? `KES ${balance.toLocaleString()}` : 'KES —'}
              </Text>
            </ModuleGlassCard>
            {transactions.length === 0 ? (
              <ModuleEmpty
                title="No transactions yet"
                body="When the school posts pocket-money credits or canteen spends, they will appear here."
              />
            ) : (
              transactions.map((tx, index) => {
                const key = String(tx.id ?? index);
                const when = String(tx.created_at ?? '').slice(0, 16).replace('T', ' ');
                const amount = Number(tx.amount ?? 0);
                return (
                  <ModuleGlassCard key={key}>
                    <Text style={styles.txTitle}>
                      {String(tx.description ?? tx.txn_type ?? tx.category ?? 'Transaction')}
                    </Text>
                    <Text style={styles.txMeta}>
                      {[when, Number.isFinite(amount) ? `KES ${amount.toLocaleString()}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </ModuleGlassCard>
                );
              })
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
  loader: { paddingVertical: 40, alignItems: 'center' },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
  balanceValue: { marginTop: 6, fontSize: 28, fontWeight: '800', color: Colors.brandGreenDark },
  txTitle: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  txMeta: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
});
