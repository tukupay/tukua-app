import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { biometricEnableMessage, enableBiometrics } from '../../lib/biometrics';
import { hideSystemStatusBar } from '../ImmersiveSystemBars';
import { ProfileAvatar } from './ProfileAvatar';
import { TokenBalancePill } from './TokenBalancePill';
import { NativeChatDrawer } from './NativeChatDrawer';
import { Colors } from '../../theme/yana';
import { FLOATING_HEADER_BODY as NATIVE_HEADER_BODY_HEIGHT } from '../../constants/layout';
import { navigateDashboard, navigateProfile } from '../../navigation/AppNavigator';

export { NATIVE_HEADER_BODY_HEIGHT };

export function NativeAppHeader() {
  const insets = useSafeAreaInsets();
  const { profile, logout, session } = useAuth();
  const { showDialog } = useDialog();
  const { navigate, sendChatCommand, jumpToTab } = useWebViewControl();
  const [open, setOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(false);

  const displayName = profile?.fullName?.trim() || profile?.email?.split('@')[0] || 'Account';
  const avatarUrl = useMemo(() => {
    const candidates = [
      profile?.avatarUrl,
      session?.user?.user_metadata?.avatar_url as string | undefined,
      session?.user?.user_metadata?.profile_image_url as string | undefined,
      session?.user?.user_metadata?.picture as string | undefined,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return null;
  }, [profile?.avatarUrl, session?.user?.user_metadata]);

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const openProfileScreen = useCallback(
    (screen: 'ProfileHome' | 'Balances' | 'Preferences' | 'ProfileThemes') => {
      jumpToTab('Profile');
      setTimeout(() => navigateProfile(screen), 0);
    },
    [jumpToTab],
  );

  const handleEnableBiometrics = useCallback(() => {
    const email = session?.user?.email;
    if (!email) return;
    setOpen(false);
    void (async () => {
      const result = await enableBiometrics(email);
      hideSystemStatusBar();
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
        title: 'AI',
        items: [
          {
            id: 'new-chat',
            label: 'New chat',
            icon: 'sparkles-outline' as const,
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
            id: 'notifications',
            label: 'Notifications',
            icon: 'notifications-outline' as const,
            onPress: () => navigateDashboard('Notifications'),
          },
          {
            id: 'profile',
            label: 'Profile',
            icon: 'person-outline' as const,
            onPress: () => openProfileScreen('ProfileHome'),
          },
          {
            id: 'balances',
            label: 'Balances & tokens',
            icon: 'wallet-outline' as const,
            onPress: () => openProfileScreen('Balances'),
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: 'settings-outline' as const,
            onPress: () => openProfileScreen('Preferences'),
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
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'grid-outline' as const,
            onPress: () => jumpToTab('Dashboard'),
          },
        ],
      },
    ],
    [handleEnableBiometrics, handleLogout, jumpToTab, navigate, openProfileScreen, sendChatCommand],
  );

  return (
    <>
      <View pointerEvents="box-none" style={styles.floatWrap}>
        {/* Soft top fade — content scrolls underneath (compact chrome) */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(4,31,24,0.92)',
            'rgba(4,31,24,0.72)',
            'rgba(4,31,24,0.35)',
            'transparent',
          ]}
          locations={[0, 0.35, 0.72, 1]}
          style={[styles.fade, { height: insets.top + NATIVE_HEADER_BODY_HEIGHT + 28 }]}
        />
        <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.chatsBtn}
            onPress={() => setChatsOpen(true)}
            accessibilityLabel="Open chats">
            <Ionicons name="menu" size={20} color={Colors.white} />
          </TouchableOpacity>

          <TokenBalancePill />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.menuTrigger}
              onPress={() => setOpen(true)}
              accessibilityLabel="Open menu">
              <ProfileAvatar name={displayName} uri={avatarUrl} size={24} />
              <Text style={styles.userName} numberOfLines={1}>
                {displayName}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              accessibilityLabel="Sign out">
              <Ionicons name="log-out-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { paddingTop: insets.top + 48 }]} onPress={() => setOpen(false)}>
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

      <NativeChatDrawer visible={chatsOpen} onClose={() => setChatsOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: NATIVE_HEADER_BODY_HEIGHT,
    backgroundColor: 'transparent',
    gap: 10,
  },
  chatsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(4,31,24,0.4)',
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  menuTrigger: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(4,31,24,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    maxWidth: 160,
    minWidth: 0,
  },
  signOutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(4,31,24,0.35)',
    flexShrink: 0,
  },
  userName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
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
