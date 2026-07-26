import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAuth } from '../../context/AuthContext';
import { deskFetch } from '../../lib/deskApi';
import { Colors } from '../../theme/yana';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { log } from '../../lib/logger';

/** Compact display: 950 → "950", 1200 → "1.2k", 1_500_000 → "1.5M" */
export function formatTokensShort(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}

/**
 * Token chip + tiny “Tukua” label — keeps header height compact.
 */
export function TokenBalancePill() {
  const { isAuthenticated } = useAuth();
  const { deskToken, isDeskAuthenticated } = useDeskAuth();
  const { navigate } = useWebViewControl();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!deskToken) {
      setBalance(0);
      return;
    }
    setLoading(true);
    try {
      const data = await deskFetch<{ balance?: number; tokens?: number }>('/comms/tokens/balance');
      const next =
        typeof data?.balance === 'number'
          ? data.balance
          : typeof data?.tokens === 'number'
            ? data.tokens
            : 0;
      setBalance(Number.isFinite(next) ? next : 0);
    } catch (e) {
      log.warn('TokenBalance', String(e));
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [deskToken]);

  useEffect(() => {
    if (!isDeskAuthenticated) {
      setBalance(0);
      return;
    }
    void load();
    const id = setInterval(() => void load(), 5 * 60_000);
    return () => clearInterval(id);
  }, [isDeskAuthenticated, load]);

  if (!isAuthenticated) return null;

  const openBalances = () => {
    navigate('/profile/balances', '/profile');
  };

  const label = formatTokensShort(balance);

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={openBalances}
      hitSlop={6}
      accessibilityLabel={`Token balance ${label}`}
      accessibilityRole="button">
      <View style={styles.pill}>
        <Ionicons name="diamond" size={11} color={Colors.orangeAccent} />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </View>
      <Text style={styles.brand}>Tukua</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(4,31,24,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
    lineHeight: 13,
  },
  brand: {
    marginTop: 1,
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
    lineHeight: 9,
  },
});
