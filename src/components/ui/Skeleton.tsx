/**
 * Skeleton blocks with a moving shimmer: a flat block in a faint theme tint, crossed by a soft band of
 * semi-transparent white (three stepped strips, no gradient). `onDark` is for blocks drawn on the green
 * hero card.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../context/AppThemeContext';
import { rgba } from '../dashboard/DashboardKit';

const SWEEP_MS = 1300;

export function Skeleton({
  width = '100%',
  height = 14,
  radius = 8,
  onDark = false,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  const [w, setW] = useState(0);
  const t = useSharedValue(0);

  useEffect(() => {
    if (!w) return;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(t);
  }, [t, w]);

  const band = Math.max(36, w * 0.45);
  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -band + t.value * (w + band * 2) }, { skewX: '-18deg' }],
  }));

  const base = onDark ? 'rgba(255,255,255,0.12)' : rgba(palette.primary, 0.07);
  const glow = onDark ? 0.1 : 0.55;

  return (
    <View
      onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
      style={[{ width, height, borderRadius: radius, backgroundColor: base, overflow: 'hidden' }, style]}>
      {w ? (
        <Animated.View pointerEvents="none" style={[styles.band, { width: band }, bandStyle]}>
          <View style={[styles.strip, { backgroundColor: `rgba(255,255,255,${glow * 0.35})` }]} />
          <View style={[styles.strip, { backgroundColor: `rgba(255,255,255,${glow * 0.7})` }]} />
          <View style={[styles.strip, { backgroundColor: `rgba(255,255,255,${glow})` }]} />
          <View style={[styles.strip, { backgroundColor: `rgba(255,255,255,${glow * 0.7})` }]} />
          <View style={[styles.strip, { backgroundColor: `rgba(255,255,255,${glow * 0.35})` }]} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** A few text-line skeletons, the last one shorter. */
export function SkeletonLines({ lines = 3, gap = 8, height = 12 }: { lines?: number; gap?: number; height?: number }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={height} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: -8, bottom: -8, left: 0, flexDirection: 'row' },
  strip: { flex: 1 },
});
