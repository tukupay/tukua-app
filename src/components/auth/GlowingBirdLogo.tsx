import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Images } from '../../constants/images';

/** Trimmed bird master aspect (512×841). */
const BIRD_ASPECT = 512 / 841;

type Props = {
  /** Square edge length (legacy). Prefer height/width for wordmark use. */
  size?: number;
  height?: number;
  width?: number;
};

/** Gentle scale pulse — no background halo or color shift. */
export function GlowingBirdLogo({ size = 52, height, width }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const h = height ?? size;
  const w = width ?? (height != null ? Math.round(height * BIRD_ASPECT) : size);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[styles.wrap, { width: w, height: h }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image
          source={Images.logoTrimmed}
          style={{ width: w, height: h }}
          resizeMode="contain"
          accessibilityLabel="Tukua logo"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
