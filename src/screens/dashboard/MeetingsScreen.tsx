import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { fetchJoinableMeetings, SchoolMeeting } from '../../lib/meetingsApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Meetings'>;

function formatWhen(iso?: string | null) {
  if (!iso) return 'Ad-hoc / opens when host starts';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function canJoin(m: SchoolMeeting) {
  return Boolean(m.join_window?.can_join || String(m.status || '').toLowerCase() === 'live');
}

export function MeetingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SchoolMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const data = await fetchJoinableMeetings();
      setItems(data?.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Meetings', msg);
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <DashboardBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.primary}
          />
        }>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Video meetings</ModuleKicker>
        <Text style={styles.title}>Meetings</Text>
        <Text style={styles.sub}>
          Join school meetings. You will enter your display name and phone before the room opens.
          Links only work in the join window (opens shortly before start).
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <ModuleEmpty title="Could not load meetings" body={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <ModuleEmpty
            title="No upcoming meetings"
            body="When a school admin schedules a public meeting, it will appear here."
            onRetry={() => void load()}
          />
        ) : (
          items.map((m) => {
            const open = canJoin(m);
            const url = m.short_url || m.join_url;
            return (
              <ModuleGlassCard key={m.id}>
                <View style={styles.row}>
                  <View style={styles.meta}>
                    <Text style={styles.meetTitle}>{m.title}</Text>
                    <Text style={styles.when}>{formatWhen(m.starts_at)}</Text>
                    <Text style={styles.status}>
                      {String(m.status || 'scheduled')}
                      {!open && m.join_window?.reason ? ` · ${m.join_window.reason}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    disabled={!open || !url}
                    style={[styles.joinBtn, (!open || !url) && styles.joinBtnDisabled]}
                    onPress={() => {
                      if (url) void Linking.openURL(url);
                    }}>
                    <Text style={styles.joinText}>{open ? 'Join' : 'Not open'}</Text>
                  </Pressable>
                </View>
              </ModuleGlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
    marginBottom: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flex: 1, minWidth: 0 },
  meetTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  when: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  status: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinBtnDisabled: { opacity: 0.45 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
