import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import MaskedView from '@react-native-masked-view/masked-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { LogoPartners } from '../components/auth/LogoPartners';
import { CertifyingAgenciesCarousel } from '../components/auth/CertifyingAgenciesCarousel';
import { NewsHighlight } from '../components/auth/NewsHighlight';
import { GreenPattern } from '../components/dashboard/DashboardBackground';

import { AuthTextField } from '../components/auth/AuthTextField';

import { AuthButton } from '../components/auth/AuthButton';

import { RootStackParamList } from '../navigation/types';

import { signInWithEmail, fetchProfile, fetchProfileGate, sendPasswordReset, signOut } from '../lib/auth';
import { useDeskAuth } from '../context/DeskAuthContext';

import { useAuth } from '../context/AuthContext';

import { useDialog } from '../context/DialogContext';

import { isBiometricLoginAvailable, unlockBiometricCredentials } from '../lib/biometrics';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { captureUserLocation } from '../lib/location';

import { registerForPushNotifications } from '../lib/notifications';

import { log } from '../lib/logger';
import { getDeskApiDebugInfo, saveDeskCredentials } from '../lib/deskApi';

import { Images } from '../constants/images';

import { Colors } from '../theme/yana';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const FORM_WIDTH = '88%';

export function LoginScreen({ navigation }: Props) {

  const { height, width } = useWindowDimensions();

  const { showDialog } = useDialog();

  const layout = useMemo(() => {

    const compact = height < 700;

    const small = height < 640;

    return {

      compact,

      small,

      topCurveH: height * (small ? 0.22 : compact ? 0.26 : 0.3),

      spacer: small ? 8 : compact ? 10 : 14,

      formGap: small ? 10 : 12,

      bottomPad: small ? 12 : 16,

      scrollMinH: height - (Platform.OS === 'ios' ? 48 : 32),

    };

  }, [height]);

  const { refreshProfile } = useAuth();
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

    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.trim().length >= 6;

  const finishLogin = async (loginEmail: string, loginPass: string) => {
    // Nest JWT first — Supabase JWT gets 401 on /parents/me/* (names/class).
    // Must finish before SIGNED_IN soft-adopt, and nest token is overwrite-locked in deskApi.
    // Always stash password so soft-reconnect works if Desk/proxy was down at login time.
    try {
      await saveDeskCredentials(loginEmail.trim(), loginPass);
    } catch {
      // ignore SecureStore failures
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

    // Supabase = Chat / Courses / Profile WebViews
    const { user } = await signInWithEmail(loginEmail.trim(), loginPass);
    if (!user) return;

    const gate = await fetchProfileGate(user.id);
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

    await fetchProfile(user.id);
    await refreshProfile();

    captureUserLocation().catch(() => {});
    registerForPushNotifications().catch(() => {});
  };

  const handleLogin = async () => {

    if (!canLogin) {

      showDialog({

        title: 'Check your details',

        message: 'Enter a valid email and password (min 6 characters).',

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

        message: err.message ?? 'Could not sign in. Check email and password.',

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
      // Same Nest-then-Supabase path as password login
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

    if (!email.trim()) {

      showDialog({

        title: 'Email required',

        message: 'Enter your email address first, then tap Forgotten Password.',

        variant: 'info',

        icon: 'mail-unread-outline',

      });

      return;

    }

    try {

      await sendPasswordReset(email.trim());

      showDialog({

        title: 'Check your email',

        message: 'If an account exists, a password reset link has been sent.',

        variant: 'success',

        icon: 'mail-open-outline',

      });

    } catch {

      showDialog({

        title: 'Could not send email',

        message: 'Please try again in a moment.',

        variant: 'danger',

      });

    }

  };

  return (
    <View style={styles.root}>
      <View style={[styles.topCurve, { height: layout.topCurveH }]} pointerEvents="none">
        <ImageBackground
          source={Images.curve1}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          imageStyle={styles.topCurveImage}
        />
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={styles.curveMaskRoot}>
              <Image source={Images.curve1} style={styles.curveMaskImage} resizeMode="cover" />
            </View>
          }>
          <View style={styles.curvePattern}>
            <GreenPattern darker />
          </View>
        </MaskedView>
      </View>

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                minHeight: layout.scrollMinH,
                paddingBottom: layout.bottomPad,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.centerBlock}>
              <LogoPartners compact={layout.compact} onGreen />

              <View style={{ height: layout.spacer }} />

              <Text style={[styles.loginTitle, layout.small && styles.loginTitleSmall]}>
                Login to your account
              </Text>

              <View style={{ height: layout.formGap }} />

              <View style={[styles.form, { maxWidth: width * 0.88 }]}>

                <AuthTextField

                  hint="you@example.com"

                  keyboardType="email-address"

                  autoCapitalize="none"

                  autoCorrect={false}

                  suffixIcon="mail-outline"

                  value={email}

                  onChangeText={setEmail}

                />

                <View style={{ height: layout.formGap }} />

                <AuthTextField

                  hint="Password"

                  isPassword

                  obscure={obscure}

                  onToggleObscure={() => setObscure((v) => !v)}

                  value={password}

                  onChangeText={setPassword}

                />

                <View style={{ height: layout.formGap }} />

                <View style={styles.rememberRow}>

                  <TouchableOpacity

                    style={styles.rememberLeft}

                    onPress={() => setRememberMe((v) => !v)}>

                    <Ionicons

                      name={rememberMe ? 'checkbox' : 'square-outline'}

                      size={20}

                      color={rememberMe ? Colors.brandGreenDark : Colors.mutedForeground}

                    />

                    <Text style={styles.rememberText}>Remember Me</Text>

                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForgot}>

                    <Text style={styles.forgotText}>Forgotten Password?</Text>

                  </TouchableOpacity>

                </View>

                <View style={{ height: layout.formGap }} />

                <View style={styles.loginRow}>

                  {loading ? (

                    <View style={styles.loadingBtn}>

                      <ActivityIndicator color={Colors.white} />

                    </View>

                  ) : (

                    <AuthButton text="Log in" enabled={canLogin} onPress={handleLogin} />

                  )}

                  {bioAvailable && !loading ? (

                    <TouchableOpacity style={styles.fingerprint} onPress={handleBiometric}>

                      <Ionicons

                        name="finger-print"

                        size={layout.compact ? 26 : 28}

                        color={Colors.white}

                      />

                    </TouchableOpacity>

                  ) : null}

                </View>

              </View>

              <TouchableOpacity

                style={styles.registerLink}

                onPress={() => navigation.navigate('Register')}>

                <Text style={styles.registerLinkText}>Don't have an account? Create Account</Text>

              </TouchableOpacity>

            </View>

            <View style={styles.institutionFooter}>

              <NewsHighlight />

              <Text style={styles.partnerLabel}>Partner Institutions</Text>

              <CertifyingAgenciesCarousel compact={layout.compact} />

            </View>

          </ScrollView>

        </KeyboardAvoidingView>

      </SafeAreaView>

    </View>

  );

}

const styles = StyleSheet.create({

  root: {

    flex: 1,

    backgroundColor: Colors.background,

  },

  topCurve: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topCurveImage: {
    resizeMode: 'cover',
  },
  curveMaskRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  curveMaskImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  curvePattern: {
    flex: 1,
    opacity: 0.88,
  },
  safe: { flex: 1, width: '100%' },

  flex: { flex: 1 },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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

    fontSize: 16,

    fontWeight: '700',

    color: Colors.brandGreenDark,

    fontFamily: 'Poppins_700Bold',

    textAlign: 'center',

  },

  loginTitleSmall: {

    fontSize: 15,

  },

  form: {

    width: FORM_WIDTH,

    alignItems: 'center',

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

    fontSize: 12,

    fontWeight: '600',

    color: Colors.brandGreenDark,

    fontFamily: 'Poppins_600SemiBold',

  },

  forgotText: {

    fontSize: 12,

    fontWeight: '600',

    color: Colors.brandGreenDark,

    fontFamily: 'Poppins_600SemiBold',

  },

  loginRow: {

    flexDirection: 'row',

    alignItems: 'center',

    width: '100%',

    gap: 10,

  },

  loadingBtn: {

    flex: 1,

    height: 48,

    borderRadius: 12,

    backgroundColor: Colors.primary,

    alignItems: 'center',

    justifyContent: 'center',

  },

  fingerprint: {

    width: 48,

    height: 48,

    borderRadius: 12,

    backgroundColor: Colors.orangeAccent,

    alignItems: 'center',

    justifyContent: 'center',

  },

  registerLink: {

    marginTop: 20,

    paddingVertical: 4,

  },

  registerLinkText: {

    color: Colors.brandGreenDark,

    fontWeight: '700',

    fontSize: 14,

    fontFamily: 'Poppins_600SemiBold',

    textAlign: 'center',

  },

});

