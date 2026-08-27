import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from '../dashboard/ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { fetchMyKyc, submitMyKyc, type KycStatus } from '../../lib/profileApi';
import { humanizeError } from '../../lib/humanizeError';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPayKyc'>;

type Shot = { uri: string; base64: string };

export function TukuaPayKycScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<KycStatus>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [front, setFront] = useState<Shot | null>(null);
  const [back, setBack] = useState<Shot | null>(null);
  const [kra, setKra] = useState<Shot | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kyc = await fetchMyKyc();
      setStatus((kyc.status as KycStatus) ?? null);
      setMessage(String(kyc.message || ''));
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pick = async (slot: 'front' | 'back' | 'kra') => {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const shot = { uri: result.assets[0].uri, base64: result.assets[0].base64 };
      if (slot === 'front') setFront(shot);
      else if (slot === 'back') setBack(shot);
      else setKra(shot);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
      allowsEditing: true,
    }).catch(async () =>
      ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      }),
    );
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const shot = { uri: result.assets[0].uri, base64: result.assets[0].base64 };
    if (slot === 'front') setFront(shot);
    else if (slot === 'back') setBack(shot);
    else setKra(shot);
  };

  const submit = async () => {
    setError(null);
    if (!front?.base64 || !back?.base64) {
      setError('Capture both the front and back of your national ID.');
      return;
    }
    setBusy(true);
    try {
      const res = await submitMyKyc({
        id_front_base64: front.base64,
        id_back_base64: back.base64,
        kra_base64: kra?.base64,
      });
      setStatus((res.status as KycStatus) ?? 'pending');
      setMessage(String(res.message || 'We’ll review your documents and notify you.'));
      setFront(null);
      setBack(null);
      setKra(null);
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setBusy(false);
    }
  };

  const chipColor =
    status === 'approved' ? '#059669' : status === 'pending' ? '#D97706' : status === 'rejected' ? '#DC2626' : '#64748B';

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 18,
        }}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Tukua Pay</ModuleKicker>
        <ModuleScreenHeader
          title="Identity verification"
          description="Upload ID photos. You can’t deposit or send until approved."
        />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <ModuleGlassCard>
              <View style={styles.statusRow}>
                <Ionicons name="shield-checkmark-outline" size={22} color={chipColor} />
                <View style={[styles.chip, { backgroundColor: chipColor }]}>
                  <Text style={styles.chipText}>{(status || 'not started').toUpperCase()}</Text>
                </View>
              </View>
              {message ? <Text style={styles.msg}>{message}</Text> : null}
            </ModuleGlassCard>

            {status === 'approved' ? (
              <Text style={styles.ok}>You’re verified. Deposit and send are unlocked.</Text>
            ) : (
              <>
                <ShotCard title="ID front" shot={front} onPress={() => void pick('front')} />
                <ShotCard title="ID back" shot={back} onPress={() => void pick('back')} />
                <ShotCard title="KRA pin (optional)" shot={kra} onPress={() => void pick('kra')} />
                {error ? <Text style={styles.err}>{error}</Text> : null}
                <Pressable
                  style={[styles.btn, busy && { opacity: 0.7 }]}
                  disabled={busy}
                  onPress={() => void submit()}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Submit for review</Text>
                  )}
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ShotCard({
  title,
  shot,
  onPress,
}: {
  title: string;
  shot: Shot | null;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <ModuleGlassCard>
        <Text style={styles.shotTitle}>{title}</Text>
        {shot ? (
          <Image source={{ uri: shot.uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={28} color={Colors.primary} />
            <Text style={styles.placeholderText}>Tap to capture</Text>
          </View>
        )}
      </ModuleGlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.4 },
  msg: { marginTop: 10, color: Colors.mutedForeground, fontSize: 13, lineHeight: 18 },
  shotTitle: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  preview: { width: '100%', height: 140, borderRadius: 12 },
  placeholder: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,61,46,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(10,61,46,0.04)',
  },
  placeholderText: { color: Colors.primary, fontWeight: '600' },
  err: { color: '#B91C1C', marginVertical: 8, fontWeight: '600' },
  ok: { marginTop: 12, color: Colors.primary, fontWeight: '700' },
  btn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
