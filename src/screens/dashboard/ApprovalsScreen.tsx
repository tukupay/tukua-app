import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import {
  approveAllJoinRequests,
  approveJoinRequest,
  fetchPendingJoinRequests,
  rejectJoinRequest,
  type JoinRequestRow,
} from '../../lib/adminPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Approvals'>;

export function ApprovalsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const res = await fetchPendingJoinRequests('pending');
      setRequests(res.requests);
      setPendingCount(res.pendingCount);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Approvals', msg);
      setError(msg);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approveOne = async (id: string) => {
    setActing(id);
    try {
      await approveJoinRequest(id);
      await load(true);
    } catch (e) {
      Alert.alert('Approve failed', e instanceof Error ? e.message : String(e));
    } finally {
      setActing(null);
    }
  };

  const rejectOne = (id: string) => {
    Alert.alert('Reject request?', 'The user will need to submit again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setActing(id);
            try {
              await rejectJoinRequest(id);
              await load(true);
            } catch (e) {
              Alert.alert('Reject failed', e instanceof Error ? e.message : String(e));
            } finally {
              setActing(null);
            }
          })();
        },
      },
    ]);
  };

  const approveAll = () => {
    if (!requests.length) return;
    Alert.alert('Approve all?', `${requests.length} pending request(s).`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve all',
        onPress: () => {
          void (async () => {
            setActing('all');
            try {
              await approveAllJoinRequests();
              await load(true);
            } catch (e) {
              Alert.alert('Bulk approve failed', e instanceof Error ? e.message : String(e));
            } finally {
              setActing(null);
            }
          })();
        },
      },
    ]);
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
        <ModuleKicker>Admin</ModuleKicker>
        <ModuleScreenHeader
          title="Join approvals"
          description={`${pendingCount} pending · parent, teacher & student requests`}
        />

        {requests.length > 1 ? (
          <Pressable
            style={[styles.approveAll, acting === 'all' && styles.disabled]}
            disabled={acting === 'all'}
            onPress={approveAll}>
            <Ionicons name="checkmark-done" size={16} color={Colors.white} />
            <Text style={styles.approveAllText}>Approve all</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load requests" body={error} onRetry={() => void load()} />
        ) : requests.length === 0 ? (
          <ModuleEmpty title="No pending requests" body="New join requests from parents and staff appear here." />
        ) : (
          requests.map((req) => (
            <ModuleGlassCard key={req.id}>
              <Text style={styles.title}>{req.requester_name || req.requester_email || 'Requester'}</Text>
              <Text style={styles.meta}>
                {[req.role_slug, req.target_student_name, req.target_class_name, req.status]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {req.note ? <Text style={styles.note}>{req.note}</Text> : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.approveBtn, acting === req.id && styles.disabled]}
                  disabled={acting === req.id}
                  onPress={() => void approveOne(req.id)}>
                  <Text style={styles.approveBtnText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.rejectBtn, acting === req.id && styles.disabled]}
                  disabled={acting === req.id}
                  onPress={() => rejectOne(req.id)}>
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </Pressable>
              </View>
            </ModuleGlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  approveAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  approveAllText: { color: Colors.white, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  note: { marginTop: 8, fontSize: 13, color: Colors.ink, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: Colors.white, fontWeight: '700' },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectBtnText: { color: '#DC2626', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
