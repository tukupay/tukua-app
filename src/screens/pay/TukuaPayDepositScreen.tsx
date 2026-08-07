import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import {
  MIN_TOPUP_KES,
  pollMpesaTopUpStatus,
  tokensFromKes,
  topUpViaMpesa,
  TOPUP_PRESETS,
} from '../../lib/wallet';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPayDeposit'>;

export function TukuaPayDepositScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(String(MIN_TOPUP_KES));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone, phone]);

  const submit = async () => {
    const kes = Number(amount);
    setError(null);
    if (!phone.trim()) {
      setError('Enter the M-Pesa number to charge.');
      return;
    }
    if (!(kes >= 1)) {
      setError('Enter at least KES 1.');
      return;
    }
    setBusy(true);
    setStatus('Sending M-Pesa prompt…');
    try {
      const tokens = tokensFromKes(kes);
      const { checkout_request_id } = await topUpViaMpesa({
        phone_number: phone.trim(),
        amount: kes,
        user_id: session?.user?.id,
        tokens,
      });
      setStatus('Check your phone for the M-Pesa prompt…');
      const result = await pollMpesaTopUpStatus(checkout_request_id, {
        onTick: (s) => {
          if (s.status === 'pending') setStatus('Waiting for M-Pesa confirmation…');
        },
      });
      if (result.status === 'completed') {
        setStatus(result.message || 'Payment received — tokens added.');
      } else if (result.status === 'failed' || result.status === 'cancelled') {
        setError(result.message || 'The M-Pesa payment was not completed.');
        setStatus('');
      } else {
        setStatus('Still processing — check Tukua Pay shortly.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('');
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
        <ModuleScreenHeader title="Deposit with M-Pesa" description="Min KES 1. You’ll get an STK prompt on your phone." />
        <ModuleGlassCard>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="07XX XXX XXX"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
          />
          <Text style={styles.label}>Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={styles.presets}>
            {TOPUP_PRESETS.map((p) => (
              <Pressable key={p} style={styles.chip} onPress={() => setAmount(String(p))}>
                <Text style={styles.chipText}>{p}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.err}>{error}</Text> : null}
          {status ? <Text style={styles.status}>{status}</Text> : null}
          <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={() => void submit()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pay with M-Pesa</Text>}
          </Pressable>
        </ModuleGlassCard>
      </View>
    </View>
  );
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
    backgroundColor: '#fff',
  },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  chipText: { fontWeight: '700', color: Colors.primary },
  err: { color: '#B91C1C', marginBottom: 8, fontWeight: '600' },
  status: { color: Colors.primary, marginBottom: 8, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
