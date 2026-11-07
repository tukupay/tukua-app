/**
 * Compact, table-like course rows for the Courses tab (owner, 2026-11-07: "use lists like a table,
 * narrower in height … more table than cards, though cards").
 *
 * The header, the rows and the footer stack into one white rounded container: the header carries the
 * top corners, every row a hairline divider, the footer the bottom corners. Every row has the same
 * height (COURSE_ROW_HEIGHT) so the FlatList can use getItemLayout and scroll smoothly.
 */
import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/AppThemeContext';
import { CARD, INK, rgba } from '../theme/ThemedPage';
import { Colors } from '../../theme/yana';
import { Skeleton } from '../ui/Skeleton';
import { LoaderMark } from '../ui/Loader';

/** Fixed row height: about two thirds of the old course card. */
export const COURSE_ROW_HEIGHT = 76;
const PRICE_COL = 92;
const THUMB = 50;

const SURFACE = 'rgba(255,255,255,0.96)';

export type CourseRowPricing = { label: string; discount?: string | null; strike?: string | null };

export type CourseRowProps = {
  title: string;
  /** Institution · level · hours, already joined. */
  secondary?: string | null;
  thumbnailUrl?: string | null;
  pricing: CourseRowPricing;
  certified?: boolean;
  featured?: boolean;
  /** Primary certifier short name, shown as a tiny badge when present. */
  certifier?: string | null;
  onPress: () => void;
};

function initials(title: string): string {
  const words = title.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'C';
  return ((words[0][0] || '') + (words[1]?.[0] || '')).toUpperCase();
}

export const CourseTableRow = memo(function CourseTableRow({
  title,
  secondary,
  thumbnailUrl,
  pricing,
  certified,
  featured,
  certifier,
  onPress,
}: CourseRowProps) {
  const { palette } = useAppTheme();
  const free = pricing.label === 'Free';
  const badge = certifier?.trim() || (certified ? 'Certified' : null);
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: rgba(palette.primary, 0.08) }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: rgba(palette.primary, 0.04) }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${pricing.label}`}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPh, { backgroundColor: rgba(palette.secondary, 0.2) }]}>
          <Text style={[styles.thumbInitials, { color: palette.primary }]}>{initials(title)}</Text>
        </View>
      )}

      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {secondary ? (
          <Text style={styles.secondary} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
        {badge || featured ? (
          <View style={styles.badges}>
            {featured ? (
              <View style={[styles.badge, { backgroundColor: rgba(palette.secondary, 0.22) }]}>
                <Ionicons name="star" size={9} color={palette.primary} />
                <Text style={[styles.badgeText, { color: palette.primary }]}>Featured</Text>
              </View>
            ) : null}
            {badge ? (
              <View style={[styles.badge, { backgroundColor: 'rgba(180,83,9,0.10)' }]}>
                <Ionicons name="ribbon-outline" size={9} color="#B45309" />
                <Text style={[styles.badgeText, { color: '#92400E' }]} numberOfLines={1}>
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.priceCol}>
        {free ? (
          <View style={[styles.freePill, { backgroundColor: rgba(palette.primary, 0.1) }]}>
            <Text style={[styles.freeText, { color: palette.primary }]}>Free</Text>
          </View>
        ) : (
          <Text style={styles.price} numberOfLines={1}>
            {pricing.label}
          </Text>
        )}
        {pricing.strike ? (
          <Text style={styles.strike} numberOfLines={1}>
            {pricing.strike}
          </Text>
        ) : null}
        {pricing.discount ? (
          <Text style={[styles.discount, { color: palette.primary }]} numberOfLines={1}>
            {pricing.discount}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
    </Pressable>
  );
});

/** Column header row; carries the container's top corners. */
export function CourseTableHeader({ count }: { count?: string | null }) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.header, { backgroundColor: rgba(palette.primary, 0.05) }]}>
      <View style={styles.headerSpacer} />
      <Text style={[styles.headerText, styles.main]} numberOfLines={1}>
        Course{count ? `  ·  ${count}` : ''}
      </Text>
      <Text style={[styles.headerText, styles.headerPrice]}>Price</Text>
      <View style={{ width: 16 }} />
    </View>
  );
}

/** Placeholder row while the first batch is on its way. */
export function CourseTableSkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={THUMB} height={THUMB} radius={10} />
      <View style={[styles.main, { gap: 8 }]}>
        <Skeleton height={12} width="78%" />
        <Skeleton height={10} width="52%" />
      </View>
      <View style={styles.priceCol}>
        <Skeleton height={14} width={54} radius={7} />
      </View>
      <View style={{ width: 16 }} />
    </View>
  );
}

/** Closes the container: loader while a batch streams in, or the end-of-list note. */
export function CourseTableFooter({
  state,
  message,
}: {
  state: 'loading' | 'more' | 'end' | 'empty' | 'error';
  /** Shown for the 'empty' state (e.g. "No courses match your filters."). */
  message?: string;
}) {
  return (
    <View style={styles.footer}>
      {state === 'loading' ? (
        <View style={styles.footerInner}>
          <LoaderMark size={22} />
          <Text style={styles.footerText}>Loading more courses…</Text>
        </View>
      ) : state === 'end' ? (
        <Text style={styles.footerText}>No more courses</Text>
      ) : state === 'more' ? (
        <Text style={styles.footerText}>Scroll for more</Text>
      ) : state === 'error' ? (
        <Text style={styles.footerText}>Could not load more. Pull to refresh.</Text>
      ) : state === 'empty' ? (
        <Text style={[styles.footerText, { paddingVertical: 10 }]}>{message || 'No courses here yet.'}</Text>
      ) : null}
    </View>
  );
}

const sides = {
  backgroundColor: SURFACE,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderColor: CARD.border,
} as const;

const styles = StyleSheet.create({
  row: {
    ...sides,
    height: COURSE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,42,26,0.10)',
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 10, backgroundColor: '#E8F5F0' },
  thumbPh: { alignItems: 'center', justifyContent: 'center' },
  thumbInitials: { fontSize: 15, fontFamily: 'Roboto_700Bold' },
  main: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 },
  title: { fontSize: 14.5, fontFamily: 'Roboto_700Bold', color: INK, lineHeight: 19 },
  secondary: { fontSize: 12, color: Colors.mutedForeground, lineHeight: 16 },
  badges: { flexDirection: 'row', gap: 4, marginTop: 1, overflow: 'hidden' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    maxWidth: 140,
  },
  badgeText: { fontSize: 10, fontWeight: '700', flexShrink: 1 },
  priceCol: { width: PRICE_COL, alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  price: { fontSize: 13.5, fontWeight: '700', color: Colors.foreground },
  strike: { fontSize: 11, color: Colors.mutedForeground, textDecorationLine: 'line-through' },
  discount: { fontSize: 10.5, fontWeight: '700' },
  freePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  freeText: { fontSize: 12, fontWeight: '800' },
  header: {
    ...sides,
    borderTopWidth: 1,
    borderTopLeftRadius: CARD.radius,
    borderTopRightRadius: CARD.radius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 34,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,42,26,0.12)',
    marginTop: 6,
  },
  headerSpacer: { width: THUMB },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  headerPrice: { width: PRICE_COL, textAlign: 'right' },
  footer: {
    ...sides,
    borderBottomWidth: 1,
    borderBottomLeftRadius: CARD.radius,
    borderBottomRightRadius: CARD.radius,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  footerInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 12, color: Colors.mutedForeground },
});
