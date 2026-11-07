import React from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

/**
 * Flat colour in place of expo-linear-gradient (owner, 2026-11-07: no gradients, they look "vibe-coded";
 * the only fade kept is the top header's, in NativeAppHeader).
 *
 * Same props as LinearGradient, so a file switches by changing its import:
 *  - a solid gradient (every stop mostly opaque) paints its most opaque colour;
 *  - a fade (some stop near transparent, e.g. a scrim or a glow) paints nothing and keeps its children.
 */
type Props = ViewProps & {
  colors: readonly string[];
  start?: unknown;
  end?: unknown;
  locations?: readonly number[] | null;
  dither?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function alphaOf(color: string): number {
  const c = String(color || '').trim().toLowerCase();
  if (!c || c === 'transparent') return 0;
  const rgba = c.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => p.trim());
    return parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1;
  }
  const hsla = c.match(/^hsla\(([^)]+)\)$/);
  if (hsla) {
    const parts = hsla[1].split(',').map((p) => p.trim());
    return parts.length >= 4 ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1;
  }
  const hex = c.match(/^#([0-9a-f]{8})$/);
  if (hex) return parseInt(hex[1].slice(6, 8), 16) / 255;
  return 1;
}

export function flatColorOf(colors: readonly string[]): string | null {
  if (!colors?.length) return null;
  const alphas = colors.map(alphaOf);
  if (Math.min(...alphas) < 0.35) return null; // a fade: decoration only
  let best = 0;
  alphas.forEach((a, i) => {
    if (a > alphas[best]) best = i;
  });
  return colors[best];
}

export function FlatFill({ colors, start: _s, end: _e, locations: _l, dither: _d, style, children, ...rest }: Props) {
  const fill = flatColorOf(colors);
  return (
    <View {...rest} style={[style, fill ? { backgroundColor: fill } : null]}>
      {children}
    </View>
  );
}

/** Drop-in name, so `import { LinearGradient } from '../FlatFill'` needs no other change. */
export const LinearGradient = FlatFill;
export default FlatFill;
