/**
 * Native Courses tab — Nest catalog + enrolled list.
 * Course detail / learn / exam / pay stay in-app via WebView (full web feature set).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNestApiBaseUrl } from '../lib/localHost';
import { resolveNestAccessTokenForWebView } from '../lib/platformNestAuth';
import { humanizeError } from '../lib/humanizeError';
import { Colors } from '../theme/yana';
import { floatingHeaderInset } from '../constants/layout';
import { log } from '../lib/logger';
import type { CoursesStackParamList } from '../navigation/CoursesStack';
import { GreenPattern } from '../components/dashboard/DashboardBackground';
import { useAppTheme } from '../context/AppThemeContext';

async function nestAuthGet<T>(path: string): Promise<T> {
  const token = await resolveNestAccessTokenForWebView();
  if (!token) throw new Error('Sign in again to load courses.');
  const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const raw =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      `Request failed (${res.status})`;
    throw new Error(humanizeError(raw));
  }
  const data =
    json && typeof json === 'object' && 'data' in json
      ? (json as { data: T }).data
      : (json as T);
  return data;
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
  if (uri) return <Image source={{ uri }} style={styles.thumb} />;
  return (
    <View style={[styles.thumb, styles.thumbPh]}>
      <Ionicons name="book-outline" size={26} color={Colors.primary} />
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

/** Mirrors web `CourseCertifierLabels` — primary certifying agency (with logo) + others. */
function CertifierLabels({ entries }: { entries: CertifierEntry[] }) {
  const named = entries.filter((e) => (e.name || e.short_name)?.trim());
  if (!named.length) return null;
  const primary = named.find((e) => e.is_default) || named[0];
  const others = named.filter((e) => e !== primary);
  const primaryName = (primary.name || primary.short_name || '').trim();
  const othersLabel = others
    .map((e) => (e.name || e.short_name || '').trim())
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.certWrap}>
      <View style={styles.certRow}>
        {primary.logo_url ? (
          <Image source={{ uri: primary.logo_url }} style={styles.certLogo} />
        ) : (
          <Ionicons name="ribbon-outline" size={13} color="#B45309" />
        )}
        <Text style={styles.certPrimary} numberOfLines={1}>
          {primaryName}
        </Text>
      </View>
      {othersLabel ? (
        <Text style={styles.certOthers} numberOfLines={1}>
          {othersLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<CoursesStackParamList>>();
  const { palette } = useAppTheme();
  const [enrolled, setEnrolled] = useState<Enrolled[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [orgBrandByCourse, setOrgBrandByCourse] = useState<Record<string, OrgBrand>>({});
  const [certifiersByCourse, setCertifiersByCourse] = useState<Record<string, CertifierEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [pageSize] = useState(20);
  const [visibleCount, setVisibleCount] = useState(20);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mine, page] = await Promise.all([
        nestAuthGet<{ items: Enrolled[] }>('/platform/courses/mine?limit=40'),
        nestAuthGet<{
          items: CatalogCourse[];
          org_brand_by_course?: Record<string, OrgBrand>;
          certifiers_by_course?: Record<string, CertifierEntry[]>;
        }>('/platform/courses/catalog-page'),
      ]);
      setEnrolled(mine?.items || []);
      setCatalog(page?.items || []);
      setOrgBrandByCourse(page?.org_brand_by_course || {});
      setCertifiersByCourse(page?.certifiers_by_course || {});
      setVisibleCount(20);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load courses';
      setError(msg);
      log.warn('Courses', 'load failed', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const browseAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((c) => c.id && !enrolledIds.has(c.id))
      .filter((c) => {
        if (filter === 'free') return Boolean(c.is_free) || Number(c.price || 0) <= 0;
        if (filter === 'featured') return Boolean(c.is_featured);
        if (filter === 'certified') return Boolean(c.is_certified);
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        const school = offeringLabel(c) || '';
        const hay = `${c.title || ''} ${c.short_description || ''} ${c.category || ''} ${school}`.toLowerCase();
        return hay.includes(q);
      });
  }, [catalog, enrolledIds, filter, query]);

  const browse = useMemo(() => browseAll.slice(0, visibleCount), [browseAll, visibleCount]);

  const headerPad = floatingHeaderInset(insets.top);

  return (
    <View style={[styles.root, { backgroundColor: palette.muted }]}>
      <LinearGradient
        colors={[palette.primary, palette.tertiary || palette.primary, palette.muted]}
        locations={[0, 0.22, 0.48]}
        style={StyleSheet.absoluteFill}
      />
      <GreenPattern style={{ height: headerPad + 120 }} darker />
      <FlatList
        data={loading ? ([{ id: '__sk1' }, { id: '__sk2' }, { id: '__sk3' }] as CatalogCourse[]) : browse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingTop: headerPad }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={Colors.primary}
          />
        }
        onEndReached={() => {
          if (loading) return;
          if (visibleCount < browseAll.length) setVisibleCount((n) => n + pageSize);
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>Courses and eLearning</Text>
            <Text style={styles.sub}>Browse, enroll, learn, and get certificates — same as web.</Text>
            {error ? (
              <View style={styles.errBox}>
                <Ionicons name="warning-outline" size={18} color="#B45309" />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            {enrolled.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.section}>Continue learning</Text>
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
                      {!orgBrand?.name && school ? <Text style={styles.school}>{school}</Text> : null}
                      <View style={styles.cardBodyRow}>
                        <CourseMedia uri={item.thumbnail_url} />
                        <View style={styles.cardBodyRight}>
                          {item.short_description ? (
                            <Text style={styles.desc} numberOfLines={2}>
                              {item.short_description}
                            </Text>
                          ) : null}
                          <Text style={styles.meta}>
                            {Math.round(Number(item.progress_percent || 0))}% · Continue
                          </Text>
                        </View>
                        <Ionicons name="play-circle" size={28} color={Colors.primary} style={styles.cardChevron} />
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
                onChangeText={(t) => {
                  setQuery(t);
                  setVisibleCount(20);
                }}
                placeholder="Search courses"
                placeholderTextColor={Colors.mutedForeground}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <View style={styles.filters}>
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => {
                      setFilter(f.key);
                      setVisibleCount(20);
                    }}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.section, { marginTop: 12 }]}>Browse</Text>
          </View>
        }
        renderItem={({ item }) =>
          loading || item.id.startsWith('__sk') ? (
            <View style={[styles.cardLarge, styles.skeletonCard]}>
              <View style={[styles.skLine, { width: '70%' }]} />
              <View style={styles.cardBodyRow}>
                <View style={[styles.thumb, styles.thumbPh]} />
                <View style={styles.cardBodyRight}>
                  <View style={[styles.skLine, { width: '90%' }]} />
                  <View style={[styles.skLine, { width: '55%', marginTop: 10 }]} />
                </View>
              </View>
            </View>
          ) : (
            (() => {
              const pricing = formatPrice(item);
              const orgBrand = orgBrandByCourse[item.id] || null;
              const school = orgBrand?.name?.trim() || offeringLabel(item);
              const certifiers = certifiersByCourse[item.id] || [];
              const desc = item.short_description || item.description || '';
              return (
                <Pressable style={styles.cardLarge} onPress={() => openCourse(item.id, item.title)}>
                  {orgBrand?.name ? <OrgBrandBadge brand={orgBrand} /> : null}
                  <Text style={styles.cardTitleFull} numberOfLines={2}>
                    {item.title || 'Course'}
                  </Text>
                  {!orgBrand?.name && school ? <Text style={styles.school}>{school}</Text> : null}
                  <View style={styles.cardBodyRow}>
                    <CourseMedia uri={item.thumbnail_url} />
                    <View style={styles.cardBodyRight}>
                      {desc ? (
                        <Text style={styles.desc} numberOfLines={2}>
                          {desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </Text>
                      ) : null}
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>{pricing.label}</Text>
                        {pricing.strike ? <Text style={styles.strike}>{pricing.strike}</Text> : null}
                        {pricing.discount ? (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{pricing.discount}</Text>
                          </View>
                        ) : null}
                        {item.is_certified ? <Text style={styles.certified}> · Certified</Text> : null}
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.mutedForeground}
                      style={styles.cardChevron}
                    />
                  </View>
                  <CertifierLabels entries={certifiers} />
                </Pressable>
              );
            })()
          )
        }
        ListEmptyComponent={
          !error && !loading ? (
            <Text style={styles.empty}>
              {query || filter !== 'all' ? 'No courses match your filters.' : 'No catalog courses right now.'}
            </Text>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 12 }]}>
              Loading courses…
            </Text>
          ) : !loading && visibleCount < browseAll.length ? (
            <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 8 }]}>
              Scroll for more…
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 100, paddingHorizontal: 16 },
  h1: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { color: 'rgba(255,255,255,0.75)', marginBottom: 16, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 10, marginTop: 8 },
  empty: { color: Colors.mutedForeground, marginBottom: 12, fontSize: 14 },
  muted: { color: Colors.mutedForeground },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.foreground, padding: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.foreground },
  chipTextOn: { color: '#fff' },
  cardLarge: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    marginTop: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    gap: 8,
  },
  cardTitleFull: { fontSize: 17, fontWeight: '700', color: Colors.foreground, lineHeight: 22 },
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
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
