import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';

const STEPS = [
  { icon: 'school-outline' as const, label: 'Learn', hint: 'Courses & skills' },
  { icon: 'trending-up-outline' as const, label: 'Grow', hint: 'AI guidance' },
  { icon: 'briefcase-outline' as const, label: 'Get hired', hint: 'Jobs & funding' },
];

export function BrandSteps({ compact, onGreen }: { compact?: boolean; onGreen?: boolean }) {
  const iconColor = onGreen ? 'rgba(255,255,255,0.95)' : Colors.brandGreenDark;
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {STEPS.map((step, i) => (
        <React.Fragment key={step.label}>
          <View style={styles.step}>
            <Ionicons name={step.icon} size={compact ? 13 : 14} color={iconColor} />
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                onGreen && styles.labelOnGreen,
              ]}>
              {step.label}
            </Text>
            {!compact && (
              <Text style={[styles.hint, onGreen && styles.hintOnGreen]}>{step.hint}</Text>
            )}
          </View>
          {i < STEPS.length - 1 && (
            <View style={styles.connector}>
              <View style={[styles.dot, onGreen && styles.dotOnGreen]} />
              <View style={[styles.line, onGreen && styles.lineOnGreen]} />
              <View style={[styles.dot, onGreen && styles.dotOnGreen]} />
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
    marginTop: 6,
    paddingHorizontal: 4,
  },
  rowCompact: { marginTop: 4 },
  step: {
    alignItems: 'center',
    width: 72,
  },
  label: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brandGreenDark,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 9,
    marginTop: 2,
  },
  labelOnGreen: {
    color: 'rgba(255,255,255,0.95)',
  },
  hint: {
    fontSize: 8,
    color: Colors.brandGreenMid,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 1,
    opacity: 0.85,
  },
  hintOnGreen: {
    color: 'rgba(255,255,255,0.65)',
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    width: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(31,139,76,0.25)',
  },
  lineOnGreen: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.brandGreenDark,
    opacity: 0.5,
  },
  dotOnGreen: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    opacity: 1,
  },
});
