import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { fetchSchoolsRegistry } from '../../lib/adminPortalApi';
import { deskFetch } from '../../lib/deskApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SuperAdminHub'>;

export function SuperAdminHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [schoolTotal, setSchoolTotal] = useState<number | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const [schoolsRes, tokenRes] = await Promise.allSettled([
        fetchSchoolsRegistry(undefined, 1, 1),
        deskFetch<{ balance?: number; tokens?: number }>('/comms/tokens/balance'),
      ]);
      if (schoolsRes.status === 'fulfilled') {
        setSchoolTotal(schoolsRes.value.total ?? schoolsRes.value.schools.length);
      } else {
        setSchoolTotal(null);
      }
      if (tokenRes.status === 'fulfilled') {
        const d = tokenRes.value;
        setTokens(typeof d?.balance === 'number' ? d.balance : typeof d?.tokens === 'number' ? d.tokens : null);
      } else {
        setTokens(null);
      }
      if (schoolsRes.status === 'rejected' && tokenRes.status === 'rejected') {
        throw schoolsRes.reason;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('SuperAdminHub', msg);
      setError(msg);
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
        <ModuleKicker>Platform</ModuleKicker>
        <ModuleScreenHeader
          title="Super admin hub"
          description="Registry + token balance from Nest"
        />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={styles.loader} />
        ) : error && schoolTotal == null && tokens == null ? (
          <ModuleEmpty title="Couldn't load hub" body={error} onRetry={() => void load()} />
        ) : (
          <View style={styles.grid}>
            <ModuleGlassCard>
              <Text style={styles.label}>Schools registered</Text>
              <Text style={styles.value}>{schoolTotal != null ? String(schoolTotal) : '—'}</Text>
            </ModuleGlassCard>
            <ModuleGlassCard>
              <Text style={styles.label}>Token balance</Text>
              <Text style={styles.value}>{tokens != null ? tokens.toLocaleString() : '—'}</Text>
            </ModuleGlassCard>
          </View>
        )}

        <Text style={styles.hint}>
          U22 revenue deep-dive and platform analytics stay on the Revenue / Analytics tiles (Tukua web)
          until staging super-admin JWT is reset — this hub shows registry + token balance only.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { marginTop: 24 },
  grid: { gap: 10 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.mutedForeground, textTransform: 'uppercase' },
  value: { marginTop: 6, fontSize: 26, fontWeight: '800', color: Colors.brandGreenDark },
  hint: { marginTop: 16, fontSize: 13, lineHeight: 18, color: Colors.mutedForeground },
});
