/**
 * Shared pieces for the money screens (fees, pocket money, tip teacher, bursary, refer & earn, receipt):
 * the dashboard look (palette.primary dark green + palette.secondary yellow on the warm page, white cards,
 * no gradients), a header with the round back button, a balance panel, list skeletons, empty and error
 * states with Retry, and client-side windowing for lists the API returns in one go.
 */
import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/AppThemeContext';
import { floatingHeaderInset } from '../../constants/layout';
import { CARD_SURFACE, INK, PrimaryPatternPanel, rgba } from '../theme/ThemedPage';
import { Skeleton } from '../ui/Skeleton';
import { Colors } from '../../theme/yana';

/** Screen header in the dashboard look: round primary back button, yellow title marker, subtitle. */
export function MoneyHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  return (
    <View style={[styles.header, { paddingTop: floatingHeaderInset(insets.top) - 8 }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={[styles.backBtn, { backgroundColor: palette.primary }]}>
          <Ionicons name="chevron-back" size={22} color={palette.secondary} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.titleRow}>
          <View style={[styles.titleMarker, { backgroundColor: palette.secondary }]} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Dark green balance panel with the whitened pattern: kicker, big amount, optional line and children. */
export function BalancePanel({
  kicker,
  value,
  line,
  icon = 'wallet',
  children,
  style,
}: {
  kicker: string;
  value: string;
  line?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  return (
    <PrimaryPatternPanel style={[styles.panel, style]}>
      <View style={styles.panelHead}>
        <View style={[styles.panelIcon, { backgroundColor: palette.secondary }]}>
          <Ionicons name={icon} size={22} color={palette.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.panelKicker}>{kicker}</Text>
          <Text style={styles.panelValue} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
          {line ? (
            <Text style={styles.panelLine} numberOfLines={2}>
              {line}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </PrimaryPatternPanel>
  );
}

/** A small stat tile for inside the BalancePanel. */
export function PanelStat({
  label,
  value,
  sub,
  onPress,
}: {
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.panelStat} onPress={onPress} disabled={!onPress}>
      <Text style={styles.panelStatLabel}>{label}</Text>
      <Text style={styles.panelStatValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={styles.panelStatSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Uppercase section label with an optional action on the right. */
export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

/** Primary (green + white text) or secondary (tinted) button. */
export function MoneyButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  const bg =
    variant === 'primary' ? palette.primary : variant === 'accent' ? palette.secondary : rgba(palette.primary, 0.08);
  const fg = variant === 'primary' ? Colors.white : palette.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={17} color={variant === 'primary' ? palette.secondary : fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Segmented tabs (pill row). */
export function MoneyTabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadonlyArray<{ key: K; label: string; icon?: keyof typeof Ionicons.glyphMap }>;
  value: K;
  onChange: (k: K) => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.tabs, { backgroundColor: rgba(palette.primary, 0.06) }]}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && { backgroundColor: palette.primary }]}>
            {t.icon ? <Ionicons name={t.icon} size={14} color={on ? palette.secondary : palette.primary} /> : null}
            <Text style={[styles.tabText, { color: on ? Colors.white : palette.primary }]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** White card surface (dashboard style). */
export function MoneyCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A row: title + meta on the left, amount right-aligned. */
export function AmountRow({
  title,
  meta,
  amount,
  amountStyle,
  icon,
  iconTone = 'neutral',
  onPress,
  right,
  last,
}: {
  title: string;
  meta?: string | null;
  amount?: string | null;
  amountStyle?: StyleProp<TextStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'neutral' | 'in' | 'out';
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
}) {
  const { palette } = useAppTheme();
  const tint =
    iconTone === 'in' ? '#15803D' : iconTone === 'out' ? '#B45309' : palette.primary;
  const body = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: rgba(tint, 0.1) }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {amount ? (
        <Text style={[styles.rowAmount, amountStyle]} numberOfLines={1}>
          {amount}
        </Text>
      ) : null}
      {right}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} android_ripple={{ color: rgba(palette.primary, 0.08) }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/** Skeleton rows while a list loads. */
export function ListSkeleton({ rows = 5, withPanel = false }: { rows?: number; withPanel?: boolean }) {
  return (
    <View style={{ gap: 12 }}>
      {withPanel ? <Skeleton height={150} radius={16} /> : null}
      <View style={[styles.card, { paddingVertical: 6 }]}>
        {Array.from({ length: rows }, (_, i) => (
          <View key={i} style={[styles.row, i < rows - 1 && styles.rowDivider]}>
            <Skeleton width={36} height={36} radius={12} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton height={12} width="70%" />
              <Skeleton height={10} width="40%" />
            </View>
            <Skeleton height={14} width={70} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Empty or error state, with an optional Retry. */
export function StateCard({
  icon = 'file-tray-outline',
  title,
  body,
  onRetry,
  tone = 'empty',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string | null;
  onRetry?: () => void;
  tone?: 'empty' | 'error';
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.card, styles.state]}>
      <View
        style={[
          styles.stateIcon,
          { backgroundColor: tone === 'error' ? 'rgba(185,28,28,0.08)' : rgba(palette.secondary, 0.18) },
        ]}>
        <Ionicons
          name={tone === 'error' ? 'cloud-offline-outline' : icon}
          size={30}
          color={tone === 'error' ? '#B91C1C' : palette.primary}
        />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {body ? <Text style={styles.stateBody}>{body}</Text> : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={[styles.retry, { backgroundColor: palette.primary }]}>
          <Ionicons name="refresh" size={15} color={palette.secondary} />
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Footer for a windowed list: a skeleton row while more are coming (FlatList onEndReached), or, with
 * `onMore` (lists inside a ScrollView), a "Show more" button; then the end marker.
 */
export function ListFooter({
  hasMore,
  total,
  noun = 'items',
  onMore,
}: {
  hasMore: boolean;
  total: number;
  noun?: string;
  onMore?: () => void;
}) {
  const { palette } = useAppTheme();
  if (!total) return null;
  if (hasMore && onMore) {
    return (
      <Pressable onPress={onMore} style={styles.moreBtn} accessibilityRole="button">
        <Text style={[styles.moreText, { color: palette.primary }]}>Show more</Text>
        <Ionicons name="chevron-down" size={15} color={palette.primary} />
      </Pressable>
    );
  }
  return hasMore ? (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <Skeleton height={44} radius={12} />
    </View>
  ) : (
    <Text style={styles.endText}>
      {total} {noun}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleMarker: { width: 4, height: 20, borderRadius: 2, marginRight: 8 },
  title: { color: INK, fontSize: 22, fontWeight: '800', flexShrink: 1 },
  subtitle: { color: Colors.mutedForeground, fontSize: 13, marginTop: 2, marginLeft: 12 },
  panel: { padding: 16 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  panelKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  panelValue: { marginTop: 2, fontSize: 28, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  panelLine: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  panelStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 12, padding: 12 },
  panelStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  panelStatValue: { marginTop: 4, fontSize: 16, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  panelStatSub: { marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 },
  section: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    minHeight: 48,
  },
  btnText: { fontWeight: '800', fontSize: 15 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  card: { ...CARD_SURFACE, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: INK },
  rowMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  rowAmount: { fontSize: 14, fontWeight: '800', color: INK, textAlign: 'right', fontVariant: ['tabular-nums'] },
  state: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stateIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stateTitle: { fontSize: 16, fontWeight: '800', color: INK, textAlign: 'center' },
  stateBody: { marginTop: 6, fontSize: 13, lineHeight: 19, color: Colors.mutedForeground, textAlign: 'center' },
  retry: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12 },
  moreText: { fontSize: 13, fontWeight: '700' },
  endText: { textAlign: 'center', fontSize: 12, color: Colors.mutedForeground, paddingVertical: 14 },
});
