/**
 * One M-Pesa payment, start to finish, for school fees, pocket money, a teacher tip, a bursary gift or an
 * event: amount + phone (with the charge and, for fees, the vote heads the money clears), then the STK
 * prompt, a clear waiting state, and an outcome screen (paid with the M-Pesa receipt / not paid with the
 * reason / still waiting with "Check again").
 *
 * layout="sheet" (inside PaymentBottomSheet bare): the form scrolls and the Pay button is pinned at the
 * bottom, so it stays right above the keyboard. layout="inline" (default): everything stacked, for a
 * host screen that scrolls.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  promptSchoolCollectionStk,
  quoteSchoolCollection,
  type SchoolCollectionPurpose,
} from '../../lib/parentPortalApi';
import { pollMpesaTopUpStatus, type MpesaTopUpStatus } from '../../lib/wallet';
import { kenyaMobileError } from '../../lib/phoneUtils';
import { darajaUserError, type DarajaUserError } from '../../lib/darajaErrors';
import { useAppTheme } from '../../context/AppThemeContext';
import { Colors } from '../../theme/yana';
import { initialsOf, kes } from '../../lib/moneyFormat';
import { INK, rgba } from '../theme/ThemedPage';

export type PaymentProcessMode =
  | 'school_fees'
  | 'school_pocket'
  | 'teacher_tip'
  | 'bursary'
  | 'school_event';

type Phase = 'form' | 'sending' | 'awaiting' | 'success' | 'failed' | 'pending';

type Quote = {
  amount_kes?: number;
  bank_app_charge_pct?: number;
  bank_app_charge_kes?: number;
  total_kes?: number;
  balance_kes?: number;
  breakdown?: Array<{ label: string; vote_head?: string; invoice_number?: string | null; amount: number }>;
};

/** Who the money goes to, shown on the form and on the outcome (teacher tip: name + photo). */
export type PaymentRecipient = {
  name: string;
  detail?: string | null;
  photoUrl?: string | null;
};

export type PaymentOutcome = {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  mpesaReceipt?: string;
  checkoutRequestId?: string;
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
  /** 'sheet': scroll body + pinned Pay button (use inside PaymentBottomSheet bare). Default 'inline'. */
  layout?: 'inline' | 'sheet';
  /** Shown on the form and the outcome (e.g. the teacher being tipped). */
  recipient?: PaymentRecipient | null;
  /** Fees: the outstanding balance, for the "Full balance" chip. */
  balance?: number | null;
  /** Called once the payment reaches an outcome. */
  onOutcome?: (outcome: PaymentOutcome) => void;
};

const PRESETS: Record<PaymentProcessMode, number[]> = {
  school_fees: [],
  school_pocket: [200, 500, 1000, 2000],
  teacher_tip: [100, 200, 500, 1000],
  bursary: [50, 100, 500, 1000],
  school_event: [],
};

function titleFor(mode: PaymentProcessMode, fallback: string): string {
  if (fallback) return fallback;
  if (mode === 'school_fees') return 'Pay school fees';
  if (mode === 'school_pocket') return 'Add pocket money';
  if (mode === 'teacher_tip') return 'Tip teacher';
  if (mode === 'school_event') return 'Pay for event';
  return 'Contribute to bursary';
}

function successNoun(mode: PaymentProcessMode): string {
  if (mode === 'teacher_tip') return 'Tip sent';
  if (mode === 'school_pocket') return 'Pocket money added';
  if (mode === 'bursary') return 'Thank you for giving';
  if (mode === 'school_event') return 'Event paid';
  return 'Fees paid';
}

/** "EXAM — Examinations & Assessment" → code "EXAM", name "Examinations & Assessment". */
function splitVoteHead(label: string): { code: string; name: string } {
  const m = String(label).match(/^\s*([A-Z0-9&]{2,6})\s*[—–-]\s*(.+)$/);
  return m ? { code: m[1]!, name: m[2]!.trim() } : { code: '', name: String(label).trim() };
}

const timeNow = () =>
  new Date().toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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
  layout = 'inline',
  recipient,
  balance,
  onOutcome,
}: Props) {
  const { palette } = useAppTheme();
  const [amount, setAmount] = useState(defaultAmount);
  const [phone, setPhone] = useState(defaultPhone);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [statusLine, setStatusLine] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fail, setFail] = useState<DarajaUserError | null>(null);
  const [mpesaReceipt, setMpesaReceipt] = useState<string | undefined>();
  const [receiptPosted, setReceiptPosted] = useState<boolean | null>(null);
  const [paidAt, setPaidAt] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [focus, setFocus] = useState<'amount' | 'phone' | null>(null);
  const cancelled = useRef(false);
  const checkoutRef = useRef('');
  const paidAmountRef = useRef(0);
  const receiptBefore = useRef<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const phoneY = useRef(0);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  // Elapsed seconds while waiting, so the wait never looks frozen.
  useEffect(() => {
    if (phase !== 'awaiting' && phase !== 'sending') return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const amountNum = Number(String(amount).replace(/[^\d.]/g, ''));

  useEffect(() => {
    if (phase !== 'form' && phase !== 'failed') return;
    if (!Number.isFinite(amountNum) || amountNum < 1) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    setQuoting(true);
    const t = setTimeout(() => {
      void quoteSchoolCollection({
        purpose: mode as SchoolCollectionPurpose,
        amount: amountNum,
        student_id: mode === 'school_fees' && studentId ? String(studentId) : undefined,
      })
        .then((q) => {
          if (!cancelled.current) setQuote(q);
        })
        .catch(() => {
          if (!cancelled.current) setQuote(null);
        })
        .finally(() => {
          if (!cancelled.current) setQuoting(false);
        });
    }, 350);
    return () => clearTimeout(t);
  }, [amountNum, mode, phase, studentId]);

  const hasNewReceipt = useCallback((): boolean => {
    const after = new Set(getReceiptIds?.() ?? []);
    for (const id of after) {
      if (id && !receiptBefore.current.has(id)) return true;
    }
    return false;
  }, [getReceiptIds]);

  const finishPaid = useCallback(
    async (st: MpesaTopUpStatus) => {
      const checkoutId = checkoutRef.current;
      setMpesaReceipt(st.mpesa_receipt);
      setPaidAt(timeNow());
      setStatusLine('Paid. Posting it to the school books…');
      try {
        const { deskFetch } = await import('../../lib/deskApi');
        await deskFetch('/accounts/collections/apply-completed', {
          method: 'POST',
          body: { checkout_request_id: checkoutId },
        });
      } catch {
        /* the M-Pesa callback posts it too; the refresh below shows whichever landed */
      }
      let posted: boolean | null = null;
      if (onRefresh) {
        try {
          await onRefresh();
          if (getReceiptIds) posted = hasNewReceipt();
        } catch {
          /* ignore */
        }
      }
      if (cancelled.current) return;
      setReceiptPosted(posted);
      setPhase('success');
      onOutcome?.({
        status: 'success',
        amount: paidAmountRef.current,
        mpesaReceipt: st.mpesa_receipt,
        checkoutRequestId: checkoutId,
      });
    },
    [getReceiptIds, hasNewReceipt, onOutcome, onRefresh],
  );

  /** Wait for M-Pesa's answer for this checkout (also used by "Check again"). */
  const waitForResult = useCallback(
    async (maxAttempts: number) => {
      const checkoutId = checkoutRef.current;
      setPhase('awaiting');
      setStatusLine('Check your phone and enter your M-Pesa PIN.');
      const st = await pollMpesaTopUpStatus(checkoutId, {
        intervalMs: 4000,
        maxAttempts,
        isCancelled: () => cancelled.current,
        onTick: (s) => {
          if (cancelled.current) return;
          if (s.status === 'pending' || s.status === 'unknown') {
            setStatusLine('Waiting for M-Pesa to confirm your PIN…');
          }
        },
      });
      if (cancelled.current) return;
      if (st.status === 'completed') {
        await finishPaid(st);
        return;
      }
      if (st.status === 'failed' || st.status === 'cancelled') {
        const f = darajaUserError(null, st.message || (st.status === 'cancelled' ? 'Request cancelled by user' : ''));
        setFail(
          st.status === 'cancelled'
            ? { ...f, title: 'Payment cancelled', message: st.message || 'You cancelled the M-Pesa prompt. Nothing was charged.' }
            : f,
        );
        setPhase('failed');
        onOutcome?.({ status: 'failed', amount: paidAmountRef.current, checkoutRequestId: checkoutId });
        return;
      }
      setPhase('pending');
      setStatusLine(
        'M-Pesa has not answered yet. If you entered your PIN, the money is on its way. Check again in a minute, or close: your statement updates by itself.',
      );
      onOutcome?.({ status: 'pending', amount: paidAmountRef.current, checkoutRequestId: checkoutId });
    },
    [finishPaid, onOutcome],
  );

  const runStkFlow = async () => {
    const n = Math.round(amountNum);
    if (!Number.isFinite(n) || n < 1) {
      setFormError('Enter an amount of at least KES 1.');
      return;
    }
    const phoneErr = kenyaMobileError(phone);
    if (phoneErr) {
      setFormError(`${phoneErr} for the M-Pesa prompt, e.g. 0712 345 678.`);
      return;
    }

    setFormError(null);
    setFail(null);
    setMpesaReceipt(undefined);
    setReceiptPosted(null);
    receiptBefore.current = new Set((getReceiptIds?.() ?? []).filter(Boolean));
    paidAmountRef.current = n;
    setPhase('sending');
    setStatusLine('Sending the M-Pesa prompt to your phone…');

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
      if (!checkoutId) throw new Error('M-Pesa did not confirm the prompt. Try again.');
      checkoutRef.current = checkoutId;
      await waitForResult(30);
    } catch (e) {
      if (cancelled.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      const f = darajaUserError(null, msg);
      setFail({ ...f, message: msg || f.message });
      setPhase('failed');
    }
  };

  const presets = useMemo(() => {
    const base = PRESETS[mode];
    if (mode === 'school_fees' && balance && balance > 0) {
      const full = Math.round(balance);
      const half = Math.round(full / 2);
      return [
        { label: 'Full balance', value: full },
        ...(half >= 100 ? [{ label: 'Half', value: half }] : []),
      ];
    }
    return base.map((v) => ({ label: v.toLocaleString('en-KE'), value: v }));
  }, [mode, balance]);

  const showForm = phase === 'form' || phase === 'failed';
  const sheet = layout === 'sheet';
  const busy = phase === 'sending' || phase === 'awaiting';
  const total = quote?.total_kes != null ? Number(quote.total_kes) : null;
  const breakdown = (quote?.breakdown ?? []).filter((b) => Number(b.amount) > 0);
  const invoiceNos = [...new Set(breakdown.map((b) => b.invoice_number).filter(Boolean))] as string[];

  const header = (
    <View style={styles.headRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={2}>
          {titleFor(mode, title)}
        </Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {!busy ? (
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close payment" style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );

  const recipientCard = recipient ? (
    <View style={[styles.recipient, { backgroundColor: rgba(palette.primary, 0.05) }]}>
      <Avatar name={recipient.name} photoUrl={recipient.photoUrl} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.recipientName} numberOfLines={1}>
          {recipient.name}
        </Text>
        {recipient.detail ? (
          <Text style={styles.recipientDetail} numberOfLines={1}>
            {recipient.detail}
          </Text>
        ) : null}
      </View>
    </View>
  ) : null;

  const formBody = (
    <>
      {recipientCard}
      {phase === 'failed' && fail ? (
        <View style={styles.errorBox}>
          <View style={styles.errorHead}>
            <Ionicons name="close-circle" size={18} color="#B91C1C" />
            <Text style={styles.errorTitle}>{fail.title}</Text>
          </View>
          <Text style={styles.errorText}>{fail.message}</Text>
          {fail.tips?.length
            ? fail.tips.map((t) => (
                <Text key={t} style={styles.tipLine}>
                  • {t}
                </Text>
              ))
            : null}
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Amount</Text>
      <View
        style={[
          styles.amountBox,
          { borderColor: focus === 'amount' ? palette.primary : 'rgba(21,65,29,0.18)' },
        ]}>
        <Text style={[styles.amountPrefix, { color: palette.primary }]}>KES</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.mutedForeground}
          onFocus={() => setFocus('amount')}
          onBlur={() => setFocus(null)}
          returnKeyType="next"
          accessibilityLabel="Amount in shillings"
        />
      </View>
      {presets.length ? (
        <View style={styles.chips}>
          {presets.map((p) => {
            const on = Math.round(amountNum) === p.value;
            return (
              <Pressable
                key={p.label}
                onPress={() => setAmount(String(p.value))}
                style={[
                  styles.chip,
                  on
                    ? { backgroundColor: palette.primary, borderColor: palette.primary }
                    : { borderColor: rgba(palette.primary, 0.2) },
                ]}>
                <Text style={[styles.chipText, { color: on ? Colors.white : palette.primary }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View onLayout={(e) => (phoneY.current = e.nativeEvent.layout.y)}>
        <Text style={styles.fieldLabel}>M-Pesa number</Text>
        <View
          style={[
            styles.phoneBox,
            { borderColor: focus === 'phone' ? palette.primary : 'rgba(21,65,29,0.18)' },
          ]}>
          <Ionicons name="phone-portrait-outline" size={18} color={palette.primary} />
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="0712 345 678"
            placeholderTextColor={Colors.mutedForeground}
            onFocus={() => {
              setFocus('phone');
              if (sheet) setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, phoneY.current - 8), animated: true }), 280);
            }}
            onBlur={() => setFocus(null)}
            accessibilityLabel="M-Pesa phone number"
          />
        </View>
        <Text style={styles.hint}>The prompt goes to this phone. Enter your PIN there.</Text>
      </View>

      {mode === 'school_fees' && breakdown.length ? (
        <View style={styles.voteCard}>
          <View style={styles.voteHead}>
            <Text style={styles.voteTitle}>This payment clears</Text>
            {invoiceNos.length === 1 ? <Text style={styles.voteMeta}>{invoiceNos[0]}</Text> : null}
          </View>
          {breakdown.map((b, i) => {
            const { code, name } = splitVoteHead(b.label || b.vote_head || 'Fees');
            return (
              <View key={`${b.label}-${i}`} style={[styles.voteRow, i < breakdown.length - 1 && styles.voteDivider]}>
                {code ? (
                  <View style={[styles.voteCode, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                    <Text style={[styles.voteCodeText, { color: palette.primary }]} numberOfLines={1}>
                      {code}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.voteLabel} numberOfLines={2}>
                    {name}
                  </Text>
                  {invoiceNos.length > 1 && b.invoice_number ? <Text style={styles.voteMeta}>{b.invoice_number}</Text> : null}
                </View>
                <Text style={styles.voteAmt}>{kes(b.amount)}</Text>
              </View>
            );
          })}
          <View style={[styles.voteRow, styles.voteTotalRow]}>
            <Text style={[styles.voteLabel, { flex: 1, fontWeight: '800' }]}>Total to fees</Text>
            <Text style={[styles.voteAmt, { fontWeight: '800' }]}>
              {kes(breakdown.reduce((s, b) => s + (Number(b.amount) || 0), 0))}
            </Text>
          </View>
        </View>
      ) : null}

      {total != null ? (
        <View style={[styles.chargeBox, { backgroundColor: rgba(palette.primary, 0.05) }]}>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Amount</Text>
            <Text style={styles.chargeVal}>{kes(quote?.amount_kes ?? amountNum)}</Text>
          </View>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Bank & app charge</Text>
            <Text style={styles.chargeVal}>{kes(quote?.bank_app_charge_kes ?? 0)}</Text>
          </View>
          <View style={[styles.chargeRow, styles.chargeTotalRow]}>
            <Text style={[styles.chargeTotalLabel, { color: palette.primary }]}>You pay</Text>
            <Text style={[styles.chargeTotalVal, { color: palette.primary }]}>{kes(total)}</Text>
          </View>
        </View>
      ) : amountNum >= 1 && quoting ? (
        <Text style={styles.meta}>Working out the charge…</Text>
      ) : null}

      {formError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      ) : null}
    </>
  );

  const payLabel =
    phase === 'failed'
      ? 'Try again'
      : total != null
        ? `Pay ${kes(total)}`
        : amountNum >= 1
          ? `Pay ${kes(amountNum)}`
          : 'Pay with M-Pesa';

  const footer = (
    <View style={[styles.actions, sheet && styles.actionsSheet]}>
      <Pressable style={styles.secondaryBtn} onPress={onClose} accessibilityRole="button">
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.primaryBtn, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => void runStkFlow()}
        accessibilityRole="button">
        <Ionicons name="phone-portrait" size={16} color={palette.secondary} />
        <Text style={styles.primaryBtnText} numberOfLines={1}>
          {payLabel}
        </Text>
      </Pressable>
    </View>
  );

  const outcome = (
    <OutcomeView
      phase={phase}
      mode={mode}
      statusLine={statusLine}
      elapsed={elapsed}
      amount={paidAmountRef.current}
      mpesaReceipt={mpesaReceipt}
      receiptPosted={receiptPosted}
      paidAt={paidAt}
      phone={phone}
      recipient={recipient}
      onCheckAgain={() => void waitForResult(8)}
      onClose={onClose}
    />
  );

  if (sheet) {
    return (
      <View style={styles.sheetRoot}>
        {header}
        {showForm ? (
          <>
            <ScrollView
              ref={scrollRef}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {formBody}
            </ScrollView>
            {footer}
          </>
        ) : (
          <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
            {outcome}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.inlineRoot}>
      {header}
      {showForm ? (
        <>
          {formBody}
          {footer}
        </>
      ) : (
        outcome
      )}
    </View>
  );
}

function Avatar({ name, photoUrl, size }: { name: string; photoUrl?: string | null; size: number }) {
  const { palette } = useAppTheme();
  const [broken, setBroken] = useState(false);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {photoUrl && !broken ? (
        <Image source={{ uri: photoUrl }} style={{ width: size, height: size }} onError={() => setBroken(true)} />
      ) : (
        <Text style={{ color: palette.secondary, fontWeight: '800', fontSize: size * 0.36 }}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

function OutcomeView({
  phase,
  mode,
  statusLine,
  elapsed,
  amount,
  mpesaReceipt,
  receiptPosted,
  paidAt,
  phone,
  recipient,
  onCheckAgain,
  onClose,
}: {
  phase: Phase;
  mode: PaymentProcessMode;
  statusLine: string;
  elapsed: number;
  amount: number;
  mpesaReceipt?: string;
  receiptPosted: boolean | null;
  paidAt: string;
  phone: string;
  recipient?: PaymentRecipient | null;
  onCheckAgain: () => void;
  onClose: () => void;
}) {
  const { palette } = useAppTheme();
  const waiting = phase === 'sending' || phase === 'awaiting';
  const steps = [
    { label: 'Prompt sent to your phone', done: phase !== 'sending', current: phase === 'sending' },
    {
      label: 'You enter your M-Pesa PIN',
      done: phase === 'success',
      current: phase === 'awaiting' || phase === 'pending',
    },
    { label: 'M-Pesa confirms the payment', done: phase === 'success', current: false },
  ];

  if (phase === 'success') {
    return (
      <View style={styles.outcome}>
        <View style={[styles.outcomeIcon, { backgroundColor: 'rgba(21,128,61,0.12)' }]}>
          <Ionicons name="checkmark-circle" size={44} color="#15803D" />
        </View>
        <Text style={styles.outcomeTitle}>{successNoun(mode)}</Text>
        <Text style={styles.outcomeAmount}>{kes(amount)}</Text>
        {recipient ? (
          <Text style={styles.outcomeBody}>
            {mode === 'teacher_tip' ? 'to ' : 'for '}
            <Text style={{ fontWeight: '800', color: INK }}>{recipient.name}</Text>
          </Text>
        ) : null}
        <View style={styles.receiptCard}>
          <ReceiptLine label="Status" value="Paid" valueColor="#15803D" />
          <ReceiptLine label="M-Pesa receipt" value={mpesaReceipt || 'Sent to you by SMS'} mono={Boolean(mpesaReceipt)} />
          <ReceiptLine label="Amount" value={kes(amount)} />
          {recipient ? <ReceiptLine label={mode === 'teacher_tip' ? 'Teacher' : 'For'} value={recipient.name} /> : null}
          <ReceiptLine label="Paid from" value={phone.trim() || '—'} />
          <ReceiptLine label="When" value={paidAt} last />
        </View>
        <Text style={styles.outcomeNote}>
          {mode === 'teacher_tip'
            ? 'The teacher gets your tip through the school. M-Pesa also sends you an SMS.'
            : mode === 'bursary'
              ? 'Your gift is in the school bursary kitty.'
              : receiptPosted === false
                ? 'The school receipt shows on your statement in a few minutes.'
                : 'Your statement is updated.'}
        </Text>
        <Pressable style={[styles.primaryBtn, styles.fullBtn, { backgroundColor: palette.primary }]} onPress={onClose}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'pending') {
    return (
      <View style={styles.outcome}>
        <View style={[styles.outcomeIcon, { backgroundColor: rgba(palette.secondary, 0.2) }]}>
          <Ionicons name="time-outline" size={40} color={palette.tertiary} />
        </View>
        <Text style={styles.outcomeTitle}>Still waiting for M-Pesa</Text>
        <Text style={styles.outcomeAmount}>{kes(amount)}</Text>
        <Text style={styles.outcomeBody}>{statusLine}</Text>
        <View style={[styles.actions, { alignSelf: 'stretch', marginTop: 14 }]}>
          <Pressable style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Close</Text>
          </Pressable>
          <Pressable style={[styles.primaryBtn, { backgroundColor: palette.primary }]} onPress={onCheckAgain}>
            <Ionicons name="refresh" size={16} color={palette.secondary} />
            <Text style={styles.primaryBtnText}>Check again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // sending / awaiting
  return (
    <View style={styles.outcome}>
      <View style={[styles.outcomeIcon, { backgroundColor: rgba(palette.primary, 0.08) }]}>
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
      <Text style={styles.outcomeTitle}>{phase === 'sending' ? 'Sending prompt…' : 'Enter your PIN on your phone'}</Text>
      <Text style={styles.outcomeAmount}>{kes(amount)}</Text>
      {recipient ? (
        <Text style={styles.outcomeBody}>
          {mode === 'teacher_tip' ? 'Tip for ' : 'For '}
          <Text style={{ fontWeight: '800', color: INK }}>{recipient.name}</Text>
        </Text>
      ) : null}
      <Text style={styles.outcomeBody}>{statusLine}</Text>
      <View style={styles.stepList}>
        {steps.map((s) => (
          <View key={s.label} style={styles.stepRow}>
            <Ionicons
              name={s.done ? 'checkmark-circle' : s.current ? 'radio-button-on' : 'ellipse-outline'}
              size={18}
              color={s.done ? '#15803D' : s.current ? palette.primary : Colors.mutedForeground}
            />
            <Text style={[styles.stepText, (s.done || s.current) && { color: INK, fontWeight: '700' }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      {waiting ? (
        <Text style={styles.elapsed}>
          {elapsed}s · keep this open until M-Pesa answers
        </Text>
      ) : null}
    </View>
  );
}

function ReceiptLine({
  label,
  value,
  valueColor,
  mono,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.rLine, !last && styles.rDivider]}>
      <Text style={styles.rLabel}>{label}</Text>
      <Text
        style={[styles.rValue, valueColor ? { color: valueColor } : null, mono && { letterSpacing: 0.8 }]}
        numberOfLines={1}
        selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineRoot: { gap: 10 },
  sheetRoot: { flexShrink: 1 },
  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  sheetScrollContent: { gap: 10, paddingBottom: 6 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  title: { fontSize: 18, fontWeight: '800', color: INK },
  sub: { marginTop: 3, fontSize: 13, color: Colors.mutedForeground },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 10 },
  recipientName: { fontSize: 15, fontWeight: '800', color: INK },
  recipientDetail: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, marginTop: 2 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  amountPrefix: { fontSize: 16, fontWeight: '800', marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    color: INK,
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  phoneInput: { flex: 1, fontSize: 17, fontWeight: '600', color: INK, paddingVertical: 11 },
  hint: { marginTop: 4, fontSize: 11, color: Colors.mutedForeground },
  voteCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  voteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  voteCode: { minWidth: 44, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8, alignItems: 'center' },
  voteCodeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  voteTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
    marginBottom: 2,
  },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  voteDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  voteTotalRow: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.12)' },
  voteLabel: { fontSize: 14, fontWeight: '600', color: INK },
  voteMeta: { marginTop: 1, fontSize: 11, color: Colors.mutedForeground },
  voteAmt: { fontSize: 14, fontWeight: '700', color: INK, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chargeBox: { borderRadius: 14, padding: 12, gap: 6 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  chargeLabel: { fontSize: 13, color: Colors.mutedForeground },
  chargeVal: { fontSize: 13, color: INK, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chargeTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(21,65,29,0.25)',
  },
  chargeTotalLabel: { fontSize: 15, fontWeight: '800' },
  chargeTotalVal: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  meta: { fontSize: 12, color: Colors.mutedForeground },
  errorBox: { borderRadius: 12, padding: 12, backgroundColor: 'rgba(185,28,28,0.07)', gap: 4 },
  errorHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  errorText: { fontSize: 13, color: '#991B1B', lineHeight: 18 },
  tipLine: { fontSize: 12, color: '#7F1D1D' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionsSheet: {
    paddingTop: 10,
    marginTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  fullBtn: { alignSelf: 'stretch', flex: 0, marginTop: 14 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    paddingHorizontal: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.2)',
  },
  secondaryBtnText: { color: INK, fontWeight: '700' },
  outcome: { alignItems: 'center', paddingVertical: 8, gap: 6 },
  outcomeIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  outcomeTitle: { fontSize: 19, fontWeight: '800', color: INK, textAlign: 'center' },
  outcomeAmount: { fontSize: 26, fontWeight: '800', color: INK, fontVariant: ['tabular-nums'] },
  outcomeBody: { fontSize: 13, lineHeight: 19, color: Colors.mutedForeground, textAlign: 'center', paddingHorizontal: 6 },
  outcomeNote: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground, textAlign: 'center', marginTop: 8 },
  receiptCard: {
    alignSelf: 'stretch',
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 12,
  },
  rLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  rLabel: { fontSize: 13, color: Colors.mutedForeground },
  rValue: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: INK, textAlign: 'right' },
  stepList: { alignSelf: 'stretch', marginTop: 12, gap: 10, paddingHorizontal: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepText: { fontSize: 14, color: Colors.mutedForeground },
  elapsed: { marginTop: 10, fontSize: 12, color: Colors.mutedForeground },
});
