/**
 * Tukua loaders (owner, 2026-11-07: "make loaders better and beautiful").
 *
 * - <LoaderMark />  the branded spinner: the Tukua app mark inside a faint green ring, with a yellow arc
 *                   running round it and the mark gently breathing. Flat colours, no gradients.
 * - <Loader />      a page-level loading state: the mark (and an optional label) centred in its parent.
 *                   `overlay` lays it over the page (absolute fill, warm-neutral veil) — e.g. a WebView.
 * - <WebPageLoader /> the overlay variant, ready for WebAppScreen / DeskModuleWebScreen.
 *
 * Colours come from the theme palette (school themes apply); default Tukua is #15411D / #F5B800 / #FAF8F3.
 */
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';
import { rgba } from '../dashboard/DashboardKit';

const MARK = require('../../../assets/images/icons/tukua-app-icon-192.png');

export function LoaderMark({ size = 56, color, accent }: { size?: number; color?: string; accent?: string }) {
  const { palette } = useAppTheme();
  const green = color ?? palette.primary;
  const yellow = accent ?? palette.secondary;
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(breathe);
    };
  }, [spin, breathe]);

  const arcStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + breathe.value * 0.08 }],
    opacity: 0.88 + breathe.value * 0.12,
  }));

  const stroke = Math.max(2.5, Math.round(size / 16));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.28;
  const markSize = Math.round(size * 0.58);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={rgba(green, 0.12)} strokeWidth={stroke} fill="none" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, arcStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={yellow}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          {
            width: markSize,
            height: markSize,
            borderRadius: markSize * 0.28,
            overflow: 'hidden',
            backgroundColor: green,
          },
          markStyle,
        ]}>
        <Image source={MARK} style={{ width: markSize, height: markSize }} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

export type LoaderProps = {
  /** Short line under the mark, e.g. "Loading your classes…". */
  label?: string;
  size?: number;
  /** Lay the loader over the page (absolute fill with a warm-neutral veil) instead of filling the parent. */
  overlay?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Page-level loading state: fills its parent and centres the branded mark. */
export function Loader({ label, size = 56, overlay = false, style }: LoaderProps) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        overlay ? [StyleSheet.absoluteFill, { backgroundColor: rgba(palette.muted || '#FAF8F3', 0.92) }] : styles.fill,
        styles.center,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading'}>
      <LoaderMark size={size} />
      {label ? <Text style={[styles.label, { color: rgba(palette.primary, 0.72) }]}>{label}</Text> : null}
    </View>
  );
}

/** Overlay loader for a WebView page (WebAppScreen, DeskModuleWebScreen). */
export function WebPageLoader({ label }: { label?: string }) {
  return <Loader overlay label={label} />;
}

const styles = StyleSheet.create({
  // flexGrow (not flex: 1) so it never collapses to 0 inside a ScrollView or an auto-height wrapper.
  fill: { flexGrow: 1, alignSelf: 'stretch', paddingVertical: 32 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: {
    marginTop: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
