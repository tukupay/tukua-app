import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { resolveDeskApiBaseUrl } from '../../lib/deskApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'GateQr'>;

type QrPayload = {
  token?: string;
  expires_at?: string;
};

async function fetchPublicAttendanceQr(schoolId: string): Promise<QrPayload> {
  const base = resolveDeskApiBaseUrl().replace(/\/$/, '');
  const url = `${base}/public/attendance-qr/${encodeURIComponent(schoolId)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: QrPayload;
    token?: string;
    expires_at?: string;
  };
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }
  const data = json?.data ?? json;
  return {
    token: String(data?.token ?? ''),
    expires_at: String(data?.expires_at ?? ''),
  };
}

export function GateQrScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser, selectedSchoolId } = useDeskAuth();
  const schoolId = String(selectedSchoolId ?? deskUser?.school_id ?? '').trim();

  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchPublicAttendanceQr(schoolId);
        if (cancelled) return;
        setToken(data.token ?? '');
        setExpiresAt(data.expires_at ?? '');
        setError('');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load QR');
        }
      }
    };

    void load();
    const poll = setInterval(() => void load(), 4_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [schoolId]);

  const scanPayload = useMemo(() => {
    if (!token || !schoolId) return '';
    return JSON.stringify({
      v: 1,
      type: 'tukua_attendance_gate',
      school_id: schoolId,
      token,
      action: 'in',
    });
  }, [token, schoolId]);

  const qrUrl = scanPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(scanPayload)}`
    : '';

  const secondsLeft = expiresAt
    ? Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000))
    : 0;

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
        <ModuleKicker>Security</ModuleKicker>
        <Text style={styles.title}>Gate check-in QR</Text>
        <Text style={styles.sub}>Refreshes every 5 seconds for staff to scan.</Text>

        {!schoolId ? (
          <ModuleGlassCard>
            <Text style={styles.errorText}>No school linked to this session.</Text>
          </ModuleGlassCard>
        ) : (
          <ModuleGlassCard>
            <View style={styles.qrWrap}>
              {qrUrl ? (
                <Image source={{ uri: qrUrl }} style={styles.qrImage} accessibilityLabel="Attendance QR" />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator color={Colors.brandGreenMid} size="large" />
                  <Text style={styles.loadingText}>Loading QR…</Text>
                </View>
              )}
            </View>

            <View style={styles.countdown}>
              <Text style={styles.countdownValue}>{secondsLeft}s</Text>
              <Text style={styles.countdownLabel}>until next rotate</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable style={styles.hintBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.hintBtnText}>Back to dashboard</Text>
            </Pressable>
          </ModuleGlassCard>
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
  qrWrap: {
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    padding: 12,
  },
  qrImage: { width: 280, height: 280 },
  qrPlaceholder: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 13, color: Colors.mutedForeground },
  countdown: { alignItems: 'center', marginTop: 16, gap: 2 },
  countdownValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.ink,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: { fontSize: 13, color: Colors.mutedForeground },
  errorText: { marginTop: 12, fontSize: 13, color: '#DC2626', textAlign: 'center' },
  hintBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  hintBtnText: { fontSize: 14, fontWeight: '700', color: Colors.brandGreenDark },
});
