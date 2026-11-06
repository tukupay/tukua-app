import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

type Props = {
  text: string;
  enabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

/** Solid hero CTA — same green→teal as dashboard balance cards. One radius, no double stroke. */
export function AuthButton({ text, enabled = true, loading = false, onPress }: Props) {
  const { s, font } = useAuthScale();
  const active = enabled && !loading;
  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      disabled={!active}
      activeOpacity={0.88}>
      <LinearGradient
        colors={active ? ['#15411D', '#006D69'] : ['#9BB0A6', '#8AA39B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          {
            height: s(52),
            borderRadius: 16,
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.label, { fontSize: font(16) }]}>{text}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: Colors.white,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
});
