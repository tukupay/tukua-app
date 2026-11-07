import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CARD_SURFACE, ThemedBackdrop } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  MoneyHeader,
} from '../../components/dashboard/MoneyKit';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDialog } from '../../context/DialogContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { receiptRowToPdfInput, shareReceiptPdfFromInput } from '../../lib/receiptPdf';

type Props = NativeStackScreenProps<DashboardStackParamList, 'ReceiptView'>;

function kes(n: number | undefined | null): string {
  const v = Number(n ?? 0) || 0;
  return `KES ${v.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
}

/**
 * Full-screen receipt view (Desk ReceiptPreview / ReceiptDetailView parity).
 * Download builds a real PDF via expo-print HTML → PDF.
 */
export function ReceiptViewScreen({ navigation, route }: Props) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const { receipt, studentName, schoolName, admissionNumber, className } = route.params;
  const [downloading, setDownloading] = useState(false);

  const pdfInput = useMemo(
    () =>
      receiptRowToPdfInput(receipt, {
        studentName,
        schoolName,
        admissionNumber,
        className,
      }),
    [receipt, studentName, schoolName, admissionNumber, className],
  );

  const amount = pdfInput.amount;
  const method = pdfInput.paymentMethod;
  const num = pdfInput.receiptNumber;
  const date = pdfInput.receiptDate;
  const deposit = pdfInput.depositDate || date;
  const notes = pdfInput.notes;
  const lines = pdfInput.breakdowns?.length
    ? pdfInput.breakdowns
    : [{ account: 'School fees payment', amount }];

  const onDownload = async () => {
    setDownloading(true);
    try {
      await shareReceiptPdfFromInput(pdfInput);
    } catch (e) {
      log.warn('ReceiptView', 'PDF share failed', String(e));
      showDialog({
        title: 'Could not create PDF',
        message: e instanceof Error ? e.message : String(e),
        variant: 'warning',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        showsVerticalScrollIndicator={false}>
        <MoneyHeader title="Receipt" subtitle={`${num} · ${kes(amount)}`} onBack={() => navigation.goBack()} />

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.primary }, downloading && { opacity: 0.65 }]}
            disabled={downloading}
            onPress={() => void onDownload()}
            accessibilityRole="button"
            accessibilityLabel="Download receipt PDF">
            {downloading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={palette.secondary} />
                <Text style={styles.primaryBtnText}>Download PDF</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.receiptInner}>
            <View style={[styles.schoolHead, { borderBottomColor: palette.primary }]}>
              <Text style={[styles.schoolName, { color: palette.primary }]}>{pdfInput.schoolName || 'School'}</Text>
              <Text style={styles.schoolMuted}>Official fee receipt</Text>
            </View>

            <View style={styles.officialBanner}>
              <Text style={styles.officialTitle}>OFFICIAL RECEIPT</Text>
              <Text style={styles.officialMeta}>Receipt No: {num}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaBold}>Receipt Date: </Text>
                  {date}
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaBold}>Deposit Date: </Text>
                  {deposit}
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaBold}>Method: </Text>
                  {method}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaBold}>Student: </Text>
                  {pdfInput.studentName}
                </Text>
                <Text style={styles.metaLine}>
                  <Text style={styles.metaBold}>ADM No: </Text>
                  {pdfInput.admissionNumber || 'N/A'}
                </Text>
                {pdfInput.className ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaBold}>Class: </Text>
                    {pdfInput.className}
                  </Text>
                ) : null}
                {typeof pdfInput.balanceAfter === 'number' ? (
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaBold}>Balance after: </Text>
                    {kes(pdfInput.balanceAfter)}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.table}>
              <View style={[styles.tr, { backgroundColor: rgba(palette.primary, 0.06) }]}>
                <Text style={[styles.th, styles.colDesc]}>Vote head / account</Text>
                <Text style={[styles.th, styles.colAmt]}>Amount</Text>
              </View>
              {lines.map((line, i) => (
                <View key={`${line.account}-${i}`} style={styles.tr}>
                  <Text style={[styles.td, styles.colDesc]}>{line.account}</Text>
                  <Text style={[styles.td, styles.colAmt]}>{kes(line.amount)}</Text>
                </View>
              ))}
              <View style={[styles.tr, styles.trTotal, { backgroundColor: rgba(palette.secondary, 0.16) }]}>
                <Text style={[styles.tdTotal, styles.colDesc, { color: palette.primary }]}>Total</Text>
                <Text style={[styles.tdTotal, styles.colAmt, { color: palette.primary }]}>{kes(amount)}</Text>
              </View>
            </View>

            {notes ? (
              <Text style={styles.notes}>
                <Text style={styles.metaBold}>Notes: </Text>
                {notes}
              </Text>
            ) : null}

            <View style={styles.footerBlock}>
              <Text style={styles.metaLine}>
                Generated by: {pdfInput.generatedBy || 'Accounts'}
              </Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Authorized Signature</Text>
              <Text style={styles.footNote}>
                This is an official receipt issued by {pdfInput.schoolName || 'the school'}.
              </Text>
              <Text style={styles.footNote}>Powered by TukuPay · Banking Partner: Co-op Bank</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  actions: { marginTop: 0 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  card: { ...CARD_SURFACE, overflow: 'hidden', marginTop: 4 },
  receiptInner: { padding: 18, gap: 14 },
  schoolHead: { borderBottomWidth: 2, paddingBottom: 12 },
  schoolName: { fontSize: 20, fontWeight: '800' },
  schoolMuted: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  officialBanner: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  officialTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.ink,
  },
  officialMeta: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  metaGrid: { flexDirection: 'row', gap: 12 },
  metaCol: { flex: 1, gap: 6 },
  metaLine: { fontSize: 13, color: Colors.ink, lineHeight: 18 },
  metaBold: { fontWeight: '700' },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  trTotal: { borderBottomWidth: 0 },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
  },
  td: { fontSize: 13, color: Colors.ink, fontWeight: '600' },
  tdTotal: { fontSize: 14, fontWeight: '800' },
  colDesc: { flex: 1.4 },
  colAmt: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  notes: { fontSize: 13, color: Colors.ink, lineHeight: 18 },
  footerBlock: { marginTop: 8, gap: 6 },
  sigLine: {
    marginTop: 28,
    width: 140,
    borderTopWidth: 1,
    borderTopColor: Colors.ink,
    alignSelf: 'flex-start',
  },
  sigLabel: { fontSize: 12, color: Colors.mutedForeground },
  footNote: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
});
