import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import {
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
  PARENT_CHILD_BUS,
  PARENT_TRIP_HISTORY,
  ParentTripHistory,
} from '../../lib/parentTransportDummy';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Transport'>;

type TabKey = 'live' | 'history';

/**
 * Transport — UI-only (same approach as Desk transport module).
 * One bus for the selected child: live map + trip history / route.
 */
export function TransportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudent } = useDeskAuth();
  const [tab, setTab] = useState<TabKey>('live');
  const [expandedTrip, setExpandedTrip] = useState<string | null>(PARENT_TRIP_HISTORY[0]?.id ?? null);

  const bus = PARENT_CHILD_BUS;
  const embed = useMemo(() => googleMapsEmbedUrl(bus.live, 15), [bus.live]);

  const openMaps = () => {
    void Linking.openURL(googleMapsSearchUrl(bus.live));
  };

  const openTripRoute = (trip: ParentTripHistory) => {
    const url = googleMapsDirectionsUrl(trip.route);
    if (url) void Linking.openURL(url);
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
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Transport</ModuleKicker>
        <Text style={styles.title}>School bus</Text>
        <Text style={styles.sub}>
          {selectedStudent?.name
            ? `Live tracking for ${selectedStudent.name}’s bus.`
            : 'Live tracking for your child’s bus.'}{' '}
          History shows routes already taken.
        </Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'live' && styles.tabActive]}
            onPress={() => setTab('live')}>
            <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>Live map</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}>
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Trip history
            </Text>
          </Pressable>
        </View>

        {tab === 'live' ? (
          <>
            <ModuleGlassCard>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{bus.name}</Text>
                <Text
                  style={[
                    styles.badge,
                    bus.status === 'On route' ? styles.badgeLive : styles.badgeIdle,
                  ]}>
                  {bus.status}
                </Text>
              </View>
              <Text style={styles.cardMeta}>
                {bus.plate} · {bus.routeCode}
              </Text>
              <Text style={styles.cardMeta}>
                {bus.originName} → {bus.destinationName}
              </Text>
              <Text style={styles.driver}>
                {bus.driverName} · {bus.driverPhoneMasked}
              </Text>
              {bus.status === 'On route' ? (
                <Text style={styles.eta}>ETA ~{bus.etaMinutes} min</Text>
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
        ) : (
          PARENT_TRIP_HISTORY.map((trip) => {
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
                    {trip.boardedAt} → {trip.alightedAt} · {trip.durationMinutes} min
                  </Text>
                  {open ? (
                    <View style={styles.routeBlock}>
                      <Text style={styles.routeTitle}>Route passed</Text>
                      {trip.route.map((p, i) => (
                        <View key={`${trip.id}-p-${i}`} style={styles.routeStop}>
                          <View style={styles.routeDot} />
                          <Text style={styles.routeLabel}>
                            {p.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
                          </Text>
                        </View>
                      ))}
                      <Pressable style={styles.routeMapsBtn} onPress={() => openTripRoute(trip)}>
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
          })
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
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabActive: { backgroundColor: Colors.brandGreenDark },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.mutedForeground },
  tabTextActive: { color: Colors.white },
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
  driver: { fontSize: 13, color: Colors.ink, marginTop: 8 },
  eta: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 8 },
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
  routeMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  routeMapsText: { fontSize: 13, fontWeight: '700', color: Colors.brandGreenDark },
  tapHint: { marginTop: 8, fontSize: 12, color: Colors.mutedForeground },
});
