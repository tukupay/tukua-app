import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { resolveDisplayImageUri } from '../lib/resolveMediaUri';

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallback?: React.ReactNode;
  accessibilityLabel?: string;
};

/** Image that normalizes URIs and falls back when load fails (no crash). */
export function SafeRemoteImage({
  uri,
  style,
  containerStyle,
  fallback = null,
  accessibilityLabel,
}: Props) {
  const resolved = resolveDisplayImageUri(uri);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return <View style={containerStyle}>{fallback}</View>;
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      onError={() => setFailed(true)}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
