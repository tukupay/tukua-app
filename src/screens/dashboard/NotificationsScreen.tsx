import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deskFetch } from '../../lib/deskApi';
import { resolveNotificationHref } from '../../lib/notificationDeepLink';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';

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

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#041F18', '#0A3D2E', '#F7FAF8']}
        locations={[0, 0.28, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: floatingHeaderInset(insets.top) - 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </Text>
        </View>
        {unread > 0 ? (
          <Pressable onPress={() => void markAll()} style={styles.markAll}>
            <Text style={styles.markAllText}>Mark all</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ padding: 24, alignItems: 'center', gap: 10 }}>
          <Ionicons name="cloud-offline-outline" size={36} color="#fff" />
          <Text style={{ color: '#fff', textAlign: 'center', opacity: 0.9 }}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              void load();
            }}
            style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={Colors.brandGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={36} color={Colors.brandGreen} />
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
              style={[styles.card, !item.is_read && styles.cardUnread]}>
              <View style={[styles.iconWrap, !item.is_read && styles.iconWrapUnread]}>
                <Ionicons
                  name={iconFor(item.event_type)}
                  size={20}
                  color={!item.is_read ? '#fff' : Colors.brandGreen}
                />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!item.is_read ? <View style={styles.dot} /> : null}
                </View>
                {item.body && item.body !== item.title ? (
                  <Text style={styles.cardBodyText} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.ago}>{timeAgo(item.created_at)}</Text>
                  {item.href ? (
                    <Text style={styles.openLink}>
                      Open <Ionicons name="arrow-forward" size={12} color={Colors.orange} />
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: 'PlusJakartaSans_700Bold' },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 2 },
  markAll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  markAllText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    borderColor: 'rgba(10,61,46,0.25)',
    backgroundColor: '#F2FBF6',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: Colors.brandGreen },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
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
  openLink: { fontSize: 12, fontWeight: '600', color: Colors.orange },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 28 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fff',
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
