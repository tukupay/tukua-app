import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from '../dashboard/ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import {
  fetchMyKyc,
  lookupTokenShareRecipient,
  transferTokens,
  type TokenShareLookup,
} from '../../lib/profileApi';
import { tokensFromKes } from '../../lib/wallet';
import { humanizeError } from '../../lib/humanizeError';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPaySend'>;

export function TukuaPaySendScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [found, setFound] = useState<TokenShareLookup | null>(null);
  const [kycOk, setKycOk] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const kyc = await fetchMyKyc();
        setKycOk(Boolean(kyc.approved));
      } catch {
        setKycOk(false);
      }
    })();
  }, []);

  const lookup = useCallback(async () => {
    setError(null);
    setOk(null);
    setFound(null);
    const q = recipient.trim();
    if (!q) {
      setError('Enter a recipient email or phone number.');
      return;
    }
    setLooking(true);
    try {
      const row = await lookupTokenShareRecipient(q);
      if (!row?.user_id) throw new Error('Recipient not found on Tukua.');
      setFound(row);
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setLooking(false);
    }
  }, [recipient]);

  const submit = async () => {
    setError(null);
    setOk(null);
    if (!kycOk) {
      setError('Complete identity verification before sending.');
      return;
    }
    const kes = Number(amount);
    if (!(kes > 0)) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (!found?.user_id) {
      setError('Look up a recipient first.');
      return;
    }
    setBusy(true);
    try {
      const tokens = tokensFromKes(kes);
      await transferTokens({
        to_user_id: found.user_id,
        tokens,
        note: note.trim() || undefined,
      });
      setOk(`Sent ${tokens.toLocaleString()} tokens (≈ KES ${kes}).`);
      setAmount('');
      setFound(null);
      setRecipient('');
    } catch (e) {
      const msg = humanizeError(e);
      if (/insufficient|not enough|balance/i.test(msg)) {
        setError('Not enough in this wallet.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <View
        style={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 18,
          flex: 1,
        }}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Tukua Pay</ModuleKicker>
        <ModuleScreenHeader
          title="Send"
          description="Find someone by email or phone, confirm the masked card, then send."
        />
        {kycOk === false ? (
          <ModuleGlassCard>
            <Text style={styles.err}>Verify your identity before sending.</Text>
            <Pressable style={styles.btn} onPress={() => navigation.navigate('TukuaPayKyc')}>
              <Text style={styles.btnText}>Open KYC</Text>
            </Pressable>
          </ModuleGlassCard>
        ) : (
          <ModuleGlassCard>
            <Text style={styles.label}>Email or phone</Text>
            <TextInput
              value={recipient}
              onChangeText={(t) => {
                setRecipient(t);
                setFound(null);
              }}
              autoCapitalize="none"
              keyboardType="default"
              placeholder="friend@example.com or 07XX…"
              placeholderTextColor={Colors.mutedForeground}
              style={styles.input}
            />
            <Pressable
              style={[styles.btnSecondary, looking && { opacity: 0.7 }]}
              disabled={looking || busy}
              onPress={() => void lookup()}>
              {looking ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.btnSecondaryText}>Find recipient</Text>
              )}
            </Pressable>

            {found ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recipient</Text>
                <Text style={styles.cardLine}>
                  Name · {found.first_name_masked || found.first_name || 'U***'}
                  {found.last_name_masked ? ` ${found.last_name_masked}` : ''}
                </Text>
                {found.phone_masked ? (
                  <Text style={styles.cardLine}>Phone · {found.phone_masked}</Text>
                ) : null}
                {(found.email_masked || found.email) && (
                  <Text style={styles.cardLine}>
                    Email · {found.email_masked || maskEmail(found.email || '')}
                  </Text>
                )}
              </View>
            ) : null}

            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={styles.input}
              placeholder="For lunch"
              placeholderTextColor={Colors.mutedForeground}
            />
            {error ? <Text style={styles.err}>{error}</Text> : null}
            {ok ? <Text style={styles.ok}>{ok}</Text> : null}
            <Pressable
              style={[styles.btn, (busy || !found) && { opacity: 0.7 }]}
              onPress={() => void submit()}
              disabled={busy || !found}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send</Text>}
            </Pressable>
          </ModuleGlassCard>
        )}
      </View>
    </View>
  );
}

function maskEmail(email: string) {
  if (!email.includes('@')) return '***';
  const [u, d] = email.split('@');
  return `${(u || 'xx').slice(0, 2)}***@${d}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.ink,
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(10,61,46,0.12)',
  },
  cardTitle: { fontWeight: '800', color: Colors.primary, marginBottom: 6 },
  cardLine: { color: Colors.ink, fontSize: 14, marginBottom: 2 },
  err: { color: '#B91C1C', marginBottom: 8, fontWeight: '600' },
  ok: { color: Colors.primary, marginBottom: 8, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSecondaryText: { color: Colors.primary, fontWeight: '800' },
});
