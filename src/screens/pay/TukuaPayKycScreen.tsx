/**
 * TukuPay setup (route name kept as `TukuaPayKyc` so existing links still land here).
 *
 * Owner, 2026-11-07: ID upload in Tukua is the wrong place. People register and verify their identity in
 * the TukuPay app, then link that TukuPay profile to Tukua with a one-time code. Linking is not live yet
 * (no server route), so step 3 shows the flow and a "coming soon" note — see ./tukuPayLink.ts.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ModuleBackBar, ModuleKicker, ModuleScreenHeader } from '../dashboard/ModuleChrome';
import { floatingHeaderInset } from '../../constants/layout';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useAppTheme } from '../../context/AppThemeContext';
import { CARD, CARD_SURFACE, INK, ThemedBackdrop, rgba } from '../../components/theme/ThemedPage';
import {
  TUKUPAY_LINKING_LIVE,
  isPlausibleLinkCode,
  linkTukuPayProfile,
  openTukuPayOnboarding,
  openTukuPayStore,
  type TukuPayLinkResult,
} from './tukuPayLink';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPayKyc'>;

function StepCard({
  n,
  title,
  body,
  children,
}: {
  n: number;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[CARD_SURFACE, styles.step]}>
      <View style={styles.stepHead}>
        <View style={[styles.stepNum, { backgroundColor: palette.primary }]}>
          <Text style={[styles.stepNumText, { color: palette.secondary }]}>{n}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepBody}>{body}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export function TukuaPayKycScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TukuPayLinkResult | null>(null);
  const [storeNote, setStoreNote] = useState<string | null>(null);

  const openApp = async () => {
    setStoreNote(null);
    try {
      const opened = await openTukuPayOnboarding();
      if (!opened) setStoreNote('TukuPay is not on this phone yet. Install it from the store, then come back.');
    } catch {
      setStoreNote('Could not open the store. Search for "TukuPay" in your app store.');
    }
  };

  const download = async () => {
    setStoreNote(null);
    try {
      await openTukuPayStore();
    } catch {
      setStoreNote('Could not open the store. Search for "TukuPay" in your app store.');
    }
  };

  const link = async () => {
    setBusy(true);
    try {
      setResult(await linkTukuPayProfile(code));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = isPlausibleLinkCode(code) && !busy;

  return (
    <View style={[styles.root, { backgroundColor: palette.muted }]}>
      <ThemedBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: bottomBarSpace + 24,
          paddingHorizontal: 16,
        }}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Tukua Pay</ModuleKicker>
        <ModuleScreenHeader
          title="Set up TukuPay"
          description="Payments run on TukuPay. Create your TukuPay account and verify your ID there, then link it here."
        />

        <View style={[styles.note, { backgroundColor: rgba(palette.secondary, 0.16), borderColor: rgba(palette.secondary, 0.5) }]}>
          <Ionicons name="shield-checkmark" size={18} color={palette.primary} />
          <Text style={[styles.noteText, { color: palette.primary }]}>
            Tukua never asks for your ID photos. Identity checks are done safely inside the TukuPay app.
          </Text>
        </View>

        <StepCard
          n={1}
          title="Get the TukuPay app"
          body="Free on Google Play. Already have it? Go to step 2.">
          <Pressable
            style={({ pressed }) => [styles.btn, { backgroundColor: palette.primary }, pressed && styles.pressed]}
            onPress={() => void download()}
            accessibilityRole="button"
            accessibilityLabel="Download TukuPay">
            <Ionicons name="logo-google-playstore" size={18} color={palette.secondary} />
            <Text style={styles.btnText}>Download TukuPay</Text>
          </Pressable>
        </StepCard>

        <StepCard
          n={2}
          title="Register and verify your ID in TukuPay"
          body="Sign up with your phone number, then follow TukuPay's identity check (national ID, selfie).">
          <Pressable
            style={({ pressed }) => [styles.btnAlt, { borderColor: rgba(palette.primary, 0.3) }, pressed && styles.pressed]}
            onPress={() => void openApp()}
            accessibilityRole="button"
            accessibilityLabel="Open TukuPay">
            <Ionicons name="open-outline" size={17} color={palette.primary} />
            <Text style={[styles.btnAltText, { color: palette.primary }]}>Open TukuPay</Text>
          </Pressable>
          {storeNote ? <Text style={styles.hint}>{storeNote}</Text> : null}
        </StepCard>

        <StepCard
          n={3}
          title="Link your TukuPay profile"
          body="TukuPay gives you a one-time code to link Tukua. Type it here so your payments and ID check carry over.">
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setResult(null);
            }}
            placeholder="e.g. TK4F-7Q92"
            placeholderTextColor={Colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={16}
            style={[styles.input, { borderColor: CARD.border }]}
            accessibilityLabel="TukuPay link code"
          />
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: palette.primary },
              !canSubmit && { opacity: 0.5 },
              pressed && styles.pressed,
            ]}
            disabled={!canSubmit}
            onPress={() => void link()}
            accessibilityRole="button"
            accessibilityLabel="Link TukuPay profile">
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="link" size={18} color={palette.secondary} />
                <Text style={styles.btnText}>Link profile</Text>
              </>
            )}
          </Pressable>

          {result?.status === 'invalid' ? <Text style={styles.err}>{result.message}</Text> : null}
          {result?.status === 'linked' ? (
            <Text style={[styles.ok, { color: palette.primary }]}>
              Linked. {result.kycVerified ? 'Your ID is verified.' : 'Finish the ID check in TukuPay to send and deposit.'}
            </Text>
          ) : null}
          {result?.status === 'coming_soon' || !TUKUPAY_LINKING_LIVE ? (
            <View style={[styles.soon, { backgroundColor: rgba(palette.primary, 0.06) }]}>
              <Ionicons name="time-outline" size={16} color={palette.primary} />
              <Text style={[styles.soonText, { color: palette.primary }]}>
                {result?.status === 'coming_soon'
                  ? 'Linking is coming soon. Keep your TukuPay account ready; we will let you know when it opens.'
                  : 'Coming soon: linking opens once TukuPay turns on link codes.'}
              </Text>
            </View>
          ) : null}
        </StepCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noteText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  step: { padding: CARD.padding, marginBottom: 12, gap: 12 },
  stepHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 14, fontWeight: '800' },
  stepTitle: { fontSize: 15.5, fontWeight: '800', color: INK },
  stepBody: { marginTop: 3, fontSize: 13, lineHeight: 18, color: Colors.mutedForeground },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  btnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  btnAltText: { fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.88 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: INK,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  hint: { fontSize: 12.5, color: Colors.mutedForeground, lineHeight: 17 },
  err: { color: '#B91C1C', fontWeight: '600', fontSize: 13 },
  ok: { fontWeight: '700', fontSize: 13 },
  soon: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10 },
  soonText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 17 },
});
