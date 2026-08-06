import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { enrollTransportFaceImage } from '../../lib/transportApi';
import { TUKUA_FACE_MODEL } from '../../lib/faceEmbedding';

type Props = NativeStackScreenProps<DashboardStackParamList, 'FaceSelfEnroll'>;

/** Student self face enroll for future boarding match. */
export function FaceSelfEnrollScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser, selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const [permission, requestPermission] = useCameraPermissions();
  const [enrolling, setEnrolling] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const personId = String(selectedStudentId || deskUser?.id || '').trim();
  const displayName =
    selectedStudent?.name ||
    deskUser?.full_name ||
    [deskUser?.first_name, deskUser?.last_name].filter(Boolean).join(' ') ||
    deskUser?.email ||
    'You';
  const adm =
    selectedStudent?.admissionNumber ||
    (deskUser as { student_number?: string } | null)?.student_number ||
    null;

  const enroll = async () => {
    if (!personId) {
      showDialog({
        title: 'No student profile',
        message: 'Select your student profile first, then try again.',
        variant: 'warning',
      });
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showDialog({ title: 'Camera needed', message: 'Allow camera to capture your face.', variant: 'warning' });
        return;
      }
    }
    setEnrolling(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.45,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) throw new Error('Could not capture photo — try again with better light.');
      await enrollTransportFaceImage({
        student_id: personId,
        person_id: personId,
        person_type: 'student',
        image_base64: photo.base64,
        model_version: TUKUA_FACE_MODEL,
      });
      showDialog({
        title: 'Face saved',
        message: 'Your photo is stored for school boarding match.',
        variant: 'success',
      });
    } catch (e) {
      showDialog({
        title: 'Could not save face',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ModuleBackBar label="My face" onBack={() => navigation.goBack()} />
      <View
        style={[
          styles.body,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) },
        ]}
      >
        <ModuleKicker>Boarding</ModuleKicker>
        <ModuleScreenHeader
          title="Enroll face"
          description={`For ${displayName}${adm ? ` (${adm})` : ''}. Used when boarding the bus.`}
        />
        <ModuleGlassCard>
          {!permission?.granted ? (
            <Pressable style={styles.btn} onPress={() => void requestPermission()}>
              <Text style={styles.btnText}>Allow camera</Text>
            </Pressable>
          ) : (
            <View style={styles.camWrap}>
              <CameraView ref={cameraRef} style={styles.cam} facing="front" />
              {enrolling ? (
                <View style={styles.camOverlay} pointerEvents="none">
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={styles.overlayTitle}>Saving face…</Text>
                  <Text style={styles.overlayName}>{displayName}</Text>
                  <Text style={styles.overlayMeta}>
                    {['Student', adm ? `Adm ${adm}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
          <Pressable style={styles.btn} disabled={enrolling || !permission?.granted} onPress={() => void enroll()}>
            {enrolling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Capture & save</Text>
            )}
          </Pressable>
        </ModuleGlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, gap: 10 },
  h1: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  camWrap: {
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  cam: { flex: 1 },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  overlayTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 8 },
  overlayName: { color: '#fff', fontWeight: '800', fontSize: 17, textAlign: 'center' },
  overlayMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.brandGreenDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
