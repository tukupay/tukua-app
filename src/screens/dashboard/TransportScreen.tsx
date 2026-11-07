/**
 * Parent transport: where the child's bus is now, past trips and the home pick-up pin.
 * Nest `GET /parents/me/transport/trips`, `GET|PUT /parents/me/transport/home`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ThemedPage, INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleHeading,
  ShowMoreButton,
  StateCard,
  StatusPill,
  SurfaceCard,
  ThemedRefresh,
  fmtDay,
  fmtRelative,
  fmtTime,
  useClientPager,
  useModulePadding,
  type PillTone,
} from '../../components/ui/ModuleKit';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  fetchParentTransportHome,
  fetchParentTransportTrips,
  ParentTransportHome,
  ParentTransportTrip,
  putParentTransportHome,
} from '../../lib/parentPortalApi';
import { DEFAULT_SCHOOL_PIN, googleMapsSearchUrl, LatLng } from '../../lib/parentTransportDummy';
import { DashboardStackParamList } from '../../navigation/types';
import { log } from '../../lib/logger';
import { fleetMapHtml, fleetMapUpdateScript, pinMapHtml, type FleetMapDrawing } from '../../lib/fleetMap';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Transport'>;
type TabKey = 'live' | 'history' | 'home';

/** Raw API row (trips, runs and `live` share most fields; runs carry vehicle_name / route_name). */
type ApiTrip = ParentTransportTrip & {
  arrived_at?: string | null;
  departed_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  notes?: string | null;
  vehicle_name?: string | null;
  vehicle_plate?: string | null;
  route_name?: string | null;
  trip_kind?: string | null;
  latest_gps?: { lat?: number; lng?: number; speed_kmh?: number | null; recorded_at?: string | null } | null;
  gps_path?: Array<{ lat?: number; lng?: number; label?: string; recorded_at?: string | null }>;
};

type LiveView = {
  trip: ApiTrip | null;
  live: boolean;
  /** A trip still marked on the road whose last sign of life is too old to trust. */
  stale: boolean;
  vehicle: string;
  route: string | null;
  point: LatLng | null;
  path: Array<[number, number]>;
  lastSeen: string | null;
  speed: number | null;
};

type TripRow = {
  id: string;
  toSchool: boolean;
  day: string;
  boarded: string;
  arrived: string;
  vehicle: string | null;
  route: string | null;
  status: { label: string; tone: PillTone };
  path: LatLng[];
};

const LIVE_STATUSES = new Set(['boarding', 'in_transit', 'active', 'on_trip', 'en_route', 'started', 'departed']);
/** An "on the road" trip with no update for this long is shown as not closed, not as live. */
const STALE_MS = 12 * 60 * 60_000;
const LIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;

function finite(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function point(lat: unknown, lng: unknown, label?: string): LatLng | null {
  const a = finite(lat);
  const b = finite(lng);
  if (a == null || b == null || (a === 0 && b === 0)) return null;
  return { lat: a, lng: b, label };
}

function ageMs(...stamps: Array<string | null | undefined>): number {
  for (const s of stamps) {
    const t = s ? new Date(s).getTime() : NaN;
    if (Number.isFinite(t)) return Date.now() - t;
  }
  return Infinity;
}

function isLiveStatus(status?: string | null): boolean {
  return LIVE_STATUSES.has(String(status ?? '').toLowerCase());
}

function tripStatus(t: ApiTrip): { label: string; tone: PillTone } {
  const s = String(t.status ?? '').toLowerCase();
  if (isLiveStatus(s)) {
    const age = ageMs(t.latest_gps?.recorded_at, t.departed_at, t.boarded_at, t.started_at, t.created_at);
    return age > STALE_MS ? { label: 'Not closed', tone: 'neutral' } : { label: 'On route', tone: 'success' };
  }
  if (s === 'arrived' || s === 'completed' || s === 'alighted' || s === 'dropped_off') return { label: 'Arrived', tone: 'primary' };
  if (s === 'scheduled' || s === 'pending') return { label: 'Scheduled', tone: 'accent' };
  if (s === 'cancelled' || s === 'canceled' || s === 'missed') return { label: s === 'missed' ? 'Missed' : 'Cancelled', tone: 'danger' };
  return { label: s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : 'Unknown', tone: 'neutral' };
}

function gpsPoints(t: ApiTrip | null | undefined): LatLng[] {
  return (Array.isArray(t?.gps_path) ? t!.gps_path! : [])
    .map((p) => point(p?.lat, p?.lng, p?.label))
    .filter((p): p is LatLng => p != null);
}

/** The run a legacy trip row belongs to ("Trip run <uuid>" in its notes). */
function runIdOf(t: ApiTrip): string | null {
  const m = String(t.notes ?? '').match(/trip run ([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

function buildLive(live: ApiTrip | null, runs: ApiTrip[]): LiveView {
  const active = runs.find((r) => isLiveStatus(r.status)) ?? null;
  const base = active ?? live ?? runs[0] ?? null;
  const trip: ApiTrip | null = base
    ? {
        ...(live ?? {}),
        ...base,
        gps_path: base.gps_path?.length ? base.gps_path : live?.gps_path,
        latest_gps: base.latest_gps ?? live?.latest_gps,
      }
    : null;
  const path = gpsPoints(trip);
  const last = path[path.length - 1] ?? null;
  const pt =
    point(trip?.latest_gps?.lat, trip?.latest_gps?.lng) ?? last ?? point(trip?.live_lat, trip?.live_lng) ?? null;
  const lastSeen = trip?.latest_gps?.recorded_at ?? trip?.gps_path?.[trip.gps_path.length - 1]?.recorded_at ?? null;
  const onRoad = Boolean(trip) && isLiveStatus(trip?.status);
  const stale = onRoad && ageMs(lastSeen, trip?.boarded_at, trip?.started_at, trip?.created_at) > STALE_MS;
  return {
    trip,
    live: onRoad && !stale,
    stale,
    vehicle: String(trip?.vehicle_label || trip?.vehicle_plate || trip?.vehicle_name || 'School bus'),
    route: (trip?.route_label || trip?.route_name || null) as string | null,
    point: pt,
    path: path.map((p) => [p.lat, p.lng] as [number, number]),
    lastSeen,
    speed: finite(trip?.latest_gps?.speed_kmh),
  };
}

function buildTripRows(trips: ApiTrip[], runs: ApiTrip[], live: ApiTrip | null): TripRow[] {
  const runById = new Map<string, ApiTrip>();
  for (const r of [...runs, ...(live ? [live] : [])]) if (r?.id) runById.set(String(r.id), r);
  return trips
    .filter((t) => t && typeof t === 'object')
    .map((t, i) => {
      const run = runById.get(runIdOf(t) ?? '') ?? null;
      const dir = String(t.direction ?? '').toLowerCase();
      const start = t.boarded_at ?? t.departed_at ?? t.created_at ?? null;
      const end = t.arrived_at ?? t.alighted_at ?? null;
      const path = gpsPoints(t).length ? gpsPoints(t) : gpsPoints(run);
      return {
        id: String(t.id ?? `trip-${i}`),
        toSchool: dir.includes('school') && !dir.includes('from'),
        day: fmtDay(start),
        boarded: fmtTime(start),
        arrived: fmtTime(end),
        vehicle: (t.vehicle_label || run?.vehicle_name || run?.vehicle_label || null) as string | null,
        route: (t.route_label || run?.route_name || run?.route_label || null) as string | null,
        status: tripStatus(t),
        path,
      };
    });
}

export function TransportScreen({ navigation }: Props) {
  const pad = useModulePadding();
  const focused = useIsFocused();
  const { palette } = useAppTheme();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const webRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tab, setTab] = useState<TabKey>('live');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [runs, setRuns] = useState<ApiTrip[]>([]);
  const [liveRaw, setLiveRaw] = useState<ApiTrip | null>(null);
  const [home, setHome] = useState<ParentTransportHome | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingHome, setSavingHome] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const applyTrips = useCallback(
    (res: Awaited<ReturnType<typeof fetchParentTransportTrips>> | null | undefined) => {
      setTrips(Array.isArray(res?.trips) ? (res!.trips as ApiTrip[]) : []);
      setRuns(Array.isArray(res?.trip_runs) ? (res!.trip_runs as ApiTrip[]) : []);
      setLiveRaw(res?.live && typeof res.live === 'object' ? (res.live as ApiTrip) : null);
    },
    [],
  );

  const applyHome = useCallback((h: ParentTransportHome | null) => {
    setHome(h);
    setLatInput(h?.latitude != null ? String(h.latitude) : '');
    setLngInput(h?.longitude != null ? String(h.longitude) : '');
    setAddressInput(h?.address_text ? String(h.address_text) : '');
  }, []);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const [tripsRes, homeRes] = await Promise.allSettled([
          fetchParentTransportTrips(selectedStudentId),
          selectedStudentId ? fetchParentTransportHome(selectedStudentId) : Promise.resolve(null),
        ]);
        if (tripsRes.status === 'rejected') throw tripsRes.reason;
        applyTrips(tripsRes.value);
        if (homeRes.status === 'fulfilled') applyHome(homeRes.value?.home ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Transport', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId, applyTrips, applyHome],
  );

  useEffect(() => {
    setExpandedTrip(null);
    void load();
  }, [load]);

  const live = useMemo(() => buildLive(liveRaw, runs), [liveRaw, runs]);
  const historyTrips = useMemo(() => buildTripRows(trips, runs, liveRaw), [trips, runs, liveRaw]);
  const pager = useClientPager(historyTrips, 10, selectedStudentId);

  // Quiet refresh while the live tab is on screen: every 15 s when the bus is on the road, else every minute.
  useEffect(() => {
    if (!focused || tab !== 'live' || loading || error) return undefined;
    const t = setInterval(() => {
      fetchParentTransportTrips(selectedStudentId)
        .then(applyTrips)
        .catch(() => {
          /* keep last known */
        });
    }, live.live ? LIVE_POLL_MS : IDLE_POLL_MS);
    return () => clearInterval(t);
  }, [focused, tab, loading, error, live.live, selectedStudentId, applyTrips]);

  const mapCentre = live.point ?? DEFAULT_SCHOOL_PIN;
  const drawing: FleetMapDrawing = useMemo(
    () => ({
      live: true,
      pickedId: null,
      showPaths: true,
      vehicles: live.point
        ? [
            {
              id: 'bus',
              name: live.vehicle,
              plate: null,
              icon: 'bus',
              color: palette.primary,
              capacity: null,
              route_name: live.route,
              status: live.live ? 'on_trip' : 'available',
              position: { lat: live.point.lat, lng: live.point.lng, speed_kmh: live.speed, recorded_at: live.lastSeen, heading: null },
              active_trip: null,
              trips:
                live.path.length >= 2
                  ? [
                      {
                        id: 'live',
                        status: live.live ? 'active' : 'completed',
                        trip_kind: '',
                        route_name: null,
                        started_at: null,
                        ended_at: null,
                        distance_km: null,
                        boarded: 0,
                        top_speed_kmh: null,
                        path: live.path,
                      },
                    ]
                  : [],
            },
          ]
        : [],
    }),
    [live, palette.primary],
  );
  // The map page loads once (centred on the first known spot); each update is drawn into it.
  const liveMapHtml = useMemo(
    () => fleetMapHtml(drawing, [mapCentre.lat, mapCentre.lng]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStudentId, loading],
  );
  const drawingRef = useRef(drawing);
  drawingRef.current = drawing;
  useEffect(() => {
    if (mapReady) webRef.current?.injectJavaScript(fleetMapUpdateScript(drawing));
  }, [drawing, mapReady]);
  useEffect(() => setMapReady(false), [liveMapHtml, tab]);

  const parsedHome = useMemo(() => {
    const lat = latInput.trim() === '' ? null : finite(latInput);
    const lng = lngInput.trim() === '' ? null : finite(lngInput);
    return lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
  }, [latInput, lngInput]);
  const homePoint: LatLng =
    (parsedHome && { ...parsedHome, label: 'Home' }) ??
    point(home?.latitude, home?.longitude, 'Home') ??
    DEFAULT_SCHOOL_PIN;

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showDialog({ title: 'Location needed', message: 'Allow location access to set your home pick-up pin.', variant: 'warning' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatInput(pos.coords.latitude.toFixed(6));
      setLngInput(pos.coords.longitude.toFixed(6));
    } catch (e) {
      showDialog({ title: 'Could not get location', message: e instanceof Error ? e.message : String(e), variant: 'warning' });
    } finally {
      setLocating(false);
    }
  };

  const openMaps = (p: LatLng) => {
    void Linking.openURL(googleMapsSearchUrl(`${p.lat},${p.lng}`));
  };

  const saveHome = async () => {
    if (!parsedHome) {
      showDialog({
        title: 'Pick a spot first',
        message: 'Use your current location, pick on the map, or enter a valid latitude and longitude.',
        variant: 'warning',
      });
      return;
    }
    setSavingHome(true);
    try {
      const res = await putParentTransportHome({
        student_id: selectedStudentId ?? undefined,
        latitude: parsedHome.lat,
        longitude: parsedHome.lng,
        address_text: addressInput.trim() || undefined,
        label: 'Home',
      });
      if (res?.home) applyHome(res.home);
      setMapPickerOpen(false);
      showDialog({ title: 'Saved', message: 'Home pick-up pin updated.', variant: 'success' });
    } catch (e) {
      showDialog({ title: 'Could not save', message: e instanceof Error ? e.message : String(e), variant: 'danger' });
    } finally {
      setSavingHome(false);
    }
  };

  const childName = selectedStudent?.name?.trim();
  const liveTone: PillTone = live.live ? 'success' : live.stale ? 'neutral' : 'primary';
  const liveLabel = live.live ? 'On route' : live.stale ? 'No signal' : live.trip ? 'Not on the road' : 'No trips yet';

  const renderLive = () => (
    <>
      <SurfaceCard>
        <View style={styles.liveTop}>
          <View style={[styles.busIcon, { backgroundColor: live.live ? palette.primary : rgba(palette.primary, 0.08) }]}>
            <Ionicons name="bus" size={22} color={live.live ? palette.secondary : palette.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {live.vehicle}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {live.route || 'School route'}
            </Text>
          </View>
          <StatusPill label={liveLabel} tone={liveTone} icon={live.live ? 'radio-outline' : undefined} />
        </View>
        <View style={styles.liveFacts}>
          {live.live ? (
            <>
              <Fact icon="time-outline" text={live.lastSeen ? `Updated ${fmtRelative(live.lastSeen).toLowerCase()}` : 'Waiting for the bus position'} />
              {live.speed != null ? <Fact icon="speedometer-outline" text={`${Math.round(live.speed)} km/h`} /> : null}
              {live.trip?.boarded_at ? <Fact icon="log-in-outline" text={`Boarded at ${fmtTime(live.trip.boarded_at)}`} /> : null}
            </>
          ) : live.trip ? (
            <Fact
              icon="calendar-outline"
              text={
                live.stale
                  ? `The bus phone stopped reporting ${fmtRelative(live.lastSeen ?? live.trip.boarded_at).toLowerCase() || 'a while ago'}.`
                  : `Last trip ${fmtDay(live.trip.ended_at ?? live.trip.boarded_at ?? live.trip.started_at)}. The map shows where it ended.`
              }
            />
          ) : (
            <Fact icon="information-circle-outline" text={`No bus trips recorded${childName ? ` for ${childName}` : ''} yet.`} />
          )}
        </View>
      </SurfaceCard>
      <View style={[styles.mapWrap, { backgroundColor: rgba(palette.primary, 0.06) }]}>
        <WebView
          ref={webRef}
          source={{ html: liveMapHtml }}
          style={styles.map}
          originWhitelist={['*']}
          nestedScrollEnabled
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() => {
            webRef.current?.injectJavaScript(fleetMapUpdateScript(drawingRef.current));
            setMapReady(true);
          }}
        />
        {!live.point ? (
          <View style={styles.mapNote} pointerEvents="none">
            <Text style={styles.mapNoteText}>No bus position yet</Text>
          </View>
        ) : null}
      </View>
      {live.point ? (
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: palette.primary }, pressed && styles.pressed]}
          onPress={() => live.point && openMaps(live.point)}>
          <Ionicons name="navigate" size={18} color={palette.secondary} />
          <Text style={styles.primaryBtnText}>Open in Google Maps</Text>
        </Pressable>
      ) : null}
      <Text style={styles.credit}>Map: OpenStreetMap contributors</Text>
    </>
  );

  const renderHistory = () => {
    if (!historyTrips.length) {
      return (
        <StateCard
          icon="bus-outline"
          title="No trips yet"
          body={`Bus trips${childName ? ` for ${childName}` : ''} show here once the school records boarding.`}
        />
      );
    }
    return (
      <>
        {pager.visible.map((trip) => {
          const open = expandedTrip === trip.id;
          const canExpand = trip.path.length > 0;
          return (
            <SurfaceCard key={trip.id} onPress={canExpand ? () => setExpandedTrip(open ? null : trip.id) : undefined}>
              <View style={styles.liveTop}>
                <View style={[styles.dirIcon, { backgroundColor: rgba(palette.primary, 0.07) }]}>
                  <Ionicons name={trip.toSchool ? 'school-outline' : 'home-outline'} size={18} color={palette.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.tripTitle}>{trip.toSchool ? 'To school' : 'To home'}</Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {trip.day}
                    {trip.boarded ? ` · ${trip.boarded}` : ''}
                    {trip.arrived ? ` → ${trip.arrived}` : ''}
                  </Text>
                </View>
                <StatusPill label={trip.status.label} tone={trip.status.tone} />
              </View>
              {trip.vehicle || trip.route ? (
                <Text style={[styles.cardMeta, styles.indent]} numberOfLines={1}>
                  {[trip.vehicle, trip.route].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              {open ? (
                <View style={[styles.routeBlock, styles.indent]}>
                  <Text style={styles.routeTitle}>Route</Text>
                  {trip.path.slice(0, 12).map((p, i) => (
                    <View key={`${trip.id}-p-${i}`} style={styles.routeStop}>
                      <View style={[styles.routeDot, { backgroundColor: i === 0 ? palette.secondary : palette.primary }]} />
                      <Text style={styles.routeLabel}>{p.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}</Text>
                    </View>
                  ))}
                  <Pressable style={styles.linkBtn} onPress={() => openMaps(trip.path[trip.path.length - 1])}>
                    <Ionicons name="map-outline" size={16} color={palette.primary} />
                    <Text style={[styles.linkText, { color: palette.primary }]}>Open on Google Maps</Text>
                  </Pressable>
                </View>
              ) : canExpand ? (
                <Text style={[styles.tapHint, styles.indent]}>Tap for the route</Text>
              ) : null}
            </SurfaceCard>
          );
        })}
        {pager.hasMore ? <ShowMoreButton shown={pager.shown} total={pager.total} onPress={pager.showMore} /> : null}
      </>
    );
  };

  const renderHome = () => {
    if (!selectedStudentId) {
      return (
        <StateCard icon="person-outline" title="Select a child" body="Choose a child from the dashboard to set their home pick-up pin." />
      );
    }
    const pickerPin = parsedHome ?? homePoint;
    return (
      <SurfaceCard>
        <Text style={styles.cardTitle}>Home pick-up point</Text>
        <Text style={styles.cardMeta}>
          {home?.address_text
            ? home.address_text
            : 'Where the bus should pick up and drop off your child. Use GPS, tap the map, or type coordinates.'}
        </Text>
        <View style={[styles.mapWrap, styles.homeMap, { backgroundColor: rgba(palette.primary, 0.06) }]}>
          {mapPickerOpen ? (
            <WebView
              source={{ html: pinMapHtml([{ lat: pickerPin.lat, lng: pickerPin.lng, label: 'Pick-up point' }], { pick: true }) }}
              originWhitelist={['*']}
              nestedScrollEnabled
              style={styles.map}
              scrollEnabled
              javaScriptEnabled
              domStorageEnabled
              onMessage={(ev) => {
                try {
                  const p = JSON.parse(ev.nativeEvent.data) as { lat?: number; lng?: number };
                  const lat = finite(p.lat);
                  const lng = finite(p.lng);
                  if (lat != null && lng != null) {
                    setLatInput(lat.toFixed(6));
                    setLngInput(lng.toFixed(6));
                  }
                } catch {
                  /* ignore */
                }
              }}
            />
          ) : (
            <WebView
              key={`${homePoint.lat},${homePoint.lng}`}
              source={{ html: pinMapHtml([{ lat: homePoint.lat, lng: homePoint.lng, label: 'Pick-up point' }]) }}
              originWhitelist={['*']}
              style={styles.map}
              scrollEnabled={false}
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>
        {mapPickerOpen ? <Text style={styles.tapHint}>Tap the map where the bus should stop.</Text> : null}
        <View style={styles.homeBtnRow}>
          <Pressable
            style={[styles.secondaryBtn, { backgroundColor: rgba(palette.primary, 0.07) }, locating && styles.disabled]}
            disabled={locating}
            onPress={() => void useCurrentLocation()}>
            {locating ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <>
                <Ionicons name="locate" size={16} color={palette.primary} />
                <Text style={[styles.secondaryText, { color: palette.primary }]}>My location</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, { backgroundColor: rgba(palette.primary, 0.07) }]}
            onPress={() => setMapPickerOpen((v) => !v)}>
            <Ionicons name={mapPickerOpen ? 'eye-outline' : 'map-outline'} size={16} color={palette.primary} />
            <Text style={[styles.secondaryText, { color: palette.primary }]}>{mapPickerOpen ? 'Preview pin' : 'Pick on map'}</Text>
          </Pressable>
        </View>
        <View style={styles.coordRow}>
          <View style={styles.flex}>
            <Text style={styles.fieldLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latInput}
              onChangeText={setLatInput}
              keyboardType="numbers-and-punctuation"
              placeholder="-1.2921"
              placeholderTextColor={MUTED_INK}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.fieldLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={lngInput}
              onChangeText={setLngInput}
              keyboardType="numbers-and-punctuation"
              placeholder="36.8219"
              placeholderTextColor={MUTED_INK}
            />
          </View>
        </View>
        <Text style={styles.fieldLabel}>Address or landmark</Text>
        <TextInput
          style={styles.input}
          value={addressInput}
          onChangeText={setAddressInput}
          placeholder="Home gate, estate, landmark"
          placeholderTextColor={MUTED_INK}
        />
        <Pressable
          style={[styles.primaryBtn, styles.saveBtn, { backgroundColor: palette.primary }, savingHome && styles.disabled]}
          disabled={savingHome}
          onPress={() => void saveHome()}>
          {savingHome ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="location" size={18} color={palette.secondary} />
              <Text style={styles.primaryBtnText}>Save home pin</Text>
            </>
          )}
        </Pressable>
      </SurfaceCard>
    );
  };

  return (
    <ThemedPage>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: pad.top, paddingBottom: pad.bottom }]}
        refreshControl={
          <ThemedRefresh
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ModuleHeading
          title="School bus"
          description={childName ? `Live bus, trips and home pin for ${childName}.` : 'Live bus, trips and home pick-up pin.'}
          onBack={() => navigation.goBack()}
        />
        {loading ? (
          <ListSkeleton rows={3} height={84} />
        ) : error ? (
          <ErrorState title="Couldn’t load transport" message={error} onRetry={() => void load()} />
        ) : (
          <>
            <ChipRow<TabKey>
              options={[
                { key: 'live', label: 'Live bus' },
                { key: 'history', label: 'Trips', count: historyTrips.length },
                { key: 'home', label: 'Home pin' },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === 'live' ? renderLive() : tab === 'history' ? renderHistory() : renderHome()}
          </>
        )}
      </ScrollView>
    </ThemedPage>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={14} color={MUTED_INK} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  liveTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  busIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dirIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  indent: { marginLeft: 48 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: INK },
  tripTitle: { fontSize: 15, fontWeight: '700', color: INK },
  cardMeta: { fontSize: 12.5, color: MUTED_INK, marginTop: 2 },
  liveFacts: { marginTop: 12, gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  factText: { flex: 1, fontSize: 13, color: MUTED_INK, lineHeight: 18 },
  mapWrap: { height: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  homeMap: { height: 220, marginTop: 12, marginBottom: 4 },
  map: { flex: 1 },
  mapNote: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapNoteText: { fontSize: 12, fontWeight: '700', color: INK },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtn: { marginTop: 16 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  credit: { fontSize: 10, color: MUTED_INK, textAlign: 'center', marginTop: 8 },
  routeBlock: { marginTop: 10, gap: 6 },
  routeTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: MUTED_INK },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLabel: { fontSize: 13, color: INK },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
  tapHint: { marginTop: 6, fontSize: 12, color: MUTED_INK },
  fieldLabel: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: MUTED_INK,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: INK,
    backgroundColor: '#FFFFFF',
  },
  coordRow: { flexDirection: 'row', gap: 10 },
  homeBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 44,
  },
  secondaryText: { fontSize: 13, fontWeight: '700' },
});
