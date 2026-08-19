import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNestApiBaseUrl } from '../../lib/localHost';
import { resolveNestAccessTokenForWebView } from '../../lib/platformNestAuth';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { GreenPattern } from '../dashboard/DashboardBackground';
import { ProfileAvatar } from './ProfileAvatar';
import { Colors } from '../../theme/yana';
import { navigateProfile } from '../../navigation/rootNavigation';

type ChatHit = {
  id: string;
  title?: string;
  updated_at?: string;
  created_at?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Native left chat history drawer — search / delete / new chat / account. */
export function NativeChatDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { sendChatCommand, jumpToTab } = useWebViewControl();
  const { profile, session, logout } = useAuth();
  const { showDialog } = useDialog();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChatHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayName = profile?.fullName?.trim() || profile?.email?.split('@')[0] || 'Account';
  const avatarUri =
    profile?.avatarUrl ||
    (session?.user?.user_metadata?.avatar_url as string | undefined) ||
    null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await resolveNestAccessTokenForWebView();
      if (!token) {
        setError('Sign in again to load chats.');
        setItems([]);
        return;
      }
      const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}/chat/conversations`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || 'Could not load chats.');
        setItems([]);
        return;
      }
      const data = json?.data ?? json;
      const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setItems(
        rows.map((r: any) => ({
          id: String(r.id),
          title: String(r.title || r.name || 'Chat'),
          updated_at: r.updated_at,
          created_at: r.created_at,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery('');
      void load();
    }
  }, [visible, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [items, query]);

  const openChat = (id: string) => {
    onClose();
    jumpToTab('Chat');
    sendChatCommand('select_chat', { chatId: id });
  };

  const newChat = () => {
    onClose();
    jumpToTab('Chat');
    sendChatCommand('new_chat');
  };

    const deleteChat = (id: string, title?: string) => {
    showDialog({
      title: 'Delete chat?',
      message: `"${title || 'This conversation'}" will be removed from your history.`,
      variant: 'danger',
      icon: 'trash-outline',
      buttons: [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingId(id);
              try {
                const token = await resolveNestAccessTokenForWebView();
                if (!token) return;
                const res = await fetch(
                  `${getNestApiBaseUrl().replace(/\/$/, '')}/chat/conversations/${encodeURIComponent(id)}`,
                  {
                    method: 'DELETE',
                    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                  },
                );
                if (res.ok) setItems((prev) => prev.filter((c) => c.id !== id));
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ],
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <View
          style={[
            styles.panel,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <View style={[styles.hero, { paddingTop: Math.max(insets.top, 12) }]}>
            <GreenPattern style={styles.heroPattern} darker />
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.brand}>Tukua</Text>
                <Text style={styles.heroSub}>Your chats</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={newChat} activeOpacity={0.9}>
              <Ionicons name="add-circle" size={20} color={Colors.brandGreenDark} />
              <Text style={styles.newBtnText}>New chat</Text>
            </TouchableOpacity>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.75)" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search chats"
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.searchInput}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
              <TouchableOpacity onPress={() => void load()}>
                <Text style={styles.retry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Recent</Text>
              {filtered.length === 0 ? (
                <Text style={styles.empty}>{query ? 'No matches.' : 'No chats yet — start one.'}</Text>
              ) : (
                filtered.map((c) => (
                  <View key={c.id} style={styles.row}>
                    <TouchableOpacity
                      style={styles.rowMain}
                      onPress={() => openChat(c.id)}
                      activeOpacity={0.85}>
                      <View style={styles.rowIcon}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={16}
                          color={Colors.primary}
                        />
                      </View>
                      <Text style={styles.rowTitle} numberOfLines={2}>
                        {c.title || 'Chat'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteChat(c.id, c.title)}
                      disabled={deletingId === c.id}
                      hitSlop={8}>
                      {deletingId === c.id ? (
                        <ActivityIndicator size="small" color={Colors.destructive} />
                      ) : (
                        <Ionicons name="trash-outline" size={16} color={Colors.destructive} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <View style={styles.accountCard}>
              <TouchableOpacity
                style={styles.userCard}
                onPress={() => {
                  onClose();
                  navigateProfile('ProfileHome');
                }}
                activeOpacity={0.9}>
                <ProfileAvatar name={displayName} uri={avatarUri} size={32} />
                <View style={styles.userText}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {profile?.email ? (
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {profile.email}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
              </TouchableOpacity>
              <View style={styles.cardDivider} />
              <TouchableOpacity
                style={styles.logoutBtn}
                activeOpacity={0.9}
                onPress={() => {
                  onClose();
                  showDialog({
                    title: 'Sign out?',
                    message: 'You can sign back in anytime with your Tukua account.',
                    variant: 'danger',
                    icon: 'log-out-outline',
                    buttons: [
                      { text: 'Stay', style: 'cancel' },
                      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
                    ],
                  });
                }}>
                <Ionicons name="log-out-outline" size={18} color={Colors.destructive} />
                <Text style={styles.logoutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(4,31,24,0.45)' },
  panel: {
    width: '86%',
    maxWidth: 360,
    height: '100%',
    backgroundColor: '#F4F7F5',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#042016',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 0 },
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    backgroundColor: Colors.brandGreenDark,
  },
  heroPattern: { ...StyleSheet.absoluteFillObject },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 1,
  },
  brand: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 1,
    marginBottom: 10,
  },
  newBtnText: {
    color: Colors.brandGreenDark,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 2,
    fontFamily: 'Inter_400Regular',
  },
  list: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.08)',
    paddingRight: 4,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,128,61,0.1)',
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    fontFamily: 'Inter_500Medium',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 10 },
  error: { color: Colors.destructive, textAlign: 'center', fontSize: 13, paddingHorizontal: 16 },
  retry: { color: Colors.primary, fontWeight: '700' },
  empty: { color: Colors.mutedForeground, padding: 16, textAlign: 'center' },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10,61,46,0.1)',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  /** Single pinned-bottom card — profile row + logout row share one border/bg. */
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.08)',
    overflow: 'hidden',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(10,61,46,0.08)',
    marginHorizontal: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  userText: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Inter_600SemiBold',
  },
  userEmail: {
    fontSize: 11,
    color: Colors.mutedForeground,
    marginTop: 1,
    fontFamily: 'Inter_400Regular',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  logoutText: {
    color: Colors.destructive,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
