import React, { useState } from 'react';
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
import { lookupTokenShareRecipient, transferTokens } from '../../lib/profileApi';
import { tokensFromKes } from '../../lib/wallet';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPaySend'>;

export function TukuaPaySendScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setOk(null);
    const kes = Number(amount);
    if (!(kes > 0)) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (tab === 'phone') {
      setError('Send by phone is not available yet — use Tukua email ID.');
      return;
    }
    const email = recipient.trim().toLowerCase();
    if (!email.includes('@')) {
      setError('Enter a valid recipient email.');
      return;
    }
    setBusy(true);
    try {
      const lookup = await lookupTokenShareRecipient(email);
      const userId = String(
        (lookup as { user_id?: string; id?: string })?.user_id ||
          (lookup as { id?: string })?.id ||
          '',
      ).trim();
      if (!userId) throw new Error('Recipient not found on Tukua.');
      const tokens = tokensFromKes(kes);
      await transferTokens({
        to_user_id: userId,
        tokens,
        note: note.trim() || undefined,
      });
      setOk(`Sent ${tokens.toLocaleString()} tokens (≈ KES ${kes}).`);
      setAmount('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
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
        <ModuleScreenHeader title="Send" description="Transfer tokens to another Tukua account." />
        <ModuleGlassCard>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, tab === 'email' && styles.tabOn]}
              onPress={() => setTab('email')}>
              <Text style={[styles.tabText, tab === 'email' && styles.tabTextOn]}>Tukua ID</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, tab === 'phone' && styles.tabOn]}
              onPress={() => setTab('phone')}>
              <Text style={[styles.tabText, tab === 'phone' && styles.tabTextOn]}>Phone</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>{tab === 'email' ? 'Recipient email' : 'Phone'}</Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            keyboardType={tab === 'phone' ? 'phone-pad' : 'email-address'}
            placeholder={tab === 'email' ? 'friend@example.com' : '07XX XXX XXX'}
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
          <Pressable style={[styles.btn, busy && { opacity: 0.7 }]} onPress={() => void submit()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send</Text>}
          </Pressable>
        </ModuleGlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(10,61,46,0.06)',
    alignItems: 'center',
  },
  tabOn: { backgroundColor: Colors.primary },
  tabText: { fontWeight: '700', color: Colors.primary },
  tabTextOn: { color: '#fff' },
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
  err: { color: '#B91C1C', marginBottom: 8, fontWeight: '600' },
  ok: { color: Colors.primary, marginBottom: 8, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
