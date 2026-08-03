/**
 * Nest password reset — opened via App Links (https://tukua.ai/reset-password)
 * or custom scheme (tukua://reset-password?token=…&type=recovery&expires_at=…).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthTextField } from '../components/auth/AuthTextField';
import { AuthButton } from '../components/auth/AuthButton';
import { GreenPattern } from '../components/dashboard/DashboardBackground';
import { RootStackParamList } from '../navigation/types';
import { forgotPassword, resetPassword } from '../lib/platformAuthApi';
import { Images } from '../constants/images';
import { Colors } from '../theme/yana';
import { useAuth } from '../context/AuthContext';

/** Must match Nest IdentityPasswordService RESET_TTL_SEC */
const RECOVERY_LINK_TTL_SEC = 3600;

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

function isRecoveryLinkExpired(expiresAtParam: string | null | undefined): boolean {
  if (!expiresAtParam) return false;
  const raw = String(expiresAtParam).trim();
  // Reject garbage fragments email clients sometimes inject ("1hour", truncated ISO, etc.)
  if (!/^\d{9,13}$/.test(raw)) return false;
  let expiresAt = parseInt(raw, 10);
  if (Number.isNaN(expiresAt)) return false;
  // Support ms timestamps if a client sent them by mistake
  if (expiresAt > 1e12) expiresAt = Math.floor(expiresAt / 1000);
  // If clock skew shows "already expired" by <2 minutes, still accept
  return Math.floor(Date.now() / 1000) > expiresAt + 120;
}

function parseExpiresUnix(expiresAtParam: string | null | undefined): number | null {
  if (!expiresAtParam) return null;
  const raw = String(expiresAtParam).trim();
  if (!/^\d{9,13}$/.test(raw)) return null;
  let n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  if (n > 1e12) n = Math.floor(n / 1000);
  return n;
}

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [obscure, setObscure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const [linkExpiresAt, setLinkExpiresAt] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [resendEmail, setResendEmail] = useState(route.params?.email?.trim() || '');
  const nestTokenRef = useRef('');

  const markExpired = useCallback((msg?: string) => {
    setExpired(true);
    setReady(false);
    setCountdownSec(null);
    setError(
      msg ||
        'This reset link has expired. Links are valid for 1 hour. Request a new one.',
    );
  }, []);

  useEffect(() => {
    const token = route.params?.token;
    const type = route.params?.type;
    const expiresAtParam = route.params?.expires_at;

    const parsed = parseExpiresUnix(expiresAtParam);
    if (parsed != null) setLinkExpiresAt(parsed);

    if (isRecoveryLinkExpired(expiresAtParam)) {
      markExpired();
      return;
    }

    if (token && (!type || type === 'recovery')) {
      nestTokenRef.current = token;
      setReady(true);
      setError('');
      return;
    }

    setError('This reset link is invalid or has expired. Request a new one.');
    setReady(false);
  }, [route.params?.token, route.params?.type, route.params?.expires_at, markExpired]);

  useEffect(() => {
    if (!ready || !linkExpiresAt) return;
    const tick = () => {
      const left = linkExpiresAt - Math.floor(Date.now() / 1000);
      if (left <= 0) {
        markExpired();
        return;
      }
      setCountdownSec(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ready, linkExpiresAt, markExpired]);

  const goBackHome = () => {
    if (isAuthenticated) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('Main');
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (linkExpiresAt && Math.floor(Date.now() / 1000) > linkExpiresAt) {
      markExpired();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const token = nestTokenRef.current;
    if (!token) {
      setError('This reset link is invalid or has expired. Request a new one.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetPassword(token, password);
      if (!result.ok) {
        const msg = result.message || 'Could not update password.';
        if (/expired|already used|invalid/i.test(msg)) markExpired(msg);
        else setError(msg);
        return;
      }
      nestTokenRef.current = '';
      setDone(true);
      setTimeout(() => {
        if (isAuthenticated) {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Main');
        } else {
          navigation.navigate('Login');
        }
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (/expired|already used|invalid/i.test(msg)) markExpired(msg);
      else {
        setError(
          msg ||
            "Couldn't update password. The reset link may have expired — request a new one.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const raw = resendEmail.trim();
    if (!raw) {
      setError('Enter the email or phone for your account to get a new link.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const looksPhone = /^\+?[\d\s()-]{7,}$/.test(raw) && !raw.includes('@');
      const result = await forgotPassword({
        email: looksPhone ? undefined : raw,
        phone: looksPhone ? raw : undefined,
        redirect_to: 'https://tukua.ai/reset-password',
      });
      if (!result.ok) {
        setError(result.message || 'Could not send a new reset link.');
        return;
      }
      setExpired(true);
      setReady(false);
      setDone(false);
      setError(
        'If an account exists, a new reset link was sent by email and/or SMS. Open the new link.',
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send a new reset link.');
    } finally {
      setResending(false);
    }
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero} pointerEvents="none">
        <GreenPattern style={StyleSheet.absoluteFill} darker />
      </View>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backRow} onPress={goBackHome} hitSlop={12}>
              <Ionicons name="arrow-back" size={20} color={Colors.brandGreenDark} />
              <Text style={styles.backText}>{isAuthenticated ? 'Back' : 'Sign in'}</Text>
            </TouchableOpacity>

            <Image source={Images.logoSplash} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>
              {done ? 'Password updated' : expired ? 'Link expired' : 'Set a new password'}
            </Text>
            <Text style={styles.sub}>
              {done
                ? 'Redirecting you…'
                : expired
                  ? 'Request a fresh reset link by email and/or SMS.'
                  : 'Choose a strong password. You will use it to sign in next time.'}
            </Text>

            {done ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                <Text style={styles.successText}>All set</Text>
              </View>
            ) : expired ? (
              <View style={styles.card}>
                {!!error && (
                  <View style={styles.errBox}>
                    <Text style={styles.errText}>{error}</Text>
                  </View>
                )}
                <AuthTextField
                  hint="Email or phone"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  suffixIcon="mail-outline"
                  value={resendEmail}
                  onChangeText={setResendEmail}
                />
                <View style={{ height: 12 }} />
                {resending ? (
                  <View style={styles.loadingBtn}>
                    <ActivityIndicator color={Colors.white} />
                  </View>
                ) : (
                  <AuthButton text="Request a new reset link" onPress={() => void handleResend()} />
                )}
              </View>
            ) : !ready ? (
              <View style={styles.card}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.muted}>{error || 'Verifying reset link…'}</Text>
                <Text style={styles.hint}>
                  Reset links expire after {RECOVERY_LINK_TTL_SEC / 3600} hour.
                </Text>
                {error ? (
                  <>
                    <View style={{ height: 12 }} />
                    <AuthTextField
                      hint="Email or phone"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      suffixIcon="mail-outline"
                      value={resendEmail}
                      onChangeText={setResendEmail}
                    />
                    <View style={{ height: 12 }} />
                    {resending ? (
                      <View style={styles.loadingBtn}>
                        <ActivityIndicator color={Colors.white} />
                      </View>
                    ) : (
                      <AuthButton
                        text="Request a new reset link"
                        onPress={() => void handleResend()}
                      />
                    )}
                  </>
                ) : null}
              </View>
            ) : (
              <View style={styles.card}>
                {countdownSec != null && countdownSec > 0 ? (
                  <Text style={styles.countdown}>
                    Link expires in {formatCountdown(countdownSec)}
                  </Text>
                ) : null}
                <AuthTextField
                  hint="New password (min 8 characters)"
                  isPassword
                  obscure={obscure}
                  onToggleObscure={() => setObscure((v) => !v)}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <View style={{ height: 12 }} />
                <AuthTextField
                  hint="Confirm new password"
                  isPassword
                  obscure={obscure}
                  onToggleObscure={() => setObscure((v) => !v)}
                  value={confirm}
                  onChangeText={setConfirm}
                  editable={!isLoading}
                />
                {!!error && (
                  <View style={[styles.errBox, { marginTop: 12 }]}>
                    <Text style={styles.errText}>{error}</Text>
                  </View>
                )}
                <View style={{ height: 16 }} />
                {isLoading ? (
                  <View style={styles.loadingBtn}>
                    <ActivityIndicator color={Colors.white} />
                  </View>
                ) : (
                  <AuthButton text="Update password" onPress={() => void handleSubmit()} />
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  safe: { flex: 1 },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    opacity: 0.35,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: {
    color: Colors.brandGreenDark,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 12 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  countdown: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.mutedForeground,
    marginBottom: 12,
    fontFamily: 'Inter_500Medium',
  },
  errBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  errText: {
    color: Colors.destructive,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
  },
  successText: {
    color: Colors.foreground,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  muted: {
    marginTop: 12,
    textAlign: 'center',
    color: Colors.mutedForeground,
    fontSize: 13,
  },
  hint: {
    marginTop: 8,
    textAlign: 'center',
    color: Colors.mutedForeground,
    fontSize: 12,
  },
  loadingBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.brandGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
