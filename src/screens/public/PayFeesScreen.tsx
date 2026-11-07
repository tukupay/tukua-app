/**
 * Pay school fees with no account (native tukua.ai/fees): pick the school, find the learner, see the balance,
 * enter the amount and M-Pesa number, confirm the prompt on the phone, see the receipt.
 * Public Nest routes only (payFeesApi.ts). Flat colours, one-line fields, the sign-in page's curved top bar.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/auth/AuthButton';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { KeyboardAwareScroll } from '../../components/auth/KeyboardAwareScroll';
import { TopWave, TukuaPatternLayer, topWaveHeight } from '../../components/auth/TopWave';
import { userMessageFromError } from '../../lib/apiHttp';
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

const errText = (e: unknown) => userMessageFromError(e, 'Something went wrong. Please try again.');

/** Same votehead twice (two invoices) → one row with the amounts added; order kept (oldest first). */
function mergeVoteheads(items: FeeQuote['pays_for'] | undefined) {
  const out: Array<{ label: string; amount: number }> = [];
  for (const it of items ?? []) {
    const label = String(it?.label || 'School fees').trim();
    const amount = Number(it?.amount) || 0;
    if (amount <= 0) continue;
    const hit = out.find((x) => x.label.toLowerCase() === label.toLowerCase());
    if (hit) hit.amount += amount;
    else out.push({ label, amount });
  }
  return out;
}

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

  const waveH = topWaveHeight(layout.width);
  const badge = s(layout.compact ? 58 : 66);
  const voteheads = useMemo(() => mergeVoteheads(quote?.pays_for), [quote?.pays_for]);
  const clearedTotal = voteheads.reduce((a, v) => a + v.amount, 0);
  const years = (quote?.balance_years ?? []).filter((y) => Number(y?.balance) > 0);

  return (
    <View style={styles.root}>
      <TukuaPatternLayer />
      <KeyboardAwareScroll
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          // The Pay button and the total sit under the M-Pesa field: keep them in view while typing.
          revealMargin={step === 2 ? s(170) : step === 1 ? s(80) : s(28)}
          contentContainerStyle={{
            paddingBottom: bottomSpace + insets.bottom + s(24),
            paddingHorizontal: layout.padH,
          }}>
          {/* The sign-in page's flat green curved top bar; scrolls away with the page. */}
          <View style={{ marginHorizontal: -layout.padH, height: Math.max(waveH * 0.55, insets.top + s(16)) }}>
            <TopWave />
          </View>
          <View style={styles.hero}>
            <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
              <Ionicons name="wallet" size={badge * 0.46} color={Colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { fontSize: font(24), marginTop: s(10) }]}>Pay school fees</Text>
            <View style={[styles.kickerPill, { paddingHorizontal: s(10), paddingVertical: s(3), marginTop: s(6) }]}>
              <Text style={[styles.kicker, { fontSize: font(10.5) }]}>NO ACCOUNT NEEDED</Text>
            </View>
            {step === 0 ? (
              <Text style={[styles.heroSub, { fontSize: font(13), marginTop: s(8), maxWidth: layout.formWidth }]}>
                By M-Pesa, in a minute. The money goes to the school's own account and the receipt into its books.
              </Text>
            ) : null}
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
                        sub={[l.class_name, l.admission, l.parent_name ? `Parent: ${l.parent_name}` : null].filter(Boolean).join(' · ')}
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

              {/* Who and what is owed */}
              <View style={[styles.balanceCard, { padding: s(16), borderRadius: s(18), marginBottom: s(14) }]}>
                <View style={[styles.balanceTop, { gap: s(12) }]}>
                  <View style={[styles.balanceAvatar, { width: s(40), height: s(40), borderRadius: s(20) }]}>
                    <Text style={[styles.balanceAvatarText, { fontSize: font(13) }]}>{learner.initials || initialsOf(learner.name)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.balanceName, { fontSize: font(15) }]} numberOfLines={1}>
                      {learner.name}
                    </Text>
                    <Text style={[styles.balanceWho, { fontSize: font(12) }]} numberOfLines={1}>
                      {[learner.class_name, learner.admission].filter(Boolean).join(' · ') || school.name}
                    </Text>
                  </View>
                </View>
                <View style={[styles.balanceDivider, { marginVertical: s(12) }]} />
                <Text style={[styles.balanceLabel, { fontSize: font(11) }]}>FEES BALANCE</Text>
                <Text style={[styles.balanceValue, { fontSize: font(28) }]} numberOfLines={1} adjustsFontSizeToFit>
                  {quote.balance_kes == null ? 'Not available' : kes(quote.balance_kes)}
                </Text>
                {years.length > 1
                  ? years.map((y) => (
                      <View key={y.year} style={[styles.yearRow, { marginTop: s(4) }]}>
                        <Text style={[styles.balanceWho, styles.flex, { fontSize: font(12) }]} numberOfLines={1}>
                          {y.year}
                        </Text>
                        <Text style={[styles.yearValue, { fontSize: font(12) }]}>{kes(y.balance)}</Text>
                      </View>
                    ))
                  : null}
              </View>

              {/* Voteheads this amount clears: one clear row each, never a cramped table */}
              {voteheads.length ? (
                <View style={[styles.card, { borderRadius: s(18), marginBottom: s(14) }]}>
                  <View style={[styles.cardHead, { paddingHorizontal: s(16), paddingTop: s(14), paddingBottom: s(8) }]}>
                    <Text style={[styles.cardTitle, { fontSize: font(14) }]}>This payment clears</Text>
                    <Text style={[styles.cardHint, { fontSize: font(11) }]}>
                      {voteheads.length} {voteheads.length === 1 ? 'votehead' : 'voteheads'}, oldest first
                    </Text>
                  </View>
                  {voteheads.map((v, i) => (
                    <View
                      key={`${v.label}-${i}`}
                      style={[
                        styles.vhRow,
                        { paddingHorizontal: s(16), paddingVertical: s(11), gap: s(12) },
                        i > 0 ? styles.vhDivider : null,
                      ]}>
                      <View style={[styles.vhDot, { width: s(8), height: s(8), borderRadius: s(4) }]} />
                      <Text style={[styles.vhName, { fontSize: font(14) }]} numberOfLines={2}>
                        {v.label}
                      </Text>
                      <Text style={[styles.vhAmount, { fontSize: font(14) }]}>{kes(v.amount)}</Text>
                    </View>
                  ))}
                  <View style={[styles.vhTotal, { paddingHorizontal: s(16), paddingVertical: s(12) }]}>
                    <Text style={[styles.vhTotalLabel, { fontSize: font(13) }]}>Cleared by this payment</Text>
                    <Text style={[styles.vhTotalValue, { fontSize: font(15) }]}>{kes(clearedTotal)}</Text>
                  </View>
                </View>
              ) : null}

              {/* Amount, number, totals and the button together, so the keyboard never hides the total */}
              <View style={[styles.card, { borderRadius: s(18), padding: s(16) }]}>
                <Text style={[styles.label, { fontSize: font(11) }]}>AMOUNT (KES)</Text>
                <AuthTextField
                  hint="Amount"
                  suffixIcon="cash-outline"
                  keyboardType="number-pad"
                  returnKeyType="next"
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ''))}
                />
                {quote.balance_kes != null && quote.balance_kes > 0 && Math.round(Number(amount)) !== Math.round(quote.balance_kes) ? (
                  <Pressable
                    onPress={() => setAmount(String(Math.round(quote.balance_kes ?? 0)))}
                    hitSlop={6}
                    accessibilityRole="button"
                    style={{ alignSelf: 'flex-start', marginTop: s(8) }}>
                    <Text style={[styles.linkText, { fontSize: font(12) }]}>Pay the full balance ({kes(quote.balance_kes)})</Text>
                  </Pressable>
                ) : null}
                <Text style={[styles.label, { fontSize: font(11), marginTop: s(14) }]}>M-PESA NUMBER</Text>
                <AuthTextField
                  hint="0712 345 678"
                  suffixIcon="phone-portrait-outline"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  returnKeyType="done"
                  value={phone}
                  onChangeText={setPhone}
                />

                <View style={[styles.summary, { marginTop: s(16), paddingTop: s(10) }]}>
                  <SumLine label="Fees" value={kes(quote.amount_kes)} font={font} />
                  <SumLine label="Bank and app charge" value={kes(quote.bank_app_charge_kes)} font={font} />
                  <View style={[styles.totalRow, { marginTop: s(6), padding: s(12), borderRadius: s(12) }]}>
                    <Text style={[styles.totalLabel, { fontSize: font(13) }]}>Total on the M-Pesa prompt</Text>
                    <Text style={[styles.totalValue, { fontSize: font(17) }]}>{kes(quote.total_kes)}</Text>
                  </View>
                </View>

                <View style={[styles.btnRow, { marginTop: s(16) }]}>
                  <AuthButton text={`Pay ${kes(quote.total_kes)}`} loading={busy} onPress={() => void pay()} />
                </View>
                <Text style={[styles.note, { fontSize: font(12), marginTop: s(10), textAlign: 'center' }]}>
                  You will get a prompt on your phone. Enter your M-Pesa PIN to finish.
                </Text>
              </View>
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
      </KeyboardAwareScroll>
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
  hero: { alignItems: 'center' },
  badge: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kickerPill: { backgroundColor: Colors.primary, borderRadius: 999 },
  kicker: { color: Colors.orange, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  heroTitle: { color: Colors.primary, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  heroSub: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 19, textAlign: 'center' },
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
  balanceTop: { flexDirection: 'row', alignItems: 'center' },
  balanceAvatar: { backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
  balanceAvatarText: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  balanceName: { color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)' },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearValue: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardHead: { gap: 2 },
  cardTitle: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  cardHint: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  vhRow: { flexDirection: 'row', alignItems: 'center' },
  vhDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  vhDot: { backgroundColor: Colors.orange },
  vhName: { flex: 1, color: Colors.ink, fontFamily: 'Inter_400Regular' },
  vhAmount: { color: Colors.ink, fontFamily: 'Inter_600SemiBold', fontVariant: ['tabular-nums'] },
  vhTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  vhTotalLabel: { flex: 1, color: Colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
  vhTotalValue: { color: Colors.primary, fontFamily: 'Poppins_700Bold', fontVariant: ['tabular-nums'] },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.background,
  },
  totalLabel: { flex: 1, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  totalValue: { color: Colors.primary, fontFamily: 'Poppins_700Bold', fontVariant: ['tabular-nums'] },
  linkText: { color: Colors.brandGreenMid, fontFamily: 'Poppins_600SemiBold' },
  balanceLabel: { color: Colors.orange, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  balanceValue: { color: Colors.white, fontFamily: 'Poppins_700Bold', marginTop: 2 },
  balanceWho: { color: Colors.navbarMuted, fontFamily: 'Inter_400Regular', marginTop: 2 },
  label: { color: Colors.labelGray, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6, marginBottom: 2 },
  summary: { borderTopWidth: 1, borderTopColor: Colors.border },
  sumLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  sumLabel: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', flexShrink: 1 },
  sumValue: { color: Colors.ink, fontFamily: 'Inter_600SemiBold', flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  sumStrong: { color: Colors.primary, fontFamily: 'Poppins_700Bold', flexShrink: 1 },
  note: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  result: { alignItems: 'center' },
  resultTitle: { color: Colors.primary, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  resultSub: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 6 },
  okBadge: { backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center' },
  badBadge: { backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center' },
  receipt: { alignSelf: 'stretch', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
});

