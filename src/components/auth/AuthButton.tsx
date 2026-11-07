import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

type Props = {
  text: string;
  enabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  /** 'green' (default): dark green pill, white text. 'yellow': Tukua yellow pill, dark green text. */
  variant?: 'green' | 'yellow';
};

/** Flat pill CTA (TukuPay's AuthButton: 50 high, fully round, flat brand colour, presses in a little). No gradient. */
export function AuthButton({ text, enabled = true, loading = false, onPress, variant = 'green' }: Props) {
  const { s, font } = useAuthScale();
  const active = enabled && !loading;
  const yellow = variant === 'yellow';
  const fill = yellow ? Colors.orange : Colors.primary;
  const ink = yellow ? Colors.primary : Colors.white;
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, { transform: [{ scale: pressed && active ? 0.98 : 1 }] }]}
      onPress={onPress}
      disabled={!active}
      accessibilityRole="button"
      accessibilityState={{ disabled: !active, busy: loading }}>
      <View
        style={[
          styles.button,
          {
            height: s(50),
            borderRadius: s(30),
            backgroundColor: fill,
            opacity: active || loading ? 1 : 0.45,
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={ink} />
        ) : (
          <Text style={[styles.label, { fontSize: font(16), color: ink }]}>{text}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
});
