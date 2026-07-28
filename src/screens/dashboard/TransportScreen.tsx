import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleTabPager } from '../../components/dashboard/ModuleTabPager';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import {
  fetchParentTransportHome,
  fetchParentTransportTrips,
  ParentTransportHome,
  ParentTransportTrip,
  putParentTransportHome,
} from '../../lib/parentPortalApi';
import {
  DEFAULT_SCHOOL_PIN,
  googleMapsDirectionsUrl,
  googleMapsEmbedTwoPinUrl,
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
  LatLng,
  mapPickerHtml,
  ParentTripHistory,
} from '../../lib/parentTransportDummy';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Transport'>;

type TabKey = 'live' | 'history' | 'home';

function tripStatusLabel(status?: string | null): string {
  const s = String(status ?? '').toLowerCase();
  if (s === 'boarding' || s === 'in_transit') return 'On route';
  if (s === 'completed') return 'Completed';
  if (s === 'scheduled') return 'Scheduled';
  return status || 'Unknown';
}

function isLiveStatus(status?: string | null): boolean {
  const s = String(status ?? '').toLowerCase();
  return s === 'boarding' || s === 'in_transit';
}

function mapApiTrip(t: ParentTransportTrip): ParentTripHistory {
  const gpsPath = (t.gps_path ?? []).filter((p) => p.lat != null && p.lng != null);
  const latest = t.latest_gps;
  const lat = Number(latest?.lat ?? t.live_lat ?? gpsPath[gpsPath.length - 1]?.lat ?? -1.2921);
  const lng = Number(latest?.lng ?? t.live_lng ?? gpsPath[gpsPath.length - 1]?.lng ?? 36.8219);
  const dir = String(t.direction ?? '').includes('school') ? 'to_school' : 'from_school';
  const route =
    gpsPath.length > 0
      ? gpsPath.map((p, i) => ({
          lat: Number(p.lat),
          lng: Number(p.lng),
          label: p.label ?? (i === 0 ? 'Start' : i === gpsPath.length - 1 ? 'Live' : 'Route'),
        }))
      : [{ lat, lng, label: t.route_label ?? 'Route' }];
  return {
    id: String(t.id ?? ''),
    date: String(t.created_at ?? t.boarded_at ?? '').slice(0, 10) || '—',
    direction: dir as 'to_school' | 'from_school',
    routeName: String(t.route_label ?? t.vehicle_label ?? 'School route'),
    plate: String(t.vehicle_label ?? 'Bus'),
    boardedAt: String(t.boarded_at ?? '').slice(11, 16) || '—',
    alightedAt: String(t.alighted_at ?? '').slice(11, 16) || '—',
    durationMinutes: 0,
    route,
  };
}

export function TransportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const [tab, setTab] = useState<TabKey>('live');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [trips, setTrips] = useState<ParentTransportTrip[]>([]);
  const [liveTrip, setLiveTrip] = useState<ParentTransportTrip | null>(null);
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

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const [tripsRes, homeRes] = await Promise.allSettled([
          fetchParentTransportTrips(selectedStudentId),
          selectedStudentId ? fetchParentTransportHome(selectedStudentId) : Promise.resolve(null),
        ]);

        if (tripsRes.status === 'fulfilled' && tripsRes.value) {
          const liveRaw = tripsRes.value.live;
          const runs = tripsRes.value.trip_runs ?? [];
          const activeRun =
            runs.find((r) => String((r as { status?: string }).status) === 'active') ?? runs[0] ?? null;
          const fromRun = activeRun
            ? {
                ...(liveRaw ?? {}),
                ...activeRun,
                gps_path:
                  (activeRun as { gps_path?: ParentTransportTrip['gps_path'] }).gps_path ??
                  liveRaw?.gps_path,
                latest_gps:
                  (activeRun as { latest_gps?: ParentTransportTrip['latest_gps'] }).latest_gps ??
                  liveRaw?.latest_gps,
                vehicle_label:
                  (activeRun as { vehicle_plate?: string; vehicle_name?: string }).vehicle_plate ||
                  (activeRun as { vehicle_name?: string }).vehicle_name ||
                  liveRaw?.vehicle_label,
                route_label:
                  (activeRun as { route_name?: string }).route_name || liveRaw?.route_label,
                status: (activeRun as { status?: string }).status || liveRaw?.status,
              }
            : liveRaw
              ? {
                  ...liveRaw,
                  gps_path: liveRaw.gps_path,
                }
              : null;
          setTrips(tripsRes.value.trips ?? []);
          setLiveTrip(fromRun);
        } else {
          setTrips([]);
          setLiveTrip(null);
          if (tripsRes.status === 'rejected') {
            throw tripsRes.reason;
          }
        }

        if (homeRes.status === 'fulfilled' && homeRes.value?.home) {
          const h = homeRes.value.home;
          setHome(h);
          setLatInput(String(h.latitude ?? ''));
          setLngInput(String(h.longitude ?? ''));
          setAddressInput(String(h.address_text ?? ''));
        } else if (homeRes.status === 'fulfilled') {
          setHome(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Transport', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Soft live refresh — update trip GPS without full-screen loading flash.
  useEffect(() => {
    if (tab !== 'live') return;
    const t = setInterval(() => {
      void (async () => {
        try {
          const tripsRes = await fetchParentTransportTrips(selectedStudentId);
          const liveRaw = tripsRes?.live;
          const runs = tripsRes?.trip_runs ?? [];
          const activeRun =
            runs.find((r) => String((r as { status?: string }).status) === 'active') ?? runs[0] ?? null;
          if (activeRun || liveRaw) {
            setLiveTrip({
              ...(liveRaw ?? {}),
              ...(activeRun ?? {}),
              gps_path:
                (activeRun as { gps_path?: ParentTransportTrip['gps_path'] })?.gps_path ??
                liveRaw?.gps_path,
              latest_gps:
                (activeRun as { latest_gps?: ParentTransportTrip['latest_gps'] })?.latest_gps ??
                liveRaw?.latest_gps,
            } as ParentTransportTrip);
          }
        } catch {
          /* keep last known */
        }
      })();
    }, 15000);
    return () => clearInterval(t);
  }, [tab, selectedStudentId]);

  const livePoint: LatLng = useMemo(() => {
    const path = liveTrip?.gps_path ?? [];
    const lastPin = path.length ? path[path.length - 1] : null;
    if (lastPin?.lat != null && lastPin?.lng != null) {
      return {
        lat: Number(lastPin.lat),
        lng: Number(lastPin.lng),
        label: liveTrip?.vehicle_label ?? 'Bus live',
      };
    }
    if (liveTrip?.latest_gps?.lat != null && liveTrip.latest_gps.lng != null) {
      return {
        lat: Number(liveTrip.latest_gps.lat),
        lng: Number(liveTrip.latest_gps.lng),
        label: liveTrip.vehicle_label ?? 'Bus live',
      };
    }
    if (liveTrip?.live_lat != null && liveTrip?.live_lng != null) {
      return {
        lat: Number(liveTrip.live_lat),
        lng: Number(liveTrip.live_lng),
        label: liveTrip.vehicle_label ?? 'Bus live',
      };
    }
    return DEFAULT_SCHOOL_PIN;
  }, [liveTrip]);

  const liveRoutePoints = useMemo(() => {
    const path = liveTrip?.gps_path ?? [];
    if (path.length >= 2) {
      return path
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), label: p.label }));
    }
    return [livePoint, DEFAULT_SCHOOL_PIN];
  }, [liveTrip, livePoint]);

  const homePoint: LatLng = useMemo(() => {
    const lat = Number(latInput);
    const lng = Number(lngInput);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, label: 'Home' };
    }
    if (home?.latitude != null && home?.longitude != null) {
      return { lat: Number(home.latitude), lng: Number(home.longitude), label: 'Home' };
    }
    return DEFAULT_SCHOOL_PIN;
  }, [latInput, lngInput, home]);

  const historyTrips = useMemo(() => (trips ?? []).map(mapApiTrip), [trips]);

  const liveLabel = liveTrip
    ? `${liveTrip.vehicle_label ?? 'School bus'} · ${liveTrip.route_label ?? 'Route'}`
    : 'School bus';
  const liveStatus = liveTrip ? tripStatusLabel(liveTrip.status) : 'No active trip';
  const embed = useMemo(() => {
    if (liveRoutePoints.length >= 2) {
      return googleMapsEmbedTwoPinUrl(
        liveRoutePoints[0]!,
        liveRoutePoints[liveRoutePoints.length - 1]!,
        13,
      );
    }
    return googleMapsEmbedUrl(livePoint, 14);
  }, [liveRoutePoints, livePoint]);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showDialog({
          title: 'Location needed',
          message: 'Allow location access to set your home pickup pin.',
          variant: 'warning',
        });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatInput(String(pos.coords.latitude));
      setLngInput(String(pos.coords.longitude));
    } catch (e) {
      showDialog({
        title: 'Could not get location',
        message: e instanceof Error ? e.message : String(e),
        variant: 'warning',
      });
    } finally {
      setLocating(false);
    }
  };

  const openMaps = () => {
    void Linking.openURL(googleMapsSearchUrl(livePoint));
  };

  const openTripRoute = (trip: ParentTripHistory) => {
    const url = googleMapsDirectionsUrl(trip.route);
    if (url) void Linking.openURL(url);
  };

  const saveHome = async () => {
    const lat = Number(latInput);
    const lng = Number(lngInput);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      showDialog({
        title: 'Invalid coordinates',
        message: 'Enter valid latitude and longitude, or use your current location / map picker.',
        variant: 'warning',
      });
      return;
    }
    setSavingHome(true);
    try {
      const res = await putParentTransportHome({
        latitude: lat,
        longitude: lng,
        address_text: addressInput.trim() || undefined,
        label: 'Home',
      });
      setHome(res?.home ?? null);
      showDialog({ title: 'Saved', message: 'Home pickup pin updated.', variant: 'success' });
    } catch (e) {
      showDialog({
        title: 'Could not save',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setSavingHome(false);
    }
  };

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: floatingHeaderInset(insets.top),
            paddingBottom: moduleScrollBottomPad(insets.bottom),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Transport</ModuleKicker>
        <Text style={styles.title}>School bus</Text>
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `Live tracking and trip history for ${selectedStudent.name}.`
            : 'Live tracking and trip history for the selected student.'}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error && !trips.length ? (
          <ModuleEmpty title="Could not load transport" body={error} onRetry={() => void load()} />
        ) : (
          <>
            <ModuleTabPager
              tabs={[
                { key: 'live', label: 'Live map' },
                { key: 'history', label: 'Trip history' },
                { key: 'home', label: 'Home pin' },
              ]}
              value={tab}
              onChange={setTab}
              minHeight={360}
              renderPage={(key) => {
                if (key === 'live') {
                  return (
                    <>
                      <View style={styles.liveHeader}>
                        <Text style={styles.liveHeaderTitle}>{liveLabel}</Text>
                        <Text style={styles.liveHeaderSub}>{liveStatus}</Text>
                      </View>
                      <ModuleGlassCard>
                        <View style={styles.row}>
                          <Text style={styles.cardTitle}>{liveLabel}</Text>
                          <Text
                            style={[
                              styles.badge,
                              isLiveStatus(liveTrip?.status) || liveStatus === 'On route'
                                ? styles.badgeLive
                                : styles.badgeIdle,
                            ]}>
                            {liveStatus}
                          </Text>
                        </View>
                        {liveTrip?.route_label ? (
                          <Text style={styles.cardMeta}>{liveTrip.route_label}</Text>
                        ) : (
                          <Text style={styles.cardMeta}>School gate pin shown when bus is not live.</Text>
                        )}
                        {liveTrip?.boarded_at ? (
                          <Text style={styles.cardMeta}>
                            Boarded · {String(liveTrip.boarded_at).slice(11, 16)}
                          </Text>
                        ) : null}
                      </ModuleGlassCard>
                      <View style={styles.mapWrap}>
                        <WebView
                          source={{ uri: embed }}
                          style={styles.map}
                          scrollEnabled={false}
                          javaScriptEnabled
                          domStorageEnabled
                        />
                      </View>
                      <Pressable style={styles.openMapsBtn} onPress={openMaps}>
                        <Ionicons name="navigate" size={18} color={Colors.white} />
                        <Text style={styles.openMapsText}>Open in Google Maps</Text>
                      </Pressable>
                    </>
                  );
                }
                if (key === 'history') {
                  if (!historyTrips.length) {
                    return (
                      <ModuleEmpty
                        title="No trips yet"
                        body="Past bus trips for your child will appear here once recorded at school."
                      />
                    );
                  }
                  return (
                    <>
                      {historyTrips.map((trip) => {
                        const open = expandedTrip === trip.id;
                        return (
                          <Pressable
                            key={trip.id}
                            onPress={() => setExpandedTrip(open ? null : trip.id)}>
                            <ModuleGlassCard>
                              <View style={styles.row}>
                                <Text style={styles.cardTitle}>
                                  {trip.direction === 'to_school' ? 'To school' : 'From school'}
                                </Text>
                                <Text style={styles.dateBadge}>{trip.date}</Text>
                              </View>
                              <Text style={styles.cardMeta}>
                                {trip.routeName} · {trip.plate}
                              </Text>
                              <Text style={styles.cardMeta}>
                                {trip.boardedAt} → {trip.alightedAt}
                                {trip.durationMinutes ? ` · ${trip.durationMinutes} min` : ''}
                              </Text>
                              {open ? (
                                <View style={styles.routeBlock}>
                                  <Text style={styles.routeTitle}>Route</Text>
                                  {trip.route.map((p, i) => (
                                    <View key={`${trip.id}-p-${i}`} style={styles.routeStop}>
                                      <View style={styles.routeDot} />
                                      <Text style={styles.routeLabel}>
                                        {p.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
                                      </Text>
                                    </View>
                                  ))}
                                  <Pressable
                                    style={styles.routeMapsBtn}
                                    onPress={() => openTripRoute(trip)}>
                                    <Ionicons name="map-outline" size={16} color={Colors.brandGreenDark} />
                                    <Text style={styles.routeMapsText}>View route on Maps</Text>
                                  </Pressable>
                                </View>
                              ) : (
                                <Text style={styles.tapHint}>Tap for route stops</Text>
                              )}
                            </ModuleGlassCard>
                          </Pressable>
                        );
                      })}
                    </>
                  );
                }
                if (!selectedStudentId) {
                  return (
                    <ModuleEmpty
                      title="Select a student"
                      body="Choose a child from the dashboard header to set their home pickup pin."
                    />
                  );
                }
                const pickerLat = Number(latInput) || homePoint.lat;
                const pickerLng = Number(lngInput) || homePoint.lng;
                return (
                  <ModuleGlassCard>
                    <Text style={styles.cardTitle}>Home pickup location</Text>
                    {home?.address_text ? (
                      <Text style={styles.cardMeta}>{home.address_text}</Text>
                    ) : (
                      <Text style={styles.cardMeta}>
                        Set where the bus should pick up your child — use GPS, tap the map, or enter coordinates.
                      </Text>
                    )}
                    <View style={styles.mapWrap}>
                      {mapPickerOpen ? (
                        <WebView
                          source={{ html: mapPickerHtml(pickerLat, pickerLng) }}
                          style={styles.map}
                          scrollEnabled
                          javaScriptEnabled
                          domStorageEnabled
                          onMessage={(ev) => {
                            try {
                              const p = JSON.parse(ev.nativeEvent.data) as { lat?: number; lng?: number };
                              if (p.lat != null && p.lng != null) {
                                setLatInput(String(p.lat));
                                setLngInput(String(p.lng));
                              }
                            } catch {
                              /* ignore */
                            }
                          }}
                        />
                      ) : (
                        <WebView
                          source={{ uri: googleMapsEmbedTwoPinUrl(homePoint, DEFAULT_SCHOOL_PIN, 13) }}
                          style={styles.map}
                          scrollEnabled={false}
                          javaScriptEnabled
                          domStorageEnabled
                        />
                      )}
                    </View>
                    <View style={styles.homeBtnRow}>
                      <Pressable
                        style={[styles.secondaryLocBtn, locating && styles.btnDisabled]}
                        disabled={locating}
                        onPress={() => void useCurrentLocation()}>
                        {locating ? (
                          <ActivityIndicator size="small" color={Colors.brandGreenDark} />
                        ) : (
                          <>
                            <Ionicons name="locate" size={16} color={Colors.brandGreenDark} />
                            <Text style={styles.secondaryLocText}>Use my current location</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable style={styles.secondaryLocBtn} onPress={() => setMapPickerOpen((v) => !v)}>
                        <Ionicons name="map" size={16} color={Colors.brandGreenDark} />
                        <Text style={styles.secondaryLocText}>
                          {mapPickerOpen ? 'Preview pin' : 'Pick on map'}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={styles.fieldLabel}>Latitude</Text>
                    <TextInput
                      style={styles.input}
                      value={latInput}
                      onChangeText={setLatInput}
                      keyboardType="decimal-pad"
                      placeholder="-1.2921"
                      placeholderTextColor={Colors.mutedForeground}
                    />
                    <Text style={styles.fieldLabel}>Longitude</Text>
                    <TextInput
                      style={styles.input}
                      value={lngInput}
                      onChangeText={setLngInput}
                      keyboardType="decimal-pad"
                      placeholder="36.8219"
                      placeholderTextColor={Colors.mutedForeground}
                    />
                    <Text style={styles.fieldLabel}>Address label</Text>
                    <TextInput
                      style={styles.input}
                      value={addressInput}
                      onChangeText={setAddressInput}
                      placeholder="Home gate, estate, landmark"
                      placeholderTextColor={Colors.mutedForeground}
                    />
                    <Pressable
                      style={[styles.openMapsBtn, savingHome && styles.btnDisabled]}
                      disabled={savingHome}
                      onPress={() => void saveHome()}>
                      {savingHome ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                      ) : (
                        <>
                          <Ionicons name="location" size={18} color={Colors.white} />
                          <Text style={styles.openMapsText}>Save home pin</Text>
                        </>
                      )}
                    </Pressable>
                  </ModuleGlassCard>
                );
              }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.ink },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    borderRadius: 6,
  },
  badgeLive: { backgroundColor: 'rgba(5,150,105,0.15)', color: '#059669' },
  badgeIdle: { backgroundColor: 'rgba(0,0,0,0.06)', color: Colors.mutedForeground },
  dateBadge: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground },
  cardMeta: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4 },
  mapWrap: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  map: { flex: 1 },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandGreenDark,
    paddingVertical: 14,
    borderRadius: 14,
  },
  openMapsText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  routeBlock: { marginTop: 12, gap: 8 },
  routeTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  routeStop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandGreenMid,
  },
  routeLabel: { fontSize: 14, color: Colors.ink },
  routeMapsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  routeMapsText: { fontSize: 13, fontWeight: '700', color: Colors.brandGreenDark },
  tapHint: { marginTop: 8, fontSize: 12, color: Colors.mutedForeground },
  liveHeader: {
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  liveHeaderTitle: { fontSize: 16, fontWeight: '800', color: Colors.white },
  liveHeaderSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  fieldLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  homeBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  secondaryLocBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  secondaryLocText: { fontSize: 12, fontWeight: '700', color: Colors.brandGreenDark },
});
