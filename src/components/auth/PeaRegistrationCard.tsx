import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_PEA_CONFIG, fetchPeaConfig, formatPeaMessage, PeaConfig } from '../../lib/peaConfig';
import { PeaStatus } from '../../lib/peaRegistrationFlow';
import { formatTokenCount } from '../../lib/tokenCounter';
import { Colors } from '../../theme/yana';

type Props = {
  phone: string;
  peaStatus?: PeaStatus;
  peaMessage?: string;
  peaAmount?: number;
  loaded?: boolean;
};

export function PeaRegistrationCard({ phone, peaStatus = 'idle', peaMessage = '', peaAmount, loaded }: Props) {
  const [peaConfig, setPeaConfig] = useState<PeaConfig>(DEFAULT_PEA_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(loaded ?? false);

  useEffect(() => {
    if (loaded) {
      setConfigLoaded(true);
      return;
    }
    let cancelled = false;
    fetchPeaConfig().then((cfg) => {
      if (!cancelled) setPeaConfig(cfg);
      if (!cancelled) setConfigLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  const amount = peaAmount ?? peaConfig.amount;
  const explanation = formatPeaMessage(peaConfig.message, amount, peaConfig.free_tokens);
  const phoneLabel = phone.trim() || 'your phone';
  const isLoaded = loaded ?? configLoaded;

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.title}>One-time registration fee — KES {amount}</Text>
          {!isLoaded ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading registration details…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.body}>{explanation}</Text>
              <Text style={styles.body}>
                You&apos;ll receive an M-Pesa prompt on{' '}
                <Text style={styles.phone}>{phoneLabel}</Text> — enter your PIN to complete registration.
              </Text>
              <Text style={styles.bonus}>
                As a welcome gift, you&apos;ll receive{' '}
                <Text style={styles.bonusStrong}>{formatTokenCount(peaConfig.free_tokens)} bonus tokens</Text>{' '}
                once registration is complete.
              </Text>
            </>
          )}
        </View>
      </View>

      {peaStatus !== 'idle' && peaMessage ? (
        <View
          style={[
            styles.statusBox,
            peaStatus === 'completed' && styles.statusOk,
            peaStatus === 'failed' && styles.statusErr,
          ]}>
          {(peaStatus === 'sending' || peaStatus === 'pending') && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 6 }} />
          )}
          <Text
            style={[
              styles.statusText,
              peaStatus === 'completed' && styles.statusTextOk,
              peaStatus === 'failed' && styles.statusTextErr,
            ]}>
            {peaMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(31,139,76,0.3)',
    backgroundColor: 'rgba(31,139,76,0.06)',
    marginBottom: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  iconWrap: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(31,139,76,0.12)' },
  meta: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingText: { fontSize: 12, color: Colors.mutedForeground },
  body: { fontSize: 12, color: Colors.mutedForeground, marginTop: 6, lineHeight: 18 },
  phone: { fontWeight: '700', color: Colors.foreground },
  bonus: { fontSize: 12, color: Colors.primary, fontWeight: '500', marginTop: 8, lineHeight: 18 },
  bonusStrong: { fontWeight: '700' },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.muted,
  },
  statusOk: { backgroundColor: 'rgba(31,139,76,0.12)' },
  statusErr: { backgroundColor: 'rgba(239,68,68,0.1)' },
  statusText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.foreground },
  statusTextOk: { color: Colors.primary },
  statusTextErr: { color: Colors.destructive },
});
