import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from '../../components/FlatFill'; // flat fill: no gradients
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { humanizeError } from '../../lib/humanizeError';
import {
  fetchMyReferrals,
  fetchReferralCourses,
  kes,
  REFERRAL_STATUS_LABEL,
  referralShareText,
  type MyReferrals,
  type ReferralCourse,
} from '../../lib/referralApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Referral'>;
type Tab = 'refer' | 'courses' | 'earnings';

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  registered: { bg: '#FEF3C7', fg: '#92400E' },
  earned: { bg: '#D1FAE5', fg: '#065F46' },
  paid_out: { bg: '#E0F2FE', fg: '#075985' },
  void: { bg: '#F1F5F9', fg: '#475569' },
};

/** Refer & earn: your short link, the target, course links and everyone who joined or bought through you. */
export function ReferralScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('refer');
  const [data, setData] = useState<MyReferrals | null>(null);
  const [courses, setCourses] = useState<ReferralCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchMyReferrals());
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== 'courses' || courses) return;
    fetchReferralCourses()
      .then((r) => setCourses(r.items || []))
      .catch((e) => setError(humanizeError(e)));
  }, [tab, courses]);

  const copy = async (value: string, key: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1800);
  };
  const shareLink = (text: string) => void Share.share({ message: text }).catch(() => undefined);
  const whatsapp = (text: string) =>
    void Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`),
    );

  const shownCourses = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (courses || []).filter((c) => !needle || c.title.toLowerCase().includes(needle)).slice(0, 40);
  }, [courses, q]);

  const pct = data && data.target.count ? Math.min(100, (data.target.reached / data.target.count) * 100) : 0;

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.brandGreenMid} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Refer & earn</ModuleKicker>

        <View style={styles.tabs}>
          {([['refer', 'Refer', 'gift'], ['courses', 'Courses', 'book-open'], ['earnings', 'Earnings', 'credit-card']] as const).map(([key, label, icon]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
              <Feather name={icon} size={14} color={tab === key ? Colors.white : Colors.brandGreen} />
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                {label}
                {key === 'earnings' && data?.people.length ? ` (${data.people.length})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && !data ? (
          <ModuleEmpty title="Couldn't load refer & earn" body={error} onRetry={() => void load()} />
        ) : !data ? (
          <View style={styles.loader}><ActivityIndicator color={Colors.brandGreenMid} /></View>
        ) : tab === 'refer' ? (
          <>
            <LinearGradient colors={['#065F46', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <Text style={styles.heroKicker}>REFER & EARN</Text>
              <Text style={styles.heroTitle}>Earn {kes(data.shares.student)} for every student you bring</Text>
              <Text style={styles.heroBody}>When someone registers with your link and pays the registration fee, you earn. Schools earn you {kes(data.shares.school)}.</Text>
              <View style={styles.linkBox}>
                <Feather name="link" size={15} color={Colors.brandGreen} />
                <Text style={styles.linkText} numberOfLines={1}>{data.link.replace(/^https?:\/\//, '')}</Text>
                <Pressable style={styles.copyBtn} onPress={() => void copy(data.link, 'link')}>
                  <Feather name={copied === 'link' ? 'check' : 'copy'} size={14} color={Colors.white} />
                  <Text style={styles.copyText}>{copied === 'link' ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              </View>
              <View style={styles.shareRow}>
                <Pressable style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => whatsapp(referralShareText(data.link))}>
                  <Feather name="message-circle" size={15} color={Colors.white} />
                  <Text style={styles.shareText}>WhatsApp</Text>
                </Pressable>
                <Pressable style={[styles.shareBtn, { backgroundColor: 'rgba(255,255,255,0.18)' }]} onPress={() => shareLink(referralShareText(data.link))}>
                  <Feather name="share-2" size={15} color={Colors.white} />
                  <Text style={styles.shareText}>Share</Text>
                </Pressable>
              </View>
            </LinearGradient>

            <ModuleGlassCard>
              <View style={styles.targetRow}>
                <View style={styles.trophy}><Feather name="award" size={22} color="#D97706" /></View>
                <Text style={styles.targetTitle}>Bring {data.target.count.toLocaleString('en-KE')} students, earn {kes(data.target.reward)}</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${data.target.reached ? Math.max(pct, 1.5) : 0}%` }]} /></View>
              <Text style={styles.muted}>
                {data.target.reached.toLocaleString('en-KE')} of {data.target.count.toLocaleString('en-KE')} have registered and paid
              </Text>
            </ModuleGlassCard>

            <View style={styles.shareGrid}>
              {[
                ['Student or teacher', data.shares.student],
                ['School', data.shares.school],
                ['Parent', data.shares.parent],
              ].map(([label, amount]) => (
                <ModuleGlassCard key={String(label)} style={styles.shareCard}>
                  <Text style={styles.muted}>{label}</Text>
                  <Text style={styles.shareAmount}>{kes(Number(amount))}</Text>
                </ModuleGlassCard>
              ))}
            </View>
            <ModuleGlassCard>
              <Text style={styles.howTitle}>How it works</Text>
              {[
                'Share your link on WhatsApp, in class groups or on your status.',
                'Your friend opens it and creates a Tukua account.',
                'When they pay the registration fee, your share shows under Earnings. Tukua pays you at the end of each month.',
              ].map((t, i) => (
                <View key={t} style={styles.step}>
                  <Text style={styles.stepNo}>{i + 1}</Text>
                  <Text style={styles.stepText}>{t}</Text>
                </View>
              ))}
              <Text style={[styles.muted, { marginTop: 8 }]}>Principals and teachers: share it with your learners and their parents.</Text>
            </ModuleGlassCard>
          </>
        ) : tab === 'courses' ? (
          <>
            <ModuleGlassCard>
              <Text style={styles.howTitle}>Earn {data.course_commission_pct}% of every course bought through your link</Text>
              <Text style={styles.muted}>Each course has its own short link. The buyer gets your discount.</Text>
            </ModuleGlassCard>
            <TextInput style={styles.search} placeholder="Find a course" placeholderTextColor={Colors.mutedForeground} value={q} onChangeText={setQ} />
            {!courses ? (
              <View style={styles.loader}><ActivityIndicator color={Colors.brandGreenMid} /></View>
            ) : shownCourses.length === 0 ? (
              <ModuleEmpty title="No course found" body={courses.length ? 'No course matches that.' : 'There are no paid courses to share yet.'} />
            ) : (
              shownCourses.map((c) => (
                <ModuleGlassCard key={c.id}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
                  <Text style={styles.muted}>{kes(c.price)} · you earn <Text style={styles.earn}>{kes(c.commission)}</Text></Text>
                  <View style={[styles.shareRow, { marginTop: 10 }]}>
                    <Pressable style={[styles.shareBtn, styles.outlineBtn]} onPress={() => void copy(c.link, c.id)}>
                      <Feather name={copied === c.id ? 'check' : 'copy'} size={14} color={Colors.brandGreen} />
                      <Text style={[styles.shareText, { color: Colors.brandGreen }]}>{copied === c.id ? 'Copied' : 'Copy link'}</Text>
                    </Pressable>
                    <Pressable style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => whatsapp(`I recommend this course on Tukua: ${c.title}. Get it here: ${c.link}`)}>
                      <Feather name="message-circle" size={14} color={Colors.white} />
                      <Text style={styles.shareText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                </ModuleGlassCard>
              ))
            )}
          </>
        ) : data.people.length === 0 ? (
          <ModuleEmpty title="Nobody yet" body="Nobody has joined or bought through your links yet. Share your link on WhatsApp to get started." />
        ) : (
          data.people.map((p) => {
            const tone = STATUS_COLORS[p.status] || STATUS_COLORS.void;
            return (
              <ModuleGlassCard key={p.id}>
                <View style={styles.personTop}>
                  <Text style={styles.personName}>{p.name}</Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{REFERRAL_STATUS_LABEL[p.status] || p.status}</Text>
                </View>
                <Text style={styles.muted}>{p.for === 'course' ? `Bought ${p.course_title}` : `Registered as ${p.kind}`}</Text>
                <Text style={styles.muted}>{[p.email, p.phone].filter(Boolean).join(' · ')}</Text>
                <Text style={[styles.personEarn, p.status === 'registered' && { color: Colors.mutedForeground, fontWeight: '600' }]}>
                  {p.status === 'registered' ? 'Earns after they pay' : kes(p.amount_earned)}
                </Text>
              </ModuleGlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  tabActive: { backgroundColor: Colors.brandGreen, borderColor: Colors.brandGreen },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.brandGreen },
  tabTextActive: { color: Colors.white },
  hero: { borderRadius: 22, padding: 18, marginBottom: 12 },
  heroKicker: { color: '#A7F3D0', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: Colors.white, fontSize: 22, fontWeight: '800', marginTop: 4, lineHeight: 27 },
  heroBody: { color: '#ECFDF5', fontSize: 13, marginTop: 6, lineHeight: 19 },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 14, paddingLeft: 12, padding: 5, marginTop: 14 },
  linkText: { flex: 1, fontWeight: '700', color: Colors.ink, fontSize: 14 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.brandGreen, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  copyText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  shareRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  outlineBtn: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: Colors.white },
  shareText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  trophy: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  targetTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.ink },
  track: { height: 10, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#10B981' },
  muted: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  shareGrid: { flexDirection: 'row', gap: 8 },
  shareCard: { flex: 1 },
  shareAmount: { fontSize: 17, fontWeight: '800', color: Colors.ink, marginTop: 4 },
  howTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink, marginBottom: 6 },
  step: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stepNo: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brandGreen, color: Colors.white, textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: '800', overflow: 'hidden' },
  stepText: { flex: 1, fontSize: 13, color: Colors.ink, lineHeight: 19 },
  search: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.ink, backgroundColor: Colors.white, marginBottom: 10 },
  courseTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  earn: { color: '#047857', fontWeight: '800' },
  personTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  personName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.ink },
  pill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  personEarn: { marginTop: 6, fontSize: 16, fontWeight: '800', color: '#047857' },
});
