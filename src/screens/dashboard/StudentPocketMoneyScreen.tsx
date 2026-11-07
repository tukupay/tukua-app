import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ThemedBackdrop, INK } from '../../components/theme/ThemedPage';
import {
  AmountRow,
  BalancePanel,
  ListFooter,
  ListSkeleton,
  MoneyHeader,
  PanelStat,
  SectionTitle,
  StateCard,
} from '../../components/dashboard/MoneyKit';
import { kes, shortDate, useWindowedList } from '../../lib/moneyFormat';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchStudentPocketMoneyReadOnly, resolveStudentRecordId } from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentPocketMoney'>;
type Tx = Record<string, unknown>;

const PAGE = 15;

function isCredit(tx: Tx): boolean {
  const type = String(tx.txn_type ?? tx.category ?? '').toLowerCase();
  if (/deposit|top|credit|refund/.test(type)) return true;
  if (/spend|purchase|debit|withdraw|canteen/.test(type)) return false;
  return Number(tx.amount ?? 0) > 0;
}

/** A learner's own pocket money wallet: balance, money in / spent, and every transaction (read-only). */
export function StudentPocketMoneyScreen({ navigation }: Props) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const { deskUser } = useDeskAuth();
  const studentId = resolveStudentRecordId(deskUser);

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!studentId) {
        setError('Your learner profile is not linked yet.');
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
        setTransactions(
          [...res.transactions].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))),
        );
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
    },
    [studentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const tx of transactions) {
      const amt = Math.abs(Number(tx.amount ?? 0) || 0);
      if (isCredit(tx)) inSum += amt;
      else outSum += amt;
    }
    return { inSum, outSum };
  }, [transactions]);

  const win = useWindowedList(transactions, PAGE);
  const blocked = loading || forbidden || Boolean(error);

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <FlatList
        data={blocked ? [] : win.visible}
        keyExtractor={(tx, i) => String(tx.id ?? i)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        onEndReached={win.loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={PAGE}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={palette.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 10 }}>
            <MoneyHeader title="Pocket money" subtitle="Your school wallet" onBack={() => navigation.goBack()} />
            {!blocked ? (
              <>
                <BalancePanel kicker="Available to spend" value={balance != null ? kes(balance) : 'KES —'} icon="wallet">
                  <View style={styles.split}>
                    <PanelStat label="Money in" value={kes(totals.inSum)} />
                    <PanelStat label="Spent" value={kes(totals.outSum)} />
                  </View>
                </BalancePanel>
                <Text style={styles.note}>Parents add pocket money from their app or at the school office.</Text>
                {transactions.length ? <SectionTitle>Activity</SectionTitle> : null}
              </>
            ) : null}
          </View>
        }
        renderItem={({ item: tx }) => {
          const credit = isCredit(tx);
          const amt = Math.abs(Number(tx.amount ?? 0) || 0);
          const desc = String(tx.description ?? '').replace(/^\s*\[[^\]]*\]\s*/, '').trim();
          const after = Number(tx.balance_after);
          return (
            <View style={styles.rowCard}>
              <AmountRow
                icon={credit ? 'arrow-down-circle-outline' : 'cart-outline'}
                iconTone={credit ? 'in' : 'out'}
                title={desc || (credit ? 'Money added' : 'Spent')}
                meta={[shortDate(tx.created_at), Number.isFinite(after) ? `Balance ${kes(after)}` : null]
                  .filter(Boolean)
                  .join(' · ')}
                amount={`${credit ? '+' : '−'}${kes(amt)}`}
                amountStyle={{ color: credit ? '#15803D' : INK }}
                last
              />
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton withPanel rows={5} />
          ) : forbidden ? (
            <StateCard
              icon="lock-closed-outline"
              title="Ask a parent or the office"
              body="Your school has not opened the pocket money wallet to learners yet. A parent can see it in their app."
            />
          ) : error ? (
            <StateCard tone="error" title="Could not load your wallet" body={error} onRetry={() => void load()} />
          ) : (
            <StateCard
              icon="wallet-outline"
              title="No activity yet"
              body="Top-ups and canteen spending show here."
            />
          )
        }
        ListFooterComponent={<ListFooter hasMore={win.hasMore} total={blocked ? 0 : win.total} noun="transactions" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  split: { flexDirection: 'row', gap: 8, marginTop: 14 },
  note: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground },
  rowCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
});
