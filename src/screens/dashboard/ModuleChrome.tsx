import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { GlassPanel } from '../../components/dashboard/Glass';

/** Shared back chrome for native dashboard module screens. */
export function ModuleBackBar({
  label = 'Dashboard',
  onBack,
}: {
  label?: string;
  onBack: () => void;
}) {
  return (
    <Pressable style={styles.back} onPress={onBack} hitSlop={10}>
      <Ionicons name="chevron-back" size={22} color={Colors.ink} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

export function ModuleKicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function ModuleEmpty({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <GlassPanel tone="frost" intensity={42} radius={16}>
      <View style={styles.cardInner}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        {onRetry ? (
          <Pressable style={styles.retry} onPress={onRetry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </GlassPanel>
  );
}

/** Glass content card for module list rows / detail blocks. */
export function ModuleGlassCard({ children }: { children: React.ReactNode }) {
  return (
    <GlassPanel tone="frost" intensity={40} radius={16} style={styles.moduleCard}>
      <View style={styles.cardInner}>{children}</View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backText: { color: Colors.ink, fontWeight: '600', fontSize: 15 },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
    marginBottom: 14,
  },
  moduleCard: { marginBottom: 10 },
  cardInner: {
    padding: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.ink },
  emptyBody: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  retry: {
    marginTop: 14,
    backgroundColor: Colors.brandGreenMid,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: { color: Colors.white, fontWeight: '700' },
});
