import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Images } from '../../constants/images';
import { RuggedGlowStar } from './RuggedGlowStar';
import { Colors } from '../../theme/yana';

type Props = {
  text: string;
  compact?: boolean;
  showStar?: boolean;
  login?: boolean;
  /** Light outline for wordmark on green patterned surfaces. */
  onGreen?: boolean;
  scale?: number;
};

const GRADIENT = ['#0A3D2E', '#E85D04'] as const;

const STROKE_OFFSETS: Array<[number, number]> = [
  [-1.2, -1.2],
  [0, -1.4],
  [1.2, -1.2],
  [-1.4, 0],
  [1.4, 0],
  [-1.2, 1.2],
  [0, 1.4],
  [1.2, 1.2],
];

/** ~3px white letter stroke to match Desk login. */
const STROKE_OFFSETS_LOGIN: Array<[number, number]> = [
  [-2.8, -2.8],
  [0, -3.2],
  [2.8, -2.8],
  [-3.2, 0],
  [3.2, 0],
  [-2.8, 2.8],
  [0, 3.2],
  [2.8, 2.8],
  [-1.6, -3],
  [1.6, -3],
  [-1.6, 3],
  [1.6, 3],
  [-3, -1.6],
  [3, -1.6],
  [-3, 1.6],
  [3, 1.6],
];

export function loginWordmarkMetrics(text: string, compact?: boolean, scale = 1) {
  const fontSize = (compact ? 36 : 44) * scale;
  const letterSpacing = (compact ? 0.4 : 0.6) * scale;
  const maskW = Math.ceil(
    text.length * fontSize * 0.58 + Math.max(0, text.length - 1) * letterSpacing + 18 * scale,
  );
  const maskH = (compact ? 46 : 56) * scale;
  return { fontSize, letterSpacing, maskW, maskH };
}

/**
 * Brand wordmark. Login: transparent letter cutout over HD art + letter outline.
 * Elsewhere: green→orange gradient mask.
 */
export function ColorChangingText({
  text,
  compact,
  showStar = false,
  login = false,
  onGreen = false,
  scale = 1,
}: Props) {
  const slideProgress = useRef(new Animated.Value(0)).current;
  const panProgress = useRef(new Animated.Value(0)).current;
  const glowProgress = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const slideLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(slideProgress, { toValue: 1, duration: 7000, useNativeDriver: true }),
        Animated.timing(slideProgress, { toValue: 0, duration: 7000, useNativeDriver: true }),
      ]),
    );
    const panLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(panProgress, { toValue: 1, duration: 22000, useNativeDriver: true }),
        Animated.timing(panProgress, { toValue: 0, duration: 22000, useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowProgress, { toValue: 0.85, duration: 2600, useNativeDriver: true }),
        Animated.timing(glowProgress, { toValue: 0.35, duration: 2600, useNativeDriver: true }),
      ]),
    );

    slideLoop.start();
    panLoop.start();
    glowLoop.start();
    return () => {
      slideLoop.stop();
      panLoop.stop();
      glowLoop.stop();
    };
  }, [slideProgress, panProgress, glowProgress]);

  const translateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-1.5, 1.5],
  });

  const artShift = panProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 12],
  });

  const textStyle = [
    styles.text,
    compact && styles.textCompact,
    login && styles.textLogin,
    login && compact && styles.textLoginCompact,
  ];

  const loginMetrics = loginWordmarkMetrics(text, compact, scale);
  const fontSize = login ? loginMetrics.fontSize : compact ? 46 : 54;
  const letterSpacing = login ? loginMetrics.letterSpacing : 1.2;
  const maskW = login
    ? loginMetrics.maskW
    : Math.ceil(text.length * fontSize * 0.58 + Math.max(0, text.length - 1) * letterSpacing + 18);
  const maskH = login ? loginMetrics.maskH : compact ? 44 : 50;
  const artW = maskW * 2.2;
  const artH = maskH * 2.4;
  const strokeOffsets = (login ? STROKE_OFFSETS_LOGIN : STROKE_OFFSETS).map(
    ([dx, dy]) => [dx * scale, dy * scale] as [number, number],
  );
  const loginType = login
    ? { fontSize, lineHeight: fontSize + 6 * scale, letterSpacing }
    : null;

  if (login) {
    return (
      <View style={[styles.outer, styles.outerLogin]}>
        <View style={[styles.loginWrap, { width: maskW, height: maskH }]}>
          {strokeOffsets.map(([dx, dy], i) => (
            <View
              key={`stroke-${i}`}
              pointerEvents="none"
              style={[
                styles.strokeLayer,
                { transform: [{ translateX: dx }, { translateY: dy }] },
              ]}>
              <Text
                style={[
                  textStyle,
                  loginType,
                  onGreen ? styles.strokeLetterOnGreen : styles.strokeLetter,
                ]}>
                {text}
              </Text>
            </View>
          ))}

          <MaskedView
            style={{ width: maskW, height: maskH }}
            maskElement={
              <View style={[styles.maskRoot, { width: maskW, height: maskH }]}>
                <Text style={[textStyle, loginType, styles.maskInk]}>{text}</Text>
              </View>
            }>
            <View style={[styles.artClip, { width: maskW, height: maskH }]}>
              <Animated.Image
                source={Images.wordmarkFill}
                style={[
                  styles.artImage,
                  {
                    width: artW,
                    height: artH,
                    transform: [{ translateX: artShift }],
                  },
                ]}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
          </MaskedView>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.outer, { transform: [{ translateX }] }]}>
      <View style={styles.titleWrap}>
        <MaskedView
          style={styles.masked}
          maskElement={
            <View style={styles.maskRoot}>
              <Text style={[textStyle, styles.maskInk]}>{text}</Text>
            </View>
          }>
          <LinearGradient colors={[...GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }}>
            <Text style={[textStyle, styles.gradientPlaceholder]}>{text}</Text>
          </LinearGradient>
        </MaskedView>

        {showStar ? (
          <Animated.View
            style={[
              styles.starBadge,
              compact && styles.starBadgeCompact,
              {
                opacity: glowProgress,
                transform: [
                  {
                    scale: glowProgress.interpolate({
                      inputRange: [0.35, 0.85],
                      outputRange: [0.94, 1.06],
                    }),
                  },
                ],
              },
            ]}>
            <RuggedGlowStar compact={compact} />
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
  },
  outerLogin: {
    alignSelf: 'center',
  },
  loginWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  strokeLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeLetter: {
    color: Colors.brandGreenDark,
  },
  strokeLetterOnGreen: {
    color: '#ffffff',
  },
  maskRoot: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskInk: {
    color: '#000000',
  },
  artClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artImage: {
    position: 'absolute',
  },
  text: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Cormorant_700Bold',
    letterSpacing: 1.2,
    color: '#000',
  },
  textCompact: {
    fontSize: 46,
    lineHeight: 50,
  },
  textLogin: {
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: 0.6,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  textLoginCompact: {
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  masked: {
    alignSelf: 'center',
  },
  gradientPlaceholder: {
    opacity: 0,
  },
  titleWrap: {
    position: 'relative',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: 2,
    right: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeCompact: {
    top: 0,
    right: -16,
  },
});
