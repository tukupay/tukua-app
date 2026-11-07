import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD, CARD_SURFACE, INK, ThemedBackdrop, rgba } from '../../components/theme/ThemedPage';
import { useAppTheme } from '../../context/AppThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deskFetch } from '../../lib/deskApi';
import { resolveNotificationHref } from '../../lib/notificationDeepLink';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { Loader } from '../../components/ui/Loader';

type Notif = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

function iconFor(eventType: string): keyof typeof Ionicons.glyphMap {
  const t = eventType.toLowerCase();
  if (t.includes('meet')) return 'videocam';
  if (t.includes('pay') || t.includes('fee') || t.includes('receipt')) return 'wallet';
  if (t.includes('attend')) return 'checkmark-circle';
  if (t.includes('transport')) return 'bus';
  if (t.includes('library')) return 'library';
  if (t.includes('discipl')) return 'shield';
  return 'notifications';
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const { navigate: webNavigate, jumpToTab } = useWebViewControl();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await deskFetch<{ items: Notif[] }>('/platform/notifications?limit=50');
      setItems(data?.items || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load notifications';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openItem = async (n: Notif) => {
    if (!n.is_read) {
      try {
        await deskFetch(`/platform/notifications/${n.id}/read`, { method: 'POST' });
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      } catch {
        /* ignore */
      }
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
    try {
      await deskFetch('/platform/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch {
      /* ignore */
    }
  };

  const unread = items.filter((i) => !i.is_read).length;
  const { palette } = useAppTheme();

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <View style={[styles.header, { paddingTop: floatingHeaderInset(insets.top) - 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: palette.primary }]}>
          <Ionicons name="chevron-back" size={22} color={palette.secondary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <View style={[styles.titleMarker, { backgroundColor: palette.secondary }]} />
            <Text style={styles.title}>Notifications</Text>
          </View>
          <Text style={styles.sub}>
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </Text>
        </View>
        {unread > 0 ? (
          <Pressable onPress={() => void markAll()} style={[styles.markAll, { backgroundColor: rgba(palette.primary, 0.08) }]}>
            <Text style={[styles.markAllText, { color: palette.primary }]}>Mark all</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <Loader />
      ) : error ? (
        <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
          <Ionicons name="cloud-offline-outline" size={36} color={palette.primary} />
          <Text style={{ color: INK, textAlign: 'center', opacity: 0.9 }}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: palette.primary, borderRadius: 10 }}
          >
            <Text style={{ color: palette.secondary, fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomBarSpace + 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={palette.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: rgba(palette.secondary, 0.16) }]}>
                <Ionicons name="notifications-off-outline" size={36} color={palette.primary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyBody}>
                Alerts for fees, meetings, attendance and more will show up here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => void openItem(item)}
              style={[styles.card, !item.is_read && { borderColor: rgba(palette.secondary, 0.7) }]}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.is_read ? rgba(palette.secondary, 0.16) : palette.primary },
                ]}>
                <Ionicons
                  name={iconFor(item.event_type)}
                  size={20}
                  color={!item.is_read ? palette.secondary : palette.primary}
                />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!item.is_read ? <View style={[styles.dot, { backgroundColor: palette.secondary }]} /> : null}
                </View>
                {item.body && item.body !== item.title ? (
                  <Text style={styles.cardBodyText} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.ago}>{timeAgo(item.created_at)}</Text>
                  {item.href ? (
                    <Text style={[styles.openLink, { color: palette.primary }]}>
                      Open <Ionicons name="arrow-forward" size={12} color={palette.primary} />
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleMarker: { width: 4, height: 20, borderRadius: 2, marginRight: 8 },
  title: { color: INK, fontSize: 22, fontFamily: 'Roboto_700Bold', flexShrink: 1 },
  sub: { color: Colors.mutedForeground, fontSize: 13, marginTop: 2, marginLeft: 12 },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  markAllText: { fontSize: 12, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    gap: 12,
    ...CARD_SURFACE,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  cardBodyText: { marginTop: 4, fontSize: 13, color: Colors.labelGray, lineHeight: 18 },
  cardMeta: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ago: { fontSize: 11, color: Colors.mutedForeground },
  openLink: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 28 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.labelGray,
    lineHeight: 20,
  },
});
