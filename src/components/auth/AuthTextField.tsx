import React from 'react';
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
  ...rest
}: Props) {
  const { s, font } = useAuthScale();
  const iconName = isPassword
    ? obscure
      ? 'eye-off-outline'
      : 'eye-outline'
    : suffixIcon ?? prefixIcon ?? 'mail-outline';

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderWidth: Math.max(1.5, s(2)),
          borderRadius: s(12),
        },
      ]}>
      <TextInput
        placeholder={hint}
        placeholderTextColor={Colors.mutedForeground}
        secureTextEntry={isPassword ? obscure : false}
        style={[
          styles.input,
          {
            height: s(45),
            borderWidth: Math.max(1, s(1)),
            borderRadius: s(10),
            paddingHorizontal: s(12),
            paddingRight: s(44),
            fontSize: font(14),
          },
          style,
        ]}
        {...rest}
      />
      <View style={[styles.suffix, { right: s(10), top: s(14) }]}>
        <TouchableOpacity onPress={onToggleObscure} disabled={!isPassword}>
          <Ionicons name={iconName} size={s(18)} color={Colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    borderColor: '#ffffff',
    backgroundColor: Colors.white,
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    backgroundColor: Colors.white,
    color: Colors.foreground,
    borderColor: Colors.border,
  },
  suffix: {
    position: 'absolute',
  },
});
