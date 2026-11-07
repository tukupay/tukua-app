import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';
import { useKeyboardReveal } from './KeyboardAwareScroll';

type Props = TextInputProps & {
  hint: string;
  isPassword?: boolean;
  obscure?: boolean;
  onToggleObscure?: () => void;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  /** @deprecated use suffixIcon */
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  /** Shown under the box in red; the border turns red too. */
  error?: string | null;
};

/** Primary green at low strength: the focus halo, and the placeholder while focused. */
const HALO = 'rgba(21,65,29,0.08)';
const HALO_ERROR = 'rgba(239,68,68,0.10)';
const HINT_FOCUSED = 'rgba(21,65,29,0.45)';

/**
 * Auth field (TukuPay's boxed style): a white rounded box with a light 1px border on every side.
 * Focused: the border turns 2px brand green, a soft green halo fades in around the box, the box springs up a touch
 * (1.015) and the leading icon and hint turn green. Error: red border and a red line under the box.
 * Inside a KeyboardAwareScroll, a focused field is kept above the keyboard.
 */
export function AuthTextField({
  hint,
  isPassword,
  obscure,
  onToggleObscure,
  suffixIcon,
  prefixIcon,
  error,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { s, font } = useAuthScale();
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<View>(null);
  const revealer = useKeyboardReveal();
  const leadIcon = suffixIcon ?? prefixIcon ?? (isPassword ? 'lock-closed-outline' : 'mail-outline');
  const hasError = Boolean(error);
  const borderColor = hasError ? Colors.destructive : focused ? Colors.primary : Colors.border;
  const borderWidth = focused || hasError ? 2 : 1;
  const iconColor = hasError ? Colors.destructive : focused ? Colors.primary : Colors.mutedForeground;

  const active = useSharedValue(0);
  useEffect(() => {
    active.value = focused ? 1 : 0;
  }, [focused, active]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: withTiming(active.value, { duration: 180 }),
  }));
  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(active.value ? 1.015 : 1, { damping: 14, stiffness: 220, mass: 0.6 }) }],
  }));

  // Release the reveal hook if the field goes away while focused.
  useEffect(() => () => revealer?.blurred(wrapRef.current), [revealer]);

  const radius = s(14);
  const height = s(52);
  // The border grows inward from 1px to 2px: take the extra pixel off the padding so the text does not move.
  const padH = s(14) - (borderWidth - 1);

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      <Animated.View style={boxStyle}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            { borderRadius: radius + 4, backgroundColor: hasError ? HALO_ERROR : HALO },
            haloStyle,
          ]}
        />
        <View
          style={[
            styles.field,
            {
              height,
              borderRadius: radius,
              borderColor,
              borderWidth,
              paddingHorizontal: padH,
            },
          ]}>
          <Ionicons name={leadIcon} size={s(19)} color={iconColor} />
          <TextInput
            placeholder={hint}
            placeholderTextColor={focused ? HINT_FOCUSED : Colors.mutedForeground}
            secureTextEntry={isPassword ? obscure : false}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
            accessibilityLabel={rest.accessibilityLabel ?? hint}
            onFocus={(e) => {
              setFocused(true);
              revealer?.focused(wrapRef.current);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              revealer?.blurred(wrapRef.current);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              {
                height: height - 4,
                paddingHorizontal: s(10),
                fontSize: font(15),
              },
              style,
            ]}
            {...rest}
          />
          {isPassword ? (
            <TouchableOpacity
              onPress={onToggleObscure}
              hitSlop={10}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={obscure ? 'Show password' : 'Hide password'}>
              <Ionicons
                name={obscure ? 'eye-off-outline' : 'eye-outline'}
                size={s(19)}
                color={focused ? Colors.primary : Colors.mutedForeground}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
      {hasError ? (
        <Text style={[styles.error, { fontSize: font(12) }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  halo: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  field: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    color: Colors.ink,
    paddingVertical: 0,
  },
  eye: {
    padding: 6,
  },
  error: {
    marginTop: 6,
    marginLeft: 4,
    color: Colors.destructive,
    fontFamily: 'Poppins_400Regular',
  },
});
