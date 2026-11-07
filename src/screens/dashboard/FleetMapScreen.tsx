import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedPage, INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import { LoaderMark } from '../../components/ui/Loader';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleHeading,
  SectionLabel,
  ShowMoreButton,
  StateCard,
  StatTile,
  StatusPill,
  SurfaceCard,
  ThemedRefresh,
  useClientPager,
  useModulePadding,
  type PillTone,
} from '../../components/ui/ModuleKit';
import { useAppTheme } from '../../context/AppThemeContext';
import {
  fetchFleetMap,
  fleetMapHtml,
  fleetMapUpdateScript,
  fleetSignalLost,
  FleetMapData,
  FleetMapVehicle,
  timeAgo,
  tripKindLabel,
  vehicleIonicon,
} from '../../lib/fleetMap';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'FleetMap'>;
type DayKey = 'today' | 'yesterday';

/** The phone on each bus sends its position about every 30 seconds; this screen asks every 15. */
const REFRESH_MS = 15_000;
const SPEED_LIMIT_KMH = 80;

function localDay(offset = 0): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function vehicleStatus(v: FleetMapVehicle, live: boolean): { label: string; tone: PillTone } {
  if (v.status === 'on_trip') {
    if (!live) return { label: 'Drove', tone: 'primary' };
    return fleetSignalLost(v) ? { label: 'No signal', tone: 'warning' } : { label: 'On a trip', tone: 'success' };
  }
  if (v.status === 'workshop') return { label: 'Workshop', tone: 'danger' };
  return { label: 'Parked', tone: 'neutral' };
}

function clock(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Every school vehicle on one map, each with its own icon and colour, where it is now and the
 * path it has driven. Tap a vehicle to follow it. For school admins and security staff.
 */
export function FleetMapScreen({ navigation }: Props) {
  const pad = useModulePadding();
  const focused = useIsFocused();
  const { palette } = useAppTheme();
  const webRef = useRef<WebView>(null);
  const [day, setDay] = useState<DayKey>('today');
  const yesterday = day === 'yesterday';
  const [data, setData] = useState<FleetMapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  }, [yesterday]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(null);
    void load();
  }, [load]);

  // Live refresh only while this screen is on top and showing today.
  useEffect(() => {
    if (yesterday || !focused) return undefined;
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, yesterday, focused]);

  const vehicles = useMemo(
    () =>
      (data?.vehicles ?? [])
        .filter((v) => v.status !== 'inactive')
        .sort(
          (a, b) =>
            Number(b.status === 'on_trip') - Number(a.status === 'on_trip') ||
            String(a.name).localeCompare(String(b.name)),
        ),
    [data],
  );
  const pager = useClientPager(vehicles, 15, day);
  const picked = vehicles.find((v) => v.id === pickedId) ?? null;
  const live = Boolean(data?.live);
  const drawing = useMemo(() => ({ vehicles, live, pickedId, showPaths }), [vehicles, live, pickedId, showPaths]);
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;

  // The page is loaded once; after that each change is drawn into it.
  const html = useMemo(() => fleetMapHtml({ vehicles: [], live: true, pickedId: null, showPaths: true }), []);
  useEffect(() => {
    if (mapReady) webRef.current?.injectJavaScript(fleetMapUpdateScript(drawing));
  }, [drawing, mapReady]);

  const onRoad = vehicles.filter((v) => v.status === 'on_trip' && !fleetSignalLost(v)).length;
  const noSignal = live ? vehicles.filter((v) => fleetSignalLost(v)).length : 0;
  const showMap = !(error && !data);

  return (
    <ThemedPage>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: pad.top, paddingBottom: pad.bottom }]}
        refreshControl={
          <ThemedRefresh
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleHeading
          title="Fleet map"
          description="Every vehicle, where it is and the path it has driven."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.toolbar}>
          <View style={styles.flex}>
            <ChipRow<DayKey>
              options={[
                { key: 'today', label: 'Today, live' },
                { key: 'yesterday', label: 'Yesterday' },
              ]}
              value={day}
              onChange={(k) => {
                setDay(k);
                setPickedId(null);
              }}
            />
          </View>
          <Pressable
            onPress={() => setShowPaths((v) => !v)}
            style={[
              styles.pathsBtn,
              showPaths
                ? { backgroundColor: palette.primary, borderColor: palette.primary }
                : { backgroundColor: '#FFFFFF', borderColor: rgba(palette.primary, 0.14) },
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: showPaths }}
            accessibilityLabel="Show paths">
            <Ionicons name="git-branch-outline" size={15} color={showPaths ? '#FFFFFF' : palette.primary} />
            <Text style={[styles.pathsText, { color: showPaths ? '#FFFFFF' : palette.primary }]}>Paths</Text>
          </Pressable>
        </View>

        {data ? (
          <View style={styles.stats}>
            <StatTile label={live ? 'On the road' : 'Drove'} value={String(live ? onRoad : vehicles.filter((v) => v.trips.length).length)} />
            <StatTile label="Vehicles" value={String(vehicles.length)} />
            {live ? (
              <StatTile label="Updated" value={clock(data.refreshed_at) || '—'} hint={noSignal ? `${noSignal} no signal` : undefined} />
            ) : (
              <StatTile label="Trips" value={String(vehicles.reduce((n, v) => n + v.trips.length, 0))} />
            )}
          </View>
        ) : null}

        {!showMap ? (
          <ErrorState title="Couldn’t load the fleet map" message={error} onRetry={() => void load()} />
        ) : (
          <View style={[styles.mapWrap, { backgroundColor: rgba(palette.primary, 0.06) }]}>
            <WebView
              ref={webRef}
              source={{ html }}
              style={styles.map}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              nestedScrollEnabled
              onLoadEnd={() => {
                webRef.current?.injectJavaScript(fleetMapUpdateScript(drawingRef.current));
                setMapReady(true);
              }}
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
              <View style={[styles.mapLoading, { backgroundColor: rgba(palette.muted, 0.7) }]} pointerEvents="none">
                <LoaderMark size={44} />
              </View>
            ) : null}
          </View>
        )}

        {picked ? <PickedCard vehicle={picked} live={live} onClose={() => setPickedId(null)} /> : null}

        {showMap ? (
          <>
            <SectionLabel>Vehicles</SectionLabel>
            {loading && !data ? (
              <ListSkeleton rows={3} />
            ) : !vehicles.length ? (
              <StateCard
                icon="bus-outline"
                title="No vehicles yet"
                body="Add the school’s vehicles in Tukua Desk, under Transport."
              />
            ) : (
              <>
                {pager.visible.map((v) => (
                  <VehicleRow
                    key={v.id}
                    vehicle={v}
                    live={live}
                    picked={v.id === pickedId}
                    onPress={() => setPickedId((prev) => (prev === v.id ? null : v.id))}
                  />
                ))}
                {pager.hasMore ? <ShowMoreButton shown={pager.shown} total={pager.total} onPress={pager.showMore} /> : null}
              </>
            )}
            {error && data ? <Text style={styles.staleNote}>Couldn’t refresh just now — showing the last update.</Text> : null}
            <Text style={styles.credit}>Map: OpenStreetMap contributors</Text>
          </>
        ) : null}
      </ScrollView>
    </ThemedPage>
  );
}

function VehicleRow({
  vehicle: v,
  live,
  picked,
  onPress,
}: {
  vehicle: FleetMapVehicle;
  live: boolean;
  picked: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  const lost = live && fleetSignalLost(v);
  const moving = live && v.status === 'on_trip' && !lost;
  const status = vehicleStatus(v, live);
  const meta = moving
    ? `${v.active_trip?.boarded ?? 0} on board · ${Math.round(v.position?.speed_kmh ?? 0)} km/h`
    : lost
      ? `Last position ${timeAgo(v.position?.recorded_at) || 'unknown'}`
      : v.trips.length
        ? `${v.trips.length} trip${v.trips.length === 1 ? '' : 's'} ${live ? 'today' : 'that day'}`
        : v.position
          ? `Last seen ${timeAgo(v.position.recorded_at) || 'earlier'}`
          : 'No position yet';
  return (
    <SurfaceCard
      onPress={onPress}
      accessibilityLabel={`${v.name}, ${status.label}`}
      style={[styles.row, picked && { borderColor: palette.primary, borderWidth: 1.5 }]}>
      <View style={[styles.badge, { backgroundColor: v.color }]}>
        <Ionicons name={vehicleIonicon(v.icon)} size={20} color="#FFFFFF" />
        {moving ? <View style={styles.movingDot} /> : null}
      </View>
      <View style={styles.flex}>
        <Text style={styles.rowName} numberOfLines={1}>
          {v.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {v.plate ? `${v.plate} · ` : ''}
          {meta}
        </Text>
      </View>
      <StatusPill label={status.label} tone={status.tone} />
    </SurfaceCard>
  );
}

function PickedCard({ vehicle: v, live, onClose }: { vehicle: FleetMapVehicle; live: boolean; onClose: () => void }) {
  const lost = live && fleetSignalLost(v);
  const speed = v.position?.speed_kmh ?? null;
  return (
    <SurfaceCard style={[styles.picked, { borderColor: v.color }]}>
      <View style={styles.rowTop}>
        <View style={[styles.badge, { backgroundColor: v.color }]}>
          <Ionicons name={vehicleIonicon(v.icon)} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.rowName}>{v.name}</Text>
          <Text style={styles.rowMeta}>
            {v.plate ? `${v.plate} · ` : ''}
            {v.active_trip
              ? `${tripKindLabel(v.active_trip.trip_kind)}${v.active_trip.route_name ? ` · ${v.active_trip.route_name}` : ''}`
              : v.position
                ? `Last seen ${timeAgo(v.position.recorded_at) || 'earlier'}`
                : 'No position yet'}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Show all vehicles">
          <Ionicons name="close" size={20} color={MUTED_INK} />
        </Pressable>
      </View>
      {lost ? (
        <Text style={styles.warn}>
          No position from this vehicle {timeAgo(v.position?.recorded_at) || 'for a while'}. The trip may not have been ended.
        </Text>
      ) : null}
      <View style={styles.stats}>
        <StatTile
          label="Speed"
          value={v.active_trip && !lost && speed != null ? `${Math.round(speed)} km/h` : '—'}
          style={speed != null && speed > SPEED_LIMIT_KMH && !lost ? styles.statWarn : undefined}
        />
        <StatTile
          label="On board"
          value={v.active_trip ? `${v.active_trip.boarded}${v.capacity ? `/${v.capacity}` : ''}` : '—'}
        />
        <StatTile label={live ? 'Trips today' : 'Trips'} value={String(v.trips.length)} />
      </View>
      {v.trips.slice(0, 6).map((trip) => (
        <Text key={trip.id} style={styles.tripLine}>
          {clock(trip.started_at) || '—'}
          {trip.ended_at ? ` to ${clock(trip.ended_at)}` : ', on the road'} · {tripKindLabel(trip.trip_kind)} · {trip.boarded} boarded
          {trip.distance_km != null ? ` · ${trip.distance_km} km` : ''}
        </Text>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  flex: { flex: 1, minWidth: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pathsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pathsText: { fontSize: 13, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mapWrap: { height: 360, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  map: { flex: 1 },
  mapLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  picked: { borderWidth: 2, gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statWarn: { backgroundColor: 'rgba(180,35,24,0.10)' },
  warn: { fontSize: 12.5, lineHeight: 17, color: '#B54708' },
  tripLine: { fontSize: 12, color: MUTED_INK },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    borderColor: '#FFFFFF',
  },
  rowName: { fontSize: 15, fontWeight: '700', color: INK },
  rowMeta: { fontSize: 12, color: MUTED_INK, marginTop: 1 },
  staleNote: { fontSize: 12, color: MUTED_INK, textAlign: 'center', marginTop: 4 },
  credit: { fontSize: 10, color: MUTED_INK, textAlign: 'center', marginTop: 8 },
});
