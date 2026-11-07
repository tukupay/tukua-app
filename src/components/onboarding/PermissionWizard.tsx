/**
 * First-run permission wizard (owner, 2026-11-07): one calm card per permission, shown once after install,
 * instead of several system dialogs popping at once. Each card says WHY in school/parent words; the system
 * dialog appears only after the user taps Allow. "Not now" moves on; features still ask in context later.
 *
 * Steps (each skipped when already allowed, or when the phone cannot ask again):
 *  - Notifications (fees, results, school messages)
 *  - Location (bus tracking, gate check-in, sign-in security)
 *  - Camera (scan QR codes, ID photos, documents)
 *  - Fingerprint sign-in — not an OS permission on Android: only when the phone has a fingerprint/face
 *    enrolled; "Allow" confirms with the finger and saves the preference, and the next password sign-in
 *    turns biometric sign-in on (lib/biometrics.ts applyBiometricPreferenceAfterLogin).
 * Contacts are not asked here: Tukua Connect asks when the user opens contact matching.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthButton } from '../auth/AuthButton';
import { TopWave, TukuaPatternLayer, topWaveHeight } from '../auth/TopWave';
import { useAuthScale } from '../auth/useAuthScale';
import { hideSystemStatusBar } from '../ImmersiveSystemBars';
import { useAppTheme } from '../../context/AppThemeContext';
import { Colors } from '../../theme/yana';
import { requestLocationPermission } from '../../lib/location';
import { ensurePushPermissions } from '../../lib/pushNotifications';
import { loadNotifications } from '../../lib/expoNotifications';
import {
  authenticateDevice,
  checkBiometricSupport,
  getBiometricPreference,
  isBiometricLoginAvailable,
  setBiometricPreference,
} from '../../lib/biometrics';
import { log } from '../../lib/logger';

/** Bump the suffix to show the wizard again after adding a new step. */
export const PERMISSION_WIZARD_DONE_KEY = 'tukua_permission_wizard_done_v1';

type StepId = 'notifications' | 'location' | 'camera' | 'biometrics';

type Step = {
  id: StepId;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  reason: string;
  allow: string;
};

const ALL_STEPS: Record<StepId, Step> = {
  notifications: {
    id: 'notifications',
    icon: 'notifications-outline',
    title: 'Stay in the loop',
    reason: 'Get a note when fees are paid, results are out, or the school sends a message about your child.',
    allow: 'Allow notifications',
  },
  location: {
    id: 'location',
    icon: 'location-outline',
    title: 'Know where the bus is',
    reason: 'Used for school bus tracking, gate check-in and to keep your account safe when you sign in.',
    allow: 'Allow location',
  },
  camera: {
    id: 'camera',
    icon: 'camera-outline',
    title: 'Scan and snap',
    reason: 'Scan school QR codes and take photos of IDs, receipts or homework when you choose to.',
    allow: 'Allow camera',
  },
  biometrics: {
    id: 'biometrics',
    icon: 'finger-print',
    title: 'Sign in with your fingerprint',
    reason: 'Open Tukua with a touch instead of typing your password each time. Your password stays on this phone.',
    allow: 'Turn on fingerprint sign-in',
  },
};

async function cameraModule() {
  return import('expo-camera');
}

/** Which steps still need an answer on this phone. Never throws: a failed check just skips that step. */
async function pendingSteps(): Promise<Step[]> {
  const out: Step[] = [];
  try {
    // Expo Go: expo-notifications is never loaded (it warns there), so the step is skipped.
    const N = loadNotifications();
    if (N) {
      const p = await N.getPermissionsAsync();
      if (!p.granted && p.canAskAgain !== false) out.push(ALL_STEPS.notifications);
    }
  } catch {
    /* not available in this runtime */
  }
  try {
    const Location = await import('expo-location');
    const p = await Location.getForegroundPermissionsAsync();
    if (p.status !== 'granted' && p.canAskAgain !== false) out.push(ALL_STEPS.location);
  } catch {
    /* skip */
  }
  try {
    const { Camera } = await cameraModule();
    const p = await Camera.getCameraPermissionsAsync();
    if (!p.granted && p.canAskAgain !== false) out.push(ALL_STEPS.camera);
  } catch {
    /* skip */
  }
  try {
    const [hw, already, pref] = await Promise.all([
      checkBiometricSupport(),
      isBiometricLoginAvailable(),
      getBiometricPreference(),
    ]);
    if (hw && !already && pref === null) out.push(ALL_STEPS.biometrics);
  } catch {
    /* skip */
  }
  return out;
}

async function allow(id: StepId): Promise<boolean> {
  try {
    switch (id) {
      case 'notifications':
        return await ensurePushPermissions({ ask: true });
      case 'location':
        return await requestLocationPermission();
      case 'camera': {
        const { Camera } = await cameraModule();
        return (await Camera.requestCameraPermissionsAsync()).granted;
      }
      case 'biometrics': {
        const ok = await authenticateDevice('Confirm to turn on fingerprint sign-in');
        if (ok) await setBiometricPreference('wanted');
        return ok;
      }
    }
  } catch (e) {
    log.warn('PermissionWizard', `allow ${id} failed`, String(e));
  }
  return false;
}

/**
 * Renders nothing once the wizard has been answered on this phone. On first launch it covers the app until the
 * user has gone through the cards (or skipped). Native only.
 */
export function PermissionWizard() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(Platform.OS === 'web');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    void (async () => {
      let seen = false;
      try {
        seen = (await AsyncStorage.getItem(PERMISSION_WIZARD_DONE_KEY)) === '1';
      } catch {
        seen = false;
      }
      if (seen) {
        if (alive) setDone(true);
        return;
      }
      const list = await pendingSteps();
      if (!alive) return;
      if (!list.length) {
        await AsyncStorage.setItem(PERMISSION_WIZARD_DONE_KEY, '1').catch(() => {});
        setDone(true);
        return;
      }
      setSteps(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!steps) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [steps, index, fade]);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(PERMISSION_WIZARD_DONE_KEY, '1').catch(() => {});
    hideSystemStatusBar();
    setDone(true);
  }, []);

  const next = useCallback(() => {
    if (!steps) return;
    if (index + 1 >= steps.length) void finish();
    else setIndex((i) => i + 1);
  }, [finish, index, steps]);

  const onAllow = useCallback(async () => {
    const step = steps?.[index];
    if (!step || busy) return;
    setBusy(true);
    try {
      await allow(step.id);
    } finally {
      setBusy(false);
      hideSystemStatusBar();
    }
    next();
  }, [busy, index, next, steps]);

  const onNotNow = useCallback(() => {
    const step = steps?.[index];
    if (!step || busy) return;
    if (step.id === 'biometrics') void setBiometricPreference('declined');
    next();
  }, [busy, index, next, steps]);

  if (done || !steps) return null;
  const step = steps[index];
  // Mounted only while active: an always-there overlay would swallow touches meant for the app.
  return (
    <View style={styles.host}>
      <SafeAreaProvider>
        <WizardCard
          step={step}
          index={index}
          total={steps.length}
          busy={busy}
          fade={fade}
          onAllow={() => void onAllow()}
          onNotNow={onNotNow}
          onSkipAll={() => void finish()}
        />
      </SafeAreaProvider>
    </View>
  );
}

function WizardCard({
  step,
  index,
  total,
  busy,
  fade,
  onAllow,
  onNotNow,
  onSkipAll,
}: {
  step: Step;
  index: number;
  total: number;
  busy: boolean;
  fade: Animated.Value;
  onAllow: () => void;
  onNotNow: () => void;
  onSkipAll: () => void;
}) {
  const insets = useSafeAreaInsets();
  const layout = useAuthScale(0.88);
  const { s, font } = layout;
  const { palette } = useAppTheme();
  const waveH = topWaveHeight(layout.width);
  const primary = palette.primary || Colors.primary;
  const secondary = palette.secondary || Colors.orange;

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <TukuaPatternLayer />
      <TopWave color={primary} />
      {total > 1 ? (
        <Pressable
          onPress={onSkipAll}
          disabled={busy}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Skip all, decide later"
          style={[styles.skip, { top: insets.top + s(12), right: s(16) }]}>
          <Text style={[styles.skipText, { fontSize: font(13) }]}>Skip</Text>
        </Pressable>
      ) : null}

      <View
        style={[
          styles.body,
          {
            paddingTop: Math.max(waveH * 0.7, insets.top + s(40)),
            paddingBottom: insets.bottom + s(24),
            paddingHorizontal: layout.padH,
          },
        ]}>
        <Animated.View
          style={[
            styles.card,
            {
              width: layout.formWidth,
              padding: s(22),
              borderRadius: s(22),
              opacity: fade,
              transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}>
          <Text style={[styles.kicker, { fontSize: font(11), color: Colors.mutedForeground }]}>
            Step {index + 1} of {total}
          </Text>
          <View
            style={[
              styles.iconWrap,
              { width: s(76), height: s(76), borderRadius: s(38), backgroundColor: primary, marginTop: s(14) },
            ]}>
            <Ionicons name={step.icon} size={s(36)} color={secondary} />
          </View>
          <Text style={[styles.title, { fontSize: font(21), marginTop: s(18), color: primary }]}>{step.title}</Text>
          <Text style={[styles.reason, { fontSize: font(14), lineHeight: font(21), marginTop: s(8) }]}>
            {step.reason}
          </Text>

          <View style={[styles.row, { marginTop: s(24) }]}>
            <AuthButton text={step.allow} loading={busy} onPress={onAllow} />
          </View>
          <Pressable
            onPress={onNotNow}
            disabled={busy}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.notNow, { marginTop: s(10), paddingVertical: s(10), opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[styles.notNowText, { fontSize: font(14) }]}>Not now</Text>
          </Pressable>
        </Animated.View>

        <View style={[styles.dots, { marginTop: s(20), gap: s(8) }]} accessibilityElementsHidden>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? s(22) : s(8),
                height: s(8),
                borderRadius: s(4),
                backgroundColor: i <= index ? primary : Colors.border,
              }}
            />
          ))}
        </View>
        <Text style={[styles.footnote, { fontSize: font(12), marginTop: s(14), maxWidth: layout.formWidth }]}>
          You can change any of these later in your phone settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50 },
  overlay: { flex: 1, backgroundColor: Colors.background },
  skip: { position: 'absolute', zIndex: 2, paddingHorizontal: 6, paddingVertical: 4 },
  skipText: { color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kicker: { fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4, textTransform: 'uppercase' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  reason: { fontFamily: 'Inter_400Regular', color: Colors.mutedForeground, textAlign: 'center' },
  row: { flexDirection: 'row', width: '100%' },
  notNow: { alignSelf: 'stretch', alignItems: 'center' },
  notNowText: { fontFamily: 'Poppins_600SemiBold', color: Colors.mutedForeground },
  dots: { flexDirection: 'row', alignItems: 'center' },
  footnote: { fontFamily: 'Inter_400Regular', color: Colors.mutedForeground, textAlign: 'center' },
});
