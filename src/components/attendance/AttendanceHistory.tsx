/**
 * Attendance page body shared by the parent (Attendance) and learner (StudentAttendance) screens: a rate card,
 * status filter chips and the daily register as compact rows grouped by month, loaded in pages from the API
 * (limit/offset) with a "Show more" button. Dashboard look (ThemedPage, white cards, palette colours).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/AppThemeContext';
import { log } from '../../lib/logger';
import type { AttendancePage } from '../../lib/parentPortalApi';
import { PrimaryPatternPanel, rgba, INK } from '../theme/ThemedPage';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  ShowMoreButton,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtDay,
  fmtTime,
  type PillTone,
} from '../ui/ModuleKit';
import { Skeleton } from '../ui/Skeleton';

const PAGE_SIZE = 30;

type Record_ = AttendancePage['records'][number];
type Filter = 'all' | 'present' | 'late' | 'absent';

export function attendanceStatus(raw?: string | null): { key: Exclude<Filter, 'all'> | 'other'; label: string; tone: PillTone } {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('absent')) return { key: 'absent', label: 'Absent', tone: 'danger' };
  if (s.includes('late')) return { key: 'late', label: 'Late', tone: 'warning' };
  if (s.includes('excused') || s.includes('leave')) return { key: 'other', label: s.includes('leave') ? 'On leave' : 'Excused', tone: 'neutral' };
  return { key: 'present', label: 'Present', tone: 'success' };
}

function monthKey(v: unknown): string {
  const s = String(v ?? '').slice(0, 7);
  return /^\d{4}-\d{2}$/.test(s) ? s : 'unknown';
}

function monthLabel(key: string): string {
  if (key === 'unknown') return 'Undated';
  const d = new Date(`${key}-15T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function AttendanceHistory({
  title,
  description,
  onBack,
  loadPage,
  reloadKey,
  summaryStudentId,
  aboveSummary,
  emptyBody,
}: {
  title: string;
  description?: string;
  onBack: () => void;
  /** Load one page; `offset` counts rows already shown. */
  loadPage: (offset: number, limit: number) => Promise<AttendancePage>;
  /** Changing it reloads from the first page (e.g. another child picked). */
  reloadKey?: string | null;
  /** Which summary row to show when the page carries several children. */
  summaryStudentId?: string | null;
  /** E.g. child chips for a parent with several children. */
  aboveSummary?: ReactNode;
  emptyBody?: string;
}) {
  const { palette } = useAppTheme();
  const [records, setRecords] = useState<Record_[]>([]);
  const [summary, setSummary] = useState<AttendancePage['summary']>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const reqId = useRef(0);

  const loadFirst = useCallback(
    async (soft = false) => {
      const id = ++reqId.current;
      if (!soft) setLoading(true);
      setError(null);
      try {
        const page = await loadPage(0, PAGE_SIZE);
        if (id !== reqId.current) return;
        setRecords(page.records);
        setSummary(page.summary);
        setTotal(page.total);
        setHasMore(page.hasMore ?? (page.records.length >= PAGE_SIZE && page.total == null));
      } catch (e) {
        if (id !== reqId.current) return;
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('AttendanceHistory', msg);
        setError(msg);
        setRecords([]);
        setSummary([]);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [loadPage],
  );

  useEffect(() => {
    setFilter('all');
    void loadFirst();
  }, [loadFirst, reloadKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const id = reqId.current;
    try {
      const page = await loadPage(records.length, PAGE_SIZE);
      if (id !== reqId.current) return;
      const seen = new Set(records.map((r) => String(r.id ?? '')).filter(Boolean));
      // An older API ignores offset and sends the first page again: nothing new means the end.
      const added = page.records.filter((r) => (r.id ? !seen.has(String(r.id)) : true));
      setRecords((prev) => [...prev, ...added]);
      if (page.total != null) setTotal(page.total);
      setHasMore(added.length > 0 && (page.hasMore ?? page.records.length >= PAGE_SIZE));
    } catch (e) {
      log.warn('AttendanceHistory', 'more', e instanceof Error ? e.message : String(e));
      setHasMore(true);
    } finally {
      setLoadingMore(false);
    }
  }, [loadPage, loadingMore, records]);

  const stats = useMemo(() => {
    const row =
      (summaryStudentId ? summary.find((s) => s.student_id === summaryStudentId) : null) ??
      (summary.length === 1 ? summary[0] : null);
    if (row) return row;
    // No summary row: count what is loaded.
    const out = { student_id: summaryStudentId ?? '', present: 0, absent: 0, late: 0, total: 0, full_name: null as string | null };
    for (const r of records) {
      const k = attendanceStatus(r.status ?? r.attendance_status).key;
      out.total += 1;
      if (k === 'absent') out.absent += 1;
      else if (k === 'late') out.late += 1;
      else out.present += 1;
    }
    return out;
  }, [summary, summaryStudentId, records]);

  const rate = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 1000) / 10 : null;

  const filtered = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => attendanceStatus(r.status ?? r.attendance_status).key === filter)),
    [records, filter],
  );

  const groups = useMemo(() => {
    const out: Array<{ key: string; rows: Record_[] }> = [];
    for (const r of filtered) {
      const k = monthKey(r.attendance_date);
      const last = out[out.length - 1];
      if (last && last.key === k) last.rows.push(r);
      else out.push({ key: k, rows: [r] });
    }
    return out;
  }, [filtered]);

  return (
    <ModuleScrollPage
      title={title}
      description={description}
      onBack={onBack}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void loadFirst(true);
      }}>
      {aboveSummary}
      {loading ? (
        <View style={{ gap: 12 }}>
          <View style={[styles.heroSkel, { backgroundColor: rgba(palette.primary, 0.08) }]}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="30%" height={30} />
            <Skeleton width="100%" height={44} />
          </View>
          <ListSkeleton rows={5} height={56} />
        </View>
      ) : error ? (
        <ErrorState title="Couldn’t load attendance" message={error} onRetry={() => void loadFirst()} />
      ) : (
        <>
          <PrimaryPatternPanel style={styles.hero}>
            <View style={styles.heroInner}>
              <View style={styles.heroHead}>
                <View style={[styles.heroIcon, { backgroundColor: palette.secondary }]}>
                  <Ionicons name="calendar" size={20} color={palette.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroKicker}>Attendance rate</Text>
                  <Text style={styles.heroValue}>{rate != null ? `${rate}%` : '—'}</Text>
                  <Text style={styles.heroSub}>
                    {stats.total
                      ? `${stats.present + stats.late} of ${stats.total} school day${stats.total === 1 ? '' : 's'} attended`
                      : 'No days recorded yet'}
                  </Text>
                </View>
              </View>
              <View style={styles.heroSplit}>
                {[
                  { label: 'Present', value: stats.present },
                  { label: 'Late', value: stats.late },
                  { label: 'Absent', value: stats.absent },
                ].map((t) => (
                  <View key={t.label} style={styles.heroStat}>
                    <Text style={styles.heroStatLabel}>{t.label}</Text>
                    <Text style={styles.heroStatValue}>{t.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </PrimaryPatternPanel>

          {records.length === 0 ? (
            <StateCard
              icon="calendar-outline"
              title="No attendance records yet"
              body={emptyBody ?? 'Days marked at school (register, gate or face check-in) will show here.'}
            />
          ) : (
            <>
              <ChipRow<Filter>
                value={filter}
                onChange={setFilter}
                options={[
                  { key: 'all', label: 'All' },
                  { key: 'present', label: 'Present' },
                  { key: 'late', label: 'Late' },
                  { key: 'absent', label: 'Absent' },
                ]}
              />
              {groups.length === 0 ? (
                <StateCard
                  icon="filter-outline"
                  title={`No ${filter} days in what’s loaded`}
                  body={hasMore ? 'Load older days to look further back.' : undefined}
                />
              ) : (
                groups.map((g) => (
                  <View key={g.key}>
                    <SectionLabel>{monthLabel(g.key)}</SectionLabel>
                    <SurfaceCard style={styles.listCard}>
                      {g.rows.map((r, i) => {
                        const st = attendanceStatus(r.status ?? r.attendance_status);
                        const tin = fmtTime(r.check_in_at);
                        const tout = fmtTime(r.check_out_at);
                        const times = st.key === 'absent' ? '' : [tin && `In ${tin}`, tout && `Out ${tout}`].filter(Boolean).join(' · ');
                        const meta = [times, r.method ? String(r.method) : ''].filter(Boolean).join(' · ');
                        return (
                          <View
                            key={String(r.id ?? `${r.attendance_date}-${i}`)}
                            style={[styles.row, i > 0 && styles.rowDivider]}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.date} numberOfLines={1}>
                                {fmtDay(r.attendance_date, { year: false })}
                              </Text>
                              {meta ? (
                                <Text style={styles.meta} numberOfLines={1}>
                                  {meta}
                                </Text>
                              ) : null}
                            </View>
                            <StatusPill label={st.label} tone={st.tone} />
                          </View>
                        );
                      })}
                    </SurfaceCard>
                  </View>
                ))
              )}
              {hasMore ? (
                <ShowMoreButton
                  label="Load older days"
                  shown={records.length}
                  total={total}
                  loading={loadingMore}
                  onPress={() => void loadMore()}
                />
              ) : (
                <Text style={styles.end}>
                  {records.length} day{records.length === 1 ? '' : 's'} shown · that’s everything
                </Text>
              )}
            </>
          )}
        </>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  heroSkel: { borderRadius: 16, padding: 16, gap: 10 },
  hero: { marginBottom: 14 },
  heroInner: { padding: 16 },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' },
  heroValue: { marginTop: 2, fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  heroSplit: { flexDirection: 'row', gap: 8 },
  heroStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, padding: 10 },
  heroStatLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' },
  heroStatValue: { marginTop: 3, fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  listCard: { paddingVertical: 4, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E1D3' },
  date: { fontSize: 14.5, fontWeight: '700', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  end: { textAlign: 'center', fontSize: 12, color: MUTED_INK, marginVertical: 10 },
});
