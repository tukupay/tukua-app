import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryPatternPanel, ThemedBackdrop, INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import { KeyboardAwareScroll } from '../../components/auth/KeyboardAwareScroll';
import {
  ListFooter,
  ListSkeleton,
  MoneyCard,
  MoneyHeader,
  MoneyTabs,
  SectionTitle,
  StateCard,
} from '../../components/dashboard/MoneyKit';
import { useWindowedList } from '../../lib/moneyFormat';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAppTheme } from '../../context/AppThemeContext';
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
  earned: { bg: '#DCFCE7', fg: '#166534' },
  paid_out: { bg: '#DBEAFE', fg: '#1E40AF' },
  void: { bg: '#F1F5F9', fg: '#475569' },
};

const PAGE = 12;
const WHATSAPP = '#25D366';

function nearEnd(e: NativeSyntheticEvent<NativeScrollEvent>): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 240;
}

/** Refer & earn: your short link, the target, course links and everyone who joined or bought through you. */
export function ReferralScreen({ navigation }: Props) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const [tab, setTab] = useState<Tab>('refer');
  const [data, setData] = useState<MyReferrals | null>(null);
  const [courses, setCourses] = useState<ReferralCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
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

  const loadCourses = useCallback(() => {
    setCoursesError(null);
    fetchReferralCourses()
      .then((r) => setCourses(r.items || []))
      .catch((e) => setCoursesError(humanizeError(e)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== 'courses' || courses) return;
    loadCourses();
  }, [tab, courses, loadCourses]);

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
    return (courses || []).filter((c) => !needle || c.title.toLowerCase().includes(needle));
  }, [courses, q]);
  const coursesWin = useWindowedList(shownCourses, PAGE);
  const peopleWin = useWindowedList(data?.people ?? [], PAGE);

  const pct = data && data.target.count ? Math.min(100, (data.target.reached / data.target.count) * 100) : 0;
  const earned = useMemo(
    () => (data?.people ?? []).reduce((s, p) => s + (p.status === 'registered' || p.status === 'void' ? 0 : Number(p.amount_earned) || 0), 0),
    [data],
  );

  const referTab = data ? (
    <>
      <PrimaryPatternPanel style={styles.hero}>
        <Text style={[styles.heroKicker, { color: palette.secondary }]}>REFER & EARN</Text>
        <Text style={styles.heroTitle}>Earn {kes(data.shares.student)} for every learner you bring</Text>
        <Text style={styles.heroBody}>
          When someone registers with your link and pays the registration fee, you earn. A school earns you {kes(data.shares.school)}.
        </Text>
        <View style={styles.linkBox}>
          <Feather name="link" size={15} color={palette.primary} />
          <Text style={styles.linkText} numberOfLines={1}>
            {data.link.replace(/^https?:\/\//, '')}
          </Text>
          <Pressable style={[styles.copyBtn, { backgroundColor: palette.primary }]} onPress={() => void copy(data.link, 'link')}>
            <Feather name={copied === 'link' ? 'check' : 'copy'} size={14} color={palette.secondary} />
            <Text style={styles.copyText}>{copied === 'link' ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>
        <View style={styles.shareRow}>
          <Pressable style={[styles.shareBtn, { backgroundColor: WHATSAPP }]} onPress={() => whatsapp(referralShareText(data.link))}>
            <Ionicons name="logo-whatsapp" size={16} color={Colors.white} />
            <Text style={styles.shareText}>WhatsApp</Text>
          </Pressable>
          <Pressable style={[styles.shareBtn, { backgroundColor: palette.secondary }]} onPress={() => shareLink(referralShareText(data.link))}>
            <Feather name="share-2" size={15} color={palette.primary} />
            <Text style={[styles.shareText, { color: palette.primary }]}>Share</Text>
          </Pressable>
        </View>
      </PrimaryPatternPanel>

      <MoneyCard style={styles.pad}>
        <View style={styles.targetRow}>
          <View style={[styles.trophy, { backgroundColor: rgba(palette.secondary, 0.22) }]}>
            <Feather name="award" size={22} color={palette.primary} />
          </View>
          <Text style={styles.targetTitle}>
            Bring {data.target.count.toLocaleString('en-KE')} learners, earn {kes(data.target.reward)}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: rgba(palette.primary, 0.08) }]}>
          <View
            style={[styles.fill, { backgroundColor: palette.secondary, width: `${data.target.reached ? Math.max(pct, 1.5) : 0}%` }]}
          />
        </View>
        <Text style={styles.muted}>
          {data.target.reached.toLocaleString('en-KE')} of {data.target.count.toLocaleString('en-KE')} have registered and paid
        </Text>
      </MoneyCard>

      <View style={styles.shareGrid}>
        {(
          [
            ['Learner or teacher', data.shares.student],
            ['School', data.shares.school],
            ['Parent', data.shares.parent],
          ] as const
        ).map(([label, amount]) => (
          <MoneyCard key={label} style={[styles.pad, styles.shareCard]}>
            <Text style={styles.muted} numberOfLines={1}>
              {label}
            </Text>
            <Text style={[styles.shareAmount, { color: palette.primary }]} numberOfLines={1} adjustsFontSizeToFit>
              {kes(Number(amount))}
            </Text>
          </MoneyCard>
        ))}
      </View>

      <MoneyCard style={styles.pad}>
        <Text style={styles.howTitle}>How it works</Text>
        {[
          'Share your link on WhatsApp, in class groups or on your status.',
          'Your friend opens it and creates a Tukua account.',
          'When they pay the registration fee, your share shows under Earnings. Tukua pays you at the end of each month.',
        ].map((t, i) => (
          <View key={t} style={styles.step}>
            <Text style={[styles.stepNo, { backgroundColor: palette.primary, color: palette.secondary }]}>{i + 1}</Text>
            <Text style={styles.stepText}>{t}</Text>
          </View>
        ))}
        <Text style={[styles.muted, { marginTop: 10 }]}>Principals and teachers: share it with your learners and their parents.</Text>
      </MoneyCard>
    </>
  ) : null;

  const coursesTab = data ? (
    <>
      <MoneyCard style={styles.pad}>
        <Text style={styles.howTitle}>Earn {data.course_commission_pct}% of every course bought through your link</Text>
        <Text style={styles.muted}>Each course has its own short link. The buyer gets your discount.</Text>
      </MoneyCard>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={17} color={Colors.mutedForeground} />
        <TextInput
          style={styles.search}
          placeholder="Find a course"
          placeholderTextColor={Colors.mutedForeground}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
      </View>
      {coursesError && !courses ? (
        <StateCard tone="error" title="Could not load courses" body={coursesError} onRetry={loadCourses} />
      ) : !courses ? (
        <ListSkeleton rows={4} />
      ) : shownCourses.length === 0 ? (
        <StateCard
          icon="book-outline"
          title="No course found"
          body={courses.length ? 'No course matches that.' : 'There are no paid courses to share yet.'}
        />
      ) : (
        <>
          {coursesWin.visible.map((c) => (
            <MoneyCard key={c.id} style={styles.pad}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {c.title}
              </Text>
              <View style={styles.courseMoney}>
                <Text style={styles.muted}>{kes(c.price)}</Text>
                <Text style={[styles.earn, { color: palette.primary }]}>You earn {kes(c.commission)}</Text>
              </View>
              <View style={[styles.shareRow, { marginTop: 10 }]}>
                <Pressable
                  style={[styles.shareBtn, { backgroundColor: rgba(palette.primary, 0.08) }]}
                  onPress={() => void copy(c.link, c.id)}>
                  <Feather name={copied === c.id ? 'check' : 'copy'} size={14} color={palette.primary} />
                  <Text style={[styles.shareText, { color: palette.primary }]}>{copied === c.id ? 'Copied' : 'Copy link'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.shareBtn, { backgroundColor: WHATSAPP }]}
                  onPress={() => whatsapp(`I recommend this course on Tukua: ${c.title}. Get it here: ${c.link}`)}>
                  <Ionicons name="logo-whatsapp" size={15} color={Colors.white} />
                  <Text style={styles.shareText}>WhatsApp</Text>
                </Pressable>
              </View>
            </MoneyCard>
          ))}
          <ListFooter hasMore={coursesWin.hasMore} total={coursesWin.total} noun="courses" onMore={coursesWin.loadMore} />
        </>
      )}
    </>
  ) : null;

  const earningsTab = data ? (
    <>
      <PrimaryPatternPanel style={styles.hero}>
        <Text style={[styles.heroKicker, { color: palette.secondary }]}>YOUR EARNINGS</Text>
        <Text style={styles.earnValue}>{kes(earned)}</Text>
        <Text style={styles.heroBody}>
          {data.registered.toLocaleString('en-KE')} joined · {data.paid.toLocaleString('en-KE')} paid. Tukua pays out at the end of each month.
        </Text>
      </PrimaryPatternPanel>
      {data.people.length === 0 ? (
        <StateCard
          icon="people-outline"
          title="Nobody yet"
          body="Nobody has joined or bought through your links yet. Share your link on WhatsApp to get started."
        />
      ) : (
        <>
          <SectionTitle>People you brought</SectionTitle>
          {peopleWin.visible.map((p) => {
            const tone = STATUS_COLORS[p.status] || STATUS_COLORS.void;
            return (
              <MoneyCard key={p.id} style={styles.pad}>
                <View style={styles.personTop}>
                  <Text style={styles.personName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>
                    {REFERRAL_STATUS_LABEL[p.status] || p.status}
                  </Text>
                </View>
                <Text style={styles.muted}>{p.for === 'course' ? `Bought ${p.course_title}` : `Registered as ${p.kind}`}</Text>
                <View style={styles.personBottom}>
                  <Text style={[styles.muted, { flex: 1 }]} numberOfLines={1}>
                    {[p.email, p.phone].filter(Boolean).join(' · ')}
                  </Text>
                  <Text
                    style={[
                      styles.personEarn,
                      { color: palette.primary },
                      p.status === 'registered' && { color: Colors.mutedForeground, fontWeight: '600', fontSize: 13 },
                    ]}>
                    {p.status === 'registered' ? 'Earns after they pay' : kes(p.amount_earned)}
                  </Text>
                </View>
              </MoneyCard>
            );
          })}
          <ListFooter hasMore={peopleWin.hasMore} total={peopleWin.total} noun="people" onMore={peopleWin.loadMore} />
        </>
      )}
    </>
  ) : null;

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <KeyboardAwareScroll
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          if (!nearEnd(e)) return;
          if (tab === 'courses') coursesWin.loadMore();
          else if (tab === 'earnings') peopleWin.loadMore();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
              if (tab === 'courses') loadCourses();
            }}
            tintColor={palette.primary}
          />
        }>
        <MoneyHeader title="Refer & earn" subtitle="Share Tukua and earn for every sign-up" onBack={() => navigation.goBack()} />
        <MoneyTabs
          tabs={[
            { key: 'refer', label: 'Refer', icon: 'gift' },
            { key: 'courses', label: 'Courses', icon: 'book' },
            {
              key: 'earnings',
              label: data?.people.length ? `Earnings (${data.people.length})` : 'Earnings',
              icon: 'wallet',
            },
          ]}
          value={tab}
          onChange={setTab}
        />
        {error && !data ? (
          <StateCard tone="error" title="Couldn't load refer & earn" body={error} onRetry={() => void load()} />
        ) : !data ? (
          <ListSkeleton withPanel rows={3} />
        ) : tab === 'refer' ? (
          referTab
        ) : tab === 'courses' ? (
          coursesTab
        ) : (
          earningsTab
        )}
      </KeyboardAwareScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  pad: { paddingVertical: 14 },
  hero: { padding: 18 },
  heroKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: Colors.white, fontSize: 21, fontWeight: '800', marginTop: 4, lineHeight: 27 },
  heroBody: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 6, lineHeight: 19 },
  earnValue: { color: Colors.white, fontSize: 30, fontWeight: '800', marginTop: 4 },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingLeft: 12,
    padding: 5,
    marginTop: 14,
  },
  linkText: { flex: 1, fontWeight: '700', color: INK, fontSize: 14 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  copyText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  shareRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
  },
  shareText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  trophy: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  targetTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: INK },
  track: { height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', borderRadius: 999 },
  muted: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  shareGrid: { flexDirection: 'row', gap: 8 },
  shareCard: { flex: 1, paddingHorizontal: 10 },
  shareAmount: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  howTitle: { fontSize: 15, fontWeight: '800', color: INK, marginBottom: 4 },
  step: { flexDirection: 'row', gap: 10, marginTop: 8 },
  stepNo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontSize: 13, color: INK, lineHeight: 19 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
  },
  search: { flex: 1, paddingVertical: 11, fontSize: 14, color: INK },
  courseTitle: { fontSize: 15, fontWeight: '700', color: INK },
  courseMoney: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  earn: { fontSize: 13, fontWeight: '800' },
  personTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  personName: { flex: 1, fontSize: 15, fontWeight: '700', color: INK },
  personBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  personEarn: { fontSize: 16, fontWeight: '800' },
});
