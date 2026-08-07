import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from '../dashboard/ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { listWallets, totalSavings, type Wallet } from '../../lib/wallet';
import { fetchMyKyc, type KycStatus } from '../../lib/profileApi';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPayHome'>;

function formatKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function TukuaPayHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hide, setHide] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const [w, kyc] = await Promise.all([
        listWallets(),
        fetchMyKyc().catch(() => null),
      ]);
      setWallets(w);
      setKycStatus((kyc?.status as KycStatus) ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('TukuaPay', msg);
      setError(msg);
      setWallets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = totalSavings(wallets);

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 18,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.primary}
          />
        }>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Tukua Pay</ModuleKicker>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <ModuleScreenHeader
              title="Your wallets"
              description="Balances for tokens and school money. Pull to refresh."
            />
          </View>
          <Pressable
            style={styles.kycBtn}
            onPress={() => navigation.navigate('TukuaPayKyc')}
            hitSlop={8}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={
                kycStatus === 'approved'
                  ? '#059669'
                  : kycStatus === 'pending'
                    ? '#D97706'
                    : Colors.primary
              }
            />
            <Text style={styles.kycChip}>
              {kycStatus === 'approved'
                ? 'Verified'
                : kycStatus === 'pending'
                  ? 'Pending'
                  : kycStatus === 'rejected'
                    ? 'Rejected'
                    : 'Verify'}
            </Text>
          </Pressable>
        </View>

        <ModuleGlassCard>
          <View style={styles.totalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{hide ? '••••••' : formatKes(total)}</Text>
            </View>
            <Pressable onPress={() => setHide((v) => !v)} hitSlop={10} style={styles.eye}>
              <Ionicons name={hide ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.primary} />
            </Pressable>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cta} onPress={() => navigation.navigate('TukuaPayDeposit')}>
              <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
              <Text style={styles.ctaText}>Deposit</Text>
            </Pressable>
            <Pressable
              style={[styles.cta, styles.ctaAlt]}
              onPress={() => navigation.navigate('TukuaPaySend')}>
              <Ionicons name="paper-plane-outline" size={18} color={Colors.primary} />
              <Text style={[styles.ctaText, { color: Colors.primary }]}>Send</Text>
            </Pressable>
            <Pressable
              style={[styles.cta, styles.ctaAlt]}
              onPress={() => navigation.navigate('TukuaPayBank')}>
              <Ionicons name="business-outline" size={18} color={Colors.primary} />
              <Text style={[styles.ctaText, { color: Colors.primary }]}>Bank</Text>
            </Pressable>
          </View>
        </ModuleGlassCard>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load wallets" body={error} onRetry={() => void load()} />
        ) : wallets.length === 0 ? (
          <ModuleEmpty
            title="No wallets yet"
            body="Deposit with M-Pesa to get started."
            onRetry={() => navigation.navigate('TukuaPayDeposit')}
          />
        ) : (
          wallets.map((w) => (
            <Pressable key={String(w.id)} onPress={() => navigation.navigate('TukuaPayDeposit')}>
              <ModuleGlassCard>
                <Text style={styles.walletName}>{w.name || 'Wallet'}</Text>
                <Text style={styles.walletMeta}>{w.wallet_type || w.alias}</Text>
                <Text style={styles.walletBal}>{hide ? '••••' : formatKes(w.balance)}</Text>
              </ModuleGlassCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kycBtn: { alignItems: 'center', paddingTop: 4, minWidth: 64 },
  kycChip: { marginTop: 2, fontSize: 10, fontWeight: '800', color: Colors.primary },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, textTransform: 'uppercase' },
  totalValue: { marginTop: 4, fontSize: 26, fontWeight: '800', color: Colors.brandGreenDark },
  eye: { padding: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  ctaAlt: { backgroundColor: 'rgba(10,61,46,0.08)' },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  walletName: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  walletMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  walletBal: { marginTop: 10, fontSize: 18, fontWeight: '800', color: Colors.ink },
});
