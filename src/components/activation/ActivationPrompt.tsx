import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/yana';
import { onActivationRequired, type ActivationNotice } from '../../lib/activation';
import { navigateProfile } from '../../navigation/rootNavigation';

/**
 * "Activate your account / school" card, shown when the API refuses with account_not_activated or
 * school_not_activated (lib/activation). Buy tokens opens Profile → Balances, where tokens are bought.
 */
export function ActivationPrompt() {
  const [notice, setNotice] = useState<ActivationNotice | null>(null);
  useEffect(() => onActivationRequired(setNotice), []);
  const school = notice?.code === 'school_not_activated';
  return (
    <Modal visible={Boolean(notice)} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>{school ? 'Activate your school' : 'Activate your account'}</Text>
          <Text style={styles.body}>
            {school
              ? 'The school has not bought tokens yet, so its records stay closed. Ask the school to buy tokens, or buy them for the school.'
              : 'You can look around now. Doing things (AI answers, saving, sending) starts after your first token purchase.'}
          </Text>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.ghost]} onPress={() => setNotice(null)} accessibilityRole="button">
              <Text style={styles.ghostText}>Not now</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: Colors.primary }]}
              accessibilityRole="button"
              onPress={() => {
                setNotice(null);
                navigateProfile('Balances');
              }}
            >
              <Text style={styles.primaryText}>Buy tokens</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: Colors.background, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 20, color: Colors.mutedForeground },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  ghost: { borderWidth: 1, borderColor: Colors.border },
  ghostText: { color: Colors.foreground, fontWeight: '600' },
  primaryText: { color: '#fff', fontWeight: '700' },
});
