import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  ActivityIndicator,

  Pressable,

  StyleSheet,

  Text,

  TextInput,

  View,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { GlassPanel } from './Glass';

import {

  contributeParentBursary,

  promptSchoolCollectionStk,

  quoteSchoolCollection,

} from '../../lib/parentPortalApi';

import { Colors } from '../../theme/yana';



const HERO_GREEN = '#15411D';



export type PaymentProcessMode = 'school_fees' | 'school_pocket' | 'teacher_tip' | 'bursary';



type Phase = 'form' | 'sending' | 'awaiting_mpesa' | 'syncing' | 'done' | 'error';



type Quote = {

  amount_kes?: number;

  bank_app_charge_pct?: number;

  bank_app_charge_kes?: number;

  total_kes?: number;

};



type Props = {

  mode: PaymentProcessMode;

  title: string;

  subtitle?: string;

  defaultAmount?: string;

  defaultPhone?: string;

  studentId?: string | null;

  teacherId?: string | null;

  programId?: string | null;

  /** Snapshot receipt ids before STK — used to detect a new receipt after sync. */

  getReceiptIds?: () => string[];

  /** Soft refresh after payment (balances, receipts, kitty). */

  onRefresh?: () => Promise<void>;

  onClose: () => void;

};



function kes(n: number | undefined | null): string {

  const v = Number(n ?? 0) || 0;

  return `KES ${v.toLocaleString()}`;

}



function titleFor(mode: PaymentProcessMode, fallback: string): string {

  if (fallback) return fallback;

  if (mode === 'school_fees') return 'Pay school fees';

  if (mode === 'school_pocket') return 'Add pocket money';

  if (mode === 'teacher_tip') return 'Tip teacher';

  return 'Contribute to bursary';

}



export function PaymentProcessCard({

  mode,

  title,

  subtitle,

  defaultAmount = '',

  defaultPhone = '',

  studentId,

  teacherId,

  programId,

  getReceiptIds,

  onRefresh,

  onClose,

}: Props) {

  const isBursary = mode === 'bursary';

  const [amount, setAmount] = useState(defaultAmount);

  const [phone, setPhone] = useState(defaultPhone);

  const [note, setNote] = useState('');

  const [quote, setQuote] = useState<Quote | null>(null);

  const [phase, setPhase] = useState<Phase>('form');

  const [statusLine, setStatusLine] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [receiptFound, setReceiptFound] = useState<boolean | null>(null);

  const cancelled = useRef(false);

  const receiptBefore = useRef<Set<string>>(new Set());



  useEffect(() => {

    cancelled.current = false;

    return () => {

      cancelled.current = true;

    };

  }, []);



  useEffect(() => {

    if (isBursary || phase !== 'form') {

      setQuote(null);

      return;

    }

    const n = Number(amount);

    if (!Number.isFinite(n) || n < 1) {

      setQuote(null);

      return;

    }

    const t = setTimeout(() => {

      void quoteSchoolCollection({ purpose: mode, amount: n })

        .then((q) => {

          if (!cancelled.current) setQuote(q);

        })

        .catch(() => {

          if (!cancelled.current) setQuote(null);

        });

    }, 280);

    return () => clearTimeout(t);

  }, [amount, isBursary, mode, phase]);



  const steps = useMemo(() => {

    if (isBursary) {

      return [

        { key: 'sending', label: 'Recording contribution' },

        { key: 'syncing', label: 'Refreshing bursary kitty' },

        { key: 'done', label: 'Done' },

      ] as const;

    }

    return [

      { key: 'sending', label: 'Sending M-Pesa prompt' },

      { key: 'awaiting_mpesa', label: 'Awaiting PIN on your phone' },

      { key: 'syncing', label: 'Updating balances & receipts' },

      { key: 'done', label: 'Done' },

    ] as const;

  }, [isBursary]);



  const stepIndex = (key: string) => steps.findIndex((s) => s.key === key);



  const activeStep =

    phase === 'form' || phase === 'error'

      ? -1

      : phase === 'sending'

        ? 0

        : phase === 'awaiting_mpesa'

          ? Math.max(0, stepIndex('awaiting_mpesa'))

          : phase === 'syncing'

            ? Math.max(0, stepIndex('syncing'))

            : steps.length - 1;



  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));



  const hasNewReceipt = (): boolean => {

    const after = new Set(getReceiptIds?.() ?? []);

    for (const id of after) {

      if (id && !receiptBefore.current.has(id)) return true;

    }

    return false;

  };



  const runStkFlow = async () => {

    const n = Number(amount);

    if (!Number.isFinite(n) || n < 1) {

      setFormError('Amount must be at least 1 KES.');

      return;

    }

    if (!phone.trim()) {

      setFormError('Enter the M-Pesa number that will receive the STK.');

      return;

    }

    setFormError(null);

    setErrorMsg(null);

    setReceiptFound(null);

    receiptBefore.current = new Set((getReceiptIds?.() ?? []).filter(Boolean));

    setPhase('sending');

    setStatusLine('Contacting M-Pesa…');

    try {

      const res = await promptSchoolCollectionStk({

        purpose: mode as 'school_fees' | 'school_pocket' | 'teacher_tip',

        amount: n,

        phone: phone.trim(),

        student_id: studentId ?? undefined,

        teacher_id: teacherId ?? undefined,

        description: titleFor(mode, title),

      });

      if (cancelled.current) return;

      const checkoutId = String(res?.checkout_request_id || '').trim();

      setPhase('awaiting_mpesa');

      setStatusLine(

        res?.customer_message || 'Check your phone and enter your M-Pesa PIN.',

      );

      // Give the parent time to enter PIN; then poll Daraja status before posting receipts.
      await sleep(6000);

      if (cancelled.current) return;

      setPhase('syncing');

      setStatusLine('Confirming M-Pesa payment…');

            let found = false;
      const POLL_MAX = 24;

      for (let i = 0; i < POLL_MAX; i++) {
        if (cancelled.current) return;

        if (checkoutId) {
          try {
            const { deskFetch } = await import('../../lib/deskApi');
            // Force Daraja/BankGPT reconcile when bill-done webhook is slow/missing.
            const st = await deskFetch<{ status?: string; data?: { status?: string } }>(
              '/payments/mpesa/status',
              {
                method: 'POST',
                body: { checkout_request_id: checkoutId },
              },
            );
            const status = String(st?.status || st?.data?.status || '').toLowerCase();
            if (status === 'completed') {
              try {
                await deskFetch('/accounts/collections/apply-completed', {
                  method: 'POST',
                  body: { checkout_request_id: checkoutId },
                });
              } catch (applyErr) {
                // Keep polling — bill-done may still write the receipt.
                console.warn('[Payment] apply-completed', applyErr);
              }
            } else if (status === 'failed' || status === 'cancelled' || status === 'reversed') {
              setPhase('done');
              setReceiptFound(false);
              setStatusLine(
                status === 'cancelled'
                  ? 'Payment cancelled on the phone.'
                  : 'Payment did not complete. Try again.',
              );
              return;
            }
          } catch {
            /* keep polling */
          }
        }

        if (onRefresh) await onRefresh();
        found = hasNewReceipt();
        if (found) break;

        setStatusLine(
          i < POLL_MAX - 1
            ? `Waiting for M-Pesa confirmation (${i + 1}/${POLL_MAX})…`
            : 'Finishing up…',
        );
        await sleep(4000);
      }

      if (cancelled.current) return;

      setReceiptFound(found);

      setPhase('done');

      setStatusLine(

        found

          ? 'Payment received — your receipt appears in the list below.'

          : 'No new receipt yet. If you entered your PIN, M-Pesa may still be processing — pull to refresh in a minute.',

      );

    } catch (e) {

      if (cancelled.current) return;

      setPhase('error');

      setErrorMsg(e instanceof Error ? e.message : String(e));

      setStatusLine('Payment could not complete.');

    }

  };



  const runBursaryFlow = async () => {

    const n = Number(amount);

    if (!Number.isFinite(n) || n < 1) {

      setFormError('Enter a valid contribution amount in KES.');

      return;

    }

    setFormError(null);

    setErrorMsg(null);

    setPhase('sending');

    setStatusLine('Recording your gift…');

    try {

      await contributeParentBursary({

        amount: n,

        program_id: programId ?? undefined,

        note: note.trim() || undefined,

      });

      if (cancelled.current) return;

      setPhase('syncing');

      setStatusLine('Refreshing bursary kitty…');

      if (onRefresh) await onRefresh();

      await sleep(600);

      if (cancelled.current) return;

      setPhase('done');

      setStatusLine(

        'Thank you — the school bursary committee decides how funds are distributed.',

      );

    } catch (e) {

      if (cancelled.current) return;

      setPhase('error');

      setErrorMsg(e instanceof Error ? e.message : String(e));

      setStatusLine('Contribution could not be recorded.');

    }

  };



  const onPay = () => {

    if (isBursary) void runBursaryFlow();

    else void runStkFlow();

  };



  const busy = phase === 'sending' || phase === 'awaiting_mpesa' || phase === 'syncing';

  const showForm = phase === 'form' || phase === 'error';



  return (

    <GlassPanel tone="frost" radius={16}>

      <View style={styles.inner}>

        <View style={styles.headRow}>

          <View style={{ flex: 1 }}>

            <Text style={styles.title}>{titleFor(mode, title)}</Text>

            {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}

          </View>

          {!busy ? (

            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close payment">

              <Ionicons name="close" size={22} color={Colors.mutedForeground} />

            </Pressable>

          ) : null}

        </View>



        {showForm ? (

          <>

            <Text style={styles.fieldLabel}>Amount (KES)</Text>

            <TextInput

              style={styles.input}

              value={amount}

              onChangeText={setAmount}

              keyboardType="decimal-pad"

              placeholder="e.g. 5000"

              placeholderTextColor={Colors.mutedForeground}

              editable={!busy}

            />

            {isBursary ? (

              <>

                <Text style={styles.fieldLabel}>Note (optional)</Text>

                <TextInput

                  style={[styles.input, styles.inputMulti]}

                  value={note}

                  onChangeText={setNote}

                  placeholder="For the vulnerable student fund"

                  placeholderTextColor={Colors.mutedForeground}

                  multiline

                  editable={!busy}

                />

              </>

            ) : (

              <>

                <Text style={styles.fieldLabel}>M-Pesa phone</Text>

                <TextInput

                  style={styles.input}

                  value={phone}

                  onChangeText={setPhone}

                  keyboardType="phone-pad"

                  placeholder="07…"

                  placeholderTextColor={Colors.mutedForeground}

                  editable={!busy}

                />

                {quote?.total_kes != null ? (

                  <View style={styles.chargeBox}>

                    <View style={styles.chargeRow}>

                      <Text style={styles.chargeLabel}>Amount</Text>

                      <Text style={styles.chargeVal}>{kes(Number(quote.amount_kes ?? 0))}</Text>

                    </View>

                    <View style={styles.chargeRow}>

                      <Text style={styles.chargeLabel}>

                        Bank & App Charges ({quote.bank_app_charge_pct}%)

                      </Text>

                      <Text style={styles.chargeVal}>

                        {kes(Number(quote.bank_app_charge_kes ?? 0))}

                      </Text>

                    </View>

                    <View style={[styles.chargeRow, styles.chargeTotalRow]}>

                      <Text style={styles.chargeTotalLabel}>You pay</Text>

                      <Text style={styles.chargeTotalVal}>{kes(Number(quote.total_kes))}</Text>

                    </View>

                  </View>

                ) : amount.trim() ? (

                  <Text style={styles.meta}>Calculating charges…</Text>

                ) : null}

              </>

            )}

            {formError || errorMsg ? (

              <Text style={styles.errorText}>{formError || errorMsg}</Text>

            ) : null}

            <View style={styles.actions}>

              <Pressable style={styles.primaryBtn} onPress={onPay}>

                <Text style={styles.primaryBtnText}>

                  {phase === 'error' ? 'Try again' : isBursary ? 'Contribute' : 'Pay'}

                </Text>

              </Pressable>

              <Pressable style={styles.secondaryBtn} onPress={onClose}>

                <Text style={styles.secondaryBtnText}>Cancel</Text>

              </Pressable>

            </View>

          </>

        ) : (

          <View style={styles.awaitBox}>

            <View style={styles.awaitIcon}>

              {phase === 'done' ? (

                <Ionicons

                  name={receiptFound === false && !isBursary ? 'time-outline' : 'checkmark-circle'}

                  size={36}

                  color={receiptFound === false && !isBursary ? Colors.orange : HERO_GREEN}

                />

              ) : (

                <ActivityIndicator color={HERO_GREEN} size="large" />

              )}

            </View>

            <Text style={styles.awaitTitle}>

              {phase === 'done'

                ? receiptFound === false && !isBursary

                  ? 'Payment pending'

                  : 'Processing complete'

                : 'Awaiting app processing'}

            </Text>

            <Text style={styles.awaitBody}>{statusLine}</Text>

            <View style={styles.stepList}>

              {steps.map((s, i) => {

                const done = i < activeStep || phase === 'done';

                const current = i === activeStep && phase !== 'done';

                return (

                  <View key={s.key} style={styles.stepRow}>

                    <Ionicons

                      name={done ? 'checkmark-circle' : current ? 'ellipse' : 'ellipse-outline'}

                      size={16}

                      color={done || current ? HERO_GREEN : Colors.mutedForeground}

                    />

                    <Text

                      style={[

                        styles.stepText,

                        (done || current) && styles.stepTextActive,

                      ]}>

                      {s.label}

                    </Text>

                  </View>

                );

              })}

            </View>

            {phase === 'done' ? (

              <Pressable style={styles.primaryBtn} onPress={onClose}>

                <Text style={styles.primaryBtnText}>Done</Text>

              </Pressable>

            ) : null}

          </View>

        )}

      </View>

    </GlassPanel>

  );

}



const styles = StyleSheet.create({

  inner: { padding: 14, gap: 8 },

  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },

  title: { fontSize: 17, fontWeight: '800', color: Colors.ink },

  sub: { marginTop: 2, fontSize: 13, color: Colors.mutedForeground },

  fieldLabel: {

    marginTop: 4,

    fontSize: 12,

    fontWeight: '700',

    color: Colors.mutedForeground,

    textTransform: 'uppercase',

    letterSpacing: 0.4,

  },

  input: {

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: 'rgba(0,0,0,0.12)',

    borderRadius: 12,

    paddingHorizontal: 12,

    paddingVertical: 10,

    fontSize: 15,

    color: Colors.ink,

    backgroundColor: 'rgba(255,255,255,0.7)',

  },

  inputMulti: { minHeight: 72, textAlignVertical: 'top' },

  meta: { fontSize: 12, color: Colors.mutedForeground },

  errorText: { fontSize: 13, color: Colors.orange, marginTop: 2 },

  chargeBox: {

    marginTop: 4,

    padding: 12,

    borderRadius: 12,

    backgroundColor: 'rgba(21,65,29,0.06)',

    gap: 6,

  },

  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },

  chargeLabel: { flex: 1, fontSize: 13, color: Colors.mutedForeground },

  chargeVal: { fontSize: 13, fontWeight: '600', color: Colors.ink },

  chargeTotalRow: {

    marginTop: 4,

    paddingTop: 8,

    borderTopWidth: StyleSheet.hairlineWidth,

    borderTopColor: 'rgba(0,0,0,0.08)',

  },

  chargeTotalLabel: { fontSize: 14, fontWeight: '800', color: Colors.ink },

  chargeTotalVal: { fontSize: 15, fontWeight: '800', color: HERO_GREEN },

  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },

  primaryBtn: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    backgroundColor: HERO_GREEN,

    paddingVertical: 12,

    borderRadius: 12,

  },

  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  secondaryBtn: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,

    backgroundColor: 'rgba(21,65,29,0.1)',

    paddingVertical: 12,

    borderRadius: 12,

  },

  secondaryBtnText: { color: HERO_GREEN, fontWeight: '700', fontSize: 14 },

  awaitBox: { alignItems: 'center', paddingVertical: 8, gap: 8 },

  awaitIcon: { marginBottom: 4, minHeight: 40, justifyContent: 'center' },

  awaitTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink, textAlign: 'center' },

  awaitBody: {

    fontSize: 13,

    color: Colors.mutedForeground,

    textAlign: 'center',

    lineHeight: 18,

    paddingHorizontal: 4,

  },

  stepList: { alignSelf: 'stretch', gap: 8, marginTop: 8, marginBottom: 4 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  stepText: { fontSize: 13, color: Colors.mutedForeground },

  stepTextActive: { color: Colors.ink, fontWeight: '600' },

});

