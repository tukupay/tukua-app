import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNestApiBaseUrl } from '../../lib/localHost';
import { resolveNestAccessTokenForWebView } from '../../lib/platformNestAuth';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { Colors } from '../../theme/yana';

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

/**
 * Native chat history drawer — replaces the web ChatGroupedSidebar inside the app WebView.
 */
export function NativeChatDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { sendChatCommand, jumpToTab } = useWebViewControl();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ChatHit[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    if (visible) void load();
  }, [visible, load]);

  const openChat = (id: string) => {
    onClose();
    jumpToTab('Chat');
    // Web ChatPage listens via app-shell-select-chat + TUKUA_MOBILE_CMD select_chat
    sendChatCommand('select_chat', { chatId: id });
  };

  const newChat = () => {
    onClose();
    jumpToTab('Chat');
    sendChatCommand('new_chat');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.panel, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Chats</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close chats">
              <Ionicons name="close" size={22} color={Colors.foreground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newBtn} onPress={newChat} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.newBtnText}>New chat</Text>
          </TouchableOpacity>

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
              {items.length === 0 ? (
                <Text style={styles.empty}>No chats yet — start one.</Text>
              ) : (
                items.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.row}
                    onPress={() => openChat(c.id)}
                    activeOpacity={0.8}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {c.title || 'Chat'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  newBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
    fontFamily: 'Inter_500Medium',
  },
  center: { paddingVertical: 36, alignItems: 'center', gap: 10 },
  error: { color: Colors.destructive, textAlign: 'center', fontSize: 13 },
  retry: { color: Colors.primary, fontWeight: '700' },
  empty: { color: Colors.mutedForeground, padding: 16, textAlign: 'center' },
});
