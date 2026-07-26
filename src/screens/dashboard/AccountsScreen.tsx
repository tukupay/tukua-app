import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardBackground, GreenPattern } from '../../components/dashboard/DashboardBackground';
import { GlassPanel } from '../../components/dashboard/Glass';
import { ModuleBackBar, ModuleEmpty, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  fetchParentAccountsStatement,
  fetchParentPocketMoney,
} from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Accounts'>;

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

function formatReceiptBody(r: ReceiptRow, studentName?: string | null): string {
  const num = String(r.receipt_number ?? r.id ?? '—');
  const date = String(r.created_at ?? r.receipt_date ?? '').slice(0, 10) || '—';
  const method = String(r.payment_method ?? r.method ?? '—');
  const amount = kes(Number(r.amount ?? 0));
  const narr = String(r.narration ?? r.description ?? r.notes ?? '').trim();
  const lines = [
    'TUKUA / SCHOOL FEE RECEIPT',
    '────────────────────────',
    `Receipt #: ${num}`,
    `Date: ${date}`,
    `Student: ${studentName || String(r.student_id ?? '—')}`,
    `Amount: ${amount}`,
    `Method: ${method}`,
  ];
  if (narr) lines.push(`Notes: ${narr}`);
  lines.push('────────────────────────', 'Generated from Tukua parent portal.');
  return lines.join('\n');
}

export function AccountsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const [feeCards, setFeeCards] = useState<FeeCard[]>([]);
  const [pockets, setPockets] = useState<PocketCard[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [receiptPage, setReceiptPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialWarn, setPartialWarn] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<ReceiptRow | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      setPartialWarn(null);
      try {
        const sid = selectedStudentId ?? undefined;
        const [accountsRes, pocketRes] = await Promise.allSettled([
          fetchParentAccountsStatement(sid),
          fetchParentPocketMoney(sid),
        ]);

        let accountsErr: string | null = null;
        let pocketErr: string | null = null;

        if (accountsRes.status === 'fulfilled') {
          const accounts = accountsRes.value;
          const raw = accounts?.balances ?? [];
          const byStudent = new Map<string, FeeCard>();
          for (const b of raw) {
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
              existing.years.push({ financial_year: fy, balance: bal });
              existing.total += bal;
            }
          }
          setFeeCards([...byStudent.values()]);
          setReceipts(accounts?.receipts ?? []);
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
          const wallets = pocketRes.value?.wallets ?? [];
          setPockets(
            wallets.map((w) => ({
              student_id: String(w.student_id ?? ''),
              admission_number: w.admission_number,
              balance: Number(w.balance ?? 0) || 0,
            })),
          );
        } else {
          pocketErr =
            pocketRes.reason instanceof Error
              ? pocketRes.reason.message
              : String(pocketRes.reason);
          setPockets([]);
        }

        if (accountsErr && pocketErr) setError(accountsErr);
        else if (accountsErr || pocketErr) setPartialWarn(accountsErr || pocketErr);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Accounts', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId, selectedStudent?.name],
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
    showDialog({
      title: 'Pay fee balance',
      message: 'Fee payment will connect to Tukua Pay soon. Balance is shown for planning.',
      variant: 'info',
      icon: 'card-outline',
    });
  };

  const onAddPocket = () => {
    showDialog({
      title: 'Add pocket money',
      message: 'Top-up will connect to Tukua Pay soon.',
      variant: 'info',
      icon: 'wallet-outline',
    });
  };

  const downloadReceipt = async (r: ReceiptRow) => {
    try {
      const body = formatReceiptBody(r, selectedStudent?.name);
      await Share.share({
        title: `Receipt ${String(r.receipt_number ?? r.id ?? '')}`,
        message: body,
      });
    } catch (e) {
      log.warn('Accounts', 'receipt share failed', String(e));
      showDialog({
        title: 'Could not share',
        message: e instanceof Error ? e.message : String(e),
        variant: 'warning',
      });
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
        <Text style={styles.title}>Fees & pocket money</Text>
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `For ${selectedStudent.name}`
            : 'Balances and receipts for the selected student.'}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error ? (
          <ModuleEmpty title="Could not load accounts" body={error} onRetry={() => void load()} />
        ) : (
          <>
            {partialWarn ? <Text style={styles.warn}>{partialWarn}</Text> : null}

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
              <Pressable style={styles.primaryBtn} onPress={onPayFees}>
                <Ionicons name="card" size={16} color={Colors.white} />
                <Text style={styles.primaryBtnText}>Pay fees</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={onAddPocket}>
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
                          onPress={() => setViewReceipt(r)}
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
        )}
      </ScrollView>

      <Modal
        visible={viewReceipt != null}
        transparent
        animationType="slide"
        onRequestClose={() => setViewReceipt(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setViewReceipt(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Receipt</Text>
            {viewReceipt ? (
              <>
                <Text style={styles.modalLine}>
                  #{String(viewReceipt.receipt_number ?? viewReceipt.id ?? '—')}
                </Text>
                <Text style={styles.modalMeta}>
                  {String(viewReceipt.created_at ?? viewReceipt.receipt_date ?? '').slice(0, 10) ||
                    '—'}
                </Text>
                <Text style={styles.modalAmount}>{kes(Number(viewReceipt.amount ?? 0))}</Text>
                <Text style={styles.modalMeta}>
                  Method ·{' '}
                  {String(viewReceipt.payment_method ?? viewReceipt.method ?? '—')}
                </Text>
                {selectedStudent?.name ? (
                  <Text style={styles.modalMeta}>Student · {selectedStudent.name}</Text>
                ) : null}
                {String(viewReceipt.narration ?? viewReceipt.description ?? '').trim() ? (
                  <Text style={styles.modalNotes}>
                    {String(viewReceipt.narration ?? viewReceipt.description)}
                  </Text>
                ) : null}
                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => void downloadReceipt(viewReceipt)}>
                    <Ionicons name="download-outline" size={16} color={Colors.white} />
                    <Text style={styles.primaryBtnText}>Download / share</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={() => setViewReceipt(null)}>
                    <Text style={styles.secondaryBtnText}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
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
  actionRow: { flexDirection: 'row', gap: 10 },
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
    gap: 6,
  },
  modalTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: Colors.mutedForeground },
  modalLine: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  modalMeta: { fontSize: 13, color: Colors.mutedForeground },
  modalAmount: { marginTop: 8, fontSize: 28, fontWeight: '800', color: HERO_GREEN },
  modalNotes: { marginTop: 8, fontSize: 14, lineHeight: 20, color: Colors.ink },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
