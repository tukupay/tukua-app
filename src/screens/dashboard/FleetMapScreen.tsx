import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackdrop } from '../../components/theme/ThemedPage';
import { ModuleBackBar, ModuleEmpty, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import {
  fetchFleetMap,
  fleetMapHtml,
  fleetMapUpdateScript,
  FleetMapData,
  FleetMapVehicle,
  timeAgo,
  tripKindLabel,
  vehicleIonicon,
} from '../../lib/fleetMap';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'FleetMap'>;

/** The phone on each bus sends its position about every 30 seconds; this screen asks every 15. */
const REFRESH_MS = 15_000;
const SPEED_LIMIT_KMH = 80;

function localDay(offset = 0): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function statusLabel(v: FleetMapVehicle): string {
  if (v.status === 'on_trip') return 'On a trip';
  if (v.status === 'workshop') return 'In the workshop';
  return 'Parked';
}

function clock(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Every school vehicle on one map, each with its own icon and colour, where it is now and the
 * path it has driven. Tap a vehicle to follow it. For school admins and security staff.
 */
export function FleetMapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [yesterday, setYesterday] = useState(false);
  const [data, setData] = useState<FleetMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [showPaths, setShowPaths] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await fetchFleetMap(yesterday ? localDay(-1) : undefined);
      setData(next);
      setError(null);
    } catch (e) {
      log.warn('fleet-map', 'load failed', e);
      setError(e instanceof Error ? e.message : 'Could not load the fleet map');
    } finally {
      setLoading(false);
    }
  }, [yesterday]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    void load();
    if (yesterday) return undefined;
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, yesterday]);

  const vehicles = useMemo(
    () =>
      (data?.vehicles ?? [])
        .filter((v) => v.status !== 'inactive')
        .sort((a, b) => Number(b.status === 'on_trip') - Number(a.status === 'on_trip') || a.name.localeCompare(b.name)),
    [data],
  );
  const picked = vehicles.find((v) => v.id === pickedId) ?? null;
  const live = Boolean(data?.live);
  const drawing = useMemo(() => ({ vehicles, live, pickedId, showPaths }), [vehicles, live, pickedId, showPaths]);

  // The page is loaded once; after that each change is drawn into it.
  const html = useMemo(() => fleetMapHtml({ vehicles: [], live: true, pickedId: null, showPaths: true }), []);
  useEffect(() => {
    if (mapReady) webRef.current?.injectJavaScript(fleetMapUpdateScript(drawing));
  }, [drawing, mapReady]);

  const onRoad = vehicles.filter((v) => v.status === 'on_trip').length;

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) }]}
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Transport</ModuleKicker>
        <ModuleScreenHeader title="Fleet map" description="Every vehicle, where it is and the path it has driven." />

        <View style={styles.toolbar}>
          <View style={styles.segment}>
            {[
              { key: false, label: 'Today, live' },
              { key: true, label: 'Yesterday' },
            ].map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  setYesterday(option.key);
                  setPickedId(null);
                }}
                style={[styles.segmentItem, yesterday === option.key && styles.segmentItemOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: yesterday === option.key }}>
                <Text style={[styles.segmentText, yesterday === option.key && styles.segmentTextOn]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => setShowPaths((v) => !v)}
            style={[styles.pathsBtn, showPaths && styles.pathsBtnOn]}
            accessibilityRole="switch"
            accessibilityState={{ checked: showPaths }}
            accessibilityLabel="Show paths">
            <Ionicons name="git-branch-outline" size={16} color={showPaths ? Colors.white : Colors.primary} />
            <Text style={[styles.pathsText, showPaths && styles.pathsTextOn]}>Paths</Text>
          </Pressable>
        </View>

        <Text style={styles.summary}>
          {loading && !data
            ? 'Fetching the fleet…'
            : live
              ? `${onRoad} on the road · ${vehicles.length} vehicles · updated ${clock(data?.refreshed_at)}`
              : `Where the fleet went yesterday · ${vehicles.length} vehicles`}
        </Text>

        {error && !data ? (
          <ModuleEmpty title="Could not load the fleet map" body={error} onRetry={() => void load()} />
        ) : (
          <View style={styles.mapWrap}>
            <WebView
              ref={webRef}
              source={{ html }}
              style={styles.map}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              nestedScrollEnabled
              onLoadEnd={() => setMapReady(true)}
              onMessage={(event) => {
                try {
                  const message = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
                  if (message.type === 'pick' && message.id) setPickedId((prev) => (prev === message.id ? null : (message.id ?? null)));
                } catch {
                  /* not ours */
                }
              }}
            />
            {loading && !data ? (
              <View style={styles.mapLoading} pointerEvents="none">
                <ActivityIndicator color={Colors.brandGreenMid} />
              </View>
            ) : null}
          </View>
        )}

        {picked ? (
          <View style={[styles.pickedCard, { borderColor: picked.color }]}>
            <View style={styles.rowTop}>
              <View style={[styles.badge, { backgroundColor: picked.color }]}>
                <Ionicons name={vehicleIonicon(picked.icon)} size={20} color={Colors.white} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{picked.name}</Text>
                <Text style={styles.rowMeta}>
                  {picked.plate ? `${picked.plate} · ` : ''}
                  {picked.active_trip
                    ? `${tripKindLabel(picked.active_trip.trip_kind)}${picked.active_trip.route_name ? ` · ${picked.active_trip.route_name}` : ''}`
                    : picked.position
                      ? `Last seen ${timeAgo(picked.position.recorded_at) || 'earlier'}`
                      : 'No position yet'}
                </Text>
              </View>
              <Pressable onPress={() => setPickedId(null)} hitSlop={10} accessibilityLabel="Show all vehicles">
                <Ionicons name="close" size={20} color={Colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Speed</Text>
                <Text style={[styles.statValue, (picked.position?.speed_kmh ?? 0) > SPEED_LIMIT_KMH && styles.statWarn]}>
                  {picked.active_trip ? `${Math.round(picked.position?.speed_kmh ?? 0)} km/h` : '—'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>On board</Text>
                <Text style={styles.statValue}>
                  {picked.active_trip ? `${picked.active_trip.boarded}${picked.capacity ? ` of ${picked.capacity}` : ''}` : '—'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{live ? 'Trips today' : 'Trips'}</Text>
                <Text style={styles.statValue}>{picked.trips.length}</Text>
              </View>
            </View>
            {picked.trips.map((trip) => (
              <Text key={trip.id} style={styles.tripLine}>
                {clock(trip.started_at)}
                {trip.ended_at ? ` to ${clock(trip.ended_at)}` : ', on the road'} · {tripKindLabel(trip.trip_kind)} · {trip.boarded} boarded
                {trip.distance_km != null ? ` · ${trip.distance_km} km` : ''}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.listTitle}>Vehicles</Text>
        {vehicles.map((v) => {
          const moving = live && v.status === 'on_trip';
          return (
            <Pressable
              key={v.id}
              onPress={() => setPickedId((prev) => (prev === v.id ? null : v.id))}
              style={[styles.row, v.id === pickedId && styles.rowOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: v.id === pickedId }}>
              <View style={[styles.badge, { backgroundColor: v.color }]}>
                <Ionicons name={vehicleIonicon(v.icon)} size={20} color={Colors.white} />
                {moving ? <View style={styles.movingDot} /> : null}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{v.name}</Text>
                <Text style={styles.rowMeta}>
                  {v.plate ? `${v.plate} · ` : ''}
                  {moving
                    ? `${v.active_trip?.boarded ?? 0} on board · ${Math.round(v.position?.speed_kmh ?? 0)} km/h`
                    : v.trips.length
                      ? `${v.trips.length} trip${v.trips.length === 1 ? '' : 's'} ${live ? 'today' : 'that day'}`
                      : v.position
                        ? `Last seen ${timeAgo(v.position.recorded_at) || 'earlier'}`
                        : 'No position yet'}
                </Text>
              </View>
              <View style={[styles.statusPill, moving && styles.statusPillOn]}>
                <Text style={[styles.statusText, moving && styles.statusTextOn]}>{statusLabel(v)}</Text>
              </View>
            </Pressable>
          );
        })}
        {!loading && data && !vehicles.length ? (
          <Text style={styles.empty}>No vehicles yet. Add the school&apos;s vehicles in Tukua Desk, under Transport.</Text>
        ) : null}
        <Text style={styles.credit}>Map: OpenStreetMap contributors</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segment: { flex: 1, flexDirection: 'row', backgroundColor: Colors.muted, borderRadius: 12, padding: 3 },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentItemOn: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
  segmentTextOn: { color: Colors.white },
  pathsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pathsBtnOn: { backgroundColor: Colors.primary },
  pathsText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  pathsTextOn: { color: Colors.white },
  summary: { fontSize: 13, color: Colors.mutedForeground },
  mapWrap: { height: 380, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.06)' },
  map: { flex: 1 },
  mapLoading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pickedCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 2, padding: 12, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: Colors.muted, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.mutedForeground },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  statWarn: { color: '#B91C1C' },
  tripLine: { fontSize: 12, color: Colors.mutedForeground },
  listTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  rowOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  movingDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#84CC16',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  rowMeta: { fontSize: 12, color: Colors.mutedForeground, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.muted },
  statusPillOn: { backgroundColor: Colors.primary },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.mutedForeground },
  statusTextOn: { color: Colors.white },
  empty: { fontSize: 13, color: Colors.mutedForeground, textAlign: 'center', paddingVertical: 16 },
  credit: { fontSize: 10, color: Colors.mutedForeground, textAlign: 'center', marginTop: 4 },
});
