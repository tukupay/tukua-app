/**
 * Native Courses tab — Nest API only (no WebView).
 * Loads enrolled courses first, then catalog browse.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deskFetch } from '../lib/deskApi';
import { Colors } from '../theme/yana';
import { floatingHeaderInset } from '../constants/layout';
import { getWebBaseUrl } from '../lib/localHost';
import { log } from '../lib/logger';

type Enrolled = {
  enrollment_id: string;
  course_id: string;
  title: string;
  thumbnail_url?: string | null;
  progress_percent?: number;
  status?: string;
  payment_status?: string;
};

type CatalogCourse = {
  id: string;
  title?: string;
  thumbnail_url?: string | null;
  short_description?: string | null;
  is_free?: boolean;
  price?: number | null;
};

export function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const [enrolled, setEnrolled] = useState<Enrolled[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mine, page] = await Promise.all([
        deskFetch<{ items: Enrolled[] }>('/platform/courses/mine?limit=40'),
        deskFetch<{ items: CatalogCourse[] }>('/platform/courses/catalog-page'),
      ]);
      setEnrolled(mine?.items || []);
      setCatalog(page?.items || []);
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

  const openCourse = (courseId: string) => {
    const base = getWebBaseUrl().replace(/\/$/, '');
    void Linking.openURL(`${base}/courses/${courseId}`);
  };

  const enrolledIds = new Set(enrolled.map((e) => e.course_id));
  const browse = catalog.filter((c) => c.id && !enrolledIds.has(c.id)).slice(0, 40);

  const headerPad = floatingHeaderInset(insets.top);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Loading your courses…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#041F18', '#0A3D2E', '#F7FAF8']}
        locations={[0, 0.22, 0.48]}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={browse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: headerPad, paddingBottom: 100, paddingHorizontal: 16 }}
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
        ListHeaderComponent={
          <View>
            <Text style={styles.h1}>Courses</Text>
            <Text style={styles.sub}>Your enrollments first — then browse more.</Text>
            {error ? (
              <View style={styles.errBox}>
                <Ionicons name="warning-outline" size={18} color="#B45309" />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.section}>Enrolled</Text>
            {enrolled.length === 0 ? (
              <Text style={styles.empty}>No enrollments yet — pick a course below.</Text>
            ) : (
              enrolled.map((item) => (
                <Pressable key={item.enrollment_id} style={styles.card} onPress={() => openCourse(item.course_id)}>
                  {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPh]}>
                      <Ionicons name="book" size={22} color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.meta}>
                      {Math.round(Number(item.progress_percent || 0))}% · {item.status || 'enrolled'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                </Pressable>
              ))
            )}

            <Text style={[styles.section, { marginTop: 20 }]}>Browse</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openCourse(item.id)}>
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]}>
                <Ionicons name="book-outline" size={22} color={Colors.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title || 'Course'}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>
                {item.is_free ? 'Free' : item.price != null ? `KES ${item.price}` : item.short_description || 'Open'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
          </Pressable>
        )}
        ListEmptyComponent={
          !error ? <Text style={styles.empty}>No catalog courses right now.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  h1: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { color: 'rgba(255,255,255,0.75)', marginBottom: 16, fontSize: 14 },
  section: { fontSize: 16, fontWeight: '700', color: Colors.foreground, marginBottom: 10, marginTop: 8 },
  empty: { color: Colors.mutedForeground, marginBottom: 12, fontSize: 14 },
  muted: { color: Colors.mutedForeground },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#E8F5F0' },
  thumbPh: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  meta: { fontSize: 12, color: Colors.mutedForeground, marginTop: 4 },
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
});
