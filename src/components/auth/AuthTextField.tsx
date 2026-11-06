import React, { useState } from 'react';
import {
  StyleSheet,
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
};

export function AuthTextField({
  hint,
  isPassword,
  obscure,
  onToggleObscure,
  suffixIcon,
  prefixIcon,
  style,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const { s, font } = useAuthScale();
  const [focused, setFocused] = useState(false);
  const leadIcon = suffixIcon ?? prefixIcon ?? (isPassword ? 'lock-closed-outline' : 'mail-outline');

  return (
    <View
      style={[
        styles.field,
        {
          minHeight: s(52),
          borderRadius: 16,
          paddingLeft: s(14),
          paddingRight: s(10),
          borderColor: focused ? 'rgba(238,125,19,0.7)' : 'rgba(10,61,46,0.07)',
          borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}>
      <Ionicons name={leadIcon} size={s(18)} color={focused ? Colors.orange : Colors.mutedForeground} />
      <TextInput
        placeholder={hint}
        placeholderTextColor={Colors.mutedForeground}
        secureTextEntry={isPassword ? obscure : false}
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
            height: s(52),
            paddingHorizontal: s(10),
            fontSize: font(15),
          },
          style,
        ]}
        {...rest}
      />
      {isPassword ? (
        <TouchableOpacity onPress={onToggleObscure} hitSlop={10} style={styles.eye}>
          <Ionicons
            name={obscure ? 'eye-off-outline' : 'eye-outline'}
            size={s(18)}
            color={Colors.mutedForeground}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
});
