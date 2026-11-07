import React, { useCallback, useState } from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { TopWave, TukuaPatternLayer, topWaveHeight } from '../components/auth/TopWave';
import { CertifyingAgenciesCarousel } from '../components/auth/CertifyingAgenciesCarousel';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthButton } from '../components/auth/AuthButton';
import { KeyboardAwareScroll } from '../components/auth/KeyboardAwareScroll';
import { MadeInBadges } from '../components/auth/MadeInBadges';

import { RootStackParamList } from '../navigation/types';

import { signInWithEmail, fetchProfile, fetchProfileGate, sendPasswordReset, signOut } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';

import { useDialog } from '../context/DialogContext';

import {
  authenticateDevice,
  checkBiometricSupport,
  isBiometricLoginAvailable,
  unlockBiometricCredentials,
} from '../lib/biometrics';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { captureUserLocation } from '../lib/location';

import { registerForPushNotifications } from '../lib/notifications';

import { log } from '../lib/logger';
import { getDeskApiDebugInfo, saveDeskCredentials } from '../lib/deskApi';

import { Colors } from '../theme/yana';
import { Images } from '../constants/images';
import { useAuthScale } from '../components/auth/useAuthScale';

type Props = Partial<NativeStackScreenProps<RootStackParamList, 'Login'>> & {
  /** Shown as a page of the signed-out front door (GuestTabsScreen): no back arrow, room for the tab bar. */
  embedded?: boolean;
  /** Room kept free under the content (the floating tab bar). */
  bottomSpace?: number;
  /** "Create account" tapped. Default: open the Register screen. */
  onCreateAccount?: () => void;
};

/** Sign in: flat green wave, Tukua logo, one-line fields, flat pill button (TukuPay's look). */
export function LoginScreen({ embedded = false, bottomSpace = 0, onCreateAccount }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const { showDialog } = useDialog();

  const layout = useAuthScale(0.88);

  const { s, font } = layout;
  const waveH = topWaveHeight(layout.width);
  const canGoBack = !embedded && navigation.canGoBack();

  const { refreshProfile, adoptSession, session, profile, sessionUnlocked, unlockSession } = useAuth();
  // A session kept from last time, waiting on the front door (no auto login): offer "Continue as <name>".
  const storedUser = session?.user && !sessionUnlocked ? session.user : null;
  const storedEmail = storedUser?.email ? String(storedUser.email) : '';
  const storedName =
    (profile?.id === storedUser?.id ? profile?.fullName?.trim() : '') ||
    String((storedUser?.user_metadata as { full_name?: string } | undefined)?.full_name || '').trim() ||
    storedEmail.split('@')[0] ||
    '';
  const storedFirstName = storedName.split(/\s+/)[0] || 'you';
  const [useOtherAccount, setUseOtherAccount] = useState(false);
  const [deviceAuth, setDeviceAuth] = useState(false);
  const { connectDesk } = useDeskAuth();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [obscure, setObscure] = useState(true);

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);

  const [bioAvailable, setBioAvailable] = useState(false);

  // No auto prompt (owner: "dont auto login. let them click the biometrics or the form fill").
  useFocusEffect(
    useCallback(() => {
      hideSystemStatusBar();
      let cancelled = false;
      (async () => {
        const [ok, device] = await Promise.all([isBiometricLoginAvailable(), checkBiometricSupport()]);
        if (cancelled) return;
        setBioAvailable(ok);
        setDeviceAuth(device);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const canLogin =

    email.trim().length >= 3 && password.trim().length >= 6;

  const finishLogin = async (loginEmail: string, loginPass: string) => {
    // Nest desk JWT first — required for /parents/me/* (names/class).
    // Must finish before SIGNED_IN soft-adopt, and nest token is overwrite-locked in deskApi.
    // Always stash password so soft-reconnect works if Desk/proxy was down at login time.
    try {
      await saveDeskCredentials(loginEmail.trim(), loginPass);
    } catch {
      // ignore SecureStore failures
    }
    // Warm Nest identity JWT for chat/courses WebView (api-host), not GoTrue.
    try {
      const { resolveNestAccessTokenForWebView } = await import('../lib/platformNestAuth');
      await resolveNestAccessTokenForWebView();
    } catch {
      /* nest api-host may be down — inject falls back later */
    }
    log.info('DeskConnection', 'Nest desk login starting', {
      email: loginEmail.trim(),
      deskApi: getDeskApiDebugInfo().deskResolved,
    });
    try {
      await connectDesk(loginEmail.trim(), loginPass);
    } catch (e: unknown) {
      log.warn(
        'DeskConnection',
        'Nest desk login failed — Select student will lack Desk names until Desk LAN proxy :3255 is up',
        e instanceof Error ? e.message : String(e),
      );
    }

    // Nest identity (PEA / platform accounts).
    const signed = await signInWithEmail(loginEmail.trim(), loginPass);
    const nestSession = (signed as { session?: { access_token?: string; user?: { id?: string; app_metadata?: { provider?: string } } } })
      ?.session;
    if (nestSession?.access_token && nestSession.user) {
      await adoptSession(nestSession as any);
    }
    const userId = nestSession?.user?.id || (signed as { user?: { id?: string } })?.user?.id;
    if (!userId) return;

    const gate = await fetchProfileGate(userId);
    if (gate?.account_type === 'organization' && gate?.approval_status === 'pending') {
      await signOut();
      showDialog({
        title: 'Pending approval',
        message: "Your organisation account is pending approval. We'll contact you within 48 hours.",
        variant: 'warning',
        icon: 'business-outline',
      });
      return;
    }

    await fetchProfile(userId);
    await refreshProfile();

    captureUserLocation().catch(() => {});
    registerForPushNotifications().catch(() => {});
  };

  const handleLogin = async () => {

    if (!canLogin) {

      showDialog({

        title: 'Check your details',

        message: 'Enter your email, phone or username, and your password (6 characters at least).',

        variant: 'warning',

        icon: 'mail-outline',

      });

      return;

    }

    setLoading(true);

    try {

      await finishLogin(email, password);

    } catch (err: any) {

      showDialog({

        title: 'Login failed',

        message: err.message ?? 'Could not sign in. Check your email, phone or username, and your password.',

        variant: 'danger',

        icon: 'lock-closed-outline',

      });

    } finally {

      setLoading(false);

    }

  };

  /** Enter with the stored session after a device check (fingerprint/face/PIN); null when it is gone. */
  const unlockStored = async (): Promise<boolean | null> => {
    const ok = await authenticateDevice(`Continue as ${storedFirstName}`);
    hideSystemStatusBar();
    if (!ok) return false;
    const next = await unlockSession();
    return next ? true : null;
  };

  const handleContinueAs = async () => {
    if (!deviceAuth) {
      // No fingerprint/face on this phone: confirm with the password instead.
      setEmail(storedEmail);
      showDialog({
        title: `Continue as ${storedFirstName}`,
        message: 'Enter your password to continue.',
        variant: 'info',
        icon: 'lock-closed-outline',
      });
      return;
    }
    let res: boolean | null = false;
    try {
      setLoading(true);
      res = await unlockStored();
    } finally {
      setLoading(false);
      hideSystemStatusBar();
    }
    if (res === null) {
      // The stored session ended (e.g. refresh rejected): fall back to a sign-in.
      if (bioAvailable) await handleBiometric(true);
      else setEmail(storedEmail);
    }
  };

  const handleBiometric = async (skipStored = false) => {
    try {
      setLoading(true);
      if (!skipStored && storedUser && !useOtherAccount && deviceAuth) {
        const res = await unlockStored();
        if (res !== null) return; // unlocked, or the user cancelled
      }
      const unlocked = await unlockBiometricCredentials();
      hideSystemStatusBar();
      if (!unlocked) {
        showDialog({
          title: 'Biometrics',
          message: 'Authentication was cancelled or failed.',
          variant: 'warning',
          icon: 'finger-print-outline',
        });
        return;
      }
      // Same Nest REST login path as password login
      await finishLogin(unlocked.email, unlocked.password);
    } catch (err: any) {
      hideSystemStatusBar();
      showDialog({
        title: 'Login failed',
        message: err.message ?? 'Could not sign in.',
        variant: 'danger',
        icon: 'finger-print-outline',
      });
    } finally {
      setLoading(false);
      hideSystemStatusBar();
    }
  };

  const handleForgot = async () => {
    const raw = email.trim();
    if (!raw) {
      showDialog({
        title: 'Email or phone required',
        message: 'Enter your email or phone first, then tap Forgot password.',
        variant: 'info',
        icon: 'mail-unread-outline',
      });
      return;
    }

    try {
      const looksPhone = /^\+?[\d\s()-]{7,}$/.test(raw) && !raw.includes('@');
      await sendPasswordReset(looksPhone ? undefined : raw, looksPhone ? raw : undefined);
      showDialog({
        title: 'Check email or SMS',
        message:
          'If an account exists, a password reset link has been sent by email and/or SMS. Open the link on this device to set a new password.',
        variant: 'success',
        icon: 'mail-open-outline',
      });
    } catch {
      showDialog({
        title: 'Could not send reset link',
        message: 'Please try again in a moment.',
        variant: 'danger',
      });
    }
  };

  const logo = s(layout.compact ? 64 : 76);

  return (
    <View style={styles.root}>
      <TukuaPatternLayer />
      <TopWave />
      {canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={[styles.back, { top: insets.top + s(10), left: s(14) }]}>
          <Ionicons name="chevron-back" size={s(24)} color={Colors.white} />
        </TouchableOpacity>
      ) : null}
      <KeyboardAwareScroll
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(waveH * 0.55, insets.top + s(16)),
              paddingBottom: bottomSpace + insets.bottom + layout.bottomPad,
              paddingHorizontal: layout.padH,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.centerBlock}>
            {/* Logo badge sitting on the wave's edge */}
            <View
              style={[
                styles.logoBadge,
                { width: logo + s(12), height: logo + s(12), borderRadius: (logo + s(12)) / 2 },
              ]}>
              <Image
                source={Images.appIcon512}
                style={{ width: logo, height: logo, borderRadius: logo / 2 }}
                accessibilityLabel="Tukua"
              />
            </View>

            <Text style={[styles.loginTitle, { fontSize: font(28), marginTop: s(14) }]}>Tukua</Text>
            <Text style={[styles.loginSub, { fontSize: font(13), marginBottom: s(22) }]}>
              Sign in to continue
            </Text>

            {storedUser && !useOtherAccount ? (
              <View style={{ width: layout.formWidth, marginBottom: s(18) }}>
                <TouchableOpacity
                  style={[styles.continueCard, { paddingVertical: s(12), paddingHorizontal: s(14), gap: s(12) }]}
                  onPress={() => void handleContinueAs()}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Continue as ${storedName || storedFirstName}`}>
                  <View style={[styles.continueIcon, { width: s(40), height: s(40), borderRadius: s(20) }]}>
                    <Ionicons name={deviceAuth ? 'finger-print' : 'person'} size={s(22)} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.continueTitle, { fontSize: font(15) }]} numberOfLines={1}>
                      Continue as {storedFirstName}
                    </Text>
                    <Text style={[styles.continueSub, { fontSize: font(12) }]} numberOfLines={1}>
                      {deviceAuth ? 'Unlock with fingerprint, face or PIN' : storedEmail || 'Enter your password below'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={s(20)} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setUseOtherAccount(true);
                    setEmail('');
                  }}
                  hitSlop={8}
                  accessibilityRole="link"
                  style={{ alignSelf: 'center', marginTop: s(10) }}>
                  <Text style={[styles.rememberText, { fontSize: font(12) }]}>
                    Not {storedFirstName}? <Text style={styles.registerLinkEm}>Use another account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ width: layout.formWidth }}>
              <AuthTextField
                hint="Email, phone or username"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                suffixIcon="person-outline"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
              />

              <View style={{ height: s(14) }} />
              <AuthTextField
                hint="Password"
                isPassword
                obscure={obscure}
                onToggleObscure={() => setObscure((v) => !v)}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                value={password}
                onChangeText={setPassword}
              />

              <View style={[styles.rememberRow, { marginTop: s(16) }]}>
                <TouchableOpacity
                  style={styles.rememberLeft}
                  onPress={() => setRememberMe((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  hitSlop={8}>
                  <Ionicons
                    name={rememberMe ? 'checkmark-circle' : 'ellipse-outline'}
                    size={s(20)}
                    color={rememberMe ? Colors.primary : Colors.mutedForeground}
                  />
                  <Text style={[styles.rememberText, { fontSize: font(12) }]}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgot} hitSlop={8} accessibilityRole="link">
                  <Text style={[styles.forgotText, { fontSize: font(12) }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.loginRow, { marginTop: s(22) }]}>
                <AuthButton text="Log in" enabled={canLogin} loading={loading} onPress={handleLogin} />
                {(bioAvailable || (storedUser && !useOtherAccount && deviceAuth)) && !loading ? (
                  <TouchableOpacity
                    style={[styles.fingerprint, { width: s(50), height: s(50), borderRadius: s(25) }]}
                    onPress={() => void handleBiometric()}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with biometrics">
                    <Ionicons name="finger-print" size={s(26)} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.registerLink, { marginTop: s(18) }]}
                onPress={() => (onCreateAccount ? onCreateAccount() : navigation.navigate('Register'))}
                accessibilityRole="link">
                <Text style={[styles.registerLinkText, { fontSize: font(14) }]}>
                  New to Tukua? <Text style={styles.registerLinkEm}>Create account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.institutionFooter, { marginTop: s(20) }]}>
            <Text style={[styles.partnerLabel, { fontSize: font(10) }]}>Partner institutions</Text>
            <CertifyingAgenciesCarousel compact={layout.compact} />
            <MadeInBadges style={{ marginTop: s(8) }} />
          </View>
      </KeyboardAwareScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  back: {
    position: 'absolute',
    zIndex: 3,
    padding: 4,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerBlock: {
    width: '100%',
    alignItems: 'center',
  },
  logoBadge: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  institutionFooter: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  partnerLabel: {
    fontWeight: '600',
    color: Colors.mutedForeground,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  loginTitle: {
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    /** Brand wordmark green. */
    color: '#15411D',
    letterSpacing: 0.3,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  continueIcon: {
    backgroundColor: '#15411D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTitle: {
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
    color: '#15411D',
  },
  continueSub: {
    fontFamily: 'Inter_400Regular',
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  loginSub: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontFamily: 'Poppins_400Regular',
    color: Colors.mutedForeground,
  },
  forgotText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    /** Darker gold: Tukua yellow is too light for text on the page colour. */
    color: Colors.brandGreenMid,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  fingerprint: {
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerLink: {
    paddingVertical: 4,
    alignSelf: 'center',
  },
  registerLinkText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    color: Colors.mutedForeground,
  },
  registerLinkEm: {
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
  },
});
