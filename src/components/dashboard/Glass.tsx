import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/yana';

type Tone = 'clear' | 'frost' | 'tint' | 'light';

type GlassProps = {
  children?: React.ReactNode;
  style?: ViewStyle | (ViewStyle | false | null | undefined)[];
  /**
   * clear / light — soft translucent white
   * frost — elevated milky card (default for icon groups / student rows)
   * tint — soft green wash
   */
  tone?: Tone;
  /** Kept for API compat — elevation cards no longer rely on BlurView (double-rim on Android). */
  intensity?: number;
  /** Corner radius — default 16 */
  radius?: number;
  shine?: boolean;
  /** Soft accent rim (e.g. selected). Replaces the single border — never stacks. */
  accentBorder?: string | null;
};

const TONE = {
  clear: {
    fill: 'rgba(255,255,255,0.78)',
    border: 'rgba(10,61,46,0.06)',
  },
  light: {
    fill: 'rgba(255,255,255,0.78)',
    border: 'rgba(10,61,46,0.06)',
  },
  frost: {
    fill: '#FFFFFF',
    border: 'rgba(10,61,46,0.07)',
  },
  tint: {
    fill: 'rgba(232,245,239,0.95)',
    border: 'rgba(10,61,46,0.08)',
  },
};

/**
 * Elevated card — one soft border + shadow + radius.
 * No BlurView rim (that read as a double border on Android).
 */
export function GlassPanel({
  children,
  style,
  tone = 'frost',
  radius = 16,
  shine = true,
  accentBorder = null,
}: GlassProps) {
  const t = TONE[tone] ?? TONE.frost;
  const borderColor = accentBorder || t.border;
  const borderWidth = accentBorder ? 1.5 : StyleSheet.hairlineWidth;

  return (
    <View
      style={[
        styles.elevated,
        {
          borderRadius: radius,
          backgroundColor: t.fill,
          borderColor,
          borderWidth,
          shadowOpacity: accentBorder ? 0.16 : 0.12,
          elevation: accentBorder ? 6 : 5,
        },
        style,
      ]}>
      {shine ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.15)', 'transparent']}
          locations={[0, 0.35, 0.75]}
          style={[styles.shine, { borderRadius: radius }]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export const glassStyles = StyleSheet.create({
  canvas: {
    backgroundColor: Colors.background,
  },
});

const styles = StyleSheet.create({
  elevated: {
    overflow: 'hidden',
    shadowColor: '#0A3D2E',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    zIndex: 1,
  },
});
