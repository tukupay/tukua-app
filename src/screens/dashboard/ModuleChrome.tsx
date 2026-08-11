import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { useAppTheme } from '../../context/AppThemeContext';
import { GlassPanel } from '../../components/dashboard/Glass';

/** Shared back chrome for native dashboard module screens. */
export function ModuleBackBar({
  label = 'Dashboard',
  onBack,
}: {
  label?: string;
  onBack: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable style={styles.back} onPress={onBack} hitSlop={10}>
      <Ionicons name="chevron-back" size={22} color={palette.primary} />
      <Text style={[styles.backText, { color: palette.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function ModuleKicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

/** Title + tiny module blurb under the back bar. */
export function ModuleScreenHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.moduleDesc}>{description}</Text> : null}
    </View>
  );
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
  const { palette } = useAppTheme();
  return (
    <GlassPanel tone="frost" intensity={42} radius={16}>
      <View style={styles.cardInner}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
        {onRetry ? (
          <Pressable style={[styles.retry, { backgroundColor: palette.primary }]} onPress={onRetry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </GlassPanel>
  );
}

/** Glass content card for module list rows / detail blocks. */
export function ModuleGlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <GlassPanel tone="frost" intensity={40} radius={16} style={[styles.moduleCard, style]}>
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
  backText: { fontWeight: '600', fontSize: 15 },
  headerBlock: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  moduleDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.mutedForeground,
  },
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: { color: Colors.white, fontWeight: '700' },
});
