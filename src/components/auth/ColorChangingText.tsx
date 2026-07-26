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
        Animated.timing(panProgress, { toValue: 1, duration: 18000, useNativeDriver: true }),
        Animated.timing(panProgress, { toValue: 0, duration: 18000, useNativeDriver: true }),
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

  // Compact centered wordmark — room for “Tukua Ai”
  const fontSize = login ? (compact ? 30 : 36) : compact ? 46 : 54;
  const letterSpacing = login ? (compact ? 1.4 : 1.8) : 1.2;
  const maskW = Math.ceil(text.length * fontSize * 0.58 + Math.max(0, text.length - 1) * letterSpacing + 14);
  const maskH = login ? (compact ? 40 : 46) : compact ? 44 : 50;
  const artW = maskW * 2.2;
  const artH = maskH * 2.4;

  if (login) {
    return (
      <Animated.View style={[styles.outer, styles.outerLogin, { transform: [{ translateX }] }]}>
        <View style={[styles.loginWrap, { width: maskW, height: maskH }]}>
          {STROKE_OFFSETS.map(([dx, dy], i) => (
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
                <Text style={[textStyle, styles.maskInk]}>{text}</Text>
              </View>
            }>
            <View style={[styles.artClip, { width: maskW, height: maskH }]}>
              <Animated.Image
                source={Images.brandArt}
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
      </Animated.View>
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
    color: 'rgba(255,255,255,0.92)',
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
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  textLoginCompact: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.4,
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
