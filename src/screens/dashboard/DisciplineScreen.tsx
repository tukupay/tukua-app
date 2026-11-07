/**
 * Discipline — conduct records for every role.
 * - student: own cases and commendations (read-only; GET /discipline/incidents answers only theirs).
 * - parent: every linked child's cases (the active-child header is dropped), filter by child and term,
 *   a this-term summary with the trend against last term. Read-only (the API has no acknowledge route).
 * - teacher / staff: cases they recorded (the server scopes them); record a new case.
 * - office (principal, deputy, discipline master, school admin): the whole school, paged from the
 *   server, with a "Mine" scope, school stats, search and status / severity / period filters.
 * Tapping a case opens DisciplineDetail (AI analysis and edit / resolve stay staff-only there).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { deskFetch } from '../../lib/deskApi';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { INK, ThemedPage } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleHeading,
  SelectField,
  ShowMoreButton,
  StatTile,
  StateCard,
  SurfaceCard,
  ThemedRefresh,
  useModulePadding,
} from '../../components/ui/ModuleKit';
import { IncidentRow } from '../../components/discipline/DisciplineParts';
import {
  DISCIPLINE_SEVERITIES,
  isClosedStatus,
  isCommendation,
  isDisciplineOffice,
  incidentWhen,
  listDisciplineIncidents,
  previousTermKey,
  studentName,
  termKey,
  termLabel,
  type DisciplineIncident,
} from '../../lib/disciplineApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Discipline'>;

type Kind = 'all' | 'concern' | 'positive';
type Scope = 'school' | 'mine';

const PAGE_SIZE = 30;

type SchoolStats = {
  incident_count?: number;
  recent_incidents?: number;
  average_rating?: number;
  active_alerts?: number;
  security_level?: string;
};

function withinDays(v: string | undefined, days: number): boolean {
  if (!v) return false;
  const t = new Date(v).getTime();
  return Number.isFinite(t) && Date.now() - t <= days * 86_400_000;
}

export function DisciplineScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const pad = useModulePadding();
  const { persona, activeRoles, linkedStudents, selectedSchoolId, selectedStudentId, selectedStudent } = useDeskAuth();
  const isStudent = persona === 'student';
  const isParent = persona === 'parent';
  const isStaff = persona === 'teacher' || persona === 'school_admin' || persona === 'super_admin';
  const office = isStaff && isDisciplineOffice(activeRoles, persona);

  const [scope, setScope] = useState<Scope>('school');
  const [items, setItems] = useState<DisciplineIncident[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [lastPageFull, setLastPageFull] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);

  // Filters
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [period, setPeriod] = useState<string>('all');
  const [child, setChild] = useState<string>(isParent && selectedStudentId ? selectedStudentId : 'all');

  const mine = isStaff && (!office || scope === 'mine');
  const currentTerm = termKey(new Date()) as string;
  const lastTerm = previousTermKey(currentTerm);

  const children = useMemo(
    () =>
      isParent
        ? linkedStudents.filter((s) => s.id && (!selectedSchoolId || s.schoolId === selectedSchoolId))
        : [],
    [isParent, linkedStudents, selectedSchoolId],
  );

  const load = useCallback(
    async (mode: 'first' | 'soft' | 'more' = 'first') => {
      if (mode === 'first') setLoading(true);
      if (mode === 'more') setLoadingMore(true);
      if (mode !== 'more') setError(null);
      const nextPage = mode === 'more' ? page + 1 : 1;
      try {
        const res = isStaff
          ? await listDisciplineIncidents({ page: nextPage, limit: PAGE_SIZE, mine })
          : // Parents: every child's cases (no active-child header); students: their own.
            await listDisciplineIncidents({ limit: 200, ...(isParent ? { studentId: null } : {}) });
        setItems((prev) => (mode === 'more' ? [...prev, ...res.items] : res.items));
        setTotal(res.total);
        setPage(nextPage);
        setLastPageFull(isStaff && res.items.length >= PAGE_SIZE);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Discipline', msg);
        if (mode === 'more') setError(null);
        else {
          setError(msg);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [isStaff, isParent, mine, page],
  );

  const loadStats = useCallback(async () => {
    if (!office) return;
    try {
      setStats(await deskFetch<SchoolStats>('/discipline/dashboard'));
    } catch (e) {
      log.info('Discipline', 'dashboard stats unavailable', e instanceof Error ? e.message : String(e));
      setStats(null);
    }
  }, [office]);

  useEffect(() => {
    void load('first');
    void loadStats();
    // Reload when the scope changes; `load` itself changes with the page counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine, isStaff, isParent, loadStats]);

  // Back from recording / editing a case: refresh quietly.
  const [focusCount, setFocusCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setFocusCount((c) => c + 1);
    }, []),
  );
  useEffect(() => {
    if (focusCount > 1) {
      void load('soft');
      void loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCount]);

  const hasMore = isStaff && (total != null ? items.length < total : lastPageFull);

  // Child filter (parents) applies before the summary so the numbers match the chosen child.
  const byChild = useMemo(() => {
    if (!isParent || child === 'all') return items;
    return items.filter((i) => (i.students ?? []).some((s) => String(s.student_id ?? '') === child));
  }, [items, isParent, child]);

  const summary = useMemo(() => {
    const thisTerm = byChild.filter((i) => termKey(incidentWhen(i)) === currentTerm);
    const prevTerm = byChild.filter((i) => termKey(incidentWhen(i)) === lastTerm);
    const concerns = (l: DisciplineIncident[]) => l.filter((i) => !isCommendation(i)).length;
    return {
      termCases: concerns(thisTerm),
      termPositive: thisTerm.length - concerns(thisTerm),
      lastCases: concerns(prevTerm),
      open: byChild.filter((i) => !isCommendation(i) && !isClosedStatus(i.status)).length,
    };
  }, [byChild, currentTerm, lastTerm]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byChild.filter((i) => {
      const positive = isCommendation(i);
      if (kind === 'positive' && !positive) return false;
      if (kind === 'concern' && positive) return false;
      if (status === 'open' && isClosedStatus(i.status)) return false;
      if (status === 'closed' && !isClosedStatus(i.status)) return false;
      if (severity !== 'all' && String(i.severity ?? '').toLowerCase() !== severity) return false;
      const when = incidentWhen(i);
      if (period === '7d' && !withinDays(when, 7)) return false;
      if (period === '30d' && !withinDays(when, 30)) return false;
      if (period === 'term' && termKey(when) !== currentTerm) return false;
      if (period === 'lastterm' && termKey(when) !== lastTerm) return false;
      if (period === 'year' && termKey(when)?.slice(0, 4) !== currentTerm.slice(0, 4)) return false;
      if (q) {
        const hay = [
          i.case_number,
          i.case_summary,
          i.title,
          i.category_label,
          i.case_narrative,
          i.status,
          ...(i.students ?? []).flatMap((s) => [studentName(s), s.admission_number, s.class_label]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [byChild, kind, status, severity, period, query, currentTerm, lastTerm]);

  const kindCounts = useMemo(() => {
    const pos = byChild.filter(isCommendation).length;
    return { all: byChild.length, positive: pos, concern: byChild.length - pos };
  }, [byChild]);

  const filtersActive = kind !== 'all' || status !== 'all' || severity !== 'all' || period !== 'all' || !!query.trim();

  const title = isStudent
    ? 'My conduct record'
    : isParent
      ? children.length > 1
        ? "My children's conduct"
        : selectedStudent?.name
          ? `${selectedStudent.name}'s conduct`
          : 'Conduct record'
      : mine
        ? 'Cases I recorded'
        : 'Discipline cases';
  const description = isStudent
    ? 'Cases and commendations the school logged for you.'
    : isParent
      ? 'Cases and commendations the school logged for your child.'
      : office
        ? 'Every case in the school. Tap one to view, edit or resolve.'
        : 'Record a case and follow the ones you logged.';

  const trend = summary.termCases - summary.lastCases;

  const header = (
    <View style={{ gap: 12 }}>
      <ModuleHeading
        title={title}
        description={description}
        onBack={() => navigation.goBack()}
        right={
          isStaff ? (
            <Pressable
              onPress={() => navigation.navigate('RecordDiscipline')}
              accessibilityRole="button"
              accessibilityLabel="Record a new case"
              style={({ pressed }) => [styles.recordBtn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.recordText}>Record case</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isStaff ? (
        <SurfaceCard onPress={() => navigation.navigate('DisciplineStudent')} accessibilityLabel="Look up a learner's conduct history">
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: rgba(palette.primary, 0.08) }]}>
              <Ionicons name="person-circle-outline" size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Learner history</Text>
              <Text style={styles.linkMeta}>Search a learner to see their conduct rating and cases</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED_INK} />
          </View>
        </SurfaceCard>
      ) : null}

      {office ? (
        <ChipRow<Scope>
          value={scope}
          onChange={setScope}
          options={[
            { key: 'school', label: 'Whole school' },
            { key: 'mine', label: 'Recorded by me' },
          ]}
        />
      ) : null}

      {!loading && !error ? (
        office && stats && scope === 'school' ? (
          <View style={styles.tiles}>
            <StatTile label="All cases" value={String(stats.incident_count ?? total ?? items.length)} style={styles.tile} />
            <StatTile label="Last 30 days" value={String(stats.recent_incidents ?? 0)} style={styles.tile} />
            <StatTile
              label="Avg rating"
              value={stats.average_rating != null ? `${stats.average_rating}%` : '—'}
              hint={stats.active_alerts ? `${stats.active_alerts} alert${stats.active_alerts === 1 ? '' : 's'}` : 'No alerts'}
              style={styles.tile}
            />
          </View>
        ) : items.length > 0 ? (
          <View style={styles.tiles}>
            <StatTile label="Cases this term" value={String(summary.termCases)} hint={termLabel(currentTerm)} style={styles.tile} />
            <StatTile label="Commendations" value={String(summary.termPositive)} hint="This term" style={styles.tile} />
            {isStaff ? (
              <StatTile label="Open" value={String(summary.open)} hint="Not resolved" style={styles.tile} />
            ) : (
              <StatTile
                label="Trend"
                value={trend === 0 ? 'Same' : trend > 0 ? `+${trend}` : String(trend)}
                hint={`vs ${termLabel(lastTerm)}`}
                style={styles.tile}
              />
            )}
          </View>
        ) : null
      ) : null}

      {isParent && children.length > 1 ? (
        <SelectField
          label="Child"
          icon="people-outline"
          value={child}
          onChange={setChild}
          options={[
            { key: 'all', label: 'All my children' },
            ...children.map((c) => ({ key: c.id, label: c.name, hint: c.className ?? null })),
          ]}
        />
      ) : null}

      {isStaff ? (
        <View style={[styles.search, { borderColor: rgba(palette.primary, 0.16) }]}>
          <Ionicons name="search" size={16} color={MUTED_INK} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search case #, learner, class, offence…"
            placeholderTextColor={MUTED_INK}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={MUTED_INK} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.selects}>
        <SelectField
          label="Period"
          icon="calendar-outline"
          value={period}
          onChange={setPeriod}
          style={styles.select}
          options={[
            { key: 'all', label: 'Any time' },
            ...(isStaff
              ? [
                  { key: '7d', label: 'Last 7 days' },
                  { key: '30d', label: 'Last 30 days' },
                ]
              : []),
            { key: 'term', label: `This term (${termLabel(currentTerm)})` },
            { key: 'lastterm', label: `Last term (${termLabel(lastTerm)})` },
            { key: 'year', label: `This year (${currentTerm.slice(0, 4)})` },
          ]}
        />
        {isStaff ? (
          <SelectField
            label="Status"
            icon="flag-outline"
            value={status}
            onChange={(k) => setStatus(k as typeof status)}
            style={styles.select}
            options={[
              { key: 'all', label: 'Any status' },
              { key: 'open', label: 'Open' },
              { key: 'closed', label: 'Resolved / closed' },
            ]}
          />
        ) : null}
      </View>
      {isStaff ? (
        <SelectField
          label="Severity"
          icon="warning-outline"
          value={severity}
          onChange={setSeverity}
          options={[
            { key: 'all', label: 'Any severity' },
            ...DISCIPLINE_SEVERITIES.map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
          ]}
        />
      ) : null}

      {byChild.length > 0 ? (
        <ChipRow<Kind>
          value={kind}
          onChange={setKind}
          options={[
            { key: 'all', label: 'All', count: kindCounts.all },
            { key: 'concern', label: 'Cases', count: kindCounts.concern },
            { key: 'positive', label: 'Commendations', count: kindCounts.positive },
          ]}
        />
      ) : null}

      {isStaff && hasMore && filtersActive ? (
        <Text style={styles.note}>
          Filters apply to the {items.length} cases loaded{total != null ? ` of ${total}` : ''}. Load more below to search further.
        </Text>
      ) : null}
    </View>
  );

  const empty = loading ? (
    <ListSkeleton rows={4} />
  ) : error ? (
    <ErrorState title="Couldn’t load conduct records" message={error} onRetry={() => void load('first')} />
  ) : byChild.length === 0 ? (
    <StateCard
      icon="shield-checkmark-outline"
      title="No cases on record"
      body={
        isStudent
          ? 'Nothing on file. Cases and commendations the school logs for you will show here.'
          : isParent
            ? 'Nothing on file for your child. Cases and commendations the school logs will show here.'
            : mine
              ? 'Cases you record will show here. Tap “Record case” to log one.'
              : 'No discipline cases recorded yet.'
      }
      actionLabel={isStaff ? 'Record case' : undefined}
      onAction={isStaff ? () => navigation.navigate('RecordDiscipline') : undefined}
    />
  ) : (
    <StateCard icon="filter-outline" title="Nothing matches these filters" body="Change or clear a filter above." />
  );

  return (
    <ThemedPage>
      <FlatList
        data={loading || error ? [] : filtered}
        keyExtractor={(item, index) => String(item.id ?? item.case_number ?? index)}
        renderItem={({ item }) => (
          <IncidentRow
            item={item}
            showStudents={!isStudent}
            onPress={() => navigation.navigate('DisciplineDetail', { id: item.id, incident: item })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={<View style={{ marginBottom: 12 }}>{header}</View>}
        ListEmptyComponent={empty}
        ListFooterComponent={
          hasMore && !loading && !error ? (
            <View style={{ marginTop: 12 }}>
              <ShowMoreButton
                shown={items.length}
                total={total}
                loading={loadingMore}
                label="Load more cases"
                onPress={() => void load('more')}
              />
            </View>
          ) : loadingMore ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 12 }} />
          ) : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading && !filtersActive) void load('more');
        }}
        contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom, paddingHorizontal: 16 }}
        refreshControl={
          <ThemedRefresh
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load('soft');
              void loadStats();
            }}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      />
    </ThemedPage>
  );
}

const styles = StyleSheet.create({
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recordText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '700', color: INK },
  linkMeta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: INK, paddingVertical: 10 },
  selects: { flexDirection: 'row', gap: 8 },
  select: { flex: 1 },
  note: { fontSize: 12, color: MUTED_INK, lineHeight: 17 },
});
