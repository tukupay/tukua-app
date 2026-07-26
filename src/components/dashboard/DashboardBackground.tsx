import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/yana';
import { LiquidGlassBackdrop } from './LiquidGlassBackdrop';

type Props = {
  /** When true, renders only the pattern / liquid canvas (for scrollable pages). */
  patternOnly?: boolean;
  /** Light animated liquid canvas for glass morphism. */
  liquid?: boolean;
  height?: number;
};

/** Dark green mesh pattern — used on green surfaces app-wide. */
export function GreenPattern({
  style,
  darker = false,
}: {
  style?: object;
  /** Deeper brand greens (landing curve / primary buttons). */
  darker?: boolean;
}) {
  const colors = darker
    ? ([Colors.brandGreenDark, Colors.brandGreen, Colors.primaryDark] as const)
    : ([Colors.brandGreen, Colors.brandGreenMid, Colors.brandGreenDark] as const);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      <View style={[styles.orb, styles.orbC]} />
      {DOTS.map((d, i) => (
        <View key={`d-${i}`} style={[styles.dot, { top: d.t, left: d.l, opacity: d.o }]} />
      ))}
      <View style={[styles.hex, styles.hexA]} />
      <View style={[styles.hex, styles.hexB]} />
    </View>
  );
}

const DOTS = [
  { t: 18, l: 24, o: 0.18 },
  { t: 36, l: 72, o: 0.12 },
  { t: 22, l: 140, o: 0.16 },
  { t: 48, l: 200, o: 0.1 },
  { t: 28, l: 280, o: 0.14 },
  { t: 70, l: 40, o: 0.1 },
  { t: 88, l: 110, o: 0.16 },
  { t: 64, l: 180, o: 0.12 },
  { t: 96, l: 250, o: 0.1 },
  { t: 110, l: 320, o: 0.14 },
  { t: 130, l: 60, o: 0.1 },
  { t: 150, l: 160, o: 0.12 },
  { t: 140, l: 240, o: 0.1 },
];

/**
 * Scrollable header chrome.
 * When `liquid`, no green band — page uses full LiquidGlassBackdrop.
 */
export function DashboardScrollHeader({
  height,
  children,
  liquid,
}: {
  height?: number;
  children?: React.ReactNode;
  liquid?: boolean;
}) {
  return (
    <View
      style={[
        styles.scrollHeader,
        height ? { minHeight: height } : null,
        liquid && styles.scrollHeaderLiquid,
      ]}>
      {!liquid ? <GreenPattern /> : null}
      <View style={styles.scrollHeaderInner}>{children}</View>
      {!liquid ? <View style={styles.curveLip} /> : null}
    </View>
  );
}

/** Fixed full-screen backdrop. */
export function DashboardBackground({ patternOnly, liquid }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {liquid ? <LiquidGlassBackdrop /> : <GreenPattern darker />}
      {!patternOnly && !liquid ? <View style={styles.sheet} /> : null}
    </View>
  );
}

/** Soft green dots/orbs for white module tiles (icons stay dark green on top). */
export function SoftTilePattern() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.softOrb, styles.softOrbA]} />
      <View style={[styles.softOrb, styles.softOrbB]} />
      {TILE_DOTS.map((d, i) => (
        <View key={`td-${i}`} style={[styles.softDot, { top: d.t, left: d.l, opacity: d.o }]} />
      ))}
      <View style={[styles.softHex, styles.softHexA]} />
      <View style={[styles.softHex, styles.softHexB]} />
    </View>
  );
}

const TILE_DOTS = [
  { t: 8, l: 10, o: 0.22 },
  { t: 18, l: 36, o: 0.16 },
  { t: 42, l: 14, o: 0.14 },
  { t: 48, l: 44, o: 0.2 },
  { t: 28, l: 52, o: 0.12 },
];

const styles = StyleSheet.create({
  scrollHeader: {
    marginHorizontal: -16,
    marginBottom: 8,
    overflow: 'hidden',
    paddingBottom: 28,
  },
  scrollHeaderLiquid: {
    marginHorizontal: 0,
    marginBottom: 4,
    paddingBottom: 8,
  },
  scrollHeaderInner: {
    zIndex: 1,
  },
  curveLip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheet: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(232,93,4,0.12)',
  },
  orbA: { width: 160, height: 160, top: -40, right: -30 },
  orbB: { width: 120, height: 120, top: 40, left: -40, backgroundColor: 'rgba(255,255,255,0.06)' },
  orbC: { width: 90, height: 90, bottom: 20, right: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  hex: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '30deg' }],
  },
  hexA: { top: 50, left: 30 },
  hexB: { top: 100, right: 40 },
  softOrb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(4,31,24,0.06)',
  },
  softOrbA: { width: 40, height: 40, top: -12, right: -10 },
  softOrbB: {
    width: 28,
    height: 28,
    bottom: -8,
    left: -6,
    backgroundColor: 'rgba(15,92,66,0.08)',
  },
  softDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.brandGreenDark,
  },
  softHex: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: 'rgba(4,31,24,0.1)',
    transform: [{ rotate: '30deg' }],
  },
  softHexA: { top: 10, left: 8 },
  softHexB: { bottom: 8, right: 6 },
});
