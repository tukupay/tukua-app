import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleScreenHeader, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import {
  fetchJoinableMeetings,
  createSchoolMeeting,
  hostEnterMeeting,
  memberEnterMeeting,
  SchoolMeeting,
} from '../../lib/meetingsApi';
import { useDeskAuth } from '../../context/DeskAuthContext';
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
  const { persona } = useDeskAuth();
  const [items, setItems] = useState<SchoolMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [hostingId, setHostingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSchedule = persona === 'school_admin' || persona === 'super_admin';

  /** Any signed-in Desk user joins in-app via profile name/phone (guest links are for non-users). */
  const inAppJoin = Boolean(persona);

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

  const onJoin = useCallback(
    async (m: SchoolMeeting) => {
      if (!canJoin(m)) return;

      if (!inAppJoin) {
        setError('Complete your profile name and phone to join meetings in the app.');
        return;
      }

      setJoiningId(m.id);
      try {
        const entered = await memberEnterMeeting(m.id);
        const roomUrl = entered?.room_url;
        if (!roomUrl) {
          throw new Error('Could not open the meeting room. Try again.');
        }
        navigation.navigate('MeetingRoom', {
          title: m.title || 'Tukua Meet',
          roomUrl,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Meetings', 'member-enter', msg);
        setError(msg);
      } finally {
        setJoiningId(null);
      }
    },
    [inAppJoin, navigation],
  );

  const onHost = useCallback(
    async (m: SchoolMeeting) => {
      setHostingId(m.id);
      setError(null);
      try {
        const entered = await hostEnterMeeting(m.id);
        const roomUrl =
          entered?.room_url ||
          (entered as { jitsi_join_url?: string })?.jitsi_join_url ||
          entered?.join_url;
        if (!roomUrl) {
          throw new Error('Could not open the host room. Try again.');
        }
        navigation.navigate('MeetingRoom', {
          title: m.title || 'Tukua Meet',
          roomUrl,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Meetings', 'host-enter', msg);
        setError(msg);
      } finally {
        setHostingId(null);
      }
    },
    [navigation],
  );

  const onCreate = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a meeting title.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createSchoolMeeting({
        title,
        is_public: true,
        duration_minutes: 60,
        join_opens_minutes_before: 15,
      });
      setNewTitle('');
      setShowCreate(false);
      await load(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Meetings', 'create', msg);
      setError(msg);
    } finally {
      setCreating(false);
    }
  }, [load, newTitle]);

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
        <ModuleKicker>Tukua Meet</ModuleKicker>
        <ModuleScreenHeader
          title="Meetings"
          description={
            canSchedule
              ? 'Schedule, host, or join school video meetings.'
              : 'Join school video meetings in the app.'
          }
        />

        {canSchedule ? (
          <ModuleGlassCard>
            {!showCreate ? (
              <Pressable style={styles.createToggle} onPress={() => setShowCreate(true)}>
                <Text style={styles.createToggleText}>Schedule a meeting</Text>
              </Pressable>
            ) : (
              <View style={styles.createForm}>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Meeting title"
                  placeholderTextColor={Colors.mutedForeground}
                  style={styles.input}
                />
                <View style={styles.createActions}>
                  <Pressable
                    style={[styles.joinBtn, creating && styles.joinBtnDisabled]}
                    disabled={creating}
                    onPress={() => void onCreate()}>
                    {creating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.joinText}>Create</Text>
                    )}
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={() => setShowCreate(false)}>
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ModuleGlassCard>
        ) : null}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error && items.length === 0 ? (
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
            const busy = joiningId === m.id;
            const hosting = hostingId === m.id;
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
                  <View style={styles.actionCol}>
                    {canSchedule ? (
                      <Pressable
                        disabled={hosting}
                        style={[styles.hostBtn, hosting && styles.joinBtnDisabled]}
                        onPress={() => void onHost(m)}>
                        {hosting ? (
                          <ActivityIndicator color={Colors.primary} size="small" />
                        ) : (
                          <Text style={styles.hostText}>Host</Text>
                        )}
                      </Pressable>
                    ) : null}
                    <Pressable
                      disabled={!open || busy}
                      style={[styles.joinBtn, (!open || busy) && styles.joinBtnDisabled]}
                      onPress={() => void onJoin(m)}>
                      {busy ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.joinText}>{open ? 'Join' : 'Not open'}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </ModuleGlassCard>
            );
          })
        )}
        {error && items.length > 0 ? <Text style={styles.inlineErr}>{error}</Text> : null}
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
  actionCol: { flexDirection: 'column', gap: 8, alignItems: 'stretch' },
  meta: { flex: 1, minWidth: 0 },
  createToggle: { paddingVertical: 4 },
  createToggleText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  createForm: { gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  createActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  secondaryText: { color: Colors.mutedForeground, fontWeight: '600', fontSize: 13 },
  hostBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  hostText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  meetTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  when: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  status: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.45 },
  joinText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  inlineErr: { marginTop: 12, color: '#b42318', fontSize: 13 },
});
