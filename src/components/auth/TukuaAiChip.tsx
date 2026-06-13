import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';

/** Flutter BankGptChip layout — Tukua AI branding */
export function TukuaAiChip({ compact }: { compact?: boolean }) {
  return (
    <LinearGradient
      colors={['#DEC1FC', '#FFD3C0']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.chip, compact && styles.chipCompact]}>
      <Ionicons name="sparkles" size={compact ? 16 : 18} color={Colors.foreground} />
      <Text style={[styles.label, compact && styles.labelCompact]}>With Tukua AI</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 55,
  },
  chipCompact: {
    width: 172,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  labelCompact: {
    fontSize: 11,
  },
});
