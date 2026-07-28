import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { fetchParentSchool } from '../../lib/parentPortalApi';
import {
  endSecurityTrip,
  ensureDailyRegister,
  fetchDailyStudentAttendance,
  fetchRegisterEntries,
  fetchSecurityActiveTrip,
  fetchSecurityAssignment,
  postSecurityTripGpsBatch,
  startSecurityTrip,
  type SecurityAssignment,
  type SecurityTripRun,
} from '../../lib/transportApi';
import { useDialog } from '../../context/DialogContext';
import { BoardStudentPanel } from './BoardStudentPanel';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SecurityHome'>;

type GpsPin = { latitude: number; longitude: number; speed_kmh?: number; recorded_at: string };

type DailyRecord = {
  id: string;
  title: string;
  meta: string;
};

/**
 * Security trips & boarding only. Face enroll is a separate screen (SecurityFaceEnroll).
 */
export function SecurityHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [schoolName, setSchoolName] = useState('');
  const [assignment, setAssignment] = useState<SecurityAssignment | null>(null);
  const [activeTrip, setActiveTrip] = useState<SecurityTripRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyLoadingMore, setDailyLoadingMore] = useState(false);
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);
  const gpsBufferRef = useRef<GpsPin[]>([]);
  const gpsFlushRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDailyRecords = useCallback(async (page = 1, append = false) => {
    if (append) setDailyLoadingMore(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const items: DailyRecord[] = [];
      try {
        const ensured = await ensureDailyRegister(today);
        const sessionId = ensured?.session?.id;
        if (sessionId) {
          const entries = await fetchRegisterEntries(sessionId);
          for (const e of entries?.entries ?? []) {
            items.push({
              id: `reg-${e.id}`,
              title: e.full_name || 'Visitor / person',
              meta: [
                e.person_type || 'register',
                e.direction || '',
                e.marked_at ? String(e.marked_at).slice(11, 16) : '',
              ]
                .filter(Boolean)
                .join(' · '),
            });
          }
        }
      } catch {
        /* register optional */
      }
      try {
        const daily = await fetchDailyStudentAttendance({ date: today, page, limit: 30 });
        const marked = (daily?.rows ?? []).filter((r) => r.check_in_at || r.check_out_at);
        for (const r of marked) {
          items.push({
            id: `att-${r.student_id}`,
            title: r.name,
            meta: [
              r.admission_number || '',
              r.check_in_at ? `in ${String(r.check_in_at).slice(11, 16)}` : '',
              r.check_out_at ? `out ${String(r.check_out_at).slice(11, 16)}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
          });
        }
        setDailyTotal(Math.max(items.length, Number(daily?.total ?? 0)));
      } catch {
        setDailyTotal(items.length);
      }
      // Client-side page slice for combined list
      const pageSize = 30;
      const slice = items.slice(0, page * pageSize);
      setDailyRecords(append ? slice : slice);
      setDailyPage(page);
    } finally {
      setDailyLoadingMore(false);
    }
  }, []);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      try {
        const [schoolRes, assignRes, tripRes] = await Promise.all([
          fetchParentSchool().catch(() => null),
          fetchSecurityAssignment(),
          fetchSecurityActiveTrip(),
        ]);
        setSchoolName(String(schoolRes?.school?.name ?? 'Your school'));
        setAssignment(assignRes?.assignment ?? null);
        setActiveTrip(tripRes?.trip ?? null);
        await loadDailyRecords(1, false);
      } catch (e) {
        showDialog({
          title: 'Could not load',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showDialog, loadDailyRecords],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const stopGps = useCallback(() => {
    gpsWatchRef.current?.remove();
    gpsWatchRef.current = null;
    if (gpsFlushRef.current) {
      clearInterval(gpsFlushRef.current);
      gpsFlushRef.current = null;
    }
    gpsBufferRef.current = [];
  }, []);

  useEffect(() => () => stopGps(), [stopGps]);

  const startGps = useCallback(
    async (tripId: string) => {
      stopGps();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showDialog({
          title: 'Location needed',
          message: 'Allow location so parents can track the bus.',
          variant: 'warning',
        });
        return;
      }
      gpsWatchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 15 },
        (pos) => {
          gpsBufferRef.current.push({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed_kmh:
              typeof pos.coords.speed === 'number' && pos.coords.speed >= 0
                ? Math.round(pos.coords.speed * 3.6)
                : undefined,
            recorded_at: new Date(pos.timestamp).toISOString(),
          });
        },
      );
      gpsFlushRef.current = setInterval(() => {
        const pins = gpsBufferRef.current.splice(0, gpsBufferRef.current.length);
        if (!pins.length) return;
        void postSecurityTripGpsBatch(tripId, pins).catch(() => undefined);
      }, 20000);
    },
    [showDialog, stopGps],
  );

  const startTrip = async () => {
    if (!assignment?.vehicle_id) {
      showDialog({
        title: 'No vehicle',
        message: 'Ask admin to assign your bus on Desk first.',
        variant: 'warning',
      });
      return;
    }
    setStarting(true);
    try {
      const trip = await startSecurityTrip({
        vehicle_id: assignment.vehicle_id,
        route_id: assignment.route_id ?? undefined,
        trip_kind: 'home_morning',
      });
      setActiveTrip(trip);
      if (trip?.id) await startGps(trip.id);
      showDialog({ title: 'Trip started', message: 'GPS tracking is on for parents.', variant: 'success' });
    } catch (e) {
      showDialog({
        title: 'Start failed',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setStarting(false);
    }
  };

  const endTrip = async () => {
    if (!activeTrip?.id) return;
    setEnding(true);
    try {
      const pins = gpsBufferRef.current.splice(0, gpsBufferRef.current.length);
      if (pins.length) {
        await postSecurityTripGpsBatch(activeTrip.id, pins).catch(() => undefined);
      }
      stopGps();
      await endSecurityTrip(activeTrip.id);
      setActiveTrip(null);
      showDialog({ title: 'Trip ended', message: 'Run closed.', variant: 'success' });
    } catch (e) {
      showDialog({
        title: 'End failed',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setEnding(false);
    }
  };

  const tripActive = Boolean(activeTrip?.id && activeTrip.status === 'active');
  const busPhoto =
    activeTrip?.vehicle_photo_url || assignment?.vehicle_photo_url || null;
  const busLabel =
    activeTrip?.vehicle_name ||
    assignment?.vehicle_name ||
    activeTrip?.vehicle_plate ||
    assignment?.vehicle_plate ||
    'Bus';

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ModuleBackBar label="Trips & board" onBack={() => navigation.goBack()} />
      <FlatList
        data={dailyRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.brandGreenDark}
          />
        }
        onEndReached={() => {
          if (dailyLoadingMore || loading) return;
          if (dailyRecords.length >= Math.max(dailyTotal, dailyRecords.length)) return;
          void loadDailyRecords(dailyPage + 1, true);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <ModuleKicker>Ops</ModuleKicker>
            <Text style={styles.h1}>{schoolName}</Text>
            <Text style={styles.sub}>Start trip · GPS · board students. Face enroll is a separate tile.</Text>

            {loading ? (
              <ActivityIndicator color={Colors.brandGreenDark} style={{ marginTop: 24 }} />
            ) : (
              <>
                <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('GateCheckIn')}>
                  <Text style={styles.linkBtnText}>Gate check-in (staff QR)</Text>
                </Pressable>
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => navigation.navigate('SecurityDailyAttendance')}>
                  <Text style={styles.linkBtnText}>Daily attendance (face · QR · search)</Text>
                </Pressable>

                <ModuleGlassCard>
                  <Text style={styles.cardTitle}>My assignment</Text>
                  {assignment ? (
                    <View style={styles.busRow}>
                      {busPhoto ? (
                        <Image source={{ uri: busPhoto }} style={styles.busImg} />
                      ) : (
                        <View style={[styles.busImg, styles.busPlaceholder]}>
                          <Ionicons name="bus-outline" size={28} color={Colors.brandGreenDark} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.line}>
                          Bus: {assignment.vehicle_name ?? '—'} ({assignment.vehicle_plate ?? '—'})
                        </Text>
                        <Text style={styles.line}>Route: {assignment.route_name ?? '—'}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.muted}>No vehicle assigned yet. Admin assigns driver + assistant on Desk.</Text>
                  )}
                </ModuleGlassCard>

                <ModuleGlassCard>
                  <Text style={styles.cardTitle}>Active trip</Text>
                  {tripActive ? (
                    <>
                      <View style={styles.busRow}>
                        {busPhoto ? (
                          <Image source={{ uri: busPhoto }} style={styles.busImg} />
                        ) : (
                          <View style={[styles.busImg, styles.busPlaceholder]}>
                            <Ionicons name="bus-outline" size={28} color={Colors.brandGreenDark} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.line}>
                            {busLabel} · {activeTrip?.trip_kind?.replace(/_/g, ' ') ?? 'run'}
                          </Text>
                          <Text style={styles.muted}>GPS buffered ~every 20s for parent tracking</Text>
                        </View>
                      </View>
                      <Pressable style={[styles.btn, styles.btnDanger]} disabled={ending} onPress={() => void endTrip()}>
                        <Text style={styles.btnText}>{ending ? 'Ending…' : 'End trip'}</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.muted}>
                        Driver/assistant are set when the trip is created on Desk. Start your assigned bus run here.
                      </Text>
                      <Pressable
                        style={styles.btn}
                        disabled={starting || !assignment?.vehicle_id}
                        onPress={() => void startTrip()}>
                        <Text style={styles.btnText}>{starting ? 'Starting…' : 'Start trip'}</Text>
                      </Pressable>
                    </>
                  )}
                </ModuleGlassCard>

                <ModuleGlassCard>
                  <BoardStudentPanel
                    tripId={activeTrip?.id ?? null}
                    tripActive={tripActive}
                    onBoarded={() => {
                      /* keep GPS buffer; avoid full reload flash */
                    }}
                    onCancel={() => undefined}
                  />
                </ModuleGlassCard>

                <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('SecurityFaceEnroll')}>
                  <Text style={styles.linkBtnText}>Face enroll (save faces)</Text>
                </Pressable>
                <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('GateQr')}>
                  <Text style={styles.linkBtnText}>Show Gate QR (staff check-in)</Text>
                </Pressable>

                <Text style={styles.cardTitle}>Daily records</Text>
                <Text style={styles.muted}>Today&apos;s gate / register entries</Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.muted}>No daily records yet today.</Text> : null
        }
        ListFooterComponent={
          dailyLoadingMore ? (
            <ActivityIndicator style={{ marginVertical: 12 }} color={Colors.brandGreenDark} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.recordRow}>
            <Text style={styles.line}>{item.title}</Text>
            <Text style={styles.muted}>{item.meta}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  line: { fontSize: 14, color: Colors.ink, marginBottom: 4 },
  muted: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  busRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  busImg: { width: 72, height: 54, borderRadius: 10 },
  busPlaceholder: {
    backgroundColor: 'rgba(15,92,66,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    marginTop: 8,
    backgroundColor: Colors.brandGreenDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDanger: { backgroundColor: '#DC2626' },
  btnText: { color: '#fff', fontWeight: '700' },
  linkBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(15,92,66,0.12)',
  },
  linkBtnText: { fontWeight: '700', color: Colors.brandGreenDark },
  recordRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
});
