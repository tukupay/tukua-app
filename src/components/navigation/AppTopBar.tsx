/**
 * The app's top bar shell (owner, 2026-11-07: "the top nav make it reusable even on profile pages. as is even
 * the curve"): flat palette.primary with the maths pattern whitened over it, a gentle wave lip (like the
 * landing's TopWave) and below it the one allowed fade, showing the same pattern as it fades out.
 *
 * - variant 'floating' (NativeAppHeader over the tabs): absolutely positioned; page content scrolls under the
 *   wave + fade (~30px overlap by design). Bar body is FLOATING_HEADER_BODY tall under the safe area.
 * - variant 'stack' (a stack screen's `header`): takes its whole height in layout, fade included, so nothing
 *   hides under the curve. With `underAppHeader` (stack screens inside the tabs, where the floating app header
 *   sits on top), the app header's bar is reserved and the back + title row sits right under it, so the two
 *   read as one green bar with one curve.
 *
 * Pass `children` to replace the default row (back button · title · right).
 */
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';
import { FLOATING_HEADER_BODY } from '../../constants/layout';
import { useAppTheme } from '../../context/AppThemeContext';
import { TintedPattern } from '../theme/ThemedPage';

export const APP_TOP_BAR_WAVE_H = 9;
export const APP_TOP_BAR_FADE_H = 30;
/** Height of the back + title row of a stack header. */
export const APP_TOP_BAR_ROW_H = 44;
const BAR_PATTERN_OPACITY = 0.42;
const WAVE_VIEW_W = 1440;
const WAVE_VIEW_H = 40;
const WAVE_PATH =
  'M0 0 L1440 0 L1440 12 C1330 30 1210 34 1090 26 C930 15 800 6 650 14 C480 24 330 40 180 36 C110 34 50 26 0 18 Z';

/** Total layout height of a 'stack' AppTopBar. */
export function appTopBarStackHeight(safeTop: number, underAppHeader = false): number {
  const top = underAppHeader ? safeTop + FLOATING_HEADER_BODY : safeTop;
  return top + APP_TOP_BAR_ROW_H + APP_TOP_BAR_WAVE_H + APP_TOP_BAR_FADE_H;
}

export type AppTopBarProps = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  children?: ReactNode;
  variant?: 'floating' | 'stack';
  underAppHeader?: boolean;
  /** Colour behind the fade in 'stack' mode (the page colour). Default: palette.muted. */
  pageColor?: string;
};

export function AppTopBar({
  title,
  onBack,
  right,
  children,
  variant = 'floating',
  underAppHeader = false,
  pageColor,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { width: screenW } = useWindowDimensions();
  const stack = variant === 'stack';
  const rowTop = stack ? (underAppHeader ? insets.top + FLOATING_HEADER_BODY : insets.top) : insets.top;
  const barH = stack ? rowTop + APP_TOP_BAR_ROW_H : insets.top + FLOATING_HEADER_BODY;
  const totalH = barH + APP_TOP_BAR_WAVE_H + APP_TOP_BAR_FADE_H;
  const patternRows = Math.ceil(totalH / Math.max(1, screenW)) + 1;

  const row = children ?? (
    <>
      {onBack ? (
        <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={palette.secondary} />
        </TouchableOpacity>
      ) : null}
      {title ? (
        <Text style={[styles.title, !onBack && styles.titleNoBack]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.flex} />
      )}
      {right ? <View style={styles.right}>{right}</View> : null}
    </>
  );

  return (
    <View
      pointerEvents="box-none"
      style={
        stack
          ? [styles.stackWrap, { height: totalH, backgroundColor: pageColor ?? palette.muted }]
          : styles.floatWrap
      }>
      {/* Fade under the bar: the bar's colour and pattern, fading out over the page. */}
      <MaskedView
        pointerEvents="none"
        style={[styles.abs, { top: barH, height: APP_TOP_BAR_WAVE_H + APP_TOP_BAR_FADE_H }]}
        maskElement={
          <LinearGradient
            colors={['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.14)', 'rgba(0,0,0,0)']}
            locations={[0, 0.3, 0.68, 1]}
            style={StyleSheet.absoluteFill}
          />
        }>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.primary }]}>
          <TintedPattern opacity={BAR_PATTERN_OPACITY} offsetY={-barH} rows={patternRows} />
        </View>
      </MaskedView>

      {/* Solid bar with the whitened maths pattern */}
      <View pointerEvents="none" style={[styles.barFill, { height: barH, backgroundColor: palette.primary }]}>
        <TintedPattern opacity={BAR_PATTERN_OPACITY} rows={patternRows} />
      </View>

      {/* Wave lip (solid), drawn over the top of the fade */}
      <View pointerEvents="none" style={[styles.abs, { top: barH - 1, height: APP_TOP_BAR_WAVE_H + 1 }]}>
        <Svg
          width={screenW}
          height={APP_TOP_BAR_WAVE_H + 1}
          viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
          preserveAspectRatio="none">
          <Path d={WAVE_PATH} fill={palette.primary} />
        </Svg>
      </View>

      {stack ? (
        <View style={[styles.stackRow, { top: rowTop, height: APP_TOP_BAR_ROW_H }]}>{row}</View>
      ) : (
        <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>{row}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  stackWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 5,
    minHeight: FLOATING_HEADER_BODY,
    backgroundColor: 'transparent',
    gap: 8,
  },
  stackRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  back: { padding: 4 },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  titleNoBack: { marginLeft: 4 },
  flex: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
