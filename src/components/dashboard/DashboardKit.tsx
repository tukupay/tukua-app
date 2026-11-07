/**
 * Dashboard building blocks in the TukuPay home look (owner, 2026-11-07: dark green + yellow, flat, no
 * gradients): the maths-pattern page tile, the section card (MenuCard), the shortcut tile (MenuItem) and
 * the bank-card chip. Colours come from the theme palette at render time, so school themes apply.
 */
import React, { type ReactNode } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';

const PATTERN_TILE = require('../../../assets/images/brand/tukua-pattern-tile.webp');

/** '#15411D' → 'rgba(21,65,29,a)'. Leaves non-hex colours as they are. */
export function rgba(hex: string, alpha: number): string {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(h)) return hex;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Shared by every dashboard card so edges and corners line up. */
export const CARD = {
  radius: 16,
  padding: 16,
  border: '#E6ECE9',
} as const;

export const INK = '#1D1B20';

/** The Tukua maths pattern (∞, Σ, π, ∫ on a faint grid), square tiles stacked down the page. Fills its parent. */
export function PatternTiles({ opacity = 0.35 }: { opacity?: number }) {
  const { width, height } = useWindowDimensions();
  const rows = Math.ceil(height / Math.max(1, width)) + 1;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}>
      {Array.from({ length: rows }, (_, i) => (
        <Image key={i} source={PATTERN_TILE} style={{ width, height: width }} resizeMode="cover" />
      ))}
    </View>
  );
}

const CARD_LIFT: ViewStyle = Platform.select<ViewStyle>({
  ios: { shadowColor: '#0F2A1A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  default: { boxShadow: '0px 4px 12px rgba(15,42,26,0.08)' } as ViewStyle,
}) as ViewStyle;

/** One card style for the dashboard sections: near-white fill, faint edge, soft lift, title over a hairline. */
export function MenuCard({
  title,
  right,
  children,
  isList = false,
  style,
}: {
  title: string;
  /** Optional element at the header's right (e.g. a "View All" pill). */
  right?: ReactNode;
  children?: ReactNode;
  /** Content sized by its rows (a list), not a row of shortcuts. */
  isList?: boolean;
  style?: ViewStyle;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.cardOuter, CARD_LIFT, style]}>
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardMarker, { backgroundColor: palette.secondary }]} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {right ?? null}
        </View>
        <View style={styles.hairline} />
        <View
          style={{
            paddingHorizontal: isList ? CARD.padding : 8,
            paddingTop: 14,
            paddingBottom: isList ? 8 : 14,
          }}>
          {children}
        </View>
      </View>
    </View>
  );
}

/** "View All" pill for a MenuCard header. */
export function ViewAllPill({ onPress, label = 'View All' }: { onPress: () => void; label?: string }) {
  const { palette } = useAppTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      <View style={[styles.pill, { backgroundColor: rgba(palette.primary, 0.08) }]}>
        <Text style={[styles.pillText, { color: palette.primary }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

/**
 * A shortcut: a 52×52 rounded tile over a one-line label. `solid` = dark green tile with a yellow icon;
 * otherwise a yellow-tinted tile with a dark green icon. Items share the row equally.
 */
export function MenuItem({
  label,
  onPress,
  solid,
  renderIcon,
  accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  solid: boolean;
  renderIcon: (color: string) => ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const { palette } = useAppTheme();
  const bg = solid ? palette.primary : rgba(palette.secondary, 0.16);
  const fg = solid ? palette.secondary : palette.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}>
      <View style={[styles.itemTile, { backgroundColor: bg }]}>{renderIcon(fg)}</View>
      <Text style={styles.itemLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The gold contact chip of a bank card, drawn flat (tinted with the theme's accent). */
export function CardChip({ color, scale = 1 }: { color: string; scale?: number }) {
  const line = 'rgba(60,40,0,0.35)';
  // Scaled down in place; negative margins give back the space the full-size chip would take.
  const s =
    scale === 1
      ? null
      : { transform: [{ scale }], marginHorizontal: -(38 * (1 - scale)) / 2, marginVertical: -(28 * (1 - scale)) / 2 };
  return (
    <View style={[styles.chip, { backgroundColor: color }, s]}>
      <View style={[styles.chipV, { borderColor: line }]} />
      <View style={[styles.chipH, { borderColor: line }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    borderRadius: CARD.radius,
  },
  cardInner: {
    borderRadius: CARD.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD.border,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  cardHead: {
    paddingHorizontal: CARD.padding,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  cardMarker: { width: 3, height: 14, borderRadius: 2, marginRight: 8 },
  cardTitle: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
    color: INK,
    flexShrink: 1,
  },
  hairline: {
    marginHorizontal: CARD.padding,
    height: 1,
    backgroundColor: CARD.border,
  },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  item: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  itemPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  itemTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    marginTop: 8,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: INK,
    textAlign: 'center',
  },
  chip: {
    width: 38,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  chipV: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  chipH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 9,
    height: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
});
