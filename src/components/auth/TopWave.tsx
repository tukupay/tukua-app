import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../theme/yana';

/**
 * Flat dark-green wave across the top of the signed-out pages (TukuPay's TopWave, same traced path).
 * One flat colour, no gradient. Full width, natural aspect.
 */
const VIEW_W = 1440;
const VIEW_H = 396;
const PATH =
  'M0 193.8 C40 214 70 216 98 227.8 C150 250 200 300 252 350.5 C290 378 320 390 363 395.8 C420 394 470 378 521 344.5 C580 300 650 225 727.8 175.8 C790 150 840 144 881.5 144.2 C960 148 1030 168 1101 186 C1170 200 1220 202 1278 190.8 C1340 172 1390 130 1439.8 81.2 L1439.8 0 L0 0 Z';

export function topWaveHeight(width: number): number {
  return (width * VIEW_H) / VIEW_W;
}

export function TopWave({ color = Colors.primary }: { color?: string }) {
  const { width } = useWindowDimensions();
  const height = topWaveHeight(width);
  return (
    <View pointerEvents="none" style={[styles.root, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none">
        <Path d={PATH} fill={color} />
      </Svg>
    </View>
  );
}

/** The faint Tukua maths pattern behind a signed-out page (light tile on the warm page colour). */
export function TukuaPatternLayer({ opacity = 0.45 }: { opacity?: number }) {
  return (
    <Image
      source={require('../../../assets/images/brand/tukua-pattern-tile.webp')}
      resizeMode="cover"
      style={[StyleSheet.absoluteFill, { opacity, width: '100%', height: '100%' }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0 },
});
