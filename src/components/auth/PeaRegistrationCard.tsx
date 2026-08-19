import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPeaMessage } from '../../lib/peaConfig';
import { PeaStatus } from '../../lib/peaRegistrationFlow';
import { formatTokenCount } from '../../lib/tokenCounter';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

type CardProps = {
  phone: string;
  peaStatus?: PeaStatus;
  peaMessage?: string;
  peaAmount: number;
  freeTokens: number;
  message: string;
  loaded?: boolean;
  roleLabel?: string;
};

/** Compact PEA amount — shown from the first register step so the fee is never hidden. */
export function PeaFeeStrip({
  amount,
  loaded,
  roleLabel,
}: {
  amount: number;
  loaded: boolean;
  roleLabel?: string;
}) {
  const { s, font } = useAuthScale();
  return (
    <View
      style={[
        styles.strip,
        { padding: s(12), borderRadius: s(12), marginBottom: s(12), gap: s(4) },
      ]}>
      <Text style={[styles.stripKicker, { fontSize: font(11) }]}>
        One-time registration fee{roleLabel ? ` · ${roleLabel}` : ''}
      </Text>
      {loaded ? (
        <Text style={[styles.stripAmount, { fontSize: font(22) }]}>KES {amount.toLocaleString()}</Text>
      ) : (
        <ActivityIndicator size="small" color={Colors.primary} />
      )}
      <Text style={[styles.stripHint, { fontSize: font(11) }]}>
        Paid with M-Pesa on the last step. Each role has its own fee from Tukua settings.
      </Text>
    </View>
  );
}

export function PeaRegistrationCard({
  phone,
  peaStatus = 'idle',
  peaMessage = '',
  peaAmount,
  freeTokens,
  message,
  loaded = false,
  roleLabel,
}: CardProps) {
  const explanation = formatPeaMessage(message, peaAmount, freeTokens);
  const phoneLabel = phone.trim() || 'your phone';
  const { s, font } = useAuthScale();

  return (
    <View style={[styles.box, { padding: s(16), borderRadius: s(14), marginBottom: s(12), gap: s(12) }]}>
      <View style={[styles.row, { gap: s(10) }]}>
        <View style={[styles.iconWrap, { padding: s(10), borderRadius: s(10) }]}>
          <Ionicons name="phone-portrait-outline" size={s(22)} color={Colors.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.kicker, { fontSize: font(11) }]}>
            One-time M-Pesa registration{roleLabel ? ` · ${roleLabel}` : ''}
          </Text>
          {loaded ? (
            <Text style={[styles.amount, { fontSize: font(26) }]}>KES {peaAmount.toLocaleString()}</Text>
          ) : (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[styles.loadingText, { fontSize: font(12) }]}>Loading fee…</Text>
            </View>
          )}
        </View>
      </View>
      {loaded ? (
        <>
          <Text style={[styles.body, { fontSize: font(13), lineHeight: font(19) }]}>{explanation}</Text>
          <Text style={[styles.body, { fontSize: font(13), lineHeight: font(19) }]}>
            M-Pesa prompt on <Text style={styles.phone}>{phoneLabel}</Text> — enter your PIN to join.
          </Text>
          <Text style={[styles.bonus, { fontSize: font(13), lineHeight: font(19) }]}>
            Welcome gift:{' '}
            <Text style={styles.bonusStrong}>{formatTokenCount(freeTokens)} bonus tokens</Text> after
            payment.
          </Text>
        </>
      ) : null}

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
  strip: {
    borderWidth: 2,
    borderColor: 'rgba(31,139,76,0.35)',
    backgroundColor: 'rgba(31,139,76,0.1)',
  },
  stripKicker: {
    fontWeight: '600',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
  },
  stripAmount: {
    fontWeight: '700',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_700Bold',
  },
  stripHint: { color: Colors.mutedForeground, fontFamily: 'Poppins_400Regular' },
  box: {
    borderWidth: 2,
    borderColor: 'rgba(31,139,76,0.4)',
    backgroundColor: 'rgba(31,139,76,0.08)',
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { backgroundColor: 'rgba(31,139,76,0.14)' },
  meta: { flex: 1, minWidth: 0 },
  kicker: {
    fontWeight: '600',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    fontWeight: '700',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingText: { color: Colors.mutedForeground },
  body: { color: Colors.mutedForeground, fontFamily: 'Poppins_400Regular' },
  phone: { fontWeight: '700', color: Colors.foreground },
  bonus: { color: Colors.primary, fontWeight: '500', fontFamily: 'Poppins_400Regular' },
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
