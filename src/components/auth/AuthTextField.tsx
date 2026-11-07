import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

type Props = TextInputProps & {
  hint: string;
  isPassword?: boolean;
  obscure?: boolean;
  onToggleObscure?: () => void;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  /** @deprecated use suffixIcon */
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  /** Shown under the line in red; the line turns red too. */
  error?: string | null;
};

/**
 * One-line auth field (TukuPay's underline style): no box, just a line under the text.
 * Line 1px border colour → 2px brand green when focused, red with a message on error.
 * The leading icon is kept (muted, green when focused) and the password eye stays on the right.
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
  const leadIcon = suffixIcon ?? prefixIcon ?? (isPassword ? 'lock-closed-outline' : 'mail-outline');
  const hasError = Boolean(error);
  const lineColor = hasError ? Colors.destructive : focused ? Colors.primary : Colors.border;
  const lineWidth = focused || hasError ? 2 : 1;
  const iconColor = hasError ? Colors.destructive : focused ? Colors.primary : Colors.mutedForeground;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.field,
          {
            minHeight: s(50),
            borderBottomColor: lineColor,
            borderBottomWidth: lineWidth,
            // Keep the text from jumping when the line thickens.
            paddingBottom: lineWidth === 2 ? 0 : 1,
          },
        ]}>
        <Ionicons name={leadIcon} size={s(19)} color={iconColor} />
        <TextInput
          placeholder={hint}
          placeholderTextColor={Colors.mutedForeground}
          secureTextEntry={isPassword ? obscure : false}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              height: s(48),
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
  field: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
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
    marginTop: 4,
    color: Colors.destructive,
    fontFamily: 'Poppins_400Regular',
  },
});
