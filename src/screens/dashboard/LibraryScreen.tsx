import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleTabPager } from '../../components/dashboard/ModuleTabPager';
import { ModuleBackBar, ModuleScreenHeader, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { fetchParentLibraryStatement, seedParentDemoData } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Library'>;

type Loan = {
  id?: string;
  book_title?: string | null;
  status?: string | null;
  issued_at?: string | null;
  due_at?: string | null;
  returned_at?: string | null;
  admission_number?: string | null;
  student_first_name?: string | null;
  student_last_name?: string | null;
};

type Fine = {
  id?: string;
  amount?: string | number | null;
  reason?: string | null;
  status?: string | null;
  loan_id?: string | null;
};

type TabKey = 'current' | 'returned' | 'overdue' | 'fines';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'current', label: 'Borrowed' },
  { key: 'returned', label: 'Returned' },
  { key: 'overdue', label: 'Not returned' },
  { key: 'fines', label: 'Fines' },
];

function isOpen(status?: string | null) {
  const s = String(status ?? '').toLowerCase();
  return s === 'open' || s === 'issued' || s === 'borrowed';
}

function isReturned(status?: string | null) {
  return String(status ?? '').toLowerCase() === 'returned';
}

function isOverdue(loan: Loan) {
  const s = String(loan.status ?? '').toLowerCase();
  if (s === 'overdue') return true;
  if (isReturned(s) || !loan.due_at) return false;
  if (!isOpen(s)) return false;
  const due = new Date(loan.due_at).getTime();
  return Number.isFinite(due) && due < Date.now();
}

export function LibraryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [tab, setTab] = useState<TabKey>('current');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = await fetchParentLibraryStatement(selectedStudentId ?? undefined);
        setLoans((data?.loans as Loan[]) ?? []);
        setFines((data?.fines as Fine[]) ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Library', msg);
        setError(msg);
        setLoans([]);
        setFines([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loansForTab = useCallback(
    (key: TabKey) => {
      const list = Array.isArray(loans) ? loans : [];
      if (key === 'current') return list.filter((l) => isOpen(l?.status) && !isOverdue(l));
      if (key === 'returned') return list.filter((l) => isReturned(l?.status));
      if (key === 'overdue') return list.filter((l) => isOverdue(l));
      return [];
    },
    [loans],
  );

  const emptyBodyFor = (key: TabKey) =>
    key === 'fines'
      ? 'No open fines for this student.'
      : key === 'returned'
        ? 'No returned books yet.'
        : key === 'overdue'
          ? 'Nothing overdue — great.'
          : 'When books are issued, they appear here.';

  const openFines = useMemo(
    () =>
      (Array.isArray(fines) ? fines : []).filter(
        (f) => !['paid', 'waived'].includes(String(f?.status ?? '').toLowerCase()),
      ),
    [fines],
  );

  const seed = async () => {
    setSeeding(true);
    try {
      await seedParentDemoData();
      await load(true);
    } catch (e) {
      log.warn('Library', 'seed failed', String(e));
    } finally {
      setSeeding(false);
    }
  };

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
        <ModuleKicker>Library</ModuleKicker>
        <ModuleScreenHeader title="Books" description="Borrow and return library books." />
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `Borrowed and returned by ${selectedStudent.name}.`
            : 'Borrowed and returned by your child.'}
        </Text>

        <ModuleTabPager
          tabs={TABS}
          value={tab}
          onChange={setTab}
          minHeight={240}
          renderPage={(key) => {
            if (loading) {
              return <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />;
            }
            if (error) {
              return <ModuleEmpty title="Could not load library" body={error} onRetry={() => void load()} />;
            }
            if (key === 'fines') {
              return openFines.length === 0 ? (
                <ModuleEmpty title="No fines" body={emptyBodyFor(key)} onRetry={() => void seed()} />
              ) : (
                <>
                  {openFines.map((fine, i) => (
                    <ModuleGlassCard key={fine.id ?? `fine-${i}`}>
                      <Text style={styles.cardTitle}>
                        KES {fine.amount != null ? String(fine.amount) : '—'}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {[fine.reason, fine.status].filter(Boolean).join(' · ')}
                      </Text>
                    </ModuleGlassCard>
                  ))}
                </>
              );
            }
            const filteredLoans = loansForTab(key);
            return filteredLoans.length === 0 ? (
              <ModuleEmpty
                title={key === 'current' ? 'No books out' : 'Nothing here'}
                body={emptyBodyFor(key)}
                onRetry={seeding ? undefined : () => void seed()}
              />
            ) : (
              <>
                {filteredLoans.map((loan, i) => {
                  const who = [loan.student_first_name, loan.student_last_name].filter(Boolean).join(' ');
                  return (
                    <ModuleGlassCard key={loan.id ?? `loan-${i}`}>
                      <Text style={styles.cardTitle}>{loan.book_title || 'Book'}</Text>
                      <Text style={styles.cardMeta}>
                        {[loan.status, who, loan.admission_number].filter(Boolean).join(' · ')}
                      </Text>
                      {loan.due_at ? (
                        <Text style={styles.due}>Due {String(loan.due_at).slice(0, 10)}</Text>
                      ) : null}
                      {loan.returned_at ? (
                        <Text style={styles.due}>Returned {String(loan.returned_at).slice(0, 10)}</Text>
                      ) : null}
                    </ModuleGlassCard>
                  );
                })}
              </>
            );
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4 },
  due: { fontSize: 13, color: Colors.primary, marginTop: 8 },
});
