import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/yana';

/** Green mesh-style background — pure RN views (no SVG, Expo Go safe). */
export function ModernBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['rgba(236,253,245,0.55)', 'rgba(255,255,255,0.25)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(31,139,76,0.04)', 'transparent']}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Dot grid */}
      <View style={styles.dotGrid}>
        {DOTS.map((dot) => (
          <View
            key={dot.id}
            style={[
              styles.dot,
              {
                top: dot.y,
                left: dot.x,
                opacity: dot.o,
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.orb, styles.orbGreen, { top: 80, left: '8%' }]} />
      <View style={[styles.orb, styles.orbGreenSoft, { top: 220, right: '12%' }]} />
      <View style={[styles.orb, styles.orbTeal, { bottom: 140, left: '18%' }]} />
    </View>
  );
}

const DOTS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  x: `${(i % 8) * 12.5 + 4}%` as `${number}%`,
  y: `${Math.floor(i / 8) * 11 + 6}%` as `${number}%`,
  o: 0.18 + (i % 3) * 0.08,
}));

const styles = StyleSheet.create({
  dotGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primaryDark,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbGreen: {
    width: 130,
    height: 130,
    backgroundColor: 'rgba(74,222,128,0.22)',
  },
  orbGreenSoft: {
    width: 110,
    height: 110,
    backgroundColor: 'rgba(16,185,129,0.16)',
  },
  orbTeal: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(45,212,191,0.18)',
  },
});
