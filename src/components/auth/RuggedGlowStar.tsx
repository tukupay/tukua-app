import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

/** Translucent glow star used on login branding and the app header mark. */
export function RuggedGlowStar({ compact, mini }: { compact?: boolean; mini?: boolean }) {
  const size = mini ? 11 : compact ? 16 : 20;
  const core = mini ? 6 : compact ? 8 : 10;

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

const styles = StyleSheet.create({
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
