/**
 * The one page look for the signed-in app (owner, 2026-11-07: "same theme like dashboard" everywhere):
 * the theme's warm neutral page (palette.muted) with the Tukua maths pattern over it, and white cards
 * (radius 16, faint edge, soft lift). Colours come from the active palette, so school themes keep the
 * same layout with their own primary + secondary.
 */
import React, { type ReactNode } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';
import { CARD, PatternTiles } from '../dashboard/DashboardKit';

export { CARD, INK, rgba } from '../dashboard/DashboardKit';

const PATTERN_TILE = require('../../../assets/images/brand/tukua-pattern-tile.webp');

/** Page fill + pattern, absolutely filling its parent. Put it first inside a screen's root view. */
export function ThemedBackdrop({ patternOpacity = 0.35 }: { patternOpacity?: number }) {
  const { palette } = useAppTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palette.muted }]}>
      <PatternTiles opacity={patternOpacity} />
    </View>
  );
}

/** A screen root with the themed backdrop behind its children. */
export function ThemedPage({
  children,
  style,
  patternOpacity,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  patternOpacity?: number;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.page, { backgroundColor: palette.muted }, style]}>
      <ThemedBackdrop patternOpacity={patternOpacity} />
      {children}
    </View>
  );
}

/** Soft lift shared with the dashboard's MenuCard. */
export const CARD_SHADOW: ViewStyle = Platform.select<ViewStyle>({
  ios: { shadowColor: '#0F2A1A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: { boxShadow: '0px 4px 12px rgba(15,42,26,0.08)' } as ViewStyle,
}) as ViewStyle;

/** Card surface in the dashboard style (no title row; use DashboardKit.MenuCard for a titled section). */
export const CARD_SURFACE: ViewStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderRadius: CARD.radius,
  borderWidth: 1,
  borderColor: CARD.border,
  ...CARD_SHADOW,
};

/**
 * The maths pattern tinted one colour (white on the dark header bar), tiled down from `offsetY`
 * so a second copy lower down (e.g. inside the header's fade) lines up with the first.
 */
export function TintedPattern({
  color = '#FFFFFF',
  opacity = 0.45,
  offsetY = 0,
  rows = 1,
}: {
  color?: string;
  opacity?: number;
  offsetY?: number;
  rows?: number;
}) {
  const { width } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}>
      <View style={{ marginTop: offsetY }}>
        {Array.from({ length: rows }, (_, i) => (
          <Image
            key={i}
            source={PATTERN_TILE}
            style={{ width, height: width, tintColor: color }}
            resizeMode="cover"
          />
        ))}
      </View>
    </View>
  );
}

/**
 * A dark panel in the landing look: flat palette.primary with the whitened maths pattern
 * (e.g. a balance card). Children sit above the pattern.
 */
export function PrimaryPatternPanel({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.panel, { backgroundColor: palette.primary }, style]}>
      <TintedPattern opacity={0.4} />
      {children}
    </View>
  );
}

const WAVE_VIEW_W = 1440;
const WAVE_VIEW_H = 60;
/** Bottom edge of a hero: the landing TopWave's rhythm, flattened to a short lip. */
const HERO_WAVE_PATH =
  'M0 0 L1440 0 L1440 18 C1330 44 1210 52 1090 40 C930 24 800 10 650 22 C480 36 330 60 180 54 C110 51 50 40 0 28 Z';

/**
 * Full-width hero in the landing look: palette.primary with the whitened pattern and a gentle wave
 * bottom edge (the page pattern shows below the wave). Sits directly under the app's top bar.
 */
export function WaveHero({
  children,
  style,
  waveHeight = 26,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  waveHeight?: number;
}) {
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  return (
    <View style={[{ paddingBottom: waveHeight }, style]}>
      <View
        pointerEvents="none"
        style={[styles.heroFill, { bottom: waveHeight, backgroundColor: palette.primary }]}>
        <TintedPattern opacity={0.4} />
      </View>
      <View pointerEvents="none" style={[styles.heroWave, { height: waveHeight + 1 }]}>
        <Svg
          width={width}
          height={waveHeight + 1}
          viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
          preserveAspectRatio="none">
          <Path d={HERO_WAVE_PATH} fill={palette.primary} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  panel: { borderRadius: CARD.radius, overflow: 'hidden' },
  heroFill: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  heroWave: { position: 'absolute', left: 0, right: 0, bottom: -1 },
});
