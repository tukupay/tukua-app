/**
 * Library.
 * - parent: the selected child's borrowing statement (GET /parents/me/library-statement) — out, overdue,
 *   returned and fines, shown in batches.
 * - everyone else (librarian, teacher): GET /library/loans one page at a time — a librarian sees the
 *   school's loans (with the dashboard counters), a teacher only their own.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { fetchParentLibraryStatement } from '../../lib/parentPortalApi';
import { fetchLibraryDashboard, fetchLibraryLoansPage, type LibraryLoanRow } from '../../lib/teacherPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { INK, rgba } from '../../components/theme/ThemedPage';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleScrollPage,
  ShowMoreButton,
  StatTile,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtDay,
  num,
  useClientPager,
  type PillTone,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Library'>;

type Loan = LibraryLoanRow & {
  student_first_name?: string | null;
  student_last_name?: string | null;
};

type Fine = {
  id?: string;
  amount?: string | number | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type TabKey = 'current' | 'overdue' | 'returned' | 'fines';

const PAGE = 20;

function statusOf(l: Loan): string {
  return String(l?.status ?? '').toLowerCase();
}

function isReturned(l: Loan) {
  return statusOf(l) === 'returned';
}

function isOverdue(l: Loan) {
  const s = statusOf(l);
  if (s === 'overdue') return true;
  if (s === 'returned' || s === 'lost' || !l.due_at) return false;
  const due = new Date(l.due_at).getTime();
  return Number.isFinite(due) && due < Date.now();
}

function isOut(l: Loan) {
  const s = statusOf(l);
  return (s === 'open' || s === 'issued' || s === 'borrowed') && !isOverdue(l);
}

function loanTone(l: Loan): { label: string; tone: PillTone } {
  if (isReturned(l)) return { label: 'Returned', tone: 'neutral' };
  if (isOverdue(l)) return { label: 'Overdue', tone: 'danger' };
  if (statusOf(l) === 'lost') return { label: 'Lost', tone: 'warning' };
  return { label: 'Borrowed', tone: 'primary' };
}

function kes(v: unknown): string {
  const n = num(v);
  return n == null ? '—' : `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function LoanCard({ loan, showBorrower }: { loan: Loan; showBorrower: boolean }) {
  const { palette } = useAppTheme();
  const tone = loanTone(loan);
  const who =
    loan.borrower_name ||
    loan.student_name ||
    [loan.student_first_name, loan.student_last_name].filter(Boolean).join(' ') ||
    null;
  const late = num(loan.days_late);
  const sub = showBorrower ? [who, loan.class_name, loan.student_number || loan.admission_number].filter(Boolean).join(' · ') : '';
  return (
    <SurfaceCard style={styles.loanCard}>
      {loan.book_cover_url ? (
        <Image source={{ uri: loan.book_cover_url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverEmpty, { backgroundColor: rgba(palette.primary, 0.07) }]}>
          <Ionicons name="book-outline" size={20} color={palette.primary} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {loan.book_title || 'Book'}
        </Text>
        {sub ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
        <Text style={styles.cardMeta} numberOfLines={1}>
          {isReturned(loan)
            ? `Returned ${fmtDay(loan.returned_at, { weekday: false })}`
            : loan.due_at
              ? `Due ${fmtDay(loan.due_at, { weekday: false })}`
              : loan.issued_at
                ? `Issued ${fmtDay(loan.issued_at, { weekday: false })}`
                : ''}
        </Text>
        <View style={styles.pillRow}>
          <StatusPill label={tone.label} tone={tone.tone} />
          {!isReturned(loan) && late != null && late > 0 ? (
            <StatusPill label={`${late} day${late === 1 ? '' : 's'} late`} tone="danger" />
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

/** Parent: the child's statement, filtered and batched on the phone. */
function ParentLibrary({ studentId, refreshKey, onLoaded }: { studentId: string | null; refreshKey: number; onLoaded: () => void }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [tab, setTab] = useState<TabKey>('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = await fetchParentLibraryStatement(studentId ?? undefined);
        setLoans(Array.isArray(data?.loans) ? (data!.loans as Loan[]) : []);
        setFines(Array.isArray(data?.fines) ? (data!.fines as Fine[]) : []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Library', msg);
        setError(msg);
        setLoans([]);
        setFines([]);
      } finally {
        setLoading(false);
        onLoaded();
      }
    },
    [studentId, onLoaded],
  );

  const first = useRef(true);
  useEffect(() => {
    void load(!first.current);
    first.current = false;
  }, [load, refreshKey]);

  const groups = useMemo(
    () => ({
      current: loans.filter(isOut),
      overdue: loans.filter(isOverdue),
      returned: loans.filter(isReturned),
    }),
    [loans],
  );
  const openFines = useMemo(
    () => fines.filter((f) => !['paid', 'waived'].includes(String(f?.status ?? '').toLowerCase())),
    [fines],
  );
  const list: Loan[] = tab === 'fines' ? [] : groups[tab];
  const pager = useClientPager(list, PAGE, tab);
  const finePager = useClientPager(openFines, PAGE, tab);

  if (loading) return <ListSkeleton rows={4} height={80} />;
  if (error) return <ErrorState title="Couldn’t load the library statement" message={error} onRetry={() => void load()} />;

  const fineTotal = openFines.reduce((sum, f) => sum + (num(f.amount) ?? 0), 0);

  return (
    <>
      <View style={styles.stats}>
        <StatTile label="Borrowed" value={String(groups.current.length)} />
        <StatTile label="Overdue" value={String(groups.overdue.length)} />
        <StatTile label="Fines" value={openFines.length ? kes(fineTotal) : '0'} />
      </View>
      <ChipRow<TabKey>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'current', label: 'Borrowed', count: groups.current.length },
          { key: 'overdue', label: 'Overdue', count: groups.overdue.length },
          { key: 'returned', label: 'Returned', count: groups.returned.length },
          { key: 'fines', label: 'Fines', count: openFines.length },
        ]}
      />
      {tab === 'fines' ? (
        openFines.length === 0 ? (
          <StateCard icon="checkmark-circle-outline" title="No fines" body="No unpaid library fines." />
        ) : (
          <>
            {finePager.visible.map((fine, i) => (
              <SurfaceCard key={fine.id ?? `fine-${i}`}>
                <View style={styles.fineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{kes(fine.amount)}</Text>
                    <Text style={styles.cardMeta}>
                      {[fine.reason, fine.created_at ? fmtDay(fine.created_at, { weekday: false }) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  {fine.status ? <StatusPill label={String(fine.status)} tone="warning" /> : null}
                </View>
              </SurfaceCard>
            ))}
            {finePager.hasMore ? (
              <ShowMoreButton shown={finePager.shown} total={finePager.total} onPress={finePager.showMore} />
            ) : null}
          </>
        )
      ) : list.length === 0 ? (
        <StateCard
          icon="book-outline"
          title={tab === 'current' ? 'No books out' : tab === 'overdue' ? 'Nothing overdue' : 'No returns yet'}
          body={
            tab === 'current'
              ? 'Books your child borrows from the school library show here.'
              : tab === 'overdue'
                ? 'Every borrowed book is within its due date.'
                : 'Returned books will be listed here.'
          }
        />
      ) : (
        <>
          {pager.visible.map((loan, i) => (
            <LoanCard key={loan.id ?? `loan-${i}`} loan={loan} showBorrower={!studentId} />
          ))}
          {pager.hasMore ? <ShowMoreButton shown={pager.shown} total={pager.total} onPress={pager.showMore} /> : null}
        </>
      )}
    </>
  );
}

type StaffTab = 'active' | 'overdue' | 'returned';

/** Librarian / teacher: server pages of /library/loans. */
function StaffLibrary({ isLibrarian, refreshKey, onLoaded }: { isLibrarian: boolean; refreshKey: number; onLoaded: () => void }) {
  const { palette } = useAppTheme();
  const [tab, setTab] = useState<StaffTab>('active');
  const [rows, setRows] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const loadPage = useCallback(
    async (p: number) => {
      const id = ++reqId.current;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await fetchLibraryLoansPage({ status: tab, page: p, limit: PAGE, q: isLibrarian ? q : undefined });
        if (id !== reqId.current) return;
        setRows((prev) => {
          if (p === 1) return res.loans as Loan[];
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...(res.loans as Loan[]).filter((r) => !seen.has(r.id))];
        });
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        if (id !== reqId.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Library', msg);
        if (p === 1) {
          setRows([]);
          setTotal(0);
          setError(msg);
        }
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
          onLoaded();
        }
      }
    },
    [tab, q, isLibrarian, onLoaded],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage, refreshKey]);

  useEffect(() => {
    if (!isLibrarian) return;
    let alive = true;
    void fetchLibraryDashboard().then((d) => {
      if (alive) setDash(d);
    });
    return () => {
      alive = false;
    };
  }, [isLibrarian, refreshKey]);

  return (
    <>
      {isLibrarian && dash ? (
        <View style={styles.stats}>
          <StatTile label="Out" value={String(num(dash.borrowed_books) ?? '—')} />
          <StatTile label="Overdue" value={String(num(dash.overdue_books) ?? '—')} />
          <StatTile label="Fines due" value={kes(dash.pending_fines_amount)} />
        </View>
      ) : null}
      <ChipRow<StaffTab>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'active', label: isLibrarian ? 'Out now' : 'My books' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'returned', label: 'Returned' },
        ]}
      />
      {isLibrarian ? (
        <View style={[styles.search, { borderColor: rgba(palette.primary, 0.14) }]}>
          <Ionicons name="search" size={16} color={MUTED_INK} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title, borrower or admission no."
            placeholderTextColor="#9AA19A"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      ) : null}
      {loading ? (
        <ListSkeleton rows={4} height={80} />
      ) : error ? (
        <ErrorState title="Couldn’t load library loans" message={error} onRetry={() => void loadPage(1)} />
      ) : rows.length === 0 ? (
        <StateCard
          icon="book-outline"
          title={q ? 'No matches' : tab === 'overdue' ? 'Nothing overdue' : tab === 'returned' ? 'No returns yet' : 'No books out'}
          body={isLibrarian ? 'Loans issued at the library desk show here.' : 'Books you borrow from the school library show here.'}
        />
      ) : (
        <>
          {rows.map((loan, i) => (
            <LoanCard key={loan.id ?? `loan-${i}`} loan={loan} showBorrower={isLibrarian} />
          ))}
          {rows.length < total ? (
            <ShowMoreButton shown={rows.length} total={total} loading={loadingMore} onPress={() => void loadPage(page + 1)} />
          ) : null}
        </>
      )}
    </>
  );
}

export function LibraryScreen({ navigation }: Props) {
  const { persona, selectedStudentId, selectedStudent, activeRoles } = useDeskAuth();
  const isParent = persona === 'parent';
  const isLibrarian = (activeRoles ?? []).some((r) =>
    ['librarian', 'school_admin', 'principal', 'deputy_principal', 'admin'].includes(String(r).toLowerCase()),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const onLoaded = useCallback(() => setRefreshing(false), []);

  return (
    <ModuleScrollPage
      title={isParent ? 'Library' : isLibrarian ? 'Library desk' : 'My library'}
      description={
        isParent
          ? selectedStudent?.name
            ? `Books borrowed and returned by ${selectedStudent.name}.`
            : 'Books borrowed and returned by your children.'
          : isLibrarian
            ? 'Loans across the school — out, overdue and returned.'
            : 'Books you have borrowed from the school library.'
      }
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        setRefreshKey((k) => k + 1);
      }}>
      {isParent ? (
        <ParentLibrary studentId={selectedStudentId} refreshKey={refreshKey} onLoaded={onLoaded} />
      ) : (
        <StaffLibrary isLibrarian={isLibrarian} refreshKey={refreshKey} onLoaded={onLoaded} />
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  loanCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cover: { width: 44, height: 62, borderRadius: 8, backgroundColor: '#EEE' },
  coverEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: INK },
  cardMeta: { fontSize: 12.5, color: MUTED_INK, marginTop: 3 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  fineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: INK },
});
