import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GreenPattern } from '../dashboard/DashboardBackground';
import { Colors } from '../../theme/yana';

type Props = {
  text: string;
  enabled?: boolean;
  onPress: () => void;
};

/** Matches RegisterScreen primary button styling — dark green + brand pattern. */
export function AuthButton({ text, enabled = true, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, !enabled && styles.disabled]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.85}>
      <View style={styles.patternClip} pointerEvents="none">
        <GreenPattern darker />
      </View>
      <Text style={styles.label}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  patternClip: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
    zIndex: 1,
  },
});
