/**
 * Notifications (every persona): newest first, loaded 25 at a time as you scroll (cursor `before`), All / Unread
 * filter, tap to open (marks it read), "Mark all read", empty and error states with Retry. Dashboard look.
 *
 * 2026-11-07: was one fixed request for 50 with no paging; "Mark all" and "mark read" failures were silent and
 * left the list showing the wrong state; a failed load replaced the list with raw error text.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedPage, INK, rgba } from '../../components/theme/ThemedPage';
import { useAppTheme } from '../../context/AppThemeContext';
import { resolveNotificationHref } from '../../lib/notificationDeepLink';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import {
  fetchNotificationsPage,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../../lib/notificationsApi';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  ModuleHeading,
  MUTED_INK,
  StateCard,
  ThemedRefresh,
  fmtRelative,
  friendlyError,
  useModulePadding,
} from '../../components/ui/ModuleKit';

const PAGE = 25;
type Filter = 'all' | 'unread';

function iconFor(eventType: string): keyof typeof Ionicons.glyphMap {
  const t = String(eventType || '').toLowerCase();
  if (t.includes('meet')) return 'videocam';
  if (t.includes('pay') || t.includes('fee') || t.includes('receipt') || t.includes('wallet')) return 'wallet';
  if (t.includes('attend') || t.includes('gate')) return 'checkmark-circle';
  if (t.includes('transport') || t.includes('trip') || t.includes('bus')) return 'bus';
  if (t.includes('library') || t.includes('book')) return 'library';
  if (t.includes('discipl')) return 'shield';
  if (t.includes('exam') || t.includes('result') || t.includes('mark') || t.includes('report')) return 'ribbon';
  if (t.includes('club')) return 'medal';
  if (t.includes('event')) return 'calendar';
  if (t.includes('join') || t.includes('approv')) return 'person-add';
  return 'notifications';
}

function dayBucket(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Earlier';
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t = d.getTime();
  if (t >= start.getTime()) return 'Today';
  if (t >= start.getTime() - 86400000) return 'Yesterday';
  if (t >= start.getTime() - 6 * 86400000) return 'This week';
  return 'Earlier';
}

export function NotificationsScreen() {
  const pad = useModulePadding();
  const { palette } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const { navigate: webNavigate, jumpToTab } = useWebViewControl();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [hasMore, setHasMore] = useState(false);
  const [serverUnread, setServerUnread] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const reqId = useRef(0);

  const loadFirst = useCallback(
    async (soft = false) => {
      const id = ++reqId.current;
      if (!soft) setLoading(true);
      setError(null);
      try {
        const page = await fetchNotificationsPage({ limit: PAGE, unreadOnly: filter === 'unread' });
        if (id !== reqId.current) return;
        setItems(page.items);
        setServerUnread(page.unreadCount);
        setHasMore(page.hasMore ?? page.items.length >= PAGE);
      } catch (e) {
        if (id !== reqId.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Notifications', msg);
        setError(msg);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    void loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || !items.length) return;
    const id = reqId.current;
    setLoadingMore(true);
    try {
      const last = items[items.length - 1];
      const page = await fetchNotificationsPage({ limit: PAGE, before: last.created_at, unreadOnly: filter === 'unread' });
      if (id !== reqId.current) return;
      const seen = new Set(items.map((i) => i.id));
      const added = page.items.filter((i) => !seen.has(i.id));
      setItems((prev) => [...prev, ...added]);
      // An older API ignores `before` and repeats the first page: nothing new means the end.
      setHasMore(added.length > 0 && (page.hasMore ?? page.items.length >= PAGE));
    } catch (e) {
      log.warn('Notifications', 'more', e instanceof Error ? e.message : String(e));
      setNotice('Couldn’t load older notifications. Scroll down to try again.');
    } finally {
      setLoadingMore(false);
    }
  }, [filter, hasMore, items, loading, loadingMore]);

  const localUnread = useMemo(() => items.filter((i) => !i.is_read).length, [items]);
  const unread = serverUnread != null ? Math.max(serverUnread, localUnread) : localUnread;

  const openItem = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setServerUnread((c) => (c != null ? Math.max(0, c - 1) : c));
      markNotificationRead(n.id).catch((e) => {
        log.warn('Notifications', 'mark read', e instanceof Error ? e.message : String(e));
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x)));
        setServerUnread((c) => (c != null ? c + 1 : c));
      });
    }
    const target = resolveNotificationHref(n.href);
    if (!target) return;
    if (target.kind === 'dashboard') {
      // @ts-expect-error dynamic screen
      navigation.navigate(target.screen, target.params);
      return;
    }
    if (target.kind === 'tab') {
      jumpToTab(target.tab);
      return;
    }
    webNavigate(target.path, '/profile');
  };

  const markAll = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    setNotice(null);
    const before = items;
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllNotificationsRead();
      setServerUnread(0);
      if (filter === 'unread') setItems([]);
    } catch (e) {
      setItems(before);
      setNotice(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      setMarkingAll(false);
    }
  };

  const rows = useMemo(() => {
    const out: Array<{ kind: 'head'; key: string; label: string } | { kind: 'item'; key: string; item: AppNotification }> = [];
    let last = '';
    for (const it of items) {
      const b = dayBucket(it.created_at);
      if (b !== last) {
        out.push({ kind: 'head', key: `h-${b}`, label: b });
        last = b;
      }
      out.push({ kind: 'item', key: it.id, item: it });
    }
    return out;
  }, [items]);

  const header = (
    <View>
      <ModuleHeading
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : 'You’re all caught up'}
        onBack={() => navigation.goBack()}
        right={
          unread > 0 ? (
            <Pressable
              onPress={() => void markAll()}
              disabled={markingAll}
              accessibilityRole="button"
              style={({ pressed }) => [styles.markAll, { backgroundColor: rgba(palette.primary, 0.08) }, pressed && { opacity: 0.8 }]}>
              {markingAll ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={14} color={palette.primary} />
                  <Text style={[styles.markAllText, { color: palette.primary }]}>Mark all read</Text>
                </>
              )}
            </Pressable>
          ) : undefined
        }
      />
      <ChipRow<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread', count: unread || undefined },
        ]}
      />
      {notice ? (
        <Pressable onPress={() => setNotice(null)} style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={16} color="#B54708" />
          <Text style={styles.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ThemedPage>
      <FlatList
        data={loading || error ? [] : rows}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom, paddingHorizontal: 16, flexGrow: 1 }}
        ListHeaderComponent={header}
        refreshControl={
          <ThemedRefresh
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setNotice(null);
              void loadFirst(true);
            }}
          />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton rows={6} height={72} />
          ) : error ? (
            <ErrorState title="Couldn’t load notifications" message={error} onRetry={() => void loadFirst()} />
          ) : (
            <StateCard
              icon={filter === 'unread' ? 'checkmark-done-outline' : 'notifications-off-outline'}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              body={
                filter === 'unread'
                  ? 'Everything has been read.'
                  : 'Alerts for fees, meetings, attendance, results and more will show up here.'
              }
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : !loading && !error && items.length > 0 && !hasMore ? (
            <Text style={styles.end}>That’s everything</Text>
          ) : null
        }
        renderItem={({ item: row }) => {
          if (row.kind === 'head') return <Text style={styles.bucket}>{row.label}</Text>;
          const n = row.item;
          return (
            <Pressable
              onPress={() => void openItem(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n.is_read ? '' : 'Unread. '}${n.title}`}
              style={({ pressed }) => [
                styles.card,
                !n.is_read && { borderColor: rgba(palette.secondary, 0.75), backgroundColor: '#FFFDF5' },
                pressed && { opacity: 0.88 },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: n.is_read ? rgba(palette.primary, 0.07) : palette.primary }]}>
                <Ionicons name={iconFor(n.event_type)} size={19} color={n.is_read ? palette.primary : palette.secondary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, !n.is_read && { fontWeight: '800' }]} numberOfLines={2}>
                    {n.title}
                  </Text>
                  {!n.is_read ? <View style={[styles.dot, { backgroundColor: palette.secondary }]} /> : null}
                </View>
                {n.body && n.body !== n.title ? (
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {n.body}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.ago}>{fmtRelative(n.created_at)}</Text>
                  {n.href && resolveNotificationHref(n.href) ? (
                    <View style={styles.openRow}>
                      <Text style={[styles.openLink, { color: palette.primary }]}>Open</Text>
                      <Ionicons name="arrow-forward" size={12} color={palette.primary} />
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ThemedPage>
  );
}

const styles = StyleSheet.create({
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    minHeight: 32,
  },
  markAllText: { fontSize: 12.5, fontWeight: '800' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(181,71,8,0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  noticeText: { flex: 1, fontSize: 12.5, color: '#7A2E0E' },
  bucket: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: MUTED_INK,
    marginTop: 6,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6ECE9',
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: INK },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardBody: { marginTop: 4, fontSize: 13, color: '#4A5A52', lineHeight: 18 },
  cardMeta: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ago: { fontSize: 11.5, color: MUTED_INK },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  openLink: { fontSize: 12, fontWeight: '800' },
  footer: { paddingVertical: 16 },
  end: { textAlign: 'center', fontSize: 12, color: MUTED_INK, marginVertical: 12 },
});
