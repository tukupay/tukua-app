/**
 * The signed-out front door (TukuPay's GuestTabs): Sign in · Pay fees · Create account, as pages that turn like a
 * book (BookPager), over a floating tab bar whose thin yellow curved edge rises out of the left corner.
 * Pay fees needs no account. Create account opens the multi-step Register screen. Flat colours, no gradients.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookPager } from '../../components/BookPager';
import { AuthButton } from '../../components/auth/AuthButton';
import { TopWave, TukuaPatternLayer, topWaveHeight } from '../../components/auth/TopWave';
import { useAuthScale } from '../../components/auth/useAuthScale';
import { LoginScreen } from '../LoginScreen';
import { PayFeesScreen } from './PayFeesScreen';
import { Colors } from '../../theme/yana';
import type { RootStackParamList } from '../../navigation/types';

/** The tab a link may ask for (tukua://welcome?tab=fees). */
export type GuestTab = 'signin' | 'fees' | 'register';
export type GuestTabsParams = { tab?: GuestTab } | undefined;

const TABS: ReadonlyArray<{ key: GuestTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'signin', label: 'Sign in', icon: 'log-in-outline' },
  { key: 'fees', label: 'Pay fees', icon: 'wallet-outline' },
  { key: 'register', label: 'Create account', icon: 'person-add-outline' },
];

/** The bar's height and the rise of its curved top edge: a page keeps this much room free under its content. */
const BAR = 46;
const WAVE = 16;
const BOTTOM_SPACE = BAR + WAVE;

const tabIndex = (t?: GuestTab) => Math.max(TABS.findIndex((x) => x.key === t), 0);

export function GuestTabsScreen() {
  const route = useRoute<RouteProp<{ Guest: GuestTabsParams }, 'Guest'>>();
  const asked = route.params?.tab;
  const [tab, setTab] = useState(() => tabIndex(asked));

  // A link opened while the front door is up switches the tab.
  useEffect(() => {
    if (asked) setTab(tabIndex(asked));
  }, [asked]);

  return (
    <View style={styles.root}>
      <BookPager
        index={tab}
        count={TABS.length}
        onFlip={setTab}
        keepAll
        pageBackground={Colors.background}
        renderPage={(i) =>
          i === 0 ? (
            <LoginScreen embedded bottomSpace={BOTTOM_SPACE} onCreateAccount={() => setTab(2)} />
          ) : i === 1 ? (
            <PayFeesScreen bottomSpace={BOTTOM_SPACE} />
          ) : (
            <CreateAccountPage onSignIn={() => setTab(0)} onPayFees={() => setTab(1)} />
          )
        }
      />
      <FloatingTabs tab={tab} onTab={setTab} />
    </View>
  );
}

const PERSONAS: ReadonlyArray<{ icon: keyof typeof Ionicons.glyphMap; title: string; text: string }> = [
  { icon: 'school-outline', title: 'Students', text: 'Courses, AI tutor, results and your school.' },
  { icon: 'people-outline', title: 'Parents', text: "Fees, grades, attendance and the school bus, for each child." },
  { icon: 'easel-outline', title: 'Teachers & staff', text: 'Marks, classes, timetable and school tools.' },
];

/** A short page that opens the full (multi-step) registration. */
function CreateAccountPage({ onSignIn, onPayFees }: { onSignIn: () => void; onPayFees: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const layout = useAuthScale(0.88);
  const { s, font } = layout;
  const insets = useSafeAreaInsets();
  const waveH = topWaveHeight(layout.width);
  return (
    <View style={styles.root}>
      <TukuaPatternLayer />
      <TopWave />
      <View
        style={[
          styles.createBody,
          {
            paddingTop: Math.max(waveH * 0.55, insets.top + s(16)),
            paddingBottom: BOTTOM_SPACE + insets.bottom + s(20),
            paddingHorizontal: layout.padH,
          },
        ]}>
        <View style={{ width: layout.formWidth, alignSelf: 'center' }}>
          <Text style={[styles.createTitle, { fontSize: font(24), marginTop: s(18) }]}>Join Tukua</Text>
          <Text style={[styles.createSub, { fontSize: font(13), marginBottom: s(18) }]}>
            One account for learning and for your school. It takes about two minutes.
          </Text>
          {PERSONAS.map((p) => (
            <View key={p.title} style={[styles.persona, { paddingVertical: s(12), gap: s(12) }]}>
              <View style={[styles.personaIcon, { width: s(40), height: s(40), borderRadius: s(20) }]}>
                <Ionicons name={p.icon} size={s(20)} color={Colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.personaTitle, { fontSize: font(14) }]}>{p.title}</Text>
                <Text style={[styles.personaText, { fontSize: font(12) }]}>{p.text}</Text>
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginTop: s(22) }}>
            <AuthButton text="Create account" onPress={() => navigation.navigate('Register')} />
          </View>
          <Pressable onPress={onSignIn} hitSlop={8} accessibilityRole="link" style={{ alignSelf: 'center', marginTop: s(16) }}>
            <Text style={[styles.createSub, { fontSize: font(14) }]}>
              Already on Tukua? <Text style={styles.linkEm}>Sign in</Text>
            </Text>
          </Pressable>
          <Pressable onPress={onPayFees} hitSlop={8} accessibilityRole="link" style={{ alignSelf: 'center', marginTop: s(10) }}>
            <Text style={[styles.createSub, { fontSize: font(13) }]}>
              Only paying fees? <Text style={styles.linkGold}>No account needed</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FloatingTabs({ tab, onTab }: { tab: number; onTab: (i: number) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const h = WAVE + BAR + insets.bottom;
  // The top edge rises from the bottom-left corner and settles flat to the right.
  const edge = `M0,0 C${width * 0.3},0 ${width * 0.38},${WAVE} ${width * 0.62},${WAVE} L${width},${WAVE}`;
  return (
    <View pointerEvents="box-none" style={[styles.bar, { height: h }]}>
      <Svg width={width} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={`${edge} L${width},${h} L0,${h} Z`} fill={Colors.white} />
        <Path d={edge} stroke={Colors.orange} strokeWidth={2} fill="none" />
      </Svg>
      <View accessibilityRole="tablist" style={[styles.tabs, { top: WAVE + 4, height: BAR - 8 }]}>
        {TABS.map((t, i) => {
          const on = i === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => onTab(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: on ? Colors.primary : 'transparent', opacity: pressed ? 0.8 : 1 },
              ]}>
              <Ionicons name={t.icon} size={16} color={on ? Colors.orange : Colors.primary} />
              <Text style={[styles.tabText, { color: on ? Colors.white : Colors.primary }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tabs: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderRadius: 10 },
  tabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11.5 },
  createBody: { flex: 1, justifyContent: 'center' },
  createTitle: { color: Colors.primary, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  createSub: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
  persona: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  personaIcon: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  personaTitle: { color: Colors.ink, fontFamily: 'Poppins_600SemiBold' },
  personaText: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  linkEm: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  linkGold: { color: Colors.brandGreenMid, fontFamily: 'Poppins_600SemiBold' },
});
