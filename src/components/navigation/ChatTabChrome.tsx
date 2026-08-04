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
 * zIndex above header (50) so it stays tappable while the keyboard is open.
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
        <Ionicons name="add" size={22} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  newChatBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 60,
    elevation: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    // Extra-visible solid brand chip (was pale and lost under the dark header)
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
