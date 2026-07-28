import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { resolveDisplayImageUri } from '../../lib/resolveMediaUri';

type Props = {
  name?: string;
  uri?: string | null;
  size?: number;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/** Profile photo when URL works; otherwise letter initials (never a blank circle). */
export function ProfileAvatar({ name = 'Account', uri, size = 24 }: Props) {
  const cleaned = resolveDisplayImageUri(uri);
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => initialsFromName(name), [name]);
  const showImage = Boolean(cleaned) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [cleaned]);

  if (showImage && cleaned) {
    return (
      <Image
        source={{ uri: cleaned }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        onError={() => setFailed(true)}
        accessibilityLabel={`${name} profile photo`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      accessibilityLabel={`${name} avatar`}>
      {initials ? (
        <Text style={[styles.initial, { fontSize: size * (initials.length > 1 ? 0.36 : 0.42) }]}>
          {initials}
        </Text>
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
