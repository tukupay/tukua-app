import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';

const STEPS = [
  { icon: 'school-outline' as const, label: 'Learn', hint: 'Courses & skills' },
  { icon: 'trending-up-outline' as const, label: 'Grow', hint: 'AI guidance' },
  { icon: 'briefcase-outline' as const, label: 'Get hired', hint: 'Jobs & funding' },
];

export function BrandSteps({ compact }: { compact?: boolean }) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.label}>
          <View style={styles.step}>
            <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
              <Ionicons name={step.icon} size={compact ? 11 : 12} color={Colors.primary} />
            </View>
            <Text style={[styles.label, compact && styles.labelCompact]}>{step.label}</Text>
            {!compact && <Text style={styles.hint}>{step.hint}</Text>}
          </View>
          {i < STEPS.length - 1 && (
            <View style={styles.connector}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={styles.dot} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rowCompact: { marginTop: 6 },
  step: {
    alignItems: 'center',
    width: 72,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(31,139,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 9,
    marginTop: 3,
  },
  hint: {
    fontSize: 8,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 1,
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(31,139,76,0.25)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
});
