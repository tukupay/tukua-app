import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type Props = { text: string; compact?: boolean };

/** Two-tone brand gradient with slow drift and rugged translucent glow star. */
const GRADIENT = ['#1F8B4C', '#7C3AED'] as const;

function RuggedGlowStar({ compact }: { compact?: boolean }) {
  const size = compact ? 16 : 20;
  const core = compact ? 8 : 10;

  return (
    <View style={[styles.starStack, { width: size, height: size }]}>
      <Text
        style={[
          styles.starLayer,
          {
            fontSize: size,
            opacity: 0.18,
            color: '#FBBF24',
            transform: [{ rotate: '12deg' }, { translateX: -1 }, { translateY: 1 }],
          },
        ]}>
        ✦
      </Text>
      <Text
        style={[
          styles.starLayer,
          {
            fontSize: size * 0.85,
            opacity: 0.28,
            color: '#F59E0B',
            transform: [{ rotate: '-8deg' }, { translateX: 1 }],
          },
        ]}>
        ✦
      </Text>
      <Text
        style={[
          styles.starLayer,
          {
            fontSize: core,
            opacity: 0.55,
            color: 'rgba(251, 191, 36, 0.75)',
          },
        ]}>
        ✦
      </Text>
      <View style={styles.starHalo} />
    </View>
  );
}

export function ColorChangingText({ text, compact }: Props) {
  const slideProgress = useRef(new Animated.Value(0)).current;
  const glowProgress = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const slideLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(slideProgress, { toValue: 1, duration: 7000, useNativeDriver: true }),
        Animated.timing(slideProgress, { toValue: 0, duration: 7000, useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowProgress, { toValue: 0.85, duration: 2600, useNativeDriver: true }),
        Animated.timing(glowProgress, { toValue: 0.35, duration: 2600, useNativeDriver: true }),
      ]),
    );

    slideLoop.start();
    glowLoop.start();
    return () => {
      slideLoop.stop();
      glowLoop.stop();
    };
  }, [slideProgress, glowProgress]);

  const translateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 3],
  });

  const textStyle = [styles.text, compact && styles.textCompact];

  return (
    <Animated.View style={[styles.outer, { transform: [{ translateX }] }]}>
      <View style={styles.titleWrap}>
        <MaskedView
          style={styles.masked}
          maskElement={<Text style={textStyle}>{text}</Text>}>
          <LinearGradient
            colors={[...GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}>
            <Text style={[textStyle, styles.gradientPlaceholder]}>{text}</Text>
          </LinearGradient>
        </MaskedView>

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
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
  },
  titleWrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  masked: {
    alignSelf: 'center',
  },
  text: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Cormorant_700Bold',
    letterSpacing: 0.8,
  },
  textCompact: {
    fontSize: 46,
    lineHeight: 50,
  },
  gradientPlaceholder: {
    opacity: 0,
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
  starStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLayer: {
    position: 'absolute',
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(251, 191, 36, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
      android: {},
    }),
  },
  starHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});
