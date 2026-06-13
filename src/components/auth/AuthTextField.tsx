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
  const iconName = isPassword
    ? obscure
      ? 'eye-off-outline'
      : 'eye-outline'
    : suffixIcon ?? prefixIcon ?? 'mail-outline';

  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholder={hint}
        placeholderTextColor={Colors.mutedForeground}
        secureTextEntry={isPassword ? obscure : false}
        style={[styles.input, style]}
        {...rest}
      />
      <View style={styles.suffix}>
        <TouchableOpacity onPress={onToggleObscure} disabled={!isPassword}>
          <Ionicons name={iconName} size={18} color={Colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 44,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: Colors.white,
    color: Colors.foreground,
  },
  suffix: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
});
