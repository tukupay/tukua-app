import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return `rgba(10, 61, 46, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Desk-style faint themed SVG mesh behind login / register. */
export function ThemedPageSvg() {
  const { width, height } = useWindowDimensions();
  const { palette } = useAppTheme();
  const primary = hexToRgba(palette.primary, 0.14);
  const secondary = hexToRgba(palette.secondary, 0.1);
  const tertiary = hexToRgba(palette.tertiary, 0.1);

  return (
    <View style={styles.root} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect width={width} height={height} fill="none" />
        {Array.from({ length: Math.ceil(height / 60) + 1 }, (_, i) => (
          <Path
            key={`h-${i}`}
            d={`M0 ${i * 60} H${width}`}
            stroke={primary}
            strokeWidth={1}
            opacity={0.35}
          />
        ))}
        {Array.from({ length: Math.ceil(width / 60) + 1 }, (_, i) => (
          <Path
            key={`v-${i}`}
            d={`M${i * 60} 0 V${height}`}
            stroke={primary}
            strokeWidth={1}
            opacity={0.35}
          />
        ))}
        <Circle cx={-40} cy={-40} r={180} fill="none" stroke={primary} strokeWidth={2} strokeDasharray="10 5" />
        <Circle cx={-40} cy={-40} r={130} fill="none" stroke={secondary} strokeWidth={1.5} />
        <Circle cx={width + 40} cy={-30} r={140} fill="none" stroke={secondary} strokeWidth={2} />
        <Polygon
          points={`${width * 0.08},${height - 20} ${width * 0.28},${height - 160} ${width * 0.48},${height - 20}`}
          fill="none"
          stroke={tertiary}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    opacity: 0.55,
  },
});
