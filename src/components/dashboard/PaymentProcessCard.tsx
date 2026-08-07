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
  promptSchoolCollectionStk,
  quoteSchoolCollection,
  type SchoolCollectionPurpose,
} from '../../lib/parentPortalApi';
import { darajaUserError, type DarajaUserError } from '../../lib/darajaErrors';
import { Colors } from '../../theme/yana';

const HERO_GREEN = '#15411D';

export type PaymentProcessMode = 'school_fees' | 'school_pocket' | 'teacher_tip' | 'bursary';

/** Two product steps: send STK → wait for M-Pesa result (then receipt). */
type Phase = 'form' | 'awaiting' | 'done' | 'error';

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
  programId: _programId,
  getReceiptIds,
  onRefresh,
  onClose,
}: Props) {
  const [amount, setAmount] = useState(defaultAmount);
  const [phone, setPhone] = useState(defaultPhone);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [statusLine, setStatusLine] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [darajaFail, setDarajaFail] = useState<DarajaUserError | null>(null);
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
    if (phase !== 'form') {
      setQuote(null);
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 1) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      void quoteSchoolCollection({ purpose: mode as SchoolCollectionPurpose, amount: n })
        .then((q) => {
          if (!cancelled.current) setQuote(q);
        })
        .catch(() => {
          if (!cancelled.current) setQuote(null);
        });
    }, 280);
    return () => clearTimeout(t);
  }, [amount, mode, phase]);

  const steps = useMemo(
    () =>
      [
        { key: 'pay', label: 'Send M-Pesa prompt' },
        { key: 'confirm', label: 'M-Pesa result & receipt' },
      ] as const,
    [],
  );

  const activeStep = phase === 'form' || phase === 'error' ? -1 : phase === 'awaiting' ? 0 : 1;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const hasNewReceipt = useCallback((): boolean => {
    const after = new Set(getReceiptIds?.() ?? []);
    for (const id of after) {
      if (id && !receiptBefore.current.has(id)) return true;
    }
    return false;
  }, [getReceiptIds]);

  const failFromStatus = (st: Record<string, unknown> | null | undefined) => {
    const code = st?.result_code ?? st?.ResultCode ?? null;
    const desc = String(
      st?.user_message || st?.result_description || st?.ResultDesc || st?.message || '',
    );
    return darajaUserError(code as number | string | null, desc);
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
    setDarajaFail(null);
    setReceiptFound(null);
    receiptBefore.current = new Set((getReceiptIds?.() ?? []).filter(Boolean));
    setPhase('awaiting');
    setStatusLine('Sending M-Pesa prompt…');

    try {
      const res = await promptSchoolCollectionStk({
        purpose: mode as SchoolCollectionPurpose,
        amount: n,
        phone: phone.trim(),
        student_id: studentId ?? undefined,
        teacher_id: teacherId ?? undefined,
        description: titleFor(mode, title),
      });

      if (cancelled.current) return;
      const checkoutId = String(res?.checkout_request_id || '').trim();
      setStatusLine(res?.customer_message || 'Check your phone and enter your M-Pesa PIN.');

      let found = false;
      const POLL_MAX = 24;
      for (let i = 0; i < POLL_MAX; i++) {
        if (cancelled.current) return;

        if (checkoutId) {
          try {
            const { deskFetch } = await import('../../lib/deskApi');
            const st = await deskFetch<Record<string, unknown>>('/payments/mpesa/status', {
              method: 'POST',
              body: { checkout_request_id: checkoutId },
            });
            const status = String(st?.status || (st?.data as any)?.status || '').toLowerCase();
            if (status === 'completed' || status === 'success') {
              try {
                await deskFetch('/accounts/collections/apply-completed', {
                  method: 'POST',
                  body: { checkout_request_id: checkoutId },
                });
              } catch (applyErr) {
                console.warn('[Payment] apply-completed', applyErr);
              }
            } else if (status === 'failed' || status === 'cancelled' || status === 'reversed') {
              const fail = failFromStatus(st);
              setDarajaFail(fail);
              setPhase('error');
              setErrorMsg(fail.message);
              setStatusLine(fail.title);
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
          i < 2
            ? 'Enter your M-Pesa PIN on the phone…'
            : i < POLL_MAX - 1
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
      const msg = e instanceof Error ? e.message : String(e);
      const fail = darajaUserError(null, msg);
      setDarajaFail(fail);
      setPhase('error');
      setErrorMsg(msg || fail.message);
      setStatusLine(fail.title);
    }
  };

  const onPay = () => {
    void runStkFlow();
  };

  const busy = phase === 'awaiting';
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

            {formError || errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError || errorMsg}</Text>
                {darajaFail?.tips?.length ? (
                  <View style={styles.tips}>
                    {darajaFail.tips.map((t) => (
                      <Text key={t} style={styles.tipLine}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.primaryBtn} onPress={onPay}>
                <Text style={styles.primaryBtnText}>
                  {phase === 'error' ? 'Try again' : mode === 'bursary' ? 'Pay with M-Pesa' : 'Pay'}
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
                  name={receiptFound === false ? 'time-outline' : 'checkmark-circle'}
                  size={36}
                  color={receiptFound === false ? Colors.orange : HERO_GREEN}
                />
              ) : (
                <ActivityIndicator color={HERO_GREEN} size="large" />
              )}
            </View>
            <Text style={styles.awaitTitle}>
              {phase === 'done'
                ? receiptFound === false
                  ? 'Payment pending'
                  : 'Payment complete'
                : 'Waiting for M-Pesa'}
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
                      ]}
                    >
                      {s.label}
                    </Text>
                  </View>
                );
              })}
            </View>
            {phase === 'done' ? (
              <Pressable style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onClose}>
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
  inner: { padding: 16, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.foreground },
  sub: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.foreground,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },
  chargeBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(21,65,29,0.06)',
    gap: 6,
  },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeLabel: { fontSize: 13, color: Colors.mutedForeground },
  chargeVal: { fontSize: 13, color: Colors.foreground, fontWeight: '600' },
  chargeTotalRow: { marginTop: 4, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(21,65,29,0.2)' },
  chargeTotalLabel: { fontSize: 14, fontWeight: '700', color: HERO_GREEN },
  chargeTotalVal: { fontSize: 14, fontWeight: '700', color: HERO_GREEN },
  meta: { fontSize: 12, color: Colors.mutedForeground },
  errorBox: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(180,40,40,0.08)',
    gap: 6,
  },
  errorText: { fontSize: 13, color: '#9B1C1C', fontWeight: '600' },
  tips: { gap: 2 },
  tipLine: { fontSize: 12, color: '#7F1D1D' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: {
    flex: 1,
    backgroundColor: HERO_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.25)',
  },
  secondaryBtnText: { color: Colors.foreground, fontWeight: '600' },
  awaitBox: { alignItems: 'center', paddingVertical: 12, gap: 8 },
  awaitIcon: { height: 48, justifyContent: 'center', marginBottom: 4 },
  awaitTitle: { fontSize: 16, fontWeight: '700', color: Colors.foreground },
  awaitBody: { fontSize: 13, color: Colors.mutedForeground, textAlign: 'center', paddingHorizontal: 8 },
  stepList: { alignSelf: 'stretch', marginTop: 12, gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepText: { fontSize: 13, color: Colors.mutedForeground },
  stepTextActive: { color: HERO_GREEN, fontWeight: '600' },
});
