import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleTabPager } from '../../components/dashboard/ModuleTabPager';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import {
  fetchParentEvents,
  payParentEvent,
  rsvpParentEvent,
  scanParentRegister,
  fetchRegisterScanTodayStatus,
  seedParentDemoData,
} from '../../lib/parentPortalApi';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDialog } from '../../context/DialogContext';
import { GateDirectionToggle } from '../../components/dashboard/GateDirectionToggle';
import { useGateScanDirection } from '../../hooks/useGateScanDirection';
import { GateDirection } from '../../lib/gateScanDirection';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Events'>;

type SchoolEvent = {
  id?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  start_at?: string;
  end_at?: string | null;
  location?: string | null;
  audience?: string | null;
  all_day?: boolean | number;
  image_url?: string | null;
  is_payable?: boolean | number;
  fee_amount?: number | null;
  fee_currency?: string | null;
  requires_rsvp?: boolean | number;
  target_class_id?: string | null;
  target_level?: string | null;
  my_rsvp?: { status?: string } | null;
  my_payment?: { status?: string } | null;
  payment_status?: string | null;
};

type MainTab = 'upcoming' | 'payable' | 'calendar' | 'scan';

function unwrapEvents(data: unknown): SchoolEvent[] {
  if (Array.isArray(data)) return data as SchoolEvent[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.events)) return obj.events as SchoolEvent[];
    if (Array.isArray(obj.items)) return obj.items as SchoolEvent[];
    if (Array.isArray(obj.data)) return obj.data as SchoolEvent[];
  }
  return [];
}

function formatWhen(ev: SchoolEvent): string {
  if (!ev.start_at) return '';
  try {
    const start = new Date(ev.start_at);
    if (Number.isNaN(start.getTime())) return String(ev.start_at);
    if (ev.all_day) {
      return start.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ev.start_at);
  }
}

function isPayable(ev: SchoolEvent) {
  return Boolean(Number(ev.is_payable) || ev.is_payable === true);
}

function dayKey(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function EventsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId } = useDeskAuth();
  const { showDialog } = useDialog();
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState<SchoolEvent[]>([]);
  const [tab, setTab] = useState<MainTab>('upcoming');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);

  const fetchRegisterStatus = useCallback(async () => {
    const data = await fetchRegisterScanTodayStatus();
    return {
      last_direction: data?.last_direction ?? null,
      check_in_at: data?.last_direction === 'in' ? data?.last_marked_at ?? null : null,
      check_out_at: data?.last_direction === 'out' ? data?.last_marked_at ?? null : null,
    };
  }, []);

  const {
    direction: scanDirection,
    setDirection: setScanDirection,
    loading: scanDirLoading,
    hint: scanDirHint,
  } = useGateScanDirection(fetchRegisterStatus);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const data = await fetchParentEvents({
          studentId: selectedStudentId,
        });
        setItems(unwrapEvents(data));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Events', msg);
        setError(msg);
        setItems([]);
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

  const listItems = useMemo(() => {
    if (tab === 'payable') return items.filter(isPayable);
    if (tab === 'calendar' && selectedDay) {
      return items.filter((e) => dayKey(e.start_at) === selectedDay);
    }
    return items;
  }, [items, tab, selectedDay]);

  const calendarCells = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const eventDays = new Set(items.map((e) => dayKey(e.start_at)).filter(Boolean));
    const cells: Array<{ day: number | null; key: string; hasEvent: boolean }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: `pad-${i}`, hasEvent: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key, hasEvent: eventDays.has(key) });
    }
    return cells;
  }, [monthCursor, items]);

  const attend = async (ev: SchoolEvent) => {
    if (!ev.id) return;
    setBusyId(ev.id);
    try {
      await rsvpParentEvent(ev.id, {
        status: 'attending',
        student_id: selectedStudentId ?? undefined,
      });
      showDialog({
        title: 'RSVP saved',
        message: 'This records your intention to attend. Scan at the school gate or event QR to register attendance.',
        variant: 'success',
      });
      await load(true);
    } catch (e) {
      log.warn('Events', 'rsvp failed', String(e));
      showDialog({
        title: 'RSVP failed',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setBusyId(null);
    }
  };

  const onScanRegister = useCallback(
    async (raw: string, direction: GateDirection) => {
      if (scanBusy) return;
      setScanBusy(true);
      try {
        const res = await scanParentRegister({
          qr_payload: raw,
          person_type: 'parent',
          direction,
        });
        const scanType = String(res?.scan_type ?? 'visit');
        const isOut = direction === 'out';
        showDialog({
          title: scanType === 'event' ? (isOut ? 'Event check-out' : 'Event check-in') : isOut ? 'Checked out' : 'School visit recorded',
          message: res?.message || (isOut ? 'Your departure was recorded.' : 'You are registered on today’s attendance / event register.'),
          variant: 'success',
        });
      } catch (e) {
        showDialog({
          title: 'Scan failed',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
        setScanned(false);
      } finally {
        setScanBusy(false);
      }
    },
    [scanBusy, showDialog],
  );

  const pay = async (ev: SchoolEvent) => {
    if (!ev.id) return;
    setBusyId(ev.id);
    try {
      await payParentEvent(ev.id, {
        student_id: selectedStudentId ?? undefined,
        method: 'mobile',
      });
      await load(true);
    } catch (e) {
      log.warn('Events', 'pay failed', String(e));
    } finally {
      setBusyId(null);
    }
  };

  const seed = async () => {
    try {
      await seedParentDemoData();
      await load(true);
    } catch (e) {
      log.warn('Events', 'seed failed', String(e));
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
        <ModuleKicker>Events</ModuleKicker>
        <Text style={styles.heading}>School activities</Text>

        <ModuleTabPager
          tabs={[
            { key: 'upcoming', label: 'All' },
            { key: 'payable', label: 'Payable' },
            { key: 'calendar', label: 'Calendar' },
            { key: 'scan', label: 'Scan' },
          ]}
          value={tab}
          onChange={(key) => {
            setTab(key);
            if (key === 'scan') setScanned(false);
          }}
          minHeight={360}
          renderPage={(key) => {
            const pageItems =
              key === 'payable'
                ? items.filter(isPayable)
                : key === 'calendar' && selectedDay
                  ? items.filter((e) => dayKey(e.start_at) === selectedDay)
                  : items;
            return (
              <>
        {key === 'scan' ? (
          <ModuleGlassCard>
            <Text style={styles.desc}>
              Scan the school gate or event QR to register attendance. “I will attend” is RSVP only —
              scanning records the real visit.
            </Text>
            <GateDirectionToggle
              value={scanDirection}
              onChange={setScanDirection}
              disabled={scanBusy || scanDirLoading}
              hint={scanDirHint}
            />
            {!permission?.granted ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Text style={styles.meta}>Camera access is needed to scan.</Text>
                <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
                  <Text style={styles.primaryBtnText}>Allow camera</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setTab('upcoming');
                    setScanned(false);
                  }}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <View style={styles.scanCameraWrap}>
                  <CameraView
                    style={styles.scanCamera}
                    facing="back"
                    onBarcodeScanned={
                      scanned || scanBusy
                        ? undefined
                        : ({ data }) => {
                            setScanned(true);
                            void onScanRegister(data, scanDirection);
                          }
                    }
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  />
                </View>
                {scanBusy ? (
                  <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 12 }} />
                ) : scanned ? (
                  <Pressable style={styles.secondaryBtn} onPress={() => setScanned(false)}>
                    <Text style={styles.secondaryBtnText}>Scan again</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.meta, { marginTop: 10 }]}>
                    Point at the school or event QR code.
                  </Text>
                )}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 10 }]}
                  onPress={() => {
                    setTab('upcoming');
                    setScanned(false);
                  }}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </ModuleGlassCard>
        ) : null}

        {key === 'calendar' ? (
          <View style={styles.calWrap}>
            <View style={styles.calHeader}>
              <Pressable
                onPress={() =>
                  setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                }>
                <Ionicons name="chevron-back" size={22} color={Colors.ink} />
              </Pressable>
              <Text style={styles.calTitle}>
                {monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable
                onPress={() =>
                  setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                }>
                <Ionicons name="chevron-forward" size={22} color={Colors.ink} />
              </Pressable>
            </View>
            <View style={styles.calDow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.calDowText}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {calendarCells.map((c) => (
                <Pressable
                  key={c.key}
                  style={[
                    styles.calCell,
                    selectedDay === c.key && styles.calCellSelected,
                    !c.day && styles.calCellEmpty,
                  ]}
                  disabled={!c.day}
                  onPress={() => c.day && setSelectedDay(c.key)}>
                  {c.day ? (
                    <>
                      <Text
                        style={[
                          styles.calDay,
                          selectedDay === c.key && styles.calDaySelected,
                        ]}>
                        {c.day}
                      </Text>
                      {c.hasEvent ? <View style={styles.calDot} /> : null}
                    </>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {key !== 'scan' && loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : key !== 'scan' && error ? (
          <ModuleEmpty
            title="Couldn’t load events"
            body={
              /session expired|401|unauthorized/i.test(error)
                ? 'School API session isn’t accepted yet for this account. Pull to retry.'
                : error
            }
            onRetry={() => void load()}
          />
        ) : key !== 'scan' && pageItems.length === 0 ? (
          <ModuleEmpty
            title={key === 'payable' ? 'No payable events' : 'No events'}
            body={
              key === 'payable'
                ? 'School trips and fee events will show here.'
                : 'Parent-facing school events will appear when the school publishes them.'
            }
            onRetry={() => void seed()}
          />
        ) : key !== 'scan' ? (
          pageItems.map((ev, index) => {
            const attending = String(ev.my_rsvp?.status ?? '') === 'attending';
            const paid = String(ev.payment_status ?? ev.my_payment?.status ?? '') === 'paid';
            const fee =
              isPayable(ev) && ev.fee_amount != null
                ? `${ev.fee_currency || 'KES'} ${ev.fee_amount}`
                : null;
            return (
              <ModuleGlassCard key={String(ev.id ?? index)}>
                {ev.image_url ? (
                  <Image source={{ uri: String(ev.image_url) }} style={styles.cover} />
                ) : null}
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.orange} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{ev.title || 'Event'}</Text>
                    <Text style={styles.meta}>{formatWhen(ev)}</Text>
                  </View>
                </View>
                {ev.location ? (
                  <Text style={styles.loc}>
                    <Ionicons name="location-outline" size={12} color={Colors.mutedForeground} />{' '}
                    {ev.location}
                  </Text>
                ) : null}
                {ev.description ? <Text style={styles.desc}>{ev.description}</Text> : null}
                <Text style={styles.tags}>
                  {[ev.category, ev.audience, ev.target_level, fee].filter(Boolean).join(' · ')}
                </Text>
                <View style={styles.actions}>
                  {isPayable(ev) && !paid ? (
                    <Pressable
                      style={styles.primaryBtn}
                      disabled={busyId === ev.id}
                      onPress={() => void pay(ev)}>
                      <Text style={styles.primaryBtnText}>
                        {busyId === ev.id ? 'Paying…' : `Pay ${fee || ''}`}
                      </Text>
                    </Pressable>
                  ) : null}
                  {paid ? (
                    <View style={styles.badgePaid}>
                      <Text style={styles.badgePaidText}>Paid</Text>
                    </View>
                  ) : null}
                  {!attending ? (
                    <Pressable
                      style={styles.secondaryBtn}
                      disabled={busyId === ev.id}
                      onPress={() => void attend(ev)}>
                      <Text style={styles.secondaryBtnText}>I will attend (RSVP)</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.badgeAttend}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={styles.badgeAttendText}>RSVP’d — scan to check in</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setTab('scan');
                      setScanned(false);
                    }}>
                    <Text style={styles.secondaryBtnText}>Scan to register</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => {
                      const start = ev.start_at ? new Date(ev.start_at) : null;
                      const end = ev.end_at ? new Date(ev.end_at) : start;
                      if (!start || Number.isNaN(start.getTime())) {
                        showDialog({
                          title: 'No date',
                          message: 'This event has no start time to add.',
                          variant: 'warning',
                        });
                        return;
                      }
                      const fmt = (d: Date) =>
                        d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
                      const dates = `${fmt(start)}/${fmt(end && !Number.isNaN(end.getTime()) ? end : new Date(start.getTime() + 3600000))}`;
                      const url =
                        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
                        `&text=${encodeURIComponent(ev.title || 'School event')}` +
                        `&dates=${dates}` +
                        `&details=${encodeURIComponent(ev.description || '')}` +
                        `&location=${encodeURIComponent(ev.location || '')}`;
                      void Linking.openURL(url);
                    }}>
                    <Text style={styles.secondaryBtnText}>Add to calendar</Text>
                  </Pressable>
                </View>
              </ModuleGlassCard>
            );
          })
        ) : null}
              </>
            );
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 12,
  },
  scanCameraWrap: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  scanCamera: { flex: 1 },
  calWrap: {
    backgroundColor: 'rgba(10,61,46,0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  calDow: { flexDirection: 'row', marginBottom: 4 },
  calDowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedForeground,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calCellEmpty: { opacity: 0 },
  calCellSelected: { backgroundColor: Colors.brandGreenDark },
  calDay: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  calDaySelected: { color: Colors.white },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.orange,
    marginTop: 2,
  },
  loader: { paddingVertical: 40, alignItems: 'center' },
  cover: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(232,93,4,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
  loc: { marginTop: 10, fontSize: 13, color: Colors.mutedForeground },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  tags: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brandGreenMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' },
  primaryBtn: {
    backgroundColor: Colors.brandGreenDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  secondaryBtn: {
    backgroundColor: 'rgba(10,61,46,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: { color: Colors.brandGreenDark, fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.45 },
  badgePaid: {
    backgroundColor: 'rgba(5,150,105,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePaidText: { color: '#059669', fontWeight: '700', fontSize: 12 },
  badgeAttend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeAttendText: { color: '#059669', fontWeight: '700', fontSize: 13 },
});
