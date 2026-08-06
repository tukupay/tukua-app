import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  MIN_TOPUP_KES,
  pollMpesaTopUpStatus,
  tokensFromKes,
  topUpViaMpesa,
} from '../../lib/wallet';
import { Colors } from '../../theme/yana';

type ZeroTokenModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onTopUpComplete?: () => void;
  onOpenBalances?: () => void;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function ZeroTokenModal({
  visible,
  onDismiss,
  onTopUpComplete,
  onOpenBalances,
}: ZeroTokenModalProps) {
  const { profile, session } = useAuth();
  const { showDialog } = useDialog();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const minKes = MIN_TOPUP_KES;
  const minTokens = tokensFromKes(minKes);

  useEffect(() => {
    if (!visible) return;
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [visible, profile?.phone, phone]);

  const submitTopUp = async () => {
    if (!phone.trim()) {
      showDialog({ title: 'Phone required', message: 'Enter the M-Pesa number to charge.', variant: 'warning' });
      return;
    }
    setBusy(true);
    setStatus('Sending M-Pesa prompt…');
    try {
      const { checkout_request_id, tokens } = await topUpViaMpesa({
        phone_number: phone.trim(),
        amount: minKes,
        user_id: session?.user?.id,
      });
      setStatus('Check your phone for the M-Pesa prompt…');
      const result = await pollMpesaTopUpStatus(checkout_request_id, {
        onTick: (s) => {
          if (s.status === 'pending') setStatus('Waiting for M-Pesa confirmation…');
        },
      });
      if (result.status === 'completed') {
        setStatus('');
        showDialog({
          title: 'Top-up successful',
          message:
            result.message ||
            `${(result.tokens || tokens).toLocaleString()} tokens have been added to your balance.`,
          variant: 'success',
        });
        onTopUpComplete?.();
        onDismiss();
      } else if (result.status === 'failed' || result.status === 'cancelled') {
        setStatus('');
        showDialog({
          title: 'Top-up not completed',
          message: result.message || 'The M-Pesa payment was not completed.',
          variant: 'warning',
        });
      } else {
        setStatus('');
        showDialog({
          title: 'Still processing',
          message: 'We could not confirm the payment yet — check Balances shortly.',
          variant: 'warning',
        });
      }
    } catch (e) {
      setStatus('');
      showDialog({ title: 'Top-up failed', message: errorMessage(e), variant: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="diamond-outline" size={26} color={Colors.primary} />
          </View>

          <Text style={styles.title}>You have zero tokens to use the app</Text>
          <Text style={styles.message}>
            Top up with M-Pesa to unlock AI chat, courses, and dashboard modules.
          </Text>

          <View style={styles.packageBox}>
            <Text style={styles.packageLabel}>Minimum package</Text>
            <Text style={styles.packageValue}>
              KES {minKes.toLocaleString()} · {minTokens.toLocaleString()} tokens
            </Text>
          </View>

          <Text style={styles.fieldLabel}>M-Pesa phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0712345678"
            placeholderTextColor={Colors.mutedForeground}
            editable={!busy}
          />

          {status ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnPrimary, busy && styles.btnDisabled]}
            onPress={() => void submitTopUp()}
            disabled={busy}>
            <Text style={styles.btnPrimaryText}>Pay with M-Pesa</Text>
          </TouchableOpacity>

          {onOpenBalances ? (
            <TouchableOpacity style={styles.btnSecondary} onPress={onOpenBalances} disabled={busy}>
              <Text style={styles.btnSecondaryText}>Open Balances</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.btnCancel} onPress={onDismiss} disabled={busy}>
            <Text style={styles.btnCancelText}>Not now</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,31,24,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.12)',
    alignItems: 'stretch',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  packageBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  packageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  packageValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.foreground,
    backgroundColor: Colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  btnPrimary: {
    marginTop: 16,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: { opacity: 0.65 },
  btnSecondary: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
  },
  btnCancel: {
    marginTop: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
});
