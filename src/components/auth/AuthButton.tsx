import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';
import { Colors } from '../../theme/yana';
import { useInsideCurve } from './CurvePaint';
import { useAuthScale } from './useAuthScale';

type Props = {
  text: string;
  enabled?: boolean;
  onPress: () => void;
};

/** Solid brand-green primary action. Always bordered; thicker double stroke on the hero curve. */
export function AuthButton({ text, enabled = true, onPress }: Props) {
  const { palette } = useAppTheme();
  const { ref, onLayout, inside } = useInsideCurve();
  const { s, font } = useAuthScale();
  const outerBorder = Math.max(inside ? 2 : 1.5, s(inside ? 3.5 : 2));
  const innerBorder = Math.max(1.5, s(2.5));
  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onLayout}
      style={[
        styles.outer,
        {
          borderRadius: s(14),
          borderWidth: outerBorder,
          borderColor: inside ? '#ffffff' : palette.primary,
        },
      ]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            height: s(48),
            borderRadius: s(12),
            borderColor: inside ? palette.primary : 'rgba(255,255,255,0.55)',
            borderWidth: innerBorder,
          },
          !enabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={!enabled}
        activeOpacity={0.85}>
        <Text style={[styles.label, { fontSize: font(16) }]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: Colors.brandGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.white,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
});
