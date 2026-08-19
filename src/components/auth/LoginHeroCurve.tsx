import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';
import { Images } from '../../constants/images';
import { useAuthScale } from './useAuthScale';

/**
 * Desk login S-curve, rotated so it is the bottom edge of a top photo region.
 * Source (objectBoundingBox, left edge of the form):
 *   M0.14 0 C-0.02 0.12 -0.04 0.28 0.16 0.50 C0.30 0.66 0.42 0.84 0.50 1
 * Rotated 90° CCW: (x,y) → (y, 1-x), then scaled to viewBox 0 0 100 108.
 */
const CURVE_CLIP =
  'M0 0 L100 0 L100 50 C84 58 66 70 50 84 C28 104 12 102 0 86 Z';
const CURVE_EDGE =
  'M0 86 C12 102 28 104 50 84 C66 70 84 58 100 50';

function bez(p0: number, c1: number, c2: number, p1: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p1;
}

/** ViewBox Y of the S-curve edge at X in 0–100. Photo sits above this line. */
function heroCurveEdgeY(nx: number): number {
  if (nx <= 50) {
    const t = Math.max(0, Math.min(1, nx / 50));
    return bez(86, 102, 104, 84, t);
  }
  const t = Math.max(0, Math.min(1, (nx - 50) / 50));
  return bez(84, 70, 58, 50, t);
}

/** True when a window point sits on the hero photo (inside the clip). */
export function isInsideHeroCurve(
  pageX: number,
  pageY: number,
  screenW: number,
  curveH: number,
): boolean {
  if (curveH <= 0 || pageY < 0 || pageY > curveH) return false;
  const nx = (pageX / Math.max(1, screenW)) * 100;
  const ny = (pageY / curveH) * 108;
  return ny <= heroCurveEdgeY(nx) - 8;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return `rgba(10, 61, 46, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function LoginHeroCurve({ height }: { height: number }) {
  const { width } = useWindowDimensions();
  const { s } = useAuthScale();
  const { palette } = useAppTheme();
  if (height <= 0) return null;

  const wash = hexToRgba(palette.primary, 0.62);
  const ground = hexToRgba(palette.muted, 0.22);

  return (
    <View style={[styles.root, { height }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 100 108" preserveAspectRatio="none">
        <Defs>
          <ClipPath id="loginHeroClip" clipRule="nonzero">
            <Path d={CURVE_CLIP} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#loginHeroClip)">
          <SvgImage
            href={Images.loginHero}
            x="0"
            y="0"
            width="100"
            height="108"
            preserveAspectRatio="xMidYMid slice"
          />
          <Rect x="0" y="0" width="100" height="108" fill={ground} />
          <Rect x="0" y="0" width="100" height="108" fill={wash} />
        </G>
        <Path
          d={CURVE_EDGE}
          fill="none"
          stroke="#ffffff"
          strokeWidth={Math.max(4, s(7))}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <Path
          d={CURVE_EDGE}
          fill="none"
          stroke={palette.primary}
          strokeWidth={Math.max(2, s(3.5))}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    overflow: 'visible',
  },
});
