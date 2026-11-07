import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackdrop, INK, rgba } from '../../components/theme/ThemedPage';
import { KeyboardAwareScroll, useKeyboardReveal } from '../../components/auth/KeyboardAwareScroll';
import { PaymentBottomSheet } from '../../components/dashboard/PaymentBottomSheet';
import { PaymentProcessCard } from '../../components/dashboard/PaymentProcessCard';
import {
  AmountRow,
  BalancePanel,
  ListFooter,
  ListSkeleton,
  MoneyButton,
  MoneyHeader,
  MoneyTabs,
  SectionTitle,
  StateCard,
} from '../../components/dashboard/MoneyKit';
import { kes, shortDate, useWindowedList } from '../../lib/moneyFormat';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  applyParentBursary,
  fetchParentBursary,
  type BursaryApplication,
  type ParentBursaryContribution,
  type ParentBursaryProgram,
} from '../../lib/parentPortalApi';
import {
  applyStudentBursary,
  fetchStudentBursaryApplications,
  resolveStudentRecordId,
} from '../../lib/studentPortalApi';
import { deskFetch } from '../../lib/deskApi';
import { defaultMpesaPhone } from '../../lib/phoneUtils';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { humanizeError } from '../../lib/humanizeError';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Bursary'>;

type ProgramRow = ParentBursaryProgram & {
  name?: string;
  closes_on?: string | null;
  provider_name?: string | null;
  source_type?: string | null;
};

type Tab = 'contribute' | 'apply';

const PAGE = 10;

const STATUS_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E', label: 'Under review' },
  approved: { bg: '#DCFCE7', fg: '#166534', label: 'Approved' },
  disbursed: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Paid to fees' },
  posted: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Paid to fees' },
  rejected: { bg: '#F1F5F9', fg: '#475569', label: 'Not approved' },
};

function programTitle(p: ProgramRow): string {
  return String(p.title || p.name || 'Bursary program');
}

/** Near the end of a scroll view: load the next batch of a windowed list. */
function nearEnd(e: NativeSyntheticEvent<NativeScrollEvent>): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 240;
}

/**
 * Bursary: "Contribute" (anyone at the school gives to the bursary kitty by M-Pesa, the same STK flow as
 * fees) and, for parents and learners only, "Apply" (ask one of the school's open programs for support).
 */
export function BursaryScreen({ navigation }: Props) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const { profile } = useAuth();
  const { persona, deskUser, linkedStudents, selectedStudentId, selectedSchool } = useDeskAuth();
  const { showDialog } = useDialog();
  const canApply = persona === 'parent' || persona === 'student';
  const ownStudentId = persona === 'student' ? resolveStudentRecordId(deskUser) : '';

  const [tab, setTab] = useState<Tab>('contribute');
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [contributions, setContributions] = useState<ParentBursaryContribution[]>([]);
  const [applications, setApplications] = useState<BursaryApplication[]>([]);
  const [kittyTotal, setKittyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  // Apply form
  const children = useMemo(
    () =>
      persona === 'parent'
        ? linkedStudents.filter((s) => !selectedSchool?.id || s.schoolId === selectedSchool.id)
        : [],
    [persona, linkedStudents, selectedSchool?.id],
  );
  const [applyChild, setApplyChild] = useState<string | null>(selectedStudentId ?? null);
  const [applyProgram, setApplyProgram] = useState<string | null>(null);
  const [applyAmount, setApplyAmount] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<View>(null);

  useEffect(() => {
    if (!applyChild && children[0]) setApplyChild(children[0].id);
  }, [children, applyChild]);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const [progRes, kittyRes, studentApps] = await Promise.allSettled([
          deskFetch<{ programs?: ProgramRow[] }>('/bursaries/programs'),
          fetchParentBursary(),
          persona === 'student' && ownStudentId
            ? fetchStudentBursaryApplications(ownStudentId)
            : Promise.resolve([] as BursaryApplication[]),
        ]);
        let list: ProgramRow[] =
          progRes.status === 'fulfilled' && Array.isArray(progRes.value?.programs) ? progRes.value.programs : [];
        if (kittyRes.status === 'fulfilled') {
          const k = kittyRes.value;
          if (!list.length && Array.isArray(k?.programs)) list = k.programs as ProgramRow[];
          setContributions(k?.contributions ?? []);
          setKittyTotal(Number(k?.kitty_total ?? 0) || 0);
          if (persona === 'parent') {
            setApplications([...(k?.applications ?? []), ...(k?.funder_applications ?? [])]);
          }
        } else {
          log.warn('Bursary', 'kitty', String(kittyRes.reason));
          setContributions([]);
          setKittyTotal(0);
        }
        if (persona === 'student') {
          setApplications(studentApps.status === 'fulfilled' ? studentApps.value : []);
        }
        setPrograms(
          list
            .filter((p) => !p.status || String(p.status).toLowerCase() === 'open')
            .map((p) => ({ ...p, title: programTitle(p), deadline: p.deadline || p.closes_on || null })),
        );
        if (progRes.status === 'rejected' && kittyRes.status === 'rejected') {
          setError(humanizeError(progRes.reason));
        }
      } catch (e) {
        const msg = humanizeError(e);
        log.warn('Bursary', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [persona, ownStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!applyProgram && programs[0]?.id) setApplyProgram(programs[0].id);
  }, [programs, applyProgram]);

  const contribWin = useWindowedList(contributions, PAGE);
  const appsWin = useWindowedList(applications, PAGE);

  const submitApplication = async () => {
    const studentId = persona === 'student' ? ownStudentId : applyChild;
    const amount = Math.round(Number(applyAmount));
    if (!studentId) {
      setApplyError(persona === 'student' ? 'Your learner profile is not linked yet.' : 'Choose which child this is for.');
      return;
    }
    if (!applyProgram) {
      setApplyError('Choose a bursary program.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 10) {
      setApplyError('Enter the amount you are asking for (at least KES 10).');
      return;
    }
    if (applyNotes.trim().length < 10) {
      setApplyError('Tell the committee briefly why you need support (a sentence or two).');
      return;
    }
    setApplyError(null);
    setSubmitting(true);
    try {
      const body = { student_id: studentId, program_id: applyProgram, requested_amount: amount, notes: applyNotes.trim() };
      if (persona === 'student') await applyStudentBursary(body);
      else await applyParentBursary(body);
      setApplyAmount('');
      setApplyNotes('');
      showDialog({
        title: 'Application sent',
        message: 'The school bursary committee will review it. You will see the decision here.',
        variant: 'success',
      });
      await load(true);
    } catch (e) {
      setApplyError(humanizeError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const revealRef = useRef<ReturnType<typeof useKeyboardReveal>>(null);
  const reveal = () => {
    // Keep the whole form (fields + Send button) above the keyboard.
    revealRef.current?.focused(formRef.current);
  };

  const contributeTab = (
    <>
      <BalancePanel
        kicker="Your gifts to the kitty"
        value={kes(kittyTotal)}
        line="Supports learners who cannot afford fees"
        icon="heart">
        <MoneyButton
          label="Give with M-Pesa"
          icon="phone-portrait"
          variant="accent"
          onPress={() => setShowPay(true)}
          style={{ marginTop: 14 }}
        />
      </BalancePanel>
      <Text style={styles.note}>
        The school bursary committee reviews needs and shares the kitty. Every shilling is recorded.
      </Text>
      <SectionTitle>Your contributions</SectionTitle>
      {contributions.length === 0 ? (
        <StateCard icon="heart-outline" title="No contributions yet" body="Your gifts show here with their date." />
      ) : (
        <>
          {contribWin.visible.map((c, i) => (
            <View key={String(c.id ?? i)} style={styles.rowCard}>
              <AmountRow
                icon="heart"
                iconTone="in"
                title={String(c.note || 'Bursary kitty').replace(/\s*checkout=\S+/i, '').trim() || 'Bursary kitty'}
                meta={[shortDate(c.created_at), String(c.status || 'recorded')].filter(Boolean).join(' · ')}
                amount={kes(Number(c.amount ?? 0))}
                last
              />
            </View>
          ))}
          <ListFooter hasMore={contribWin.hasMore} total={contribWin.total} noun="contributions" onMore={contribWin.loadMore} />
        </>
      )}
    </>
  );

  const applyTab = (
    <>
      <SectionTitle>Open programs</SectionTitle>
      {programs.length === 0 ? (
        <StateCard icon="school-outline" title="No open programs" body="The school has no bursary program taking applications right now." />
      ) : (
        programs.map((p) => {
          const on = applyProgram === p.id;
          return (
            <Pressable
              key={String(p.id)}
              onPress={() => setApplyProgram(p.id ?? null)}
              style={[styles.programCard, on && { borderColor: palette.primary, backgroundColor: rgba(palette.primary, 0.04) }]}>
              <Ionicons
                name={on ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={on ? palette.primary : Colors.mutedForeground}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.programTitle}>{programTitle(p)}</Text>
                {p.description ? <Text style={styles.programDesc}>{p.description}</Text> : null}
                {p.deadline ? <Text style={styles.programMeta}>Closes {shortDate(p.deadline)}</Text> : null}
              </View>
            </Pressable>
          );
        })
      )}

      {programs.length ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Apply for support</Text>
          {persona === 'parent' ? (
            children.length ? (
              <>
                <Text style={styles.label}>For</Text>
                <View style={styles.chips}>
                  {children.map((c) => {
                    const on = applyChild === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setApplyChild(c.id)}
                        style={[
                          styles.chip,
                          on ? { backgroundColor: palette.primary, borderColor: palette.primary } : { borderColor: rgba(palette.primary, 0.2) },
                        ]}>
                        <Text style={[styles.chipText, { color: on ? Colors.white : palette.primary }]} numberOfLines={1}>
                          {c.name.split(/\s+/)[0] || c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.note}>Link your child on the dashboard first.</Text>
            )
          ) : null}
          <RevealBridge bridge={revealRef} />
          <View ref={formRef} collapsable={false} style={{ gap: 8 }}>
            <Text style={styles.label}>Amount you need</Text>
            <View style={styles.amountBox}>
              <Text style={[styles.amountPrefix, { color: palette.primary }]}>KES</Text>
              <TextInput
                style={styles.amountInput}
                value={applyAmount}
                onChangeText={(v) => setApplyAmount(v.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.mutedForeground}
                onFocus={reveal}
              />
            </View>
            <Text style={styles.label}>Why do you need support?</Text>
            <TextInput
              style={styles.notes}
              value={applyNotes}
              onChangeText={setApplyNotes}
              multiline
              maxLength={1000}
              placeholder="e.g. Lost income this term; two children in school."
              placeholderTextColor={Colors.mutedForeground}
              onFocus={reveal}
              textAlignVertical="top"
            />
            {applyError ? <Text style={styles.err}>{applyError}</Text> : null}
            {submitting ? (
              <View style={[styles.busyBtn, { backgroundColor: palette.primary }]}>
                <ActivityIndicator color={Colors.white} />
              </View>
            ) : (
              <MoneyButton label="Send application" icon="send" onPress={() => void submitApplication()} />
            )}
          </View>
        </View>
      ) : null}

      <SectionTitle>{persona === 'student' ? 'Your applications' : "Your children's applications"}</SectionTitle>
      {applications.length === 0 ? (
        <StateCard icon="document-text-outline" title="No applications yet" body="Applications you send show here with the committee's decision." />
      ) : (
        <>
          {appsWin.visible.map((a, i) => {
            const st = String(a.status || 'pending').toLowerCase();
            const tone = STATUS_TONE[st] ?? { bg: '#F1F5F9', fg: '#475569', label: st.replace(/_/g, ' ') };
            const approved = Number(a.approved_amount ?? 0);
            const child = children.find((c) => c.id === a.student_id)?.name;
            return (
              <View key={String(a.id ?? i)} style={[styles.rowCard, { paddingVertical: 12, gap: 6 }]}>
                <View style={styles.appTop}>
                  <Text style={styles.programTitle} numberOfLines={1}>
                    {a.program_name || a.funder_name || 'Bursary'}
                  </Text>
                  <Text style={[styles.pill, { backgroundColor: tone.bg, color: tone.fg }]}>{tone.label}</Text>
                </View>
                <Text style={styles.programMeta}>
                  {[child, shortDate(a.applied_on ?? a.created_at)].filter(Boolean).join(' · ')}
                </Text>
                <View style={styles.appAmounts}>
                  <Text style={styles.programMeta}>Asked {kes(Number(a.requested_amount ?? 0))}</Text>
                  {approved > 0 ? <Text style={styles.approved}>Approved {kes(approved)}</Text> : null}
                </View>
                {a.decision_notes ? <Text style={styles.programDesc}>{a.decision_notes}</Text> : null}
              </View>
            );
          })}
          <ListFooter hasMore={appsWin.hasMore} total={appsWin.total} noun="applications" onMore={appsWin.loadMore} />
        </>
      )}
    </>
  );

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <KeyboardAwareScroll
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          if (!nearEnd(e)) return;
          if (tab === 'contribute') contribWin.loadMore();
          else appsWin.loadMore();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={palette.primary}
          />
        }>
        <MoneyHeader
          title="Bursary"
          subtitle={canApply ? 'Give to the kitty, or apply for support' : 'Give to the school bursary kitty'}
          onBack={() => navigation.goBack()}
        />
        {canApply ? (
          <MoneyTabs
            tabs={[
              { key: 'contribute', label: 'Contribute', icon: 'heart' },
              { key: 'apply', label: 'Apply', icon: 'document-text' },
            ]}
            value={tab}
            onChange={setTab}
          />
        ) : null}
        {loading ? (
          <ListSkeleton withPanel rows={3} />
        ) : error ? (
          <StateCard tone="error" title="Could not load bursary" body={error} onRetry={() => void load()} />
        ) : tab === 'apply' && canApply ? (
          applyTab
        ) : (
          contributeTab
        )}
      </KeyboardAwareScroll>

      <PaymentBottomSheet visible={showPay} onClose={() => setShowPay(false)} bare>
        {showPay ? (
          <PaymentProcessCard
            layout="sheet"
            mode="bursary"
            title="Give to the bursary kitty"
            subtitle={selectedSchool?.name ? `${selectedSchool.name} bursary fund` : 'School bursary fund'}
            defaultAmount="100"
            defaultPhone={defaultMpesaPhone(profile?.phone)}
            onRefresh={async () => {
              await load(true);
            }}
            onClose={() => setShowPay(false)}
          />
        ) : null}
      </PaymentBottomSheet>
    </View>
  );
}

/** Hands the nearest KeyboardAwareScroll's revealer to the screen (the hook only works inside it). */
function RevealBridge({ bridge }: { bridge: React.RefObject<ReturnType<typeof useKeyboardReveal>> }) {
  const revealer = useKeyboardReveal();
  bridge.current = revealer;
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  note: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground },
  rowCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
  },
  programTitle: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: INK },
  programDesc: { marginTop: 3, fontSize: 13, lineHeight: 18, color: Colors.mutedForeground },
  programMeta: { fontSize: 12, color: Colors.mutedForeground },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    gap: 8,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: INK },
  label: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(21,65,29,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  amountPrefix: { fontSize: 15, fontWeight: '800', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '800', color: INK, paddingVertical: 10 },
  notes: {
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(21,65,29,0.18)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: INK,
    backgroundColor: '#FFFFFF',
  },
  err: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  busyBtn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  appAmounts: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  approved: { fontSize: 13, fontWeight: '800', color: '#166534' },
  pill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
});
