import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { teacherGateScan, fetchGateTodayStatus } from '../../lib/transportApi';
import { useDialog } from '../../context/DialogContext';
import { GateDirectionToggle } from '../../components/dashboard/GateDirectionToggle';
import { useGateScanDirection } from '../../hooks/useGateScanDirection';
import { GateDirection } from '../../lib/gateScanDirection';

type Props = NativeStackScreenProps<DashboardStackParamList, 'GateCheckIn'>;

function parseQrToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as { type?: string; token?: string };
    if (parsed?.type === 'tukua_attendance_gate' && parsed.token) {
      return String(parsed.token);
    }
  } catch {
    // fall through — treat as raw token
  }
  return trimmed;
}

export function GateCheckInScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    const data = await fetchGateTodayStatus();
    return {
      check_in_at: data?.check_in_at ?? null,
      check_out_at: data?.check_out_at ?? null,
    };
  }, []);

  const { direction, setDirection, loading: dirLoading, hint } = useGateScanDirection(fetchStatus);

  const submitCheckIn = useCallback(
    async (rawToken: string, scanDirection: GateDirection) => {
      const qr_token = parseQrToken(rawToken);
      if (!qr_token) {
        showDialog({ title: 'Invalid QR', message: 'Could not read gate token.', variant: 'warning' });
        return;
      }

      setSubmitting(true);
      try {
        // Geo optional — server geofence is currently disabled.
        let latitude = 0;
        let longitude = 0;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
          }
        } catch {
          /* proceed without GPS */
        }
        await teacherGateScan({
          qr_token,
          latitude,
          longitude,
          action: scanDirection,
        });

        showDialog({
          title: scanDirection === 'in' ? 'Checked in' : 'Checked out',
          message: `Your ${scanDirection === 'in' ? 'arrival' : 'departure'} was recorded.`,
          variant: 'success',
        });
        navigation.goBack();
      } catch (e) {
        showDialog({
          title: 'Check-in failed',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
        setScanned(false);
      } finally {
        setSubmitting(false);
      }
    },
    [navigation, showDialog],
  );

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || submitting) return;
      setScanned(true);
      void submitCheckIn(data, direction);
    },
    [scanned, submitting, submitCheckIn, direction],
  );

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
        <ModuleKicker>Staff</ModuleKicker>
        <Text style={styles.title}>Attendance Scanner</Text>
        <Text style={styles.sub}>Scan the security gate QR code with the camera.</Text>

        <GateDirectionToggle
          value={direction}
          onChange={setDirection}
          disabled={submitting || dirLoading}
          hint={hint}
        />

        <ModuleGlassCard>
          {!permission?.granted ? (
            <View style={styles.permBox}>
              <Text style={styles.permText}>Camera access is needed to scan the gate QR.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
                <Text style={styles.primaryBtnText}>Allow camera</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.cameraWrap}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={scanned || submitting ? undefined : onBarcodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
              </View>
              {submitting ? (
                <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 12 }} />
              ) : scanned ? (
                <Pressable style={styles.secondaryBtn} onPress={() => setScanned(false)}>
                  <Text style={styles.secondaryBtnText}>Scan again</Text>
                </Pressable>
              ) : (
                <Text style={styles.hint}>Point at the gate display QR code.</Text>
              )}
            </>
          )}
        </ModuleGlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4, lineHeight: 20 },
  permBox: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  permText: { fontSize: 14, color: Colors.mutedForeground, textAlign: 'center' },
  cameraWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 280,
    backgroundColor: '#111',
  },
  camera: { flex: 1 },
  hint: { marginTop: 12, fontSize: 13, color: Colors.mutedForeground, textAlign: 'center' },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: Colors.brandGreenDark,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(10,61,46,0.08)',
  },
  secondaryBtnText: { color: Colors.brandGreenDark, fontWeight: '700', fontSize: 14 },
});
