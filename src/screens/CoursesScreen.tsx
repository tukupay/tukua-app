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
  ScrollView,
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
import { CARD, CARD_SURFACE, INK, ThemedBackdrop } from '../components/theme/ThemedPage';
import { rgba } from '../theme/color';
import {
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
  organization_id?: string | null;
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

type FilterKey = 'all' | 'enrolled' | 'featured' | 'free' | 'paid' | 'certified';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'enrolled', label: 'My courses' },
  { key: 'featured', label: 'Featured' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
  { key: 'certified', label: 'Certified' },
];

/** "digital-skills" → "Digital skills"; keeps "CBC Primary" / "8-4-4 Secondary" as they are. */
function prettyLabel(raw: string): string {
  const t = raw.trim();
  if (/[A-Z]/.test(t)) return t;
  const words = t.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Catalogue levels grouped into a few tags (PP1 → Pre-primary, Grade 5 → Grades 4–6, Form 3 → Form 1–4). */
const LEVEL_BANDS = [
  'Pre-primary',
  'Grades 1–3',
  'Grades 4–6',
  'Grades 7–9',
  'Grades 10–12',
  'Form 1–4',
  'Beginner',
  'Intermediate',
  'Advanced',
];

function levelBand(level?: string | null): string | null {
  const l = String(level ?? '').trim().toLowerCase();
  if (!l) return null;
  if (/^pp\s*\d/.test(l) || l.includes('pre-primary') || l.includes('pre primary')) return 'Pre-primary';
  const grade = l.match(/^grade\s*(\d+)/);
  if (grade) {
    const g = Number(grade[1]);
    if (g <= 3) return 'Grades 1–3';
    if (g <= 6) return 'Grades 4–6';
    if (g <= 9) return 'Grades 7–9';
    return 'Grades 10–12';
  }
  if (/^form\s*\d/.test(l)) return 'Form 1–4';
  if (l.startsWith('beginner')) return 'Beginner';
  if (l.startsWith('intermediate')) return 'Intermediate';
  if (l.startsWith('advanced')) return 'Advanced';
  return prettyLabel(String(level));
}

function isFreeCourse(c: CatalogCourse): boolean {
  return Boolean(c.is_free) || Number(c.price || 0) <= 0;
}

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

/** One labelled, sideways-scrolling row of filter tags ("All" first). Tap a selected tag again to clear it. */
function TagRow({
  label,
  icon,
  tags,
  value,
  onChange,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tags: { key: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const { palette } = useAppTheme();
  if (tags.length < 2 && !value) return null;
  return (
    <View style={styles.tagRow}>
      <View style={styles.tagLabel}>
        <Ionicons name={icon} size={13} color={Colors.mutedForeground} />
        <Text style={styles.tagLabelText}>{label}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScroll}
        keyboardShouldPersistTaps="handled"
      >
        {[{ key: '', label: 'All' }, ...tags].map((t) => {
          const on = t.key ? value === t.key : !value;
          return (
            <Pressable
              key={t.key || '__all'}
              onPress={() => onChange(t.key ? (value === t.key ? null : t.key) : null)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label}: ${t.label}`}
              style={[
                styles.tag,
                on && { backgroundColor: rgba(palette.secondary, 0.22), borderColor: palette.secondary },
              ]}
            >
              <Text style={[styles.tagText, on && { color: palette.primary }]} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

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
  /** Subject / category tag (client-side over the batches already in). */
  const [category, setCategory] = useState<string | null>(null);
  /** Level band tag (client-side). */
  const [level, setLevel] = useState<string | null>(null);
  /** Provider (university / academy): the server filters by organization_id. */
  const [providerId, setProviderId] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  // Tags seen so far; kept across searches so a chip never vanishes while it is selected.
  const [categoriesSeen, setCategoriesSeen] = useState<string[]>([]);
  const [providersSeen, setProvidersSeen] = useState<Record<string, string>>({});

  const listRef = useRef<FlatList<CatalogCourse>>(null);
  // Paging cursor + guards live in refs so onEndReached never sees stale values.
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const queryRef = useRef('');
  const providerRef = useRef<string | null>(null);
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
    const org = providerRef.current;
    const path =
      `/platform/courses/catalog-page?limit=${PAGE_SIZE}&offset=${offset}&order=catalog` +
      (q ? `&q=${encodeURIComponent(q)}` : '') +
      (org ? `&organization_id=${encodeURIComponent(org)}` : '');
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
      // Remember every subject and provider seen, for the filter tags.
      const cats = items.map((c) => String(c.category ?? '').trim()).filter(Boolean);
      if (cats.length) {
        setCategoriesSeen((prev) => {
          const next = [...prev];
          for (const c of cats) if (!next.includes(c)) next.push(c);
          return next.length === prev.length ? prev : next;
        });
      }
      const brands = page?.org_brand_by_course || {};
      setProvidersSeen((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const c of items) {
          const id = String(c.organization_id ?? '').trim();
          if (!id || next[id]) continue;
          const name = brands[c.id]?.name?.trim() || offeringLabel(c);
          if (name) {
            next[id] = name;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
      offsetRef.current = offset + items.length;
      const pageTotal = Number(page?.total);
      if (reset) setTotal(Number.isFinite(pageTotal) && pageTotal > 0 ? pageTotal : null);
      hasMoreRef.current =
        items.length >= PAGE_SIZE && (!Number.isFinite(pageTotal) || pageTotal <= 0 || offsetRef.current < pageTotal);
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
    providerRef.current = providerId;
    void fetchPage(true);
  }, [debouncedQuery, providerId, fetchPage]);

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

  const showEnrolled = filter === 'enrolled';

  // The server pages, searches (q) and filters by provider; the other tags filter the batches already in.
  const browse = useMemo(() => {
    if (showEnrolled) return [];
    return catalog
      .filter((c) => c.id && !enrolledIds.has(c.id))
      .filter((c) => {
        if (filter === 'free') return isFreeCourse(c);
        if (filter === 'paid') return !isFreeCourse(c);
        if (filter === 'featured') return Boolean(c.is_featured);
        if (filter === 'certified') return Boolean(c.is_certified);
        return true;
      })
      .filter((c) => !category || String(c.category ?? '').trim() === category)
      .filter((c) => !level || levelBand(c.level) === level);
  }, [catalog, enrolledIds, filter, category, level, showEnrolled]);

  /** "My courses" tag: the enrolled courses as table rows (searched on the phone). */
  const enrolledRows = useMemo<CatalogCourse[]>(() => {
    if (!showEnrolled) return [];
    const q = query.trim().toLowerCase();
    return enrolled
      .filter((e) => !q || String(e.title || '').toLowerCase().includes(q))
      .map((e) => ({
        id: e.course_id,
        title: e.title,
        thumbnail_url: e.thumbnail_url,
        short_description: e.short_description,
        organization_name: e.organization_name ?? e.school_name ?? e.org_name ?? null,
      }));
  }, [showEnrolled, enrolled, query]);

  const progressByCourse = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of enrolled) m[e.course_id] = Number(e.progress_percent || 0);
    return m;
  }, [enrolled]);

  // A filter (or the enrolled courses) can leave a batch nearly empty: keep streaming until the screen has rows.
  useEffect(() => {
    if (showEnrolled || loading || loadingMore || !hasMore || moreError || error) return;
    if (browse.length < MIN_VISIBLE) void fetchPage(false);
  }, [showEnrolled, browse.length, loading, loadingMore, hasMore, moreError, error, fetchPage]);

  const headerPad = floatingHeaderInset(insets.top);

  const categoryTags = useMemo(
    () => [...categoriesSeen].sort((a, b) => a.localeCompare(b)),
    [categoriesSeen],
  );
  const levelTags = useMemo(() => {
    const present = new Set(catalog.map((c) => levelBand(c.level)).filter((x): x is string => Boolean(x)));
    if (level) present.add(level);
    return [...present].sort((a, b) => {
      const ia = LEVEL_BANDS.indexOf(a);
      const ib = LEVEL_BANDS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
  }, [catalog, level]);
  const providerTags = useMemo(
    () => Object.entries(providersSeen).sort((a, b) => a[1].localeCompare(b[1])),
    [providersSeen],
  );
  const activeTagCount =
    (filter !== 'all' ? 1 : 0) + (category ? 1 : 0) + (level ? 1 : 0) + (providerId ? 1 : 0);
  const clearTags = () => {
    setFilter('all');
    setCategory(null);
    setLevel(null);
    setProviderId(null);
  };

  const renderItem = useCallback(
    ({ item }: { item: CatalogCourse }) => {
      if (item.id.startsWith('__sk')) return <CourseTableSkeletonRow />;
      const orgBrand = orgBrandByCourse[item.id] || null;
      const certifiers = certifiersByCourse[item.id] || [];
      const primary = certifiers.find((e) => e.is_default) || certifiers[0];
      const certifier = (primary?.short_name || primary?.name || '').trim() || null;
      const enrolledRow = showEnrolled;
      return (
        <CourseTableRow
          title={item.title || 'Course'}
          secondary={secondaryLine(item, orgBrand?.name)}
          thumbnailUrl={item.thumbnail_url}
          pricing={formatPrice(item)}
          certified={Boolean(item.is_certified)}
          featured={Boolean(item.is_featured)}
          certifier={certifier}
          progressPercent={enrolledRow ? progressByCourse[item.id] ?? 0 : null}
          onPress={() => (enrolledRow ? openEnrolled(item.id, item.title) : openCourse(item.id, item.title))}
        />
      );
    },
    // openCourse / openEnrolled only use navigation, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgBrandByCourse, certifiersByCourse, showEnrolled, progressByCourse],
  );

  const footerState: 'loading' | 'more' | 'end' | 'empty' | 'error' | null = showEnrolled
    ? enrolledRows.length
      ? 'end'
      : 'empty'
    : loading
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
        data={showEnrolled ? enrolledRows : loading ? SKELETON_ROWS : browse}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
          <View>
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

            {enrolled.length > 0 && !showEnrolled ? (
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
                const label = f.key === 'enrolled' && enrolled.length ? `${f.label} · ${enrolled.length}` : f.label;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.chip, on && { backgroundColor: palette.primary, borderColor: palette.primary }]}
                  >
                    <Text style={[styles.chipText, on && { color: palette.secondary }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!showEnrolled ? (
              <>
                <TagRow
                  label="Subject"
                  icon="pricetags-outline"
                  tags={categoryTags.map((c) => ({ key: c, label: prettyLabel(c) }))}
                  value={category}
                  onChange={setCategory}
                />
                <TagRow
                  label="Level"
                  icon="stats-chart-outline"
                  tags={levelTags.map((l) => ({ key: l, label: l }))}
                  value={level}
                  onChange={setLevel}
                />
                <TagRow
                  label="Provider"
                  icon="business-outline"
                  tags={providerTags.map(([id, name]) => ({ key: id, label: name }))}
                  value={providerId}
                  onChange={setProviderId}
                />
              </>
            ) : null}

            <View style={styles.browseRow}>
              <SectionTitle
                label={showEnrolled ? 'My courses' : 'Browse'}
                accent={palette.secondary}
                style={{ marginTop: 12, flex: 1 }}
              />
              {activeTagCount > 0 ? (
                <Pressable onPress={clearTags} hitSlop={8} accessibilityRole="button" style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={14} color={palette.primary} />
                  <Text style={[styles.clearText, { color: palette.primary }]}>Clear filters</Text>
                </Pressable>
              ) : null}
            </View>
            <CourseTableHeader
              count={
                showEnrolled
                  ? `${enrolledRows.length}`
                  : !loading && !category && !level && (filter === 'all' || filter === 'certified') && total
                    ? `${total}`
                    : null
              }
            />
          </View>
        }
        ListFooterComponent={
          footerState ? (
            <CourseTableFooter
              state={footerState}
              message={
                error && !catalog.length
                  ? 'Pull down to try again.'
                  : showEnrolled
                    ? query
                      ? 'None of your courses match that search.'
                      : 'You have not enrolled in a course yet. Tap All to browse.'
                    : query || activeTagCount > 0
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
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  tagLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 74 },
  tagLabelText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', color: Colors.mutedForeground },
  tagScroll: { gap: 6, paddingRight: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: CARD.border,
    maxWidth: 220,
  },
  tagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: INK },
  browseRow: { flexDirection: 'row', alignItems: 'center' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingVertical: 4 },
  clearText: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold' },
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
