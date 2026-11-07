import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from '../FlatFill'; // flat fill: no gradients
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';
import { Colors } from '../../theme/yana';
import { rgba as hexToRgba } from '../../theme/color';

/** Desk-style faint themed SVG mesh behind login / register. */
export function ThemedPageSvg() {
  const { width, height } = useWindowDimensions();
  const { palette } = useAppTheme();
  const primary = hexToRgba(palette.primary, 0.14);
  const secondary = hexToRgba(palette.secondary, 0.1);
  const tertiary = hexToRgba(palette.tertiary, 0.1);
  const page = Colors.background;

  return (
    <View style={styles.root} pointerEvents="none">
      <Svg width={width} height={height} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}>
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
        <Circle cx={-40} cy={-40} r={150} fill="none" stroke={primary} strokeWidth={1.25} opacity={0.45} />
        <Circle cx={width + 40} cy={-30} r={120} fill="none" stroke={secondary} strokeWidth={1.25} opacity={0.4} />
        <Polygon
          points={`${width * 0.08},${height - 20} ${width * 0.28},${height - 160} ${width * 0.48},${height - 20}`}
          fill="none"
          stroke={tertiary}
          strokeWidth={1.5}
        />
      </Svg>
      <LinearGradient
        colors={[page, 'transparent', 'transparent', page]}
        locations={[0, 0.2, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[page, 'transparent', 'transparent', page]}
        locations={[0, 0.16, 0.84, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
