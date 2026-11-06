import React, { useCallback, useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { LogoPartners } from '../components/auth/LogoPartners';
import { LoginHeroCurve, loginHeroHeight } from '../components/auth/LoginHeroCurve';
import { ChatPatternBackdrop } from '../components/auth/ChatPatternBackdrop';
import { CurveHProvider, CurvePaint } from '../components/auth/CurvePaint';
import { CertifyingAgenciesCarousel } from '../components/auth/CertifyingAgenciesCarousel';
import { NewsHighlight } from '../components/auth/NewsHighlight';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthButton } from '../components/auth/AuthButton';
import { GlassPanel } from '../components/dashboard/Glass';

import { RootStackParamList } from '../navigation/types';

import { signInWithEmail, fetchProfile, fetchProfileGate, sendPasswordReset, signOut } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useDeskAuth } from '../context/DeskAuthContext';

import { useDialog } from '../context/DialogContext';

import { isBiometricLoginAvailable, unlockBiometricCredentials } from '../lib/biometrics';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { captureUserLocation } from '../lib/location';

import { registerForPushNotifications } from '../lib/notifications';

import { log } from '../lib/logger';
import { getDeskApiDebugInfo, saveDeskCredentials } from '../lib/deskApi';

import { Colors } from '../theme/yana';
import { useAuthScale } from '../components/auth/useAuthScale';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {

  const { showDialog } = useDialog();

  const layout = useAuthScale(0.88);

  const { s, font } = layout;
  /** Curve sits just above the form (was ~72% and overlapped fields). */
  const curveH = loginHeroHeight(layout.width, layout.height);

  const { refreshProfile, adoptSession } = useAuth();
  const { connectDesk } = useDeskAuth();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [obscure, setObscure] = useState(true);

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);

  const [bioAvailable, setBioAvailable] = useState(false);
  const bioPromptedRef = React.useRef(false);
  const handleBiometricRef = React.useRef<() => Promise<void>>(async () => {});

  useFocusEffect(
    useCallback(() => {
      hideSystemStatusBar();
      let cancelled = false;
      (async () => {
        const ok = await isBiometricLoginAvailable();
        if (cancelled) return;
        setBioAvailable(ok);
        if (ok && !bioPromptedRef.current) {
          bioPromptedRef.current = true;
          setTimeout(() => {
            if (!cancelled) void handleBiometricRef.current();
          }, 450);
        }
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

  const handleBiometric = async () => {
    try {
      setLoading(true);
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
  handleBiometricRef.current = handleBiometric;

  const handleForgot = async () => {
    const raw = email.trim();
    if (!raw) {
      showDialog({
        title: 'Email or phone required',
        message: 'Enter your email or phone first, then tap Forgotten Password.',
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

  return (
    <View style={styles.root}>
      <ChatPatternBackdrop />
      <LoginHeroCurve height={curveH} />

      <CurveHProvider height={curveH}>
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                minHeight: layout.scrollMinH,
                paddingBottom: layout.bottomPad,
                paddingHorizontal: layout.padH,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.centerBlock, { paddingTop: Math.max(s(20), Math.round(curveH * 0.1)) }]}>
              <CurvePaint>
                {(inside) => <LogoPartners compact={layout.compact} onGreen={inside} />}
              </CurvePaint>

              <View style={{ height: Math.max(layout.spacer, s(10)) }} />

              <GlassPanel
                tone="frost"
                radius={16}
                shine
                style={[styles.formCard, { width: layout.formWidth, marginTop: s(8), padding: s(18) }]}>
                <Text style={[styles.loginTitle, { fontSize: font(20) }]}>Welcome back</Text>
                <Text style={[styles.loginSub, { fontSize: font(13), marginBottom: s(16) }]}>
                  Sign in to Tukua
                </Text>
                <Text style={[styles.fieldLabel, { fontSize: font(11) }]}>Email, phone or username</Text>
                <AuthTextField
                  hint="you@example.com / 07… / username"
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  suffixIcon="person-outline"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={[styles.fieldLabel, { fontSize: font(11), marginTop: s(14) }]}>Password</Text>
                <AuthTextField
                  hint="Password"
                  isPassword
                  obscure={obscure}
                  onToggleObscure={() => setObscure((v) => !v)}
                  autoComplete="password"
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                />

                <View style={[styles.rememberRow, { marginTop: s(14) }]}>
                  <TouchableOpacity style={styles.rememberLeft} onPress={() => setRememberMe((v) => !v)}>
                    <Ionicons
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={s(20)}
                      color={rememberMe ? Colors.orange : Colors.mutedForeground}
                    />
                    <Text style={[styles.rememberText, { fontSize: font(12) }]}>Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleForgot} hitSlop={8}>
                    <Text style={[styles.forgotText, { fontSize: font(12) }]}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.loginRow, { marginTop: s(16) }]}>
                  <AuthButton text="Log in" enabled={canLogin} loading={loading} onPress={handleLogin} />
                  {bioAvailable && !loading ? (
                    <TouchableOpacity
                      style={[styles.fingerprint, { width: s(52), height: s(52), borderRadius: 16 }]}
                      onPress={handleBiometric}
                      accessibilityLabel="Sign in with biometrics">
                      <Ionicons name="finger-print" size={layout.compact ? s(24) : s(26)} color={Colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </GlassPanel>

              <TouchableOpacity
                style={[styles.registerLink, { marginTop: s(16) }]}
                onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLinkText, { fontSize: font(14) }]}>
                  Don't have an account? <Text style={styles.registerLinkEm}>Create account</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.institutionFooter}>

              <NewsHighlight />

              <Text style={[styles.partnerLabel, { fontSize: font(10) }]}>Partner Institutions</Text>

              <CertifyingAgenciesCarousel compact={layout.compact} />

            </View>

          </ScrollView>

        </KeyboardAvoidingView>

      </SafeAreaView>
      </CurveHProvider>

    </View>

  );

}

const styles = StyleSheet.create({

  root: {

    flex: 1,

    backgroundColor: Colors.background,

  },

  safe: { flex: 1, width: '100%', zIndex: 2 },

  flex: { flex: 1 },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerBlock: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  institutionFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    gap: 6,
  },

  partnerLabel: {

    fontSize: 10,

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
    color: Colors.ink,
  },
  loginSub: {
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: Colors.mutedForeground,
  },
  formCard: {
    alignSelf: 'center',
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.labelGray,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
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
    gap: 8,
  },
  rememberText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
  },
  forgotText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.orange,
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
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  registerLink: {
    paddingVertical: 4,
  },
  registerLinkText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    color: Colors.mutedForeground,
  },
  registerLinkEm: {
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.brandGreenMid,
  },
});

