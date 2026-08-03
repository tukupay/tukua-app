import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { toggleSavageMode } from '../../lib/userPreferences';
import { Colors } from '../../theme/yana';
import { FLOATING_HEADER_BODY, TAB_BAR_BODY_HEIGHT } from '../../constants/layout';

const SAVAGE_ON_OPACITY = 1;
const SAVAGE_OFF_OPACITY = 0.22;

/**
 * Chat-tab-only floating chrome: + new chat (bottom-right above tab bar)
 * and savage toggle (top-right under the floating header).
 */
export function ChatTabChrome() {
  const insets = useSafeAreaInsets();
  const { session, savageMode, setSavageMode } = useAuth();
  const { showDialog } = useDialog();
  const { activeTabPath, sendChatCommand, jumpToTab } = useWebViewControl();
  const savageOpacity = useRef(new Animated.Value(SAVAGE_OFF_OPACITY)).current;

  const visible = activeTabPath === '/chat';

  useEffect(() => {
    if (!session?.user) {
      savageOpacity.setValue(SAVAGE_OFF_OPACITY);
      return;
    }
    savageOpacity.setValue(savageMode ? SAVAGE_ON_OPACITY : SAVAGE_OFF_OPACITY);
  }, [session?.user?.id, savageMode, savageOpacity]);

  if (!visible) return null;

  const handleSavageToggle = async () => {
    try {
      const enabled = await toggleSavageMode();
      if (enabled === null) {
        showDialog({
          title: 'Sign in required',
          message: 'Sign in to toggle savage mode.',
          variant: 'warning',
          icon: 'flame-outline',
        });
        return;
      }
      setSavageMode(enabled);
      Animated.timing(savageOpacity, {
        toValue: enabled ? SAVAGE_ON_OPACITY : SAVAGE_OFF_OPACITY,
        duration: 220,
        useNativeDriver: true,
      }).start();
      showDialog({
        title: enabled ? 'Savage mode ON 😏' : 'Savage mode off',
        message: enabled
          ? 'Tukua will respond with extra wit. Enjoy responsibly.'
          : 'Back to the regular Tukua tone.',
        variant: 'success',
        icon: 'flame-outline',
      });
    } catch {
      showDialog({
        title: 'Could not update',
        message: 'Savage mode failed to save. Try again.',
        variant: 'danger',
        icon: 'flame-outline',
      });
    }
  };

  const topInset = insets.top + FLOATING_HEADER_BODY + 8;
  const bottomInset = TAB_BAR_BODY_HEIGHT + insets.bottom + 16;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <TouchableOpacity
        style={[styles.savageBtn, { top: topInset }, savageMode && styles.savageBtnActive]}
        onPress={() => void handleSavageToggle()}
        accessibilityLabel={savageMode ? 'Savage mode on' : 'Savage mode off'}
        accessibilityRole="button">
        <Animated.Text style={[styles.savageEmoji, { opacity: savageOpacity }]}>😏</Animated.Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.newChatFab, { bottom: bottomInset }]}
        onPress={() => {
          jumpToTab('Chat');
          sendChatCommand('new_chat');
        }}
        accessibilityLabel="New chat"
        activeOpacity={0.85}>
        <Ionicons name="add" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  savageBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 40,
    elevation: 40,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(4,31,24,0.28)',
  },
  savageBtnActive: {
    borderColor: 'rgba(244,140,6,0.75)',
    backgroundColor: 'rgba(232,93,4,0.38)',
  },
  savageEmoji: {
    fontSize: 17,
    lineHeight: 20,
  },
  newChatFab: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
    elevation: 40,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(10,61,46,0.35)',
    // Light / slightly visible — not opaque green
    backgroundColor: 'rgba(232,245,239,0.72)',
  },
});
