import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardBackground, GreenPattern } from '../../components/dashboard/DashboardBackground';
import { GlassPanel } from '../../components/dashboard/Glass';
import { ModuleTabPager } from '../../components/dashboard/ModuleTabPager';
import { PaymentBottomSheet } from '../../components/dashboard/PaymentBottomSheet';
import { PaymentProcessCard } from '../../components/dashboard/PaymentProcessCard';
import { ModuleBackBar, ModuleScreenHeader, ModuleEmpty, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useAuth } from '../../context/AuthContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  createParentPaymentSlip,
  fetchParentAccountsStatement,
  fetchParentInvoices,
  fetchParentPaymentSlips,
  fetchParentPocketMoney,
  ParentInvoice,
  ParentPaymentSlip,
} from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchStudentFees, type StudentFeeBalance } from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Accounts'>;

type MoneyTab = 'fees' | 'invoices' | 'slips';

function defaultMpesaPhone(profilePhone?: string | null): string {
  const raw = String(profilePhone ?? '').trim();
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) return `0${digits.slice(3, 12)}`;
  if (digits.length >= 9) return digits.startsWith('0') ? digits.slice(0, 10) : `0${digits.slice(-9)}`;
  return raw;
}

type FeeYearRow = {
  financial_year: string | null;
  balance: number;
};

type FeeCard = {
  student_id: string;
  student_name: string;
  admission_number?: string | null;
  years: FeeYearRow[];
  total: number;
};

type PocketCard = {
  student_id: string;
  admission_number?: string | null;
  balance: number;
};

type ReceiptRow = Record<string, unknown>;

const HERO_GREEN = '#15411D';
const RECEIPT_PAGE = 8;

function kes(n: number | undefined | null): string {
  const v = Number(n ?? 0) || 0;
  return `KES ${v.toLocaleString()}`;
}

function yearLabel(raw: string | null): string {
  if (!raw) return 'Current year';
  if (/^[0-9a-f-]{36}$/i.test(raw)) return `FY ${raw.slice(0, 8)}`;
  return raw;
}

export function AccountsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { selectedStudentId, selectedStudent, selectedSchool, persona } = useDeskAuth();
  const { showDialog } = useDialog();
  const [feeCards, setFeeCards] = useState<FeeCard[]>([]);
  const [pockets, setPockets] = useState<PocketCard[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [receiptPage, setReceiptPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialWarn, setPartialWarn] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<ParentInvoice[]>([]);
  const [slips, setSlips] = useState<ParentPaymentSlip[]>([]);
  const [slipModal, setSlipModal] = useState(false);
  const [slipFileUri, setSlipFileUri] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [moneyTab, setMoneyTab] = useState<MoneyTab>('fees');
  const [payForm, setPayForm] = useState<'fees' | 'pocket' | 'tip' | null>(null);
  const [payAmountSeed, setPayAmountSeed] = useState('');
  const [payPhone, setPayPhone] = useState(() => defaultMpesaPhone(profile?.phone));
  const [studentFees, setStudentFees] = useState<StudentFeeBalance | null>(null);
  const [studentFeesLoading, setStudentFeesLoading] = useState(false);

  useEffect(() => {
    const next = defaultMpesaPhone(profile?.phone);
    if (next) setPayPhone((prev) => (prev.trim() ? prev : next));
  }, [profile?.phone]);

  useEffect(() => {
    if (persona !== 'student') return;
    setStudentFeesLoading(true);
    void fetchStudentFees()
      .then(setStudentFees)
      .finally(() => setStudentFeesLoading(false));
  }, [persona]);

  const load = useCallback(
    async (soft = false) => {
      if (persona === 'student') {
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setFeeCards([]);
        setPockets([]);
        setInvoices([]);
        setSlips([]);
        setReceipts([]);
        return;
      }
      if (!soft) setLoading(true);
      setError(null);
      setPartialWarn(null);
      try {
        const sid = selectedStudentId ?? undefined;
        const [accountsRes, pocketRes, invoicesRes, slipsRes] = await Promise.allSettled([
          fetchParentAccountsStatement(sid),
          fetchParentPocketMoney(sid),
          fetchParentInvoices(sid),
          fetchParentPaymentSlips(sid),
        ]);

        let accountsErr: string | null = null;
        let pocketErr: string | null = null;
        let invoicesErr: string | null = null;
        let slipsErr: string | null = null;

        if (accountsRes.status === 'fulfilled') {
          const accounts = accountsRes.value;
          const raw = Array.isArray(accounts?.balances) ? accounts.balances : [];
          // Prefer one FY per student (calendar year e.g. "2026") — never sum all FY rows
          // (that inflated mobile totals e.g. 32945+13550+7268 = 53763).
          const yearNow = String(new Date().getFullYear());
          const scoreFy = (fy: string | null | undefined) => {
            const s = String(fy ?? '');
            if (s === yearNow) return 3;
            if (/^\d{4}$/.test(s)) return 2;
            return 1;
          };
          const byStudent = new Map<string, FeeCard>();
          for (const b of raw) {
            if (!b || typeof b !== 'object') continue;
            const id = String(b.student_id ?? '').trim() || 'unknown';
            const bal = Number(b.balance ?? 0) || 0;
            const fy = (b as { financial_year?: string | null }).financial_year ?? null;
            const existing = byStudent.get(id);
            if (!existing) {
              byStudent.set(id, {
                student_id: id,
                student_name: b.student_name || selectedStudent?.name || 'Student',
                admission_number: (b as { admission_number?: string | null }).admission_number,
                years: [{ financial_year: fy, balance: bal }],
                total: bal,
              });
            } else {
              const prevFy = existing.years[0]?.financial_year ?? null;
              if (scoreFy(fy) > scoreFy(prevFy)) {
                existing.years = [{ financial_year: fy, balance: bal }];
                existing.total = bal;
              }
            }
          }
          setFeeCards([...byStudent.values()]);
          setReceipts(Array.isArray(accounts?.receipts) ? accounts.receipts : []);
          setReceiptPage(0);
        } else {
          accountsErr =
            accountsRes.reason instanceof Error
              ? accountsRes.reason.message
              : String(accountsRes.reason);
          setFeeCards([]);
          setReceipts([]);
        }

        if (pocketRes.status === 'fulfilled') {
          const wallets = Array.isArray(pocketRes.value?.wallets) ? pocketRes.value.wallets : [];
          setPockets(
            wallets.map((w) => ({
              student_id: String(w?.student_id ?? ''),
              admission_number: w?.admission_number,
              balance: Number(w?.balance ?? 0) || 0,
            })),
          );
        } else {
          pocketErr =
            pocketRes.reason instanceof Error
              ? pocketRes.reason.message
              : String(pocketRes.reason);
          setPockets([]);
        }

        if (invoicesRes.status === 'fulfilled') {
          setInvoices(invoicesRes.value?.invoices ?? []);
        } else {
          invoicesErr =
            invoicesRes.reason instanceof Error
              ? invoicesRes.reason.message
              : String(invoicesRes.reason);
          setInvoices([]);
        }

        if (slipsRes.status === 'fulfilled') {
          setSlips(slipsRes.value?.slips ?? []);
        } else {
          slipsErr =
            slipsRes.reason instanceof Error ? slipsRes.reason.message : String(slipsRes.reason);
          setSlips([]);
        }

        const errs = [accountsErr, pocketErr, invoicesErr, slipsErr].filter(Boolean);
        if (errs.length >= 3) setError(errs[0] ?? 'Could not load accounts');
        else if (errs.length) setPartialWarn(errs[0] ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Accounts', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [persona, selectedStudentId, selectedStudent?.name],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const feeTotal = useMemo(
    () => feeCards.reduce((sum, c) => sum + c.total, 0),
    [feeCards],
  );
  const pocketTotal = useMemo(
    () => pockets.reduce((sum, w) => sum + w.balance, 0),
    [pockets],
  );
  const combined = feeTotal + pocketTotal;

  const receiptPages = Math.max(1, Math.ceil(receipts.length / RECEIPT_PAGE));
  const pageReceipts = useMemo(() => {
    const start = receiptPage * RECEIPT_PAGE;
    return receipts.slice(start, start + RECEIPT_PAGE);
  }, [receipts, receiptPage]);

  const onPayFees = () => {
    setPayAmountSeed(feeTotal > 0 ? String(Math.round(feeTotal)) : '');
    setPayPhone((p) => p.trim() || defaultMpesaPhone(profile?.phone));
    setPayForm('fees');
  };

  const onAddPocket = () => {
    setPayAmountSeed('');
    setPayPhone((p) => p.trim() || defaultMpesaPhone(profile?.phone));
    setPayForm('pocket');
  };

  const getReceiptIds = useCallback(
    () =>
      receipts
        .map((r) => String(r?.id ?? r?.receipt_number ?? '').trim())
        .filter(Boolean),
    [receipts],
  );

  const openReceiptView = (r: ReceiptRow) => {
    navigation.navigate('ReceiptView', {
      receipt: r,
      studentName: selectedStudent?.name,
      schoolName: selectedSchool?.name,
      admissionNumber: selectedStudent?.admissionNumber,
      className: selectedStudent?.className,
    });
  };

  const resetSlipForm = () => {
    setSlipFileUri(null);
    setSlipFileName(null);
  };

  const pickSlipImage = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setSlipFileUri(asset.uri);
      setSlipFileName(asset.name || 'bank-slip.jpg');
    } catch (e) {
      showDialog({
        title: 'Could not open photo',
        message: e instanceof Error ? e.message : String(e),
        variant: 'warning',
      });
    }
  };

  const submitSlip = async () => {
    if (!slipFileUri) {
      showDialog({
        title: 'Attach slip photo',
        message: 'Upload a clear photo of the bank slip. Amount can be read by school AI / bursar.',
        variant: 'warning',
      });
      return;
    }
    setSubmittingSlip(true);
    try {
      let file_url: string | undefined;
      try {
        const b64 = await FileSystem.readAsStringAsync(slipFileUri, {
          encoding: 'base64',
        });
        file_url = `data:image/jpeg;base64,${b64}`;
      } catch {
        file_url = slipFileUri;
      }
      await createParentPaymentSlip({
        student_id: selectedStudentId ?? undefined,
        file_url,
        file_name: slipFileName || 'bank-slip.jpg',
      });
      resetSlipForm();
      setSlipModal(false);
      showDialog({
        title: 'Submitted',
        message: 'Your bank slip photo is pending bursar approval before fees are posted.',
        variant: 'success',
      });
      await load(true);
    } catch (e) {
      showDialog({
        title: 'Could not submit',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setSubmittingSlip(false);
    }
  };

  const exportReceipts = useCallback(async () => {
    if (!receipts.length) {
      showDialog({
        title: 'Nothing to export',
        message: 'No receipts yet for this student.',
        variant: 'info',
      });
      return;
    }
    const header = 'receipt_number,amount,method,date,student_id';
    const lines = receipts.map((r) =>
      [
        String(r.receipt_number ?? r.id ?? ''),
        String(r.amount ?? ''),
        String(r.payment_method ?? r.method ?? ''),
        String(r.created_at ?? r.receipt_date ?? ''),
        String(r.student_id ?? selectedStudentId ?? ''),
      ]
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(','),
    );
    try {
      await Share.share({
        title: `Receipts ${selectedStudent?.name || ''}`.trim(),
        message: [header, ...lines].join('\n'),
      });
    } catch (e) {
      log.warn('Accounts', 'export failed', String(e));
    }
  }, [receipts, selectedStudent?.name, selectedStudentId, showDialog]);

  if (persona === 'student') {
    const balance = Number(studentFees?.balance ?? 0);
    return (
      <View style={styles.root}>
        <DashboardBackground patternOnly liquid />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: floatingHeaderInset(insets.top),
              paddingBottom: moduleScrollBottomPad(insets.bottom),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <ModuleBackBar onBack={() => navigation.goBack()} />
          <ModuleKicker>School fees</ModuleKicker>
          <ModuleScreenHeader
            title="Your fees"
            description="Read-only balance from the school ledger. M-Pesa pay stays on the parent app or office."
          />
          {studentFeesLoading ? (
            <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
          ) : studentFees ? (
            <GlassPanel tone="frost" radius={16} style={styles.tableCard}>
              <View style={styles.tableInner}>
                <Text style={styles.section}>Outstanding balance</Text>
                <Text style={[styles.heroStatValue, { color: Colors.brandGreenDark, fontSize: 28, marginTop: 4 }]}>
                  {kes(balance)}
                </Text>
                <Text style={styles.sub}>
                  FY {yearLabel(studentFees.financial_year ?? null)}
                  {studentFees.student_number ? ` · #${studentFees.student_number}` : ''}
                </Text>
                <Text style={[styles.sub, { marginTop: 12 }]}>
                  Invoiced {kes(studentFees.total_invoiced)} · Receipted {kes(studentFees.total_receipts)}
                </Text>
                {(studentFees.recent_receipts ?? []).length > 0 ? (
                  <>
                    <Text style={[styles.section, { marginTop: 16 }]}>Recent receipts</Text>
                    {(studentFees.recent_receipts ?? []).slice(0, 5).map((r, i) => (
                      <Text key={String(r.id ?? i)} style={styles.sub}>
                        {String(r.receipt_number ?? r.id ?? 'Receipt')} · {kes(Number(r.amount ?? 0))}
                      </Text>
                    ))}
                  </>
                ) : null}
              </View>
            </GlassPanel>
          ) : (
            <ModuleEmpty
              title="Balance unavailable"
              body="Could not load your fee ledger yet. Ask the bursar or a parent to check Accounts."
            />
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: floatingHeaderInset(insets.top),
            paddingBottom: moduleScrollBottomPad(insets.bottom),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>School fees</ModuleKicker>
        <ModuleScreenHeader title="Fees & pocket money" description="Pay fees, view invoices and pocket money." />
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `For ${selectedStudent.name}`
            : 'Balances and receipts for the selected student.'}
        </Text>

        <ModuleTabPager
          tabs={[
            { key: 'fees', label: 'Fees' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'slips', label: 'Bank slips' },
          ]}
          value={moneyTab}
          onChange={setMoneyTab}
          minHeight={320}
          renderPage={(key) => {
        if (loading) {
          return <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />;
        }
        if (error) {
          return <ModuleEmpty title="Could not load accounts" body={error} onRetry={() => void load()} />;
        }
        return (
          <>
            {partialWarn ? <Text style={styles.warn}>{partialWarn}</Text> : null}

            {key === 'fees' ? (
              <>
            {/* Same elevated green balance card as dashboard */}
            <View style={styles.heroElevate}>
              <View style={styles.heroCard}>
                <GreenPattern darker />
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(21,65,29,0.35)', 'rgba(0,109,105,0.55)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <View style={styles.heroHead}>
                    <View style={styles.heroIconBox}>
                      <Ionicons name="wallet" size={22} color={HERO_GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroKicker}>Total balance</Text>
                      <Text style={styles.heroValue}>{kes(combined)}</Text>
                      <Text style={styles.heroSub}>
                        {selectedStudent?.name || 'Student'} · fees + pocket
                      </Text>
                    </View>
                  </View>
                  <View style={styles.heroSplit}>
                    <Pressable style={styles.heroStat} onPress={onPayFees}>
                      <Text style={styles.heroStatLabel}>Fee balance</Text>
                      <Text style={styles.heroStatValue} numberOfLines={1}>
                        {kes(feeTotal)}
                      </Text>
                      <Text style={styles.heroStatSub} numberOfLines={1}>
                        Outstanding
                      </Text>
                    </Pressable>
                    <Pressable style={styles.heroStat} onPress={onAddPocket}>
                      <Text style={styles.heroStatLabel}>Pocket money</Text>
                      <Text style={styles.heroStatValue} numberOfLines={1}>
                        {kes(pocketTotal)}
                      </Text>
                      <Text style={styles.heroStatSub} numberOfLines={1}>
                        Wallet
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={[styles.primaryBtn, styles.actionFlex]} onPress={onPayFees}>
                <Ionicons name="card" size={16} color={Colors.white} />
                <Text style={styles.primaryBtnText}>Pay fees</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, styles.actionFlex]} onPress={onAddPocket}>
                <Ionicons name="add-circle" size={16} color={HERO_GREEN} />
                <Text style={styles.secondaryBtnText}>Add pocket</Text>
              </Pressable>
            </View>

            {feeCards.length > 1
              ? feeCards.map((card) => (
                  <GlassPanel key={card.student_id} tone="frost" radius={16}>
                    <View style={styles.detailInner}>
                      <Text style={styles.detailName}>{card.student_name}</Text>
                      <Text style={styles.detailAmt}>{kes(card.total)}</Text>
                      {card.years.map((y, i) => (
                        <Text key={`${card.student_id}-y-${i}`} style={styles.yearLine}>
                          {yearLabel(y.financial_year)} · {kes(y.balance)}
                        </Text>
                      ))}
                    </View>
                  </GlassPanel>
                ))
              : null}

            <View style={styles.receiptHead}>
              <Text style={[styles.section, { marginTop: 0, flex: 1 }]}>Recent receipts</Text>
              <Pressable style={styles.exportBtn} onPress={() => void exportReceipts()}>
                <Ionicons name="share-outline" size={16} color={HERO_GREEN} />
                <Text style={styles.exportText}>Export</Text>
              </Pressable>
            </View>

            {receipts.length === 0 ? (
              <Text style={styles.sub}>No receipts yet.</Text>
            ) : (
              <GlassPanel tone="frost" radius={16} style={styles.tableCard}>
                <View style={styles.tableInner}>
                  <View style={[styles.tr, styles.trHead]}>
                    <Text style={[styles.th, styles.colDate]}>Date</Text>
                    <Text style={[styles.th, styles.colAmt]}>Amount</Text>
                    <Text style={[styles.th, styles.colAct]}> </Text>
                  </View>
                  {pageReceipts.map((r, i) => {
                    const date = String(r.created_at ?? r.receipt_date ?? '').slice(0, 10);
                    return (
                      <View key={String(r.id ?? `${date}-${i}`)} style={styles.tr}>
                        <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                          {date || '—'}
                        </Text>
                        <Text style={[styles.td, styles.colAmt]} numberOfLines={1}>
                          {kes(Number(r.amount ?? 0))}
                        </Text>
                        <Pressable
                          style={styles.viewBtn}
                          onPress={() => openReceiptView(r)}
                          accessibilityRole="button"
                          accessibilityLabel="View receipt">
                          <Text style={styles.viewBtnText}>View</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                  <View style={styles.pager}>
                    <Pressable
                      style={[styles.pageBtn, receiptPage === 0 && styles.pageBtnDisabled]}
                      disabled={receiptPage === 0}
                      onPress={() => setReceiptPage((p) => Math.max(0, p - 1))}>
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={receiptPage === 0 ? Colors.mutedForeground : HERO_GREEN}
                      />
                    </Pressable>
                    <Text style={styles.pageLabel}>
                      {receiptPage + 1} / {receiptPages} · {receipts.length} total
                    </Text>
                    <Pressable
                      style={[
                        styles.pageBtn,
                        receiptPage >= receiptPages - 1 && styles.pageBtnDisabled,
                      ]}
                      disabled={receiptPage >= receiptPages - 1}
                      onPress={() =>
                        setReceiptPage((p) => Math.min(receiptPages - 1, p + 1))
                      }>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                          receiptPage >= receiptPages - 1
                            ? Colors.mutedForeground
                            : HERO_GREEN
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </GlassPanel>
            )}
              </>
            ) : null}

            {key === 'invoices' ? (
              <>
            <View style={styles.receiptHead}>
              <Text style={[styles.section, { marginTop: 0, flex: 1 }]}>Invoices</Text>
            </View>
            {invoices.length === 0 ? (
              <Text style={styles.sub}>No invoices yet.</Text>
            ) : (
              <GlassPanel tone="frost" radius={16} style={styles.tableCard}>
                <View style={styles.tableInner}>
                  {invoices.slice(0, 10).map((inv, i) => {
                    const date = String(inv.invoice_date ?? inv.due_date ?? '').slice(0, 10);
                    return (
                      <View key={String(inv.id ?? `inv-${i}`)} style={styles.tr}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.td} numberOfLines={1}>
                            {inv.invoice_number || inv.description || 'Invoice'}
                          </Text>
                          <Text style={styles.invMeta}>{date || '—'}</Text>
                        </View>
                        <Text style={[styles.td, styles.colAmt]} numberOfLines={1}>
                          {kes(Number(inv.amount ?? (inv as { total_amount?: number }).total_amount ?? inv.balance ?? 0))}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GlassPanel>
            )}
              </>
            ) : null}

            {key === 'slips' ? (
              <>
            <View style={styles.receiptHead}>
              <Text style={[styles.section, { marginTop: 0, flex: 1 }]}>Bank slips</Text>
              <Pressable
                style={styles.exportBtn}
                onPress={() => {
                  resetSlipForm();
                  setSlipModal(true);
                }}>
                <Ionicons name="camera-outline" size={16} color={HERO_GREEN} />
                <Text style={styles.exportText}>Upload photo</Text>
              </Pressable>
            </View>
            <Text style={styles.sub}>
              Photo only — no form. School AI / bursar reads amount from the slip image.
            </Text>
            {slips.length === 0 ? (
              <Text style={styles.sub}>No bank slips submitted yet.</Text>
            ) : (
              <GlassPanel tone="frost" radius={16} style={styles.tableCard}>
                <View style={styles.tableInner}>
                  {slips.slice(0, 10).map((s, i) => {
                    const date = String(s.created_at ?? s.paid_on ?? '').slice(0, 10);
                    const st = String(s.status ?? 'pending').replace(/_/g, ' ');
                    const amt = Number(s.amount ?? 0);
                    return (
                      <View key={String(s.id ?? `slip-${i}`)} style={styles.tr}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.td} numberOfLines={1}>
                            {s.file_name || s.bank_ref || 'Bank slip photo'}
                          </Text>
                          <Text style={styles.invMeta}>
                            {date} · {st}
                          </Text>
                        </View>
                        <Text style={[styles.td, styles.colAmt]} numberOfLines={1}>
                          {amt > 0 ? kes(amt) : 'Pending'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GlassPanel>
            )}
              </>
            ) : null}
          </>
        );
          }}
        />
      </ScrollView>

      <PaymentBottomSheet visible={payForm != null} onClose={() => setPayForm(null)}>
        {payForm ? (
          <PaymentProcessCard
            key={`${payForm}-${payAmountSeed}-${payPhone}`}
            mode={
              payForm === 'fees'
                ? 'school_fees'
                : payForm === 'pocket'
                  ? 'school_pocket'
                  : 'teacher_tip'
            }
            title={
              payForm === 'fees'
                ? 'Pay school fees'
                : payForm === 'pocket'
                  ? 'Add pocket money'
                  : 'Tip teacher'
            }
            subtitle={
              payForm === 'fees' && feeTotal > 0
                ? `Balance · ${kes(feeTotal)}`
                : selectedStudent?.name
                  ? `For ${selectedStudent.name}`
                  : undefined
            }
            defaultAmount={payAmountSeed}
            defaultPhone={payPhone}
            studentId={selectedStudentId}
            getReceiptIds={getReceiptIds}
            onRefresh={async () => {
              await load(true);
            }}
            onClose={() => setPayForm(null)}
          />
        ) : null}
      </PaymentBottomSheet>

      <Modal
        visible={slipModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSlipModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSlipModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Upload bank slip</Text>
            <Text style={styles.modalMeta}>
              Photo only. Amount and bank reference are read from the image by school AI / bursar —
              no form to fill.
            </Text>
            <Pressable style={styles.secondaryBtn} onPress={() => void pickSlipImage()}>
              <Ionicons name="camera-outline" size={16} color={HERO_GREEN} />
              <Text style={styles.secondaryBtnText}>
                {slipFileName || 'Choose slip photo'}
              </Text>
            </Pressable>
            {slipFileUri ? (
              <Image source={{ uri: slipFileUri }} style={styles.slipPreview} resizeMode="cover" />
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.primaryBtn, submittingSlip && { opacity: 0.6 }]}
                disabled={submittingSlip}
                onPress={() => void submitSlip()}>
                {submittingSlip ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Submit photo</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => {
                  resetSlipForm();
                  setSlipModal(false);
                }}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4 },
  warn: {
    fontSize: 13,
    color: Colors.orange,
    backgroundColor: 'rgba(232,93,4,0.08)',
    padding: 10,
    borderRadius: 10,
  },
  section: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  heroElevate: {
    borderRadius: 16,
    marginTop: 4,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 168,
  },
  heroContent: { padding: 16, zIndex: 1 },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
  },
  heroValue: { marginTop: 2, fontSize: 26, fontWeight: '800', color: Colors.white },
  heroSub: { marginTop: 2, fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  heroSplit: { flexDirection: 'row', gap: 8 },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 12,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  heroStatValue: { marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.white },
  heroStatSub: { marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },
  actionFlex: { flex: 1, justifyContent: 'center' },
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
  detailInner: { padding: 14, gap: 4 },
  detailName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  detailAmt: { fontSize: 20, fontWeight: '800', color: HERO_GREEN },
  yearLine: { fontSize: 12, color: Colors.mutedForeground },
  receiptHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  exportText: { fontSize: 13, fontWeight: '700', color: HERO_GREEN },
  tableCard: { overflow: 'hidden' },
  tableInner: { paddingVertical: 4, paddingHorizontal: 8 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  trHead: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
  },
  td: { fontSize: 13, color: Colors.ink, fontWeight: '600' },
  colDate: { flex: 1.1 },
  colAmt: { flex: 1 },
  colAct: { width: 56 },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(21,65,29,0.1)',
  },
  viewBtnText: { fontSize: 12, fontWeight: '800', color: HERO_GREEN },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pageBtn: { padding: 6 },
  pageBtnDisabled: { opacity: 0.35 },
  pageLabel: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  modalTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: Colors.mutedForeground },
  modalMeta: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  invMeta: { marginTop: 2, fontSize: 11, color: Colors.mutedForeground },
  slipPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});
