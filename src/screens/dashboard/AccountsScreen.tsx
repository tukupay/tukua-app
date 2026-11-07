import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackdrop, INK, rgba } from '../../components/theme/ThemedPage';
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
  PanelStat,
  SectionTitle,
  StateCard,
} from '../../components/dashboard/MoneyKit';
import { kes, shortDate, useWindowedList } from '../../lib/moneyFormat';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAuth } from '../../context/AuthContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { useAppTheme } from '../../context/AppThemeContext';
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
import { defaultMpesaPhone } from '../../lib/phoneUtils';
import { log } from '../../lib/logger';
import { fetchStudentFees, type StudentFeeBalance } from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Accounts'>;

type MoneyTab = 'receipts' | 'invoices' | 'pocket' | 'slips';

type Row = Record<string, unknown>;

type FeeCard = {
  student_id: string;
  student_name: string;
  year_name: string | null;
  balance: number;
};

const PAGE = 12;

/** Seeded rows carry a "[ACCOUNTS-SEED:…]" tag in front of the text: never show it. */
function clean(v: unknown): string {
  return String(v ?? '').replace(/^\s*\[[^\]]*\]\s*/, '').trim();
}

function yearLabel(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s || /^[0-9a-f-]{36}$/i.test(s)) return '';
  return s.replace(/^Financial Year\s*/i, 'FY ');
}

function methodLabel(raw: unknown): string {
  const s = String(raw ?? '').replace(/_/g, ' ').trim();
  if (!s) return '';
  if (/mpesa|mobile money/i.test(s)) return 'M-Pesa';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AccountsScreen({ navigation }: Props) {
  const { persona } = useDeskAuth();
  return persona === 'student' ? (
    <StudentFees onBack={() => navigation.goBack()} />
  ) : (
    <ParentAccounts navigation={navigation} />
  );
}

/** Student: read-only fee balance and recent receipts. */
function StudentFees({ onBack }: { onBack: () => void }) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const [fees, setFees] = useState<StudentFeeBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const row = await fetchStudentFees();
    setFees(row);
    setFailed(!row);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const receipts = (fees?.recent_receipts ?? []) as Row[];
  const win = useWindowedList(receipts, PAGE);

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <FlatList
        data={loading || failed ? [] : win.visible}
        keyExtractor={(r, i) => String(r.id ?? i)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        onEndReached={win.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={palette.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }}>
            <MoneyHeader title="Your fees" subtitle="Balance from the school's books" onBack={onBack} />
            {loading ? null : fees ? (
              <>
                <BalancePanel
                  kicker="Fee balance"
                  value={kes(fees.balance)}
                  line={[fees.student_name, yearLabel(fees.financial_year_name ?? fees.financial_year)].filter(Boolean).join(' · ')}>
                  <View style={styles.panelSplit}>
                    <PanelStat label="Billed" value={kes(fees.total_invoiced)} />
                    <PanelStat label="Paid" value={kes(fees.total_receipts)} />
                  </View>
                </BalancePanel>
                <Text style={styles.note}>
                  A parent pays fees from their Tukua app, or at the school office.
                </Text>
                {receipts.length ? <SectionTitle>Recent receipts</SectionTitle> : null}
              </>
            ) : null}
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={styles.rowCard}>
            <AmountRow
              icon="receipt-outline"
              iconTone="in"
              title={String(r.receipt_number ?? 'Receipt')}
              meta={[shortDate(r.created_at ?? r.receipt_date), methodLabel(r.payment_method)].filter(Boolean).join(' · ')}
              amount={kes(Number(r.amount ?? 0))}
              last
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton withPanel rows={4} />
          ) : failed ? (
            <StateCard
              tone="error"
              title="Could not load your fees"
              body="Check your connection and try again."
              onRetry={() => {
                setLoading(true);
                void load();
              }}
            />
          ) : (
            <StateCard icon="receipt-outline" title="No receipts yet" body="Payments the school records show here." />
          )
        }
        ListFooterComponent={<ListFooter hasMore={win.hasMore} total={loading ? 0 : win.total} noun="receipts" />}
      />
    </View>
  );
}

function ParentAccounts({ navigation }: { navigation: Props['navigation'] }) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const { profile } = useAuth();
  const { selectedStudentId, selectedStudent, selectedSchool } = useDeskAuth();
  const { showDialog } = useDialog();
  const [feeCards, setFeeCards] = useState<FeeCard[]>([]);
  const [pocketBalance, setPocketBalance] = useState(0);
  const [pocketTx, setPocketTx] = useState<Row[]>([]);
  const [receipts, setReceipts] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<ParentInvoice[]>([]);
  const [slips, setSlips] = useState<ParentPaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialWarn, setPartialWarn] = useState<string | null>(null);
  const [tab, setTab] = useState<MoneyTab>('receipts');
  const [openInvoice, setOpenInvoice] = useState<string | null>(null);
  const [slipModal, setSlipModal] = useState(false);
  const [slipFileUri, setSlipFileUri] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string | null>(null);
  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [payForm, setPayForm] = useState<'fees' | 'pocket' | null>(null);
  const [payAmountSeed, setPayAmountSeed] = useState('');
  const [payPhone, setPayPhone] = useState(() => defaultMpesaPhone(profile?.phone));

  useEffect(() => {
    const next = defaultMpesaPhone(profile?.phone);
    if (next) setPayPhone((prev) => (prev.trim() ? prev : next));
  }, [profile?.phone]);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      setPartialWarn(null);
      const sid = selectedStudentId ?? undefined;
      const [accountsRes, pocketRes, invoicesRes, slipsRes] = await Promise.allSettled([
        fetchParentAccountsStatement(sid),
        fetchParentPocketMoney(sid),
        fetchParentInvoices(sid),
        fetchParentPaymentSlips(sid),
      ]);
      const msg = (r: PromiseRejectedResult) => (r.reason instanceof Error ? r.reason.message : String(r.reason));
      const errs: string[] = [];

      if (accountsRes.status === 'fulfilled') {
        const raw = Array.isArray(accountsRes.value?.balances) ? accountsRes.value.balances : [];
        // One FY per learner (the current calendar year first): never add up all years' rows.
        const yearNow = String(new Date().getFullYear());
        const score = (b: Row) => {
          const s = `${b.financial_year_name ?? ''} ${b.financial_year ?? ''}`;
          return s.includes(yearNow) ? 3 : /\d{4}/.test(s) ? 2 : 1;
        };
        const byStudent = new Map<string, { row: Row; score: number }>();
        for (const b of raw as Row[]) {
          if (!b || typeof b !== 'object') continue;
          const id = String(b.student_id ?? '').trim() || 'unknown';
          const prev = byStudent.get(id);
          if (!prev || score(b) > prev.score) byStudent.set(id, { row: b, score: score(b) });
        }
        setFeeCards(
          [...byStudent.entries()].map(([id, { row }]) => ({
            student_id: id,
            student_name: String(row.student_name || selectedStudent?.name || 'Learner'),
            year_name: yearLabel((row.financial_year_name as string) ?? (row.financial_year as string)),
            balance: Number(row.balance ?? 0) || 0,
          })),
        );
        const rec = Array.isArray(accountsRes.value?.receipts) ? (accountsRes.value.receipts as Row[]) : [];
        setReceipts(
          [...rec].sort((a, b) =>
            String(b.receipt_date ?? b.created_at ?? '').localeCompare(String(a.receipt_date ?? a.created_at ?? '')),
          ),
        );
      } else {
        errs.push(msg(accountsRes));
        setFeeCards([]);
        setReceipts([]);
      }

      if (pocketRes.status === 'fulfilled') {
        const wallets = Array.isArray(pocketRes.value?.wallets) ? pocketRes.value.wallets : [];
        setPocketBalance(wallets.reduce((s, w) => s + (Number(w?.balance ?? 0) || 0), 0));
        setPocketTx(Array.isArray(pocketRes.value?.transactions) ? pocketRes.value.transactions : []);
      } else {
        errs.push(msg(pocketRes));
        setPocketBalance(0);
        setPocketTx([]);
      }

      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value?.invoices ?? []);
      else {
        errs.push(msg(invoicesRes));
        setInvoices([]);
      }

      if (slipsRes.status === 'fulfilled') setSlips(slipsRes.value?.slips ?? []);
      else {
        errs.push(msg(slipsRes));
        setSlips([]);
      }

      if (errs.length >= 3) setError(errs[0] ?? 'Could not load accounts');
      else if (errs.length) {
        log.warn('Accounts', errs[0]);
        setPartialWarn('Some of this page did not load. Pull down to try again.');
      }
      setLoading(false);
      setRefreshing(false);
    },
    [selectedStudentId, selectedStudent?.name],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const feeTotal = useMemo(() => feeCards.reduce((s, c) => s + c.balance, 0), [feeCards]);
  const learnerName = feeCards[0]?.student_name || selectedStudent?.name || 'your child';
  const yearName = feeCards[0]?.year_name || '';

  const rows: Row[] = useMemo(() => {
    if (tab === 'receipts') return receipts;
    if (tab === 'invoices') return invoices as Row[];
    if (tab === 'pocket') return pocketTx;
    return slips as Row[];
  }, [tab, receipts, invoices, pocketTx, slips]);
  const win = useWindowedList(rows, PAGE);

  const getReceiptIds = useCallback(
    () => receipts.map((r) => String(r?.id ?? r?.receipt_number ?? '').trim()).filter(Boolean),
    [receipts],
  );

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

  const openReceiptView = (r: Row) => {
    navigation.navigate('ReceiptView', {
      receipt: r,
      studentName: learnerName,
      schoolName: selectedSchool?.name,
      admissionNumber: selectedStudent?.admissionNumber,
      className: selectedStudent?.className,
    });
  };

  const pickSlipImage = async () => {
    try {
      // Re-encoded JPEG (quality 0.7): a full-size phone photo sent as base64 would pass the API's 12 MB limit.
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setSlipFileUri(asset.uri);
      setSlipFileName(asset.fileName || 'bank-slip.jpg');
    } catch (e) {
      showDialog({
        title: 'Could not open photo',
        message: e instanceof Error ? e.message : String(e),
        variant: 'warning',
      });
    }
  };

  const resetSlipForm = () => {
    setSlipFileUri(null);
    setSlipFileName(null);
  };

  const submitSlip = async () => {
    if (!slipFileUri) {
      showDialog({
        title: 'Attach slip photo',
        message: 'Upload a clear photo of the bank slip. The bursar reads the amount from it.',
        variant: 'warning',
      });
      return;
    }
    setSubmittingSlip(true);
    try {
      let file_url: string | undefined;
      try {
        const b64 = await FileSystem.readAsStringAsync(slipFileUri, { encoding: 'base64' });
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
        message: 'Your bank slip is waiting for the bursar to approve it before the fees are posted.',
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
      showDialog({ title: 'Nothing to export', message: 'No receipts yet for this learner.', variant: 'info' });
      return;
    }
    const header = 'receipt_number,amount,method,date';
    const lines = receipts.map((r) =>
      [
        String(r.receipt_number ?? r.id ?? ''),
        String(r.amount ?? ''),
        String(r.payment_method ?? r.method ?? ''),
        String(r.receipt_date ?? r.created_at ?? ''),
      ]
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(','),
    );
    try {
      await Share.share({ title: `Receipts ${learnerName}`.trim(), message: [header, ...lines].join('\n') });
    } catch (e) {
      log.warn('Accounts', 'export failed', String(e));
    }
  }, [receipts, learnerName, showDialog]);

  const sectionRight =
    tab === 'receipts' && receipts.length ? (
      <Pressable style={styles.linkBtn} onPress={() => void exportReceipts()} hitSlop={8}>
        <Ionicons name="share-outline" size={15} color={palette.primary} />
        <Text style={[styles.linkText, { color: palette.primary }]}>Export</Text>
      </Pressable>
    ) : tab === 'slips' ? (
      <Pressable
        style={styles.linkBtn}
        onPress={() => {
          resetSlipForm();
          setSlipModal(true);
        }}
        hitSlop={8}>
        <Ionicons name="camera-outline" size={15} color={palette.primary} />
        <Text style={[styles.linkText, { color: palette.primary }]}>Upload photo</Text>
      </Pressable>
    ) : null;

  const sectionTitle =
    tab === 'receipts' ? 'Receipts' : tab === 'invoices' ? 'Invoices' : tab === 'pocket' ? 'Pocket money activity' : 'Bank slips';

  const header = (
    <View style={{ gap: 12, marginBottom: 10 }}>
      <MoneyHeader
        title="Fees & pocket money"
        subtitle={`For ${learnerName}`}
        onBack={() => navigation.goBack()}
      />
      {loading ? null : error ? null : (
        <>
          <BalancePanel kicker="Fee balance" value={kes(feeTotal)} line={[learnerName, yearName].filter(Boolean).join(' · ')}>
            <View style={styles.panelSplit}>
              <PanelStat label="Fees owed" value={kes(feeTotal)} sub="Tap to pay" onPress={onPayFees} />
              <PanelStat label="Pocket money" value={kes(pocketBalance)} sub="Tap to add" onPress={onAddPocket} />
            </View>
          </BalancePanel>
          <View style={styles.actionRow}>
            <MoneyButton label="Pay fees" icon="card" onPress={onPayFees} style={{ flex: 1 }} />
            <MoneyButton label="Add pocket money" icon="add-circle" variant="accent" onPress={onAddPocket} style={{ flex: 1 }} />
          </View>
          {feeCards.length > 1
            ? feeCards.map((c) => (
                <View key={c.student_id} style={styles.rowCard}>
                  <AmountRow title={c.student_name} meta={c.year_name} amount={kes(c.balance)} last />
                </View>
              ))
            : null}
          {partialWarn ? <Text style={styles.warn}>{partialWarn}</Text> : null}
          <MoneyTabs
            tabs={[
              { key: 'receipts', label: 'Receipts' },
              { key: 'invoices', label: 'Invoices' },
              { key: 'pocket', label: 'Pocket' },
              { key: 'slips', label: 'Slips' },
            ]}
            value={tab}
            onChange={setTab}
          />
          <SectionTitle right={sectionRight}>{sectionTitle}</SectionTitle>
          {tab === 'slips' ? (
            <Text style={styles.note}>Paid at the bank? Upload a photo of the slip. The bursar reads the amount and posts it.</Text>
          ) : null}
        </>
      )}
    </View>
  );

  const renderItem = ({ item: r }: { item: Row }) => {
    if (tab === 'receipts') {
      return (
        <View style={styles.rowCard}>
          <AmountRow
            icon="receipt-outline"
            iconTone="in"
            title={String(r.receipt_number ?? 'Receipt')}
            meta={[shortDate(r.receipt_date ?? r.created_at), methodLabel(r.payment_method)].filter(Boolean).join(' · ')}
            amount={kes(Number(r.amount ?? 0))}
            onPress={() => openReceiptView(r)}
            right={<Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />}
            last
          />
        </View>
      );
    }
    if (tab === 'invoices') {
      const inv = r as ParentInvoice & { total_amount?: number | string; items?: Row[] };
      const id = String(inv.id ?? inv.invoice_number ?? '');
      const open = openInvoice === id;
      const items = Array.isArray(inv.items) ? inv.items : [];
      const total = Number(inv.total_amount ?? inv.amount ?? inv.balance ?? 0);
      return (
        <View style={styles.rowCard}>
          <AmountRow
            icon="document-text-outline"
            title={String(inv.invoice_number || 'Invoice')}
            meta={[clean(inv.description), shortDate(inv.invoice_date ?? inv.due_date)].filter(Boolean).join(' · ')}
            amount={kes(total)}
            onPress={items.length ? () => setOpenInvoice(open ? null : id) : undefined}
            right={
              items.length ? (
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.mutedForeground} />
              ) : null
            }
            last={!open}
          />
          {open ? (
            <View style={styles.items}>
              {items.map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemLabel} numberOfLines={2}>
                    {String(it.description ?? 'Item')}
                  </Text>
                  <Text style={styles.itemAmt}>{kes(Number(it.line_total ?? it.amount ?? 0))}</Text>
                </View>
              ))}
              <View style={[styles.itemRow, styles.itemTotal]}>
                <Text style={[styles.itemLabel, { fontWeight: '800' }]}>Total</Text>
                <Text style={[styles.itemAmt, { fontWeight: '800' }]}>{kes(total)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      );
    }
    if (tab === 'pocket') {
      const amt = Number(r.amount ?? 0);
      const type = String(r.txn_type ?? r.category ?? '').toLowerCase();
      const isIn = /deposit|top|credit|refund/.test(type) || (!type && amt > 0);
      return (
        <View style={styles.rowCard}>
          <AmountRow
            icon={isIn ? 'arrow-down-circle-outline' : 'cart-outline'}
            iconTone={isIn ? 'in' : 'out'}
            title={clean(r.description) || (isIn ? 'Money added' : 'Spent')}
            meta={[shortDate(r.created_at), methodLabel(r.payment_method)].filter(Boolean).join(' · ')}
            amount={`${isIn ? '+' : '−'}${kes(Math.abs(amt))}`}
            amountStyle={{ color: isIn ? '#15803D' : INK }}
            last
          />
        </View>
      );
    }
    const s = r as ParentPaymentSlip;
    const amt = Number(s.amount ?? 0);
    return (
      <View style={styles.rowCard}>
        <AmountRow
          icon="image-outline"
          title={String(s.file_name || s.bank_ref || 'Bank slip photo')}
          meta={[shortDate(s.created_at ?? s.paid_on), String(s.status ?? 'pending').replace(/_/g, ' ')].filter(Boolean).join(' · ')}
          amount={amt > 0 ? kes(amt) : 'Pending'}
          last
        />
      </View>
    );
  };

  const empty = loading ? (
    <ListSkeleton withPanel rows={5} />
  ) : error ? (
    <StateCard tone="error" title="Could not load accounts" body={error} onRetry={() => void load()} />
  ) : (
    <StateCard
      icon={tab === 'pocket' ? 'wallet-outline' : tab === 'slips' ? 'image-outline' : 'receipt-outline'}
      title={
        tab === 'receipts'
          ? 'No receipts yet'
          : tab === 'invoices'
            ? 'No invoices yet'
            : tab === 'pocket'
              ? 'No pocket money activity'
              : 'No bank slips yet'
      }
      body={
        tab === 'pocket'
          ? 'Top-ups and canteen spending show here.'
          : tab === 'slips'
            ? 'Upload a photo after paying at the bank.'
            : 'They show here as the school records them.'
      }
    />
  );

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <FlatList
        data={loading || error ? [] : win.visible}
        keyExtractor={(r, i) => `${tab}-${String(r.id ?? r.receipt_number ?? r.invoice_number ?? i)}`}
        renderItem={renderItem}
        extraData={openInvoice}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={<ListFooter hasMore={win.hasMore} total={loading || error ? 0 : win.total} noun={tab === 'pocket' ? 'transactions' : tab} />}
        onEndReached={win.loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        initialNumToRender={PAGE}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={palette.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <PaymentBottomSheet visible={payForm != null} onClose={() => setPayForm(null)} bare>
        {payForm ? (
          <PaymentProcessCard
            key={`${payForm}-${payAmountSeed}`}
            layout="sheet"
            mode={payForm === 'fees' ? 'school_fees' : 'school_pocket'}
            title={payForm === 'fees' ? 'Pay school fees' : 'Add pocket money'}
            subtitle={
              payForm === 'fees' && feeTotal > 0
                ? `${learnerName} · balance ${kes(feeTotal)}`
                : `For ${learnerName}`
            }
            balance={payForm === 'fees' ? feeTotal : null}
            defaultAmount={payAmountSeed}
            defaultPhone={payPhone}
            studentId={selectedStudentId}
            getReceiptIds={payForm === 'fees' ? getReceiptIds : undefined}
            onRefresh={async () => {
              await load(true);
            }}
            onClose={() => setPayForm(null)}
          />
        ) : null}
      </PaymentBottomSheet>

      <Modal visible={slipModal} transparent animationType="slide" onRequestClose={() => setSlipModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSlipModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Upload bank slip</Text>
            <Text style={styles.modalMeta}>
              Photo only. The bursar reads the amount and bank reference from the picture: nothing to fill in.
            </Text>
            <MoneyButton
              label={slipFileName ? 'Choose another photo' : 'Choose slip photo'}
              icon="camera-outline"
              variant="secondary"
              onPress={() => void pickSlipImage()}
            />
            {slipFileUri ? <Image source={{ uri: slipFileUri }} style={styles.slipPreview} resizeMode="cover" /> : null}
            <View style={styles.actionRow}>
              <MoneyButton
                label="Cancel"
                variant="secondary"
                onPress={() => {
                  resetSlipForm();
                  setSlipModal(false);
                }}
                style={{ flex: 1 }}
              />
              {submittingSlip ? (
                <View style={[styles.busyBtn, { backgroundColor: palette.primary }]}>
                  <ActivityIndicator color={Colors.white} size="small" />
                </View>
              ) : (
                <MoneyButton label="Submit photo" icon="cloud-upload-outline" onPress={() => void submitSlip()} style={{ flex: 1 }} />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  panelSplit: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  note: { fontSize: 12, lineHeight: 17, color: Colors.mutedForeground },
  warn: {
    fontSize: 13,
    color: '#92400E',
    backgroundColor: 'rgba(245,184,0,0.14)',
    padding: 10,
    borderRadius: 10,
  },
  rowCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
  items: { paddingBottom: 8, paddingLeft: 48 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  itemTotal: { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  itemLabel: { flex: 1, fontSize: 13, color: INK },
  itemAmt: { fontSize: 13, fontWeight: '700', color: INK, textAlign: 'right', fontVariant: ['tabular-nums'] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: INK },
  modalMeta: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  slipPreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: rgba('#000000', 0.04) },
  busyBtn: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
});
