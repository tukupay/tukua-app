import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';

type Props = {
  name?: string;
  uri?: string | null;
  size?: number;
};

export function ProfileAvatar({ name = 'Account', uri, size = 24 }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityLabel={`${name} profile photo`}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      {initial !== '?' ? (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      ) : (
        <Ionicons name="person" size={size * 0.55} color={Colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: 'rgba(31,139,76,0.2)',
    backgroundColor: Colors.primaryLight,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(31,139,76,0.2)',
  },
  initial: {
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
});
