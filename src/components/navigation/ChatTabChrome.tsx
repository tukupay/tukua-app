import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { Colors } from '../../theme/yana';
import { FLOATING_HEADER_BODY } from '../../constants/layout';

/**
 * Chat-tab-only floating chrome: + new chat, docked top-right under the
 * floating header (savage toggle now lives in `NativeAppHeader` actions).
 */
export function ChatTabChrome() {
  const insets = useSafeAreaInsets();
  const { activeTabPath, sendChatCommand, jumpToTab } = useWebViewControl();

  const visible = activeTabPath === '/chat';

  if (!visible) return null;

  const topInset = insets.top + FLOATING_HEADER_BODY + 8;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        style={[styles.newChatBtn, { top: topInset }]}
        onPress={() => {
          jumpToTab('Chat');
          sendChatCommand('new_chat');
        }}
        accessibilityLabel="New chat"
        accessibilityRole="button"
        activeOpacity={0.85}>
        <Ionicons name="add" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  newChatBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 40,
    elevation: 40,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(10,61,46,0.35)',
    // Light / slightly visible — not opaque green
    backgroundColor: 'rgba(232,245,239,0.72)',
  },
});
