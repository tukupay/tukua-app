import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { toggleSavageMode } from '../../lib/userPreferences';
import { biometricEnableMessage, enableBiometrics } from '../../lib/biometrics';
import { TukuaBrandMark } from './TukuaBrandMark';
import { ProfileAvatar } from './ProfileAvatar';
import { Colors } from '../../theme/yana';

const SAVAGE_ON_OPACITY = 1;
const SAVAGE_OFF_OPACITY = 0.22;

export function NativeAppHeader() {
  const { profile, logout, session, savageMode, setSavageMode } = useAuth();
  const { showDialog } = useDialog();
  const { navigate, sendChatCommand, jumpToTab } = useWebViewControl();
  const [open, setOpen] = useState(false);
  const savageOpacity = useRef(new Animated.Value(SAVAGE_OFF_OPACITY)).current;

  const displayName = profile?.fullName?.trim() || profile?.email?.split('@')[0] || 'Account';
  const avatarUrl =
    profile?.avatarUrl ||
    (session?.user?.user_metadata?.avatar_url as string | undefined) ||
    (session?.user?.user_metadata?.profile_image_url as string | undefined) ||
    null;

  useEffect(() => {
    if (!session?.user) {
      savageOpacity.setValue(SAVAGE_OFF_OPACITY);
      return;
    }
    savageOpacity.setValue(savageMode ? SAVAGE_ON_OPACITY : SAVAGE_OFF_OPACITY);
  }, [session?.user?.id, savageMode, savageOpacity]);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

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

  const handleEnableBiometrics = useCallback(() => {
    const email = session?.user?.email;
    if (!email) return;
    setOpen(false);
    void (async () => {
      const result = await enableBiometrics(email);
      if (result.ok) {
        showDialog({
          title: 'Biometrics enabled',
          message: 'Fingerprint or face unlock is ready on the login screen.',
          variant: 'success',
          icon: 'finger-print-outline',
        });
        return;
      }
      showDialog({
        title: 'Could not enable biometrics',
        message: biometricEnableMessage(result.reason),
        variant: 'warning',
        icon: 'finger-print-outline',
      });
    })();
  }, [session?.user?.email, showDialog]);

  const handleLogout = useCallback(() => {
    setOpen(false);
    showDialog({
      title: 'Sign out of Tukua?',
      message: 'You will need to sign in again to access your chats and courses.',
      variant: 'danger',
      icon: 'log-out-outline',
      buttons: [
        { text: 'Stay signed in', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => logout() },
      ],
    });
  }, [logout, showDialog]);

  const menuSections = useMemo(
    () => [
      {
        title: 'Chat',
        items: [
          {
            id: 'new-chat',
            label: 'New chat',
            icon: 'add-circle-outline' as const,
            onPress: (): void => {
              sendChatCommand('new_chat');
            },
          },
          {
            id: 'models',
            label: 'AI models',
            icon: 'sparkles-outline' as const,
            onPress: () => sendChatCommand('open_models'),
          },
        ],
      },
      {
        title: 'Account',
        items: [
          {
            id: 'profile',
            label: 'Profile',
            icon: 'person-outline' as const,
            onPress: () => navigate('/profile', '/profile'),
          },
          {
            id: 'balances',
            label: 'Balances & tokens',
            icon: 'wallet-outline' as const,
            onPress: () => navigate('/profile/balances', '/profile'),
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: 'settings-outline' as const,
            onPress: () => navigate('/profile/preferences', '/profile'),
          },
          {
            id: 'biometrics',
            label: 'Fingerprint login',
            icon: 'finger-print-outline' as const,
            onPress: handleEnableBiometrics,
          },
          {
            id: 'logout',
            label: 'Sign out',
            icon: 'log-out-outline' as const,
            destructive: true,
            onPress: handleLogout,
          },
        ],
      },
      {
        title: 'Explore',
        items: [
          {
            id: 'courses',
            label: 'Courses',
            icon: 'book-outline' as const,
            onPress: () => navigate('/courses', '/courses'),
          },
          {
            id: 'about',
            label: 'About & support',
            icon: 'information-circle-outline' as const,
            onPress: () => jumpToTab('About'),
          },
        ],
      },
    ],
    [handleEnableBiometrics, handleLogout, jumpToTab, navigate, sendChatCommand],
  );

  return (
    <>
      <View style={styles.bar}>
        <TukuaBrandMark />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.savageBtn, savageMode && styles.savageBtnActive]}
            onPress={() => void handleSavageToggle()}
            accessibilityLabel={savageMode ? 'Savage mode on' : 'Savage mode off'}
            accessibilityRole="button">
            <Animated.Text style={[styles.savageEmoji, { opacity: savageOpacity }]}>😏</Animated.Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuTrigger}
            onPress={() => setOpen(true)}
            accessibilityLabel="Open menu">
            <ProfileAvatar name={displayName} uri={avatarUrl} size={24} />
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleLogout}
            accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={18} color={Colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderRow}>
                <ProfileAvatar name={displayName} uri={avatarUrl} size={40} />
                <View style={styles.sheetHeaderText}>
                  <Text style={styles.sheetName}>{displayName}</Text>
                  {profile?.email ? <Text style={styles.sheetEmail}>{profile.email}</Text> : null}
                </View>
              </View>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {menuSections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuRow}
                      onPress={() => closeAnd(item.onPress)}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={'destructive' in item && item.destructive ? Colors.destructive : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.menuLabel,
                          'destructive' in item && item.destructive && styles.menuLabelDestructive,
                        ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '78%',
    flexShrink: 1,
  },
  savageBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  savageBtnActive: {
    borderColor: 'rgba(234,88,12,0.35)',
    backgroundColor: 'rgba(255,237,213,0.85)',
  },
  savageEmoji: {
    fontSize: 15,
    lineHeight: 17,
  },
  menuTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(31,139,76,0.15)',
    minWidth: 0,
  },
  signOutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
    backgroundColor: 'rgba(254,226,226,0.5)',
    flexShrink: 0,
  },
  userName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  sheet: {
    width: 280,
    maxHeight: '78%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sheetName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  sheetEmail: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
  },
  sheetScroll: { paddingVertical: 6 },
  section: { paddingHorizontal: 8, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    fontFamily: 'Inter_500Medium',
  },
  menuLabelDestructive: {
    color: Colors.destructive,
  },
});
