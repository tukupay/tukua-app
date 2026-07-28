import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { fetchParentSchool } from '../../lib/parentPortalApi';
import {
  endSecurityTrip,
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
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);
  const gpsBufferRef = useRef<GpsPin[]>([]);
  const gpsFlushRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    [showDialog],
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

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ModuleBackBar label="Trips & board" onBack={() => navigation.goBack()} />
      <ScrollView
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
      >
        <ModuleKicker>Ops</ModuleKicker>
        <Text style={styles.h1}>{schoolName}</Text>
        <Text style={styles.sub}>Start trip · GPS · board students. Face enroll is a separate tile.</Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenDark} style={{ marginTop: 24 }} />
        ) : (
          <>
            <Pressable style={styles.linkBtn} onPress={() => navigation.navigate('GateCheckIn')}>
              <Text style={styles.linkBtnText}>Gate check-in</Text>
            </Pressable>

            <ModuleGlassCard>
              <Text style={styles.cardTitle}>My assignment</Text>
              {assignment ? (
                <>
                  <Text style={styles.line}>
                    Bus: {assignment.vehicle_name ?? '—'} ({assignment.vehicle_plate ?? '—'})
                  </Text>
                  <Text style={styles.line}>Route: {assignment.route_name ?? '—'}</Text>
                </>
              ) : (
                <Text style={styles.muted}>No vehicle assigned yet. Admin assigns driver + assistant on Desk.</Text>
              )}
            </ModuleGlassCard>

            <ModuleGlassCard>
              <Text style={styles.cardTitle}>Active trip</Text>
              {tripActive ? (
                <>
                  <Text style={styles.line}>On trip · {activeTrip?.trip_kind ?? 'run'}</Text>
                  <Text style={styles.muted}>GPS buffered and sent about every 20 seconds for parent tracking</Text>
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
                    onPress={() => void startTrip()}
                  >
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
          </>
        )}
      </ScrollView>
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
});
