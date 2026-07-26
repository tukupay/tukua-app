import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  focused: boolean;
  size?: number;
};

function sparklePath(cx: number, cy: number, r: number): string {
  const tip = r;
  const waist = r * 0.38;
  return [
    `M ${cx} ${cy - tip}`,
    `C ${cx + waist} ${cy - waist} ${cx + waist} ${cy - waist} ${cx + tip} ${cy}`,
    `C ${cx + waist} ${cy + waist} ${cx + waist} ${cy + waist} ${cx} ${cy + tip}`,
    `C ${cx - waist} ${cy + waist} ${cx - waist} ${cy + waist} ${cx - tip} ${cy}`,
    `C ${cx - waist} ${cy - waist} ${cx - waist} ${cy - waist} ${cx} ${cy - tip}`,
    'Z',
  ].join(' ');
}

/**
 * AI tab icon — large left + two small right sparkles (unchanged design).
 * Animation is scale-only so the glyph shape/colors stay the same.
 */
export function AiTabIcon({ focused, size = 24 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: focused ? 1.1 : 1.04,
          duration: focused ? 850 : 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: focused ? 850 : 1300,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [focused, pulse]);

  // Slot stays `size` (nav layout). Glyph renders larger and overflows evenly.
  const draw = Math.round(size * 1.32);
  const vb = 24;
  const large = sparklePath(8.8, 12, 9.4);
  const smallTop = sparklePath(18.6, 6.6, 4.8);
  const smallBot = sparklePath(18.8, 17.2, 4.2);
  const gradId = focused ? 'aiSparkleOn' : 'aiSparkleOff';

  return (
    <View style={[styles.slot, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.draw,
          {
            width: draw,
            height: draw,
            marginLeft: -(draw - size) / 2,
            marginTop: -(draw - size) / 2,
            transform: [{ scale: pulse }],
          },
        ]}>
        <Svg width={draw} height={draw} viewBox={`0 0 ${vb} ${vb}`}>
          <Defs>
            <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={focused ? '#22D3EE' : '#67E8F9'} />
              <Stop offset="0.45" stopColor={focused ? '#7C3AED' : '#A78BFA'} />
              <Stop offset="1" stopColor={focused ? '#EC4899' : '#F9A8D4'} />
            </SvgLinearGradient>
          </Defs>
          <Path d={large} fill={`url(#${gradId})`} />
          <Path d={smallTop} fill={`url(#${gradId})`} />
          <Path d={smallBot} fill={`url(#${gradId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draw: {
    overflow: 'visible',
  },
});
