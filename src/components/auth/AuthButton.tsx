import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/yana';

type Props = {
  text: string;
  enabled?: boolean;
  onPress: () => void;
};

/** Matches RegisterScreen primary button styling. */
export function AuthButton({ text, enabled = true, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, !enabled && styles.disabled]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.85}>
      <Text style={styles.label}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
});
