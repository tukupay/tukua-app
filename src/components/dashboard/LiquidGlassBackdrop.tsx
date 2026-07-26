import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Light canvas + soft liquid color blobs (design principle from TukuPay mock).
 * Glass morphism needs a patterned light surface underneath to frost.
 */
export function LiquidGlassBackdrop() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );

    const la = loop(a, 16000);
    const lb = loop(b, 22000, 600);
    const lc = loop(c, 18000, 1200);
    la.start();
    lb.start();
    lc.start();
    return () => {
      la.stop();
      lb.stop();
      lc.stop();
    };
  }, [a, b, c]);

  const cxPink = a.interpolate({ inputRange: [0, 1], outputRange: [W * 0.12, W * 0.28] });
  const cyPink = a.interpolate({ inputRange: [0, 1], outputRange: [H * 0.08, H * 0.18] });
  const rxPink = b.interpolate({ inputRange: [0, 1], outputRange: [110, 140] });

  const cxPurple = b.interpolate({ inputRange: [0, 1], outputRange: [W * 0.88, W * 0.72] });
  const cyPurple = b.interpolate({ inputRange: [0, 1], outputRange: [H * 0.14, H * 0.26] });

  const cxOrange = c.interpolate({ inputRange: [0, 1], outputRange: [W * 0.7, W * 0.55] });
  const cyOrange = a.interpolate({ inputRange: [0, 1], outputRange: [H * 0.42, H * 0.52] });

  const cxBlue = a.interpolate({ inputRange: [0, 1], outputRange: [W * 0.18, W * 0.32] });
  const cyBlue = c.interpolate({ inputRange: [0, 1], outputRange: [H * 0.58, H * 0.48] });

  const cxCream = b.interpolate({ inputRange: [0, 1], outputRange: [W * 0.5, W * 0.62] });
  const cyCream = c.interpolate({ inputRange: [0, 1], outputRange: [H * 0.72, H * 0.62] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#FFFFFF', '#F7FAF8', '#FBFCFB', '#FFFFFF']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="blobPink" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F7306E" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#F7306E" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobPurple" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#EB78F9" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#EB78F9" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobOrange" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F1A455" stopOpacity="0.42" />
            <Stop offset="100%" stopColor="#F1A455" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobBlue" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00AEFF" stopOpacity="0.32" />
            <Stop offset="70%" stopColor="#3963F9" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#3963F9" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobCream" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFF8E4" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FFF8E4" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blobGreen" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#15411D" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#15411D" stopOpacity="0" />
          </RadialGradient>
          <SvgLinearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#EE7D13" stopOpacity="0.55" />
            <Stop offset="55%" stopColor="#15411D" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#15411D" stopOpacity="0.08" />
          </SvgLinearGradient>
        </Defs>

        {/* Soft liquid color orbs */}
        <AnimatedEllipse cx={cxPink} cy={cyPink} rx={rxPink} ry={120} fill="url(#blobPink)" />
        <AnimatedEllipse
          cx={cxPurple}
          cy={cyPurple}
          rx={130}
          ry={150}
          fill="url(#blobPurple)"
        />
        <AnimatedEllipse
          cx={cxOrange}
          cy={cyOrange}
          rx={150}
          ry={120}
          fill="url(#blobOrange)"
        />
        <AnimatedEllipse cx={cxBlue} cy={cyBlue} rx={140} ry={110} fill="url(#blobBlue)" />
        <AnimatedEllipse
          cx={cxCream}
          cy={cyCream}
          rx={160}
          ry={130}
          fill="url(#blobCream)"
        />
        <AnimatedCircle
          cx={a.interpolate({ inputRange: [0, 1], outputRange: [W * 0.85, W * 0.75] })}
          cy={c.interpolate({ inputRange: [0, 1], outputRange: [H * 0.78, H * 0.7] })}
          r={90}
          fill="url(#blobGreen)"
        />

        {/* Brand ribbon wash (orange → green) */}
        <Path
          d={`M${-20} ${H * 0.32} C ${W * 0.25} ${H * 0.22}, ${W * 0.55} ${H * 0.4}, ${W * 1.05} ${H * 0.28}`}
          stroke="url(#ribbon)"
          strokeWidth={48}
          strokeLinecap="round"
          fill="none"
          opacity={0.35}
        />
        <Path
          d={`M${W * 0.05} ${H * 0.88} C ${W * 0.35} ${H * 0.78}, ${W * 0.7} ${H * 0.95}, ${W * 1.1} ${H * 0.82}`}
          stroke="url(#ribbon)"
          strokeWidth={36}
          strokeLinecap="round"
          fill="none"
          opacity={0.22}
        />
      </Svg>

      {/* Extra blur wash so blobs feel liquid under glass */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.4)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
