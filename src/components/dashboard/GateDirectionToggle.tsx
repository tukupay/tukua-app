import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GateDirection, gateDirectionLabel } from '../../lib/gateScanDirection';
import { Colors } from '../../theme/yana';

type Props = {
  value: GateDirection;
  onChange: (next: GateDirection) => void;
  disabled?: boolean;
  hint?: string;
};

export function GateDirectionToggle({ value, onChange, disabled, hint }: Props) {
  const isIn = value === 'in';
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>This scan will</Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.chip, isIn && styles.chipActiveIn, disabled && styles.chipDisabled]}
          disabled={disabled}
          onPress={() => onChange('in')}
          accessibilityRole="button"
          accessibilityState={{ selected: isIn }}>
          <Ionicons name="log-in-outline" size={16} color={isIn ? '#fff' : Colors.brandGreenDark} />
          <Text style={[styles.chipText, isIn && styles.chipTextActive]}>{gateDirectionLabel('in')}</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, !isIn && styles.chipActiveOut, disabled && styles.chipDisabled]}
          disabled={disabled}
          onPress={() => onChange('out')}
          accessibilityRole="button"
          accessibilityState={{ selected: !isIn }}>
          <Ionicons name="log-out-outline" size={16} color={!isIn ? '#fff' : Colors.brandGreenDark} />
          <Text style={[styles.chipText, !isIn && styles.chipTextActive]}>{gateDirectionLabel('out')}</Text>
        </Pressable>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActiveIn: { backgroundColor: Colors.brandGreenDark, borderColor: Colors.brandGreenDark },
  chipActiveOut: { backgroundColor: '#B45309', borderColor: '#B45309' },
  chipDisabled: { opacity: 0.55 },
  chipText: { fontSize: 14, fontWeight: '700', color: Colors.brandGreenDark },
  chipTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: Colors.mutedForeground, lineHeight: 17 },
});
