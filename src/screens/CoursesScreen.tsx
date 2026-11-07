/**
 * Native Courses tab — Nest catalog + enrolled list.
 * Course detail / learn / exam / pay stay in-app via WebView (full web feature set).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNestApiBaseUrl } from '../lib/localHost';
import { resolveNestAccessTokenForWebView } from '../lib/platformNestAuth';
import { humanizeError } from '../lib/humanizeError';
import { fetchWithTimeout, messageForStatus, readJsonSafe, unwrapEnvelope } from '../lib/apiHttp';
import { Colors } from '../theme/yana';
import { floatingHeaderInset } from '../constants/layout';
import { useBottomBarSpace } from '../components/navigation/useBottomBarSpace';
import { log } from '../lib/logger';
import type { CoursesStackParamList } from '../navigation/CoursesStack';
import { useAppTheme } from '../context/AppThemeContext';
import { CARD, CARD_SURFACE, INK, ThemedBackdrop, rgba } from '../components/theme/ThemedPage';
import {
  COURSE_ROW_HEIGHT,
  CourseTableFooter,
  CourseTableHeader,
  CourseTableRow,
  CourseTableSkeletonRow,
} from '../components/courses/CourseTableRow';

async function nestAuthGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = await resolveNestAccessTokenForWebView();
  if (!token) throw new Error('Sign in again to load courses.');
  const res = await fetchWithTimeout(`${getNestApiBaseUrl().replace(/\/$/, '')}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal,
  });
  const json = await readJsonSafe(res);
  if (!res.ok) throw new Error(humanizeError(messageForStatus(res.status, json)));
  return unwrapEnvelope<T>(json);
}

type Enrolled = {
  enrollment_id: string;
  course_id: string;
  title: string;
  thumbnail_url?: string | null;
  short_description?: string | null;
  progress_percent?: number;
  status?: string;
  payment_status?: string;
  organization_name?: string | null;
  school_name?: string | null;
  org_name?: string | null;
};

type CatalogCourse = {
  id: string;
  title?: string;
  thumbnail_url?: string | null;
  short_description?: string | null;
  description?: string | null;
  is_free?: boolean;
  price?: number | null;
  list_price?: number | null;
  original_price?: number | null;
  discount_percent?: number | null;
  discount_percentage?: number | null;
  category?: string | null;
  is_featured?: boolean;
  is_certified?: boolean;
  organization_name?: string | null;
  school_name?: string | null;
  org_name?: string | null;
  certifying_agency_name?: string | null;
  course_code?: string | null;
  level?: string | null;
  duration?: string | number | null;
};

type OrgBrand = {
  id?: string;
  name?: string | null;
  logo_url?: string | null;
  slug?: string | null;
};

type CertifierEntry = {
  id?: string;
  name?: string | null;
  short_name?: string | null;
  logo_url?: string | null;
  is_default?: boolean;
};

type FilterKey = 'all' | 'featured' | 'free' | 'certified';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Featured' },
  { key: 'free', label: 'Free' },
  { key: 'certified', label: 'Certified' },
];

function offeringLabel(c: {
  organization_name?: string | null;
  school_name?: string | null;
  org_name?: string | null;
  certifying_agency_name?: string | null;
}): string | null {
  const label =
    c.organization_name || c.school_name || c.org_name || c.certifying_agency_name || null;
  return label ? String(label).trim() || null : null;
}

function formatPrice(c: CatalogCourse): {
  label: string;
  discount?: string | null;
  strike?: string | null;
} {
  const free = Boolean(c.is_free) || Number(c.price || 0) <= 0;
  if (free) return { label: 'Free' };

  const price = Number(c.price || 0);
  const list =
    c.list_price != null
      ? Number(c.list_price)
      : c.original_price != null
        ? Number(c.original_price)
        : null;
  let discountPct =
    c.discount_percent != null
      ? Number(c.discount_percent)
      : c.discount_percentage != null
        ? Number(c.discount_percentage)
        : null;
  if ((discountPct == null || !Number.isFinite(discountPct)) && list != null && list > price && price > 0) {
    discountPct = Math.round(((list - price) / list) * 100);
  }
  const strike = list != null && list > price ? `KES ${list}` : null;
  const discount =
    discountPct != null && discountPct > 0 ? `${Math.round(discountPct)}% off` : null;
  return { label: `KES ${price}`, discount, strike };
}

function CourseMedia({ uri }: { uri?: string | null }) {
  const { palette } = useAppTheme();
  if (uri) return <Image source={{ uri }} style={styles.thumb} />;
  return (
    <View style={[styles.thumb, styles.thumbPh, { backgroundColor: rgba(palette.secondary, 0.16) }]}>
      <Ionicons name="book-outline" size={26} color={palette.primary} />
    </View>
  );
}

/** Section heading in the dashboard style: a short accent bar before the label. */
function SectionTitle({ label, accent, style }: { label: string; accent: string; style?: object }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={[styles.sectionMarker, { backgroundColor: accent }]} />
      <Text style={styles.section}>{label}</Text>
    </View>
  );
}

/** Mirrors web `CourseOrgBrandBadge` — delivering-org logo + "Partnership with" label. */
function OrgBrandBadge({ brand }: { brand: OrgBrand | null }) {
  const name = brand?.name?.trim();
  if (!name) return null;
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View style={styles.orgBadge}>
      {brand?.logo_url ? (
        <Image source={{ uri: brand.logo_url }} style={styles.orgBadgeLogo} />
      ) : (
        <View style={[styles.orgBadgeLogo, styles.orgBadgeLogoPh]}>
          <Text style={styles.orgBadgeInitials}>{initials}</Text>
        </View>
      )}
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text style={styles.orgBadgeLabel}>Partnership with</Text>
        <Text style={styles.orgBadgeName} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

/** Institution · level · duration, for the second line of a course row. */
function secondaryLine(c: CatalogCourse, brandName?: string | null): string {
  const parts: string[] = [];
  const school = brandName?.trim() || offeringLabel(c);
  if (school) parts.push(school);
  const level = String(c.level ?? '').trim();
  if (level) parts.push(level.charAt(0).toUpperCase() + level.slice(1));
  const dur = c.duration;
  if (typeof dur === 'number' && Number.isFinite(dur) && dur > 0) parts.push(`${dur} hrs`);
  else if (typeof dur === 'string' && dur.trim()) parts.push(dur.trim());
  if (!parts.length && c.category) parts.push(String(c.category));
  return parts.join(' · ');
}

/** Courses per batch from /platform/courses/catalog-page (server pages with limit/offset, max 48). */
const PAGE_SIZE = 20;
/** Fewer rows than this on screen (after filters) and more on the server: fetch the next batch. */
const MIN_VISIBLE = 12;
const SEARCH_DEBOUNCE_MS = 300;

type CatalogPage = {
  items: CatalogCourse[];
  total?: number;
  org_brand_by_course?: Record<string, OrgBrand>;
  certifiers_by_course?: Record<string, CertifierEntry[]>;
};

const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => ({ id: `__sk${i}` }) as CatalogCourse);

export function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const bottomBarSpace = useBottomBarSpace();
  const navigation = useNavigation<NativeStackNavigationProp<CoursesStackParamList>>();
  const { palette } = useAppTheme();
  const [enrolled, setEnrolled] = useState<Enrolled[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [orgBrandByCourse, setOrgBrandByCourse] = useState<Record<string, OrgBrand>>({});
  const [certifiersByCourse, setCertifiersByCourse] = useState<Record<string, CertifierEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [headerHeight, setHeaderHeight] = useState(0);

  const listRef = useRef<FlatList<CatalogCourse>>(null);
  // Paging cursor + guards live in refs so onEndReached never sees stale values.
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const queryRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  // Only the newest reset (search, pull-to-refresh) may write to the screen.
  const loadRun = useRef(0);

  const loadEnrolled = useCallback(() => {
    void nestAuthGet<{ items: Enrolled[] }>('/platform/courses/mine?limit=40')
      .then((mine) => setEnrolled(mine?.items || []))
      .catch((e) => log.warn('Courses', 'enrolled load failed', e instanceof Error ? e.message : String(e)));
  }, []);

  /**
   * One batch of the catalogue. `reset` starts again at offset 0 (new search / refresh) and cancels the
   * request still on its way; otherwise it appends the next batch. Rows stream in a batch at a time.
   */
  const fetchPage = useCallback(async (reset: boolean, opts?: { silent?: boolean }) => {
    if (!reset && (inFlightRef.current || !hasMoreRef.current)) return;
    if (reset) {
      abortRef.current?.abort();
      loadRun.current += 1;
      offsetRef.current = 0;
      hasMoreRef.current = true;
      if (!opts?.silent) setLoading(true);
    } else {
      setLoadingMore(true);
    }
    const run = loadRun.current;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    inFlightRef.current = true;
    setMoreError(false);
    const offset = offsetRef.current;
    const q = queryRef.current;
    const path =
      `/platform/courses/catalog-page?limit=${PAGE_SIZE}&offset=${offset}&order=catalog` +
      (q ? `&q=${encodeURIComponent(q)}` : '');
    try {
      const page = await nestAuthGet<CatalogPage>(path, ctrl.signal);
      if (run !== loadRun.current) return;
      const items = page?.items || [];
      if (reset) seenRef.current = new Set();
      const fresh: CatalogCourse[] = [];
      for (const item of items) {
        const id = String(item?.id ?? '');
        if (!id || seenRef.current.has(id)) continue;
        seenRef.current.add(id);
        fresh.push(item);
      }
      setCatalog((prev) => (reset ? fresh : [...prev, ...fresh]));
      setOrgBrandByCourse((prev) => ({ ...(reset ? {} : prev), ...(page?.org_brand_by_course || {}) }));
      setCertifiersByCourse((prev) => ({ ...(reset ? {} : prev), ...(page?.certifiers_by_course || {}) }));
      offsetRef.current = offset + items.length;
      const total = Number(page?.total);
      hasMoreRef.current =
        items.length >= PAGE_SIZE && (!Number.isFinite(total) || total <= 0 || offsetRef.current < total);
      setHasMore(hasMoreRef.current);
      if (reset) setError(null);
    } catch (e) {
      if (ctrl.signal.aborted || run !== loadRun.current) return;
      const msg = e instanceof Error ? e.message : 'Could not load courses';
      log.warn('Courses', 'load failed', msg);
      if (reset) setError(msg);
      else setMoreError(true);
    } finally {
      if (run === loadRun.current) {
        inFlightRef.current = false;
        setLoadingMore(false);
        if (reset) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadEnrolled();
    return () => abortRef.current?.abort();
  }, [loadEnrolled]);

  // Typing waits a moment before asking the server; the search starts again at the first batch.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    queryRef.current = debouncedQuery;
    void fetchPage(true);
  }, [debouncedQuery, fetchPage]);

  const openCourse = (courseId: string, title?: string, tab?: string) => {
    const path = tab ? `/courses/${courseId}/${tab}` : `/courses/${courseId}`;
    navigation.navigate('CourseWeb', {
      path,
      title: title || 'Course',
    });
  };

  /** Enrolled courses open the learn path (same as web). */
  const openEnrolled = (courseId: string, title?: string) => {
    navigation.navigate('CourseWeb', {
      path: `/courses/${courseId}/learn`,
      title: title || 'Course',
    });
  };

  const enrolledIds = useMemo(() => new Set(enrolled.map((e) => e.course_id)), [enrolled]);

  // The server pages and searches (q); the Featured / Free / Certified chips filter the batches already in.
  const browse = useMemo(() => {
    return catalog
      .filter((c) => c.id && !enrolledIds.has(c.id))
      .filter((c) => {
        if (filter === 'free') return Boolean(c.is_free) || Number(c.price || 0) <= 0;
        if (filter === 'featured') return Boolean(c.is_featured);
        if (filter === 'certified') return Boolean(c.is_certified);
        return true;
      });
  }, [catalog, enrolledIds, filter]);

  // A filter (or the enrolled courses) can leave a batch nearly empty: keep streaming until the screen has rows.
  useEffect(() => {
    if (loading || loadingMore || !hasMore || moreError || error) return;
    if (browse.length < MIN_VISIBLE) void fetchPage(false);
  }, [browse.length, loading, loadingMore, hasMore, moreError, error, fetchPage]);

  const headerPad = floatingHeaderInset(insets.top);

  const getItemLayout = useCallback(
    (_: ArrayLike<CatalogCourse> | null | undefined, index: number) => ({
      length: COURSE_ROW_HEIGHT,
      offset: headerPad + headerHeight + COURSE_ROW_HEIGHT * index,
      index,
    }),
    [headerPad, headerHeight],
  );

  const renderItem = useCallback(
    ({ item }: { item: CatalogCourse }) => {
      if (item.id.startsWith('__sk')) return <CourseTableSkeletonRow />;
      const orgBrand = orgBrandByCourse[item.id] || null;
      const certifiers = certifiersByCourse[item.id] || [];
      const primary = certifiers.find((e) => e.is_default) || certifiers[0];
      const certifier = (primary?.short_name || primary?.name || '').trim() || null;
      return (
        <CourseTableRow
          title={item.title || 'Course'}
          secondary={secondaryLine(item, orgBrand?.name)}
          thumbnailUrl={item.thumbnail_url}
          pricing={formatPrice(item)}
          certified={Boolean(item.is_certified)}
          featured={Boolean(item.is_featured)}
          certifier={certifier}
          onPress={() => openCourse(item.id, item.title)}
        />
      );
    },
    // openCourse only uses navigation, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgBrandByCourse, certifiersByCourse],
  );

  const footerState: 'loading' | 'more' | 'end' | 'empty' | 'error' | null = loading
    ? null
    : error && !catalog.length
      ? 'empty'
      : loadingMore
        ? 'loading'
        : moreError
          ? 'error'
          : !browse.length
            ? 'empty'
            : hasMore
              ? 'more'
              : 'end';

  return (
    <View style={[styles.root, { backgroundColor: palette.muted }]}>
      <ThemedBackdrop />
      <FlatList
        ref={listRef}
        data={loading ? SKELETON_ROWS : browse}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={40}
        windowSize={9}
        removeClippedSubviews
        contentContainerStyle={[styles.listContent, { paddingTop: headerPad, paddingBottom: bottomBarSpace + 16 }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEnrolled();
              void fetchPage(true, { silent: true });
            }}
            tintColor={Colors.primary}
          />
        }
        onEndReached={() => {
          if (loading) return;
          void fetchPage(false);
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View onLayout={(e) => setHeaderHeight(Math.round(e.nativeEvent.layout.height))}>
            <View style={styles.titleRow}>
              <View style={[styles.titleMarker, { backgroundColor: palette.secondary }]} />
              <Text style={styles.h1}>Courses and eLearning</Text>
            </View>
            <Text style={styles.sub}>Browse, enroll, learn, and get certificates — same as web.</Text>
            {error ? (
              <View style={styles.errBox}>
                <Ionicons name="warning-outline" size={18} color="#B45309" />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            {enrolled.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <SectionTitle label="Continue learning" accent={palette.secondary} />
                {enrolled.map((item) => {
                  const orgBrand = orgBrandByCourse[item.course_id] || null;
                  const school = orgBrand?.name?.trim() || offeringLabel(item);
                  return (
                    <Pressable
                      key={item.enrollment_id}
                      style={styles.cardLarge}
                      onPress={() => openEnrolled(item.course_id, item.title)}
                    >
                      {orgBrand?.name ? <OrgBrandBadge brand={orgBrand} /> : null}
                      <Text style={styles.cardTitleFull} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {!orgBrand?.name && school ? <Text style={[styles.school, { color: palette.primary }]}>{school}</Text> : null}
                      <View style={styles.cardBodyRow}>
                        <CourseMedia uri={item.thumbnail_url} />
                        <View style={styles.cardBodyRight}>
                          {item.short_description ? (
                            <Text style={styles.desc} numberOfLines={2}>
                              {item.short_description}
                            </Text>
                          ) : null}
                          <View style={[styles.progressTrack, { backgroundColor: rgba(palette.primary, 0.1) }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  backgroundColor: palette.secondary,
                                  width: `${Math.max(2, Math.min(100, Math.round(Number(item.progress_percent || 0))))}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.meta}>
                            {Math.round(Number(item.progress_percent || 0))}% · Continue
                          </Text>
                        </View>
                        <View style={[styles.playTile, { backgroundColor: palette.primary }]}>
                          <Ionicons name="play" size={16} color={palette.secondary} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={Colors.mutedForeground} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search courses"
                placeholderTextColor={Colors.mutedForeground}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>

            <View style={styles.filters}>
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[styles.chip, on && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                  >
                    <Text style={[styles.chipText, on && { color: palette.secondary }]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <SectionTitle label="Browse" accent={palette.secondary} style={{ marginTop: 12 }} />
            <CourseTableHeader />
          </View>
        }
        ListFooterComponent={
          footerState ? (
            <CourseTableFooter
              state={footerState}
              message={
                error && !catalog.length
                  ? 'Pull down to try again.'
                  : query || filter !== 'all'
                    ? 'No courses match your filters.'
                    : 'No catalog courses right now.'
              }
            />
          ) : loading ? (
            <CourseTableFooter state="loading" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 100, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 4 },
  titleMarker: { width: 4, height: 22, borderRadius: 2, marginRight: 10 },
  h1: { fontSize: 24, fontFamily: 'Roboto_700Bold', color: INK, flexShrink: 1 },
  sub: { color: Colors.mutedForeground, marginBottom: 16, fontSize: 14, marginLeft: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 8 },
  sectionMarker: { width: 3, height: 14, borderRadius: 2, marginRight: 8 },
  section: { fontSize: 16, fontFamily: 'Roboto_700Bold', color: INK },
  playTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  empty: { color: Colors.mutedForeground, marginBottom: 12, fontSize: 14 },
  muted: { color: Colors.mutedForeground },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...CARD_SURFACE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.foreground, padding: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: CARD.border,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: INK },
  cardLarge: {
    flexDirection: 'column',
    ...CARD_SURFACE,
    padding: CARD.padding,
    marginBottom: 12,
    marginTop: 6,
    gap: 8,
  },
  cardTitleFull: { fontSize: 16, fontFamily: 'Roboto_700Bold', color: INK, lineHeight: 21 },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#E8F5F0' },
  thumbPh: { alignItems: 'center', justifyContent: 'center' },
  cardBodyRight: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 },
  desc: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  school: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  meta: { fontSize: 14, color: Colors.mutedForeground, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  price: { fontSize: 16, fontWeight: '700', color: Colors.foreground },
  strike: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: 'rgba(232,93,4,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  discountText: { fontSize: 12, fontWeight: '700', color: Colors.orange },
  certified: { fontSize: 13, color: Colors.mutedForeground },
  cardChevron: { alignSelf: 'center' },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: CARD.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  orgBadgeLogo: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff' },
  orgBadgeLogoPh: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  orgBadgeInitials: { fontSize: 12, fontWeight: '800', color: '#fff' },
  orgBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  orgBadgeName: { fontSize: 13, fontWeight: '700', color: Colors.foreground },
  certWrap: { marginTop: 2, gap: 2 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  certLogo: { width: 16, height: 16, borderRadius: 4, backgroundColor: '#fff' },
  certPrimary: { fontSize: 12, fontWeight: '700', color: Colors.foreground, flexShrink: 1 },
  certOthers: { fontSize: 11, color: Colors.mutedForeground, marginLeft: 19 },
  errBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errText: { flex: 1, color: '#92400E', fontSize: 13 },
  skeletonCard: { opacity: 0.7 },
  skLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2EBE6',
    width: '80%',
  },
});
