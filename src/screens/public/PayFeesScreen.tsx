/**
 * Pay school fees with no account (native tukua.ai/fees): pick the school, find the learner, see the balance,
 * enter the amount and M-Pesa number, confirm the prompt on the phone, see the receipt.
 * Public Nest routes only (payFeesApi.ts). Flat colours, one-line fields.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { useAuthScale } from '../../components/auth/useAuthScale';
import { PagerSafeStrip } from '../../components/BookPager';
import { Colors } from '../../theme/yana';
import {
  feePaymentStatus,
  findLearners,
  kes,
  quoteFees,
  searchFeeSchools,
  startFeePayment,
  type DirectorySchool,
  type FeeQuote,
  type FoundLearner,
  type LearnerSearchBy,
} from './payFeesApi';

const BY_LABEL: Record<LearnerSearchBy, string> = { adm: 'Admission no.', name: 'Name', phone: "Parent's phone" };
const BY_HINT: Record<LearnerSearchBy, string> = { adm: 'e.g. STUD-12901', name: "The learner's names", phone: 'e.g. 0712 345 678' };
const STEPS = ['School', 'Learner', 'Amount', 'Pay'];
const POLL_MS = 4000;
const POLL_MAX = 40;

type Payment = { checkout: string; status: string; message?: string; receipt?: string; total: number };

const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.');

export function PayFeesScreen({ bottomSpace = 0 }: { bottomSpace?: number }) {
  const layout = useAuthScale(0.9);
  const { s, font } = layout;
  const insets = useSafeAreaInsets();

  const [schoolQ, setSchoolQ] = useState('');
  const [schools, setSchools] = useState<DirectorySchool[] | null>(null);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [school, setSchool] = useState<DirectorySchool | null>(null);
  const [by, setBy] = useState<LearnerSearchBy>('adm');
  const [lq, setLq] = useState('');
  const [learners, setLearners] = useState<FoundLearner[] | null>(null);
  const [learner, setLearner] = useState<FoundLearner | null>(null);
  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);

  const stopPolling = useCallback(() => {
    if (polling.current) clearInterval(polling.current);
    polling.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // School search (debounced).
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setSchoolsLoading(true);
      try {
        const list = await searchFeeSchools(schoolQ);
        if (!cancelled) setSchools(list);
      } catch (e) {
        if (!cancelled) {
          setSchools([]);
          setError(errText(e));
        }
      } finally {
        if (!cancelled) setSchoolsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [schoolQ]);

  // The charge and total follow the amount typed.
  useEffect(() => {
    if (!school || !learner || !quote || payment) return;
    const n = Math.round(Number(amount));
    if (!n || n < 10 || n === Math.round(quote.amount_kes)) return;
    const t = setTimeout(async () => {
      try {
        const q = await quoteFees(school.slug, learner.ref, n);
        if (alive.current) setQuote(q);
      } catch (e) {
        if (alive.current) setError(errText(e));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [amount, school, learner, quote, payment]);

  const step = payment ? 3 : quote ? 2 : school ? 1 : 0;

  const reset = (to: 'school' | 'learner' | 'amount' | 'all') => {
    stopPolling();
    setError('');
    setPayment(null);
    if (to === 'school' || to === 'all') {
      setSchool(null);
      setLearners(null);
      setLearner(null);
      setQuote(null);
      setLq('');
    }
    if (to === 'learner') {
      setLearner(null);
      setQuote(null);
    }
    if (to === 'all') {
      setAmount('');
    }
  };

  const search = async () => {
    if (!school || lq.trim().length < 2) return;
    setBusy(true);
    setError('');
    setLearners(null);
    try {
      const r = await findLearners(school.slug, by, lq.trim());
      setLearners(r?.learners ?? []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const choose = async (l: FoundLearner) => {
    if (!school) return;
    setLearner(l);
    setBusy(true);
    setError('');
    try {
      const q = await quoteFees(school.slug, l.ref);
      setQuote(q);
      setAmount(String(Math.max(Math.round(q.balance_kes ?? q.amount_kes ?? 0), 0) || ''));
    } catch (e) {
      setError(errText(e));
      setLearner(null);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!school || !learner || !quote) return;
    const n = Math.round(Number(amount));
    const msisdn = phone.replace(/\s+/g, '');
    if (!n || n < 10) {
      setError('Enter at least KES 10.');
      return;
    }
    if (!/^(?:\+?254|0)?[71]\d{8}$/.test(msisdn)) {
      setError('Enter the M-Pesa number, for example 0712 345 678.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const started = await startFeePayment(school.slug, learner.ref, msisdn, n);
      setPayment({ checkout: started.checkout_request_id, status: 'pending', total: started.total_kes });
      let tries = 0;
      stopPolling();
      polling.current = setInterval(async () => {
        tries += 1;
        try {
          const st = await feePaymentStatus(school.slug, started.checkout_request_id);
          if (st.status !== 'pending' || tries > POLL_MAX) {
            stopPolling();
            if (!alive.current) return;
            setPayment((p) =>
              p
                ? {
                    ...p,
                    status: tries > POLL_MAX && st.status === 'pending' ? 'timeout' : st.status,
                    message: st.message,
                    receipt: st.receipt,
                  }
                : p,
            );
          }
        } catch {
          if (tries > POLL_MAX) {
            stopPolling();
            if (alive.current) setPayment((p) => (p ? { ...p, status: 'timeout' } : p));
          }
        }
      }, POLL_MS);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: bottomSpace + insets.bottom + s(24),
            paddingHorizontal: layout.padH,
          }}>
          {/* Flat green header with a rounded foot */}
          <View
            style={[
              styles.header,
              {
                marginHorizontal: -layout.padH,
                paddingHorizontal: layout.padH,
                paddingTop: insets.top + s(20),
                paddingBottom: s(22),
                borderBottomLeftRadius: s(28),
                borderBottomRightRadius: s(28),
              },
            ]}>
            <Text style={[styles.kicker, { fontSize: font(11) }]}>NO ACCOUNT NEEDED</Text>
            <Text style={[styles.heroTitle, { fontSize: font(24) }]}>Pay school fees</Text>
            <Text style={[styles.heroSub, { fontSize: font(13), marginTop: s(6) }]}>
              By M-Pesa, in a minute. The money goes to the school's own account and the receipt into its books.
            </Text>
          </View>

          <Steps at={step} s={s} font={font} />

          {error ? (
            <View style={[styles.errorBox, { marginBottom: s(12) }]} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={s(18)} color={Colors.destructive} />
              <Text style={[styles.errorText, { fontSize: font(13) }]}>{error}</Text>
            </View>
          ) : null}

          {step === 0 ? (
            <View>
              <Text style={[styles.h2, { fontSize: font(16) }]}>Which school?</Text>
              <AuthTextField
                hint="School name, county or short name"
                suffixIcon="search-outline"
                autoCorrect={false}
                value={schoolQ}
                onChangeText={(t) => {
                  setError('');
                  setSchoolQ(t);
                }}
              />
              <View style={{ marginTop: s(12), gap: s(8) }}>
                {schoolsLoading && !schools ? <ActivityIndicator color={Colors.primary} style={{ marginTop: s(12) }} /> : null}
                {(schools ?? []).map((sc) => (
                  <Row
                    key={sc.slug}
                    onPress={() => {
                      setError('');
                      setSchool(sc);
                    }}
                    title={sc.name}
                    sub={[sc.county, sc.kind].filter(Boolean).join(' · ')}
                    logo={sc.logo}
                    initials={initialsOf(sc.name)}
                    s={s}
                    font={font}
                  />
                ))}
                {schools && !schools.length && !schoolsLoading ? (
                  <Text style={[styles.empty, { fontSize: font(13) }]}>
                    No school here takes fees online yet{schoolQ.trim() ? ` for "${schoolQ.trim()}"` : ''}.
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {step === 1 && school ? (
            <View>
              <BackLink label={school.name} onPress={() => reset('school')} s={s} font={font} />
              <Text style={[styles.h2, { fontSize: font(16) }]}>Find the learner</Text>
              <PagerSafeStrip contentContainerStyle={{ gap: s(8), paddingVertical: s(4) }}>
                {(Object.keys(BY_LABEL) as LearnerSearchBy[]).map((b) => {
                  const on = b === by;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => {
                        setBy(b);
                        setLearners(null);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[
                        styles.chip,
                        { paddingHorizontal: s(14), paddingVertical: s(7) },
                        on ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : null,
                      ]}>
                      <Text style={[styles.chipText, { fontSize: font(12) }, on ? { color: Colors.white } : null]}>{BY_LABEL[b]}</Text>
                    </Pressable>
                  );
                })}
              </PagerSafeStrip>
              <View style={{ marginTop: s(8) }}>
                <AuthTextField
                  hint={BY_HINT[by]}
                  suffixIcon={by === 'phone' ? 'call-outline' : by === 'name' ? 'person-outline' : 'id-card-outline'}
                  keyboardType={by === 'phone' ? 'phone-pad' : 'default'}
                  autoCapitalize={by === 'adm' ? 'characters' : 'words'}
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => void search()}
                  value={lq}
                  onChangeText={setLq}
                />
              </View>
              <View style={[styles.btnRow, { marginTop: s(16) }]}>
                <AuthButton text="Find learner" enabled={lq.trim().length >= 2} loading={busy && !learner} onPress={() => void search()} />
              </View>
              {learners ? (
                learners.length ? (
                  <View style={{ marginTop: s(14), gap: s(8) }}>
                    {learners.map((l) => (
                      <Row
                        key={l.ref}
                        onPress={() => void choose(l)}
                        disabled={busy}
                        title={l.name}
                        sub={[l.class_name, l.admission].filter(Boolean).join(' · ')}
                        initials={l.initials}
                        trailing={busy && learner?.ref === l.ref ? 'busy' : 'Choose'}
                        s={s}
                        font={font}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.empty, { fontSize: font(13), marginTop: s(14) }]}>
                    No learner found. Check the {BY_LABEL[by].toLowerCase()}, or try another way.
                  </Text>
                )
              ) : null}
            </View>
          ) : null}

          {step === 2 && school && learner && quote ? (
            <View>
              <BackLink label={`${learner.name} · ${school.name}`} onPress={() => reset('learner')} s={s} font={font} />
              <View style={[styles.balanceCard, { padding: s(16), borderRadius: s(16), marginBottom: s(16) }]}>
                <Text style={[styles.balanceLabel, { fontSize: font(11) }]}>FEES BALANCE</Text>
                <Text style={[styles.balanceValue, { fontSize: font(26) }]}>{kes(quote.balance_kes)}</Text>
                <Text style={[styles.balanceWho, { fontSize: font(12) }]} numberOfLines={1}>
                  {[learner.name, learner.class_name, learner.admission].filter(Boolean).join(' · ')}
                </Text>
              </View>

              <Text style={[styles.label, { fontSize: font(11) }]}>AMOUNT (KES)</Text>
              <AuthTextField
                hint="Amount"
                suffixIcon="cash-outline"
                keyboardType="number-pad"
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ''))}
              />
              <Text style={[styles.label, { fontSize: font(11), marginTop: s(16) }]}>M-PESA NUMBER</Text>
              <AuthTextField
                hint="0712 345 678"
                suffixIcon="phone-portrait-outline"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                value={phone}
                onChangeText={setPhone}
              />

              {quote.pays_for?.length ? (
                <View style={{ marginTop: s(18) }}>
                  <Text style={[styles.label, { fontSize: font(11) }]}>THIS CLEARS</Text>
                  {quote.pays_for.map((p) => (
                    <SumLine key={p.label} label={p.label} value={kes(p.amount)} font={font} />
                  ))}
                </View>
              ) : null}

              <View style={[styles.summary, { marginTop: s(18), paddingTop: s(10) }]}>
                <SumLine label="Fees" value={kes(quote.amount_kes)} font={font} />
                <SumLine label="Bank and app charge" value={kes(quote.bank_app_charge_kes)} font={font} />
                <SumLine label="Total on the M-Pesa prompt" value={kes(quote.total_kes)} font={font} strong />
              </View>

              <View style={[styles.btnRow, { marginTop: s(18) }]}>
                <AuthButton text={`Pay ${kes(quote.total_kes)}`} loading={busy} onPress={() => void pay()} />
              </View>
              <Text style={[styles.note, { fontSize: font(12), marginTop: s(10) }]}>
                You will get a prompt on your phone. Enter your M-Pesa PIN to finish.
              </Text>
            </View>
          ) : null}

          {step === 3 && payment && school && learner ? (
            <View style={[styles.result, { paddingVertical: s(24) }]}>
              {payment.status === 'pending' ? (
                <>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={[styles.resultTitle, { fontSize: font(20), marginTop: s(14) }]}>Check your phone</Text>
                  <Text style={[styles.resultSub, { fontSize: font(13) }]}>
                    Enter your M-Pesa PIN to pay {kes(payment.total)} to {school.name}.
                  </Text>
                </>
              ) : payment.status === 'completed' ? (
                <>
                  <View style={[styles.okBadge, { width: s(64), height: s(64), borderRadius: s(32) }]}>
                    <Ionicons name="checkmark" size={s(36)} color={Colors.primary} />
                  </View>
                  <Text style={[styles.resultTitle, { fontSize: font(20), marginTop: s(14) }]}>Paid. Thank you.</Text>
                  <View style={[styles.receipt, { padding: s(14), borderRadius: s(14), marginTop: s(14) }]}>
                    <SumLine label="Amount" value={kes(payment.total)} font={font} strong />
                    <SumLine label="Learner" value={learner.name} font={font} />
                    {learner.admission ? <SumLine label="Admission no." value={learner.admission} font={font} /> : null}
                    <SumLine label="School" value={school.name} font={font} />
                    {payment.receipt ? <SumLine label="M-Pesa receipt" value={payment.receipt} font={font} /> : null}
                  </View>
                  <Text style={[styles.note, { fontSize: font(12), marginTop: s(10), textAlign: 'center' }]}>
                    The school has the payment in its books. M-Pesa also sends you a message.
                  </Text>
                  <View style={[styles.btnRow, { marginTop: s(18) }]}>
                    <AuthButton text="Done" onPress={() => reset('all')} />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.badBadge, { width: s(64), height: s(64), borderRadius: s(32) }]}>
                    <Ionicons name="close" size={s(36)} color={Colors.white} />
                  </View>
                  <Text style={[styles.resultTitle, { fontSize: font(20), marginTop: s(14) }]}>
                    {payment.status === 'timeout' ? 'We have not heard back yet' : 'The payment did not go through'}
                  </Text>
                  <Text style={[styles.resultSub, { fontSize: font(13) }]}>
                    {payment.message ||
                      (payment.status === 'timeout'
                        ? 'If you entered your PIN, the school will still get the payment. Check your M-Pesa messages.'
                        : 'Nothing was taken. You can try again.')}
                  </Text>
                  <View style={[styles.btnRow, { marginTop: s(18) }]}>
                    <AuthButton text="Try again" onPress={() => reset('amount')} />
                  </View>
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type Scale = { s: (n: number) => number; font: (n: number) => number };

function Steps({ at, s, font }: { at: number } & Scale) {
  return (
    <View style={[styles.steps, { marginVertical: s(18) }]}>
      {STEPS.map((l, i) => {
        const done = i < at;
        const on = i === at;
        return (
          <React.Fragment key={l}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  { width: s(24), height: s(24), borderRadius: s(12) },
                  done ? { backgroundColor: Colors.primary } : on ? { backgroundColor: Colors.orange } : null,
                ]}>
                {done ? (
                  <Ionicons name="checkmark" size={s(14)} color={Colors.white} />
                ) : (
                  <Text style={[styles.stepNum, { fontSize: font(11) }, on ? { color: Colors.primary } : null]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, { fontSize: font(11) }, on ? { color: Colors.primary } : null]}>{l}</Text>
            </View>
            {i < STEPS.length - 1 ? <View style={[styles.stepLine, done ? { backgroundColor: Colors.primary } : null]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function BackLink({ label, onPress, s, font }: { label: string; onPress: () => void } & Scale) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" style={[styles.backLink, { marginBottom: s(10) }]}>
      <Ionicons name="arrow-back" size={s(16)} color={Colors.mutedForeground} />
      <Text style={[styles.backText, { fontSize: font(13) }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Row({
  title,
  sub,
  logo,
  initials,
  trailing = 'chevron',
  disabled,
  onPress,
  s,
  font,
}: {
  title: string;
  sub?: string;
  logo?: string | null;
  initials: string;
  trailing?: 'chevron' | 'busy' | string;
  disabled?: boolean;
  onPress: () => void;
} & Scale) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { padding: s(12), borderRadius: s(14), gap: s(12) }, pressed ? { opacity: 0.85 } : null]}>
      {logo ? (
        <Image source={{ uri: logo }} style={{ width: s(40), height: s(40), borderRadius: s(20), backgroundColor: Colors.muted }} />
      ) : (
        <View style={[styles.avatar, { width: s(40), height: s(40), borderRadius: s(20) }]}>
          <Text style={[styles.avatarText, { fontSize: font(13) }]}>{initials}</Text>
        </View>
      )}
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { fontSize: font(14) }]} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={[styles.rowSub, { fontSize: font(12) }]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {trailing === 'busy' ? (
        <ActivityIndicator color={Colors.primary} />
      ) : trailing === 'chevron' ? (
        <Ionicons name="chevron-forward" size={s(18)} color={Colors.mutedForeground} />
      ) : (
        <Text style={[styles.rowAction, { fontSize: font(13) }]}>{trailing}</Text>
      )}
    </Pressable>
  );
}

function SumLine({ label, value, strong, font }: { label: string; value: string; strong?: boolean; font: (n: number) => number }) {
  return (
    <View style={styles.sumLine}>
      <Text style={[strong ? styles.sumStrong : styles.sumLabel, { fontSize: font(strong ? 14 : 13) }]}>{label}</Text>
      <Text style={[strong ? styles.sumStrong : styles.sumValue, { fontSize: font(strong ? 14 : 13) }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  kicker: { color: Colors.orange, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  heroTitle: { color: Colors.white, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  header: { backgroundColor: Colors.primary },
  heroSub: { color: Colors.navbarMuted, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  h2: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
  steps: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: Colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  stepLabel: { color: Colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 6, marginBottom: 16 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: Colors.destructive,
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 8,
  },
  errorText: { flex: 1, color: Colors.foreground, fontFamily: 'Inter_400Regular' },
  empty: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.orange, fontFamily: 'Poppins_600SemiBold' },
  rowTitle: { color: Colors.ink, fontFamily: 'Poppins_600SemiBold' },
  rowSub: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  rowAction: { color: Colors.brandGreenMid, fontFamily: 'Poppins_600SemiBold' },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipText: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  btnRow: { flexDirection: 'row' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { flexShrink: 1, color: Colors.mutedForeground, fontFamily: 'Poppins_600SemiBold' },
  balanceCard: { backgroundColor: Colors.primary },
  balanceLabel: { color: Colors.orange, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  balanceValue: { color: Colors.white, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  balanceWho: { color: Colors.navbarMuted, fontFamily: 'Inter_400Regular', marginTop: 2 },
  label: { color: Colors.labelGray, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6, marginBottom: 2 },
  summary: { borderTopWidth: 1, borderTopColor: Colors.border },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  sumLabel: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', flexShrink: 1 },
  sumValue: { color: Colors.ink, fontFamily: 'Inter_600SemiBold', flexShrink: 1, textAlign: 'right' },
  sumStrong: { color: Colors.primary, fontFamily: 'Poppins_700Bold', flexShrink: 1 },
  note: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  result: { alignItems: 'center' },
  resultTitle: { color: Colors.primary, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  resultSub: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 6 },
  okBadge: { backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
  badBadge: { backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center' },
  receipt: { alignSelf: 'stretch', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
});

