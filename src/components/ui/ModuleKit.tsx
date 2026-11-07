/**
 * Building blocks for the dashboard's list / report module screens (owner, 2026-11-07: every page in the
 * dashboard look — warm page with the maths pattern, white cards, the floating header on top, nothing under
 * the floating tab bar, flat colours, Tukua loaders, empty + error states with Retry, batches not walls).
 *
 * - <ModuleScrollPage>   ThemedPage + ScrollView clear of the floating header and tab bar, pull to refresh,
 *                        back row and title. For short pages; long lists use FlatList + useModulePadding().
 * - useModulePadding()   { top, bottom } content padding under the floating header / above the tab bar.
 * - <SurfaceCard>        the dashboard's white card (radius 16, faint edge, soft lift).
 * - <StateCard>          empty / error / info state with an icon and an optional action (Retry).
 * - <ListSkeleton>       shimmer cards while a list loads.
 * - <StatusPill>         small coloured label (present / absent / open / closed …).
 * - <StatTile>           label + value tile for summary rows.
 * - <ShowMoreButton>     "Show more · 20 of 85" for batched lists.
 * - useClientPager()     shows a long in-memory list in batches.
 * - <ChipRow>            horizontal filter chips.
 * - <SelectField>        compact dropdown: tap opens a themed bottom-sheet list (year, exam …).
 *
 * Colours come from useAppTheme(): school themes keep the layout with their own primary/secondary.
 */
import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/AppThemeContext';
import { floatingHeaderInset } from '../../constants/layout';
import { useBottomBarSpace } from '../navigation/useBottomBarSpace';
import { CARD_SURFACE, INK, ThemedPage } from '../theme/ThemedPage';
import { rgba } from '../../theme/color';
import { Skeleton } from './Skeleton';
import { ModuleBackBar, ModuleScreenHeader } from '../../screens/dashboard/ModuleChrome';

export const MUTED_INK = '#5E625B';

/** Content padding for a module screen: below the floating app header, above the floating tab bar. */
export function useModulePadding(extraBottom = 16): { top: number; bottom: number } {
  const insets = useSafeAreaInsets();
  const bar = useBottomBarSpace();
  return { top: floatingHeaderInset(insets.top), bottom: bar + extraBottom };
}

/** RefreshControl in the theme colours. */
export function ThemedRefresh({
  refreshing,
  onRefresh,
  ...rest
}: { refreshing: boolean; onRefresh: () => void } & Omit<RefreshControlProps, 'refreshing' | 'onRefresh'>) {
  const { palette } = useAppTheme();
  // On Android a ScrollView/FlatList clones its refreshControl and passes the list itself (and its style)
  // as children/style. Those must reach RefreshControl, or the whole page body is dropped (blank pages).
  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={palette.primary}
      colors={[palette.primary]}
      progressBackgroundColor="#FFFFFF"
    />
  );
}

export function ModuleScrollPage({
  title,
  description,
  onBack,
  backLabel,
  refreshing = false,
  onRefresh,
  headerRight,
  children,
  contentStyle,
  scrollProps,
}: {
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  headerRight?: ReactNode;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}) {
  const pad = useModulePadding();
  return (
    <ThemedPage>
      <ScrollView
        {...scrollProps}
        contentContainerStyle={[styles.content, { paddingTop: pad.top, paddingBottom: pad.bottom }, contentStyle]}
        refreshControl={onRefresh ? <ThemedRefresh refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ModuleHeading title={title} description={description} onBack={onBack} backLabel={backLabel} right={headerRight} />
        {children}
      </ScrollView>
    </ThemedPage>
  );
}

/** Back row + title block, for FlatList headers. */
export function ModuleHeading({
  title,
  description,
  onBack,
  backLabel,
  right,
}: {
  title: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
}) {
  return (
    <View>
      {onBack || right ? (
        <View style={styles.backRow}>
          {onBack ? <ModuleBackBar onBack={onBack} label={backLabel} /> : <View />}
          {right ? <View style={styles.backRight}>{right}</View> : null}
        </View>
      ) : null}
      <ModuleScreenHeader title={title} description={description} />
    </View>
  );
}

export function SurfaceCard({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      {/* Long labels (e.g. exam names) wrap instead of pushing `right` off a 360-dp screen. */}
      <Text style={styles.section} numberOfLines={3}>
        {children}
      </Text>
      {right ? <View style={styles.sectionRight}>{right}</View> : null}
    </View>
  );
}

export function StateCard({
  icon = 'information-circle-outline',
  title,
  body,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}) {
  const { palette } = useAppTheme();
  const iconColor = tone === 'error' ? '#B42318' : palette.primary;
  return (
    <View style={[styles.card, styles.stateCard]}>
      <View style={[styles.stateIcon, { backgroundColor: tone === 'error' ? 'rgba(180,35,24,0.08)' : rgba(palette.primary, 0.07) }]}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {body ? <Text style={styles.stateBody}>{body}</Text> : null}
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.stateBtn, { backgroundColor: palette.primary }, pressed && styles.pressed]}>
          <Text style={styles.stateBtnText}>{actionLabel || 'Retry'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Error state with Retry: a short human line, never a stack trace. */
export function ErrorState({ title = 'Couldn’t load this page', message, onRetry }: { title?: string; message?: string | null; onRetry?: () => void }) {
  return (
    <StateCard
      tone="error"
      icon="cloud-offline-outline"
      title={title}
      body={friendlyError(message)}
      actionLabel="Retry"
      onAction={onRetry}
    />
  );
}

export function friendlyError(message?: string | null): string {
  const m = String(message ?? '').trim();
  if (!m) return 'Something went wrong. Check your connection and try again.';
  if (/network request failed|failed to fetch|timeout|timed out|aborted/i.test(m)) {
    return 'We couldn’t reach the school server. Check your connection and try again.';
  }
  if (/401|unauthor|session expired|jwt/i.test(m)) return 'Your session needs a refresh. Pull down or tap Retry.';
  if (/403|forbidden|not allowed|permission/i.test(m)) return 'Your account can’t open this yet. Ask the school office if you need access.';
  if (/404|not found|cannot get/i.test(m)) return 'This isn’t available for your school yet.';
  if (/5\d\d|internal server/i.test(m)) return 'The school server had a problem. Try again in a moment.';
  return m.length > 160 ? `${m.slice(0, 157)}…` : m;
}

export function ListSkeleton({ rows = 4, height = 64 }: { rows?: number; height?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={[styles.card, styles.skelCard, { minHeight: height }]}>
          <Skeleton width={36} height={36} radius={10} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton height={12} width="70%" />
            <Skeleton height={10} width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent';

export function pillColors(tone: PillTone, primary: string, secondary: string): { fg: string; bg: string } {
  switch (tone) {
    case 'success':
      return { fg: '#067647', bg: 'rgba(6,118,71,0.10)' };
    case 'warning':
      return { fg: '#B54708', bg: 'rgba(181,71,8,0.10)' };
    case 'danger':
      return { fg: '#B42318', bg: 'rgba(180,35,24,0.10)' };
    case 'primary':
      return { fg: primary, bg: rgba(primary, 0.09) };
    case 'accent':
      return { fg: '#5C4300', bg: rgba(secondary, 0.22) };
    default:
      return { fg: MUTED_INK, bg: 'rgba(94,98,91,0.10)' };
  }
}

export function StatusPill({ label, tone = 'neutral', icon }: { label: string; tone?: PillTone; icon?: keyof typeof Ionicons.glyphMap }) {
  const { palette } = useAppTheme();
  const c = pillColors(tone, palette.primary, palette.secondary);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={c.fg} /> : null}
      <Text style={[styles.pillText, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatTile({ label, value, hint, style }: { label: string; value: string; hint?: string; style?: StyleProp<ViewStyle> }) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.stat, { backgroundColor: rgba(palette.primary, 0.05) }, style]}>
      <Text style={[styles.statLabel, { color: palette.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.statHint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function ShowMoreButton({
  shown,
  total,
  onPress,
  loading = false,
  label = 'Show more',
}: {
  shown: number;
  total?: number | null;
  onPress: () => void;
  loading?: boolean;
  label?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [styles.more, { borderColor: rgba(palette.primary, 0.18) }, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={palette.primary} />
      ) : (
        <>
          <Text style={[styles.moreText, { color: palette.primary }]}>{label}</Text>
          <Text style={styles.moreCount}>
            {total != null && total > 0 ? `${shown} of ${total}` : `${shown} shown`}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** Shows `items` in batches of `pageSize`; resets to the first batch when `resetKey` changes. */
export function useClientPager<T>(items: readonly T[], pageSize = 20, resetKey?: unknown) {
  const [count, setCount] = useState(pageSize);
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);
  const visible = useMemo(() => items.slice(0, count), [items, count]);
  const showMore = useCallback(() => setCount((c) => c + pageSize), [pageSize]);
  return { visible, hasMore: items.length > count, showMore, shown: visible.length, total: items.length };
}

export function ChipRow<K extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: K; label: string; count?: number }>;
  value: K;
  onChange: (key: K) => void;
}) {
  const { palette } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              active
                ? { backgroundColor: palette.primary, borderColor: palette.primary }
                : { backgroundColor: '#FFFFFF', borderColor: rgba(palette.primary, 0.14) },
            ]}>
            <Text style={[styles.chipText, { color: active ? '#FFFFFF' : palette.primary }]} numberOfLines={1}>
              {o.label}
              {o.count != null ? ` · ${o.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type SelectOption = { key: string; label: string; hint?: string | null; badge?: string | null };

/**
 * Compact themed dropdown. The trigger shows a small label above the chosen value; tapping opens a bottom
 * sheet with the options (the chosen one ticked). Same pattern as the sign-up AuthSelect, in the school theme.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  title,
  icon,
  disabled = false,
  style,
}: {
  label: string;
  value: string | null | undefined;
  options: SelectOption[];
  onChange: (key: string) => void;
  placeholder?: string;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value) ?? null;
  const canOpen = !disabled && options.length > 0;
  return (
    <>
      <Pressable
        onPress={() => canOpen && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled: !canOpen, expanded: open }}
        style={({ pressed }) => [
          styles.selectTrigger,
          { borderColor: rgba(palette.primary, 0.16) },
          pressed && canOpen && styles.pressed,
          !canOpen && { opacity: 0.6 },
          style,
        ]}>
        {icon ? (
          <View style={[styles.selectIcon, { backgroundColor: rgba(palette.primary, 0.08) }]}>
            <Ionicons name={icon} size={15} color={palette.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.selectLabel, { color: palette.primary }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.selectValue, !selected && { color: MUTED_INK }]} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={MUTED_INK} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{title ?? label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.key}
              style={styles.sheetList}
              renderItem={({ item }) => {
                const on = item.key === value;
                return (
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      if (!on) onChange(item.key);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [
                      styles.sheetRow,
                      on && { backgroundColor: rgba(palette.primary, 0.07) },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.sheetRowText, on && { color: palette.primary }]} numberOfLines={2}>
                        {item.label}
                      </Text>
                      {item.hint ? (
                        <Text style={styles.sheetRowHint} numberOfLines={1}>
                          {item.hint}
                        </Text>
                      ) : null}
                    </View>
                    {item.badge ? (
                      <View style={[styles.pill, { backgroundColor: rgba(palette.primary, 0.1), alignSelf: 'center' }]}>
                        <Text style={[styles.pillText, { color: palette.primary }]}>{item.badge}</Text>
                      </View>
                    ) : null}
                    {on ? <Ionicons name="checkmark-circle" size={20} color={palette.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** Parse a number from API text ("67.0000") — null when it is not a number. */
export function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** "67.5" / "68" — one decimal at most; '—' when missing. */
export function fmtNum(v: unknown, digits = 1): string {
  const n = num(v);
  if (n == null) return '—';
  const f = Number(n.toFixed(digits));
  return String(f);
}

/** Local "Mon 13 Oct 2026" for an ISO date or timestamp; '—' when missing. */
export function fmtDay(v: unknown, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const s = String(v ?? '').trim();
  if (!s) return '—';
  const dateOnly = /^\d{4}-\d{2}-\d{2}/.test(s) && (s.length === 10 || /T00:00:00(\.000)?Z$/.test(s));
  const d = dateOnly ? new Date(`${s.slice(0, 10)}T12:00:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10) || '—';
  return d.toLocaleDateString(undefined, {
    weekday: opts.weekday === false ? undefined : 'short',
    day: 'numeric',
    month: 'short',
    year: opts.year === false ? undefined : 'numeric',
  });
}

/** Local "07:51" for a timestamp; '' when missing. */
export function fmtTime(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** "5 min ago", "Yesterday", "12 Oct". */
export function fmtRelative(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const d = new Date(s);
  const t = d.getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  backRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  backRight: { marginBottom: 12 },
  card: { ...CARD_SURFACE, padding: 14, marginBottom: 10 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionRight: { flexShrink: 0 },
  section: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: MUTED_INK,
  },
  stateCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  stateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  stateTitle: { fontSize: 16, fontWeight: '800', color: INK, textAlign: 'center' },
  stateBody: { marginTop: 6, fontSize: 13.5, lineHeight: 19, color: MUTED_INK, textAlign: 'center' },
  stateBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 28 },
  stateBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  skelCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: '800' },
  stat: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minWidth: 0 },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { marginTop: 4, fontSize: 17, fontWeight: '800', color: INK },
  statHint: { marginTop: 2, fontSize: 10.5, color: MUTED_INK },
  more: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  moreText: { fontSize: 14, fontWeight: '800' },
  moreCount: { marginTop: 2, fontSize: 11, color: MUTED_INK },
  chips: { gap: 8, paddingBottom: 12, paddingRight: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  selectTrigger: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 52,
  },
  selectIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  selectLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  selectValue: { marginTop: 2, fontSize: 14, fontWeight: '700', color: INK },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingHorizontal: 16,
    maxHeight: '75%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9DAD5', marginBottom: 10 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: INK, marginBottom: 8 },
  sheetList: { flexGrow: 0 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  sheetRowText: { fontSize: 14.5, fontWeight: '700', color: INK },
  sheetRowHint: { marginTop: 2, fontSize: 12, color: MUTED_INK },
});
