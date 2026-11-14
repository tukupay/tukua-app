import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthButton } from './AuthButton';
import { Colors } from '../../theme/yana';
import { sendOtp, verifyOtp } from '../../lib/platformAuthApi';
import { humanizeError } from '../../lib/humanizeError';

const RESEND_SECONDS = 45;

/**
 * Phone first (as on TukuPay): we text a 6-digit code and nothing is saved until the person types it.
 * On success it hands back the proof that sign-up sends with the account (auth/register phone_proof).
 */
export function PhoneCodeModal({
  visible,
  phone,
  onClose,
  onVerified,
}: {
  visible: boolean;
  /** The number in +254… form. */
  phone: string;
  onClose: () => void;
  onVerified: (proof: string) => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'' | 'sending' | 'checking'>('');
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);
  const sentFor = useRef('');

  const send = async () => {
    setBusy('sending');
    setError('');
    const res = await sendOtp({ phone_number: phone, purpose: 'sign-up' });
    setBusy('');
    if (!res.ok) {
      setError(humanizeError(res.message || res.error || 'We could not send the code. Try again.'));
      return;
    }
    sentFor.current = phone;
    setWait(RESEND_SECONDS);
  };

  useEffect(() => {
    if (!visible) return;
    setCode('');
    if (sentFor.current !== phone) void send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phone]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const confirm = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy('checking');
    setError('');
    const res = await verifyOtp({ phone_number: phone, code: value });
    setBusy('');
    const proof = res.ok ? res.data?.phone_proof : undefined;
    if (!proof) {
      setError(humanizeError(res.message || res.error || 'That code is not right. Check it and try again.'));
      setCode('');
      return;
    }
    onVerified(proof);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>Confirm your phone</Text>
          <Text style={styles.body}>
            {busy === 'sending' ? 'Sending a code to ' : 'We sent a 6-digit code to '}
            <Text style={styles.bold}>{phone}</Text>. Type it here to continue.
          </Text>
          <TextInput
            value={code}
            onChangeText={(t) => {
              const v = t.replace(/\D/g, '').slice(0, 6);
              setCode(v);
              if (v.length === 6) void confirm(v);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            autoFocus
            placeholder="••••••"
            placeholderTextColor={Colors.mutedForeground}
            style={styles.input}
            accessibilityLabel="Code from the SMS"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AuthButton text="Confirm" enabled={code.length === 6} loading={busy === 'checking'} onPress={() => void confirm()} />
          <Pressable disabled={busy !== '' || wait > 0} onPress={() => void send()} style={styles.linkWrap}>
            <Text style={[styles.link, (busy !== '' || wait > 0) && styles.linkOff]}>
              {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
            </Text>
          </Pressable>
          <Text style={styles.small}>Wrong number? Close this and change it.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 22, gap: 12 },
  title: { fontSize: 19, fontWeight: '700', color: Colors.foreground },
  body: { fontSize: 14, lineHeight: 20, color: Colors.mutedForeground },
  bold: { fontWeight: '700', color: Colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    height: 56,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
    color: Colors.foreground,
    backgroundColor: Colors.background,
  },
  error: { color: Colors.destructive, fontSize: 13, textAlign: 'center' },
  linkWrap: { alignSelf: 'center', paddingVertical: 4 },
  link: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  linkOff: { color: Colors.mutedForeground },
  small: { fontSize: 12, color: Colors.mutedForeground, textAlign: 'center' },
});
