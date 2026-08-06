import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useDialog } from '../../context/DialogContext';
import {
  enrollTransportFaceImage,
  getTransportFaceStatus,
  searchTransportPeople,
  searchTransportStudents,
  type TransportStudentMatch,
} from '../../lib/transportApi';
import { getDeskApiBaseUrl } from '../../lib/localHost';
import { TUKUA_FACE_MODEL } from '../../lib/faceEmbedding';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SecurityFaceEnroll'>;
type PersonType = 'student' | 'teacher' | 'staff';
type PersonHit = TransportStudentMatch & {
  person_type?: PersonType;
  employee_number?: string | null;
  email?: string | null;
};

function dedupeHits(list: PersonHit[]): PersonHit[] {
  const byId = new Set<string>();
  const byAdm = new Set<string>();
  const out: PersonHit[] = [];
  for (const p of list) {
    const id = String(p.id || '');
    if (!id || byId.has(id)) continue;
    const adm = String(p.student_number || p.admission_number || p.employee_number || '')
      .trim()
      .toLowerCase();
    if (adm && byAdm.has(adm)) continue;
    byId.add(id);
    if (adm) byAdm.add(adm);
    out.push(p);
  }
  return out;
}

type FaceStatus = {
  enrolled: boolean;
  embedding_status?: 'ready' | 'pending' | 'invalid' | null;
  image_url?: string | null;
  updated_at?: string | null;
};

function resolveDeskMediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getDeskApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

/**
 * Save face embeddings for future boarding match (students / teachers / staff).
 * Separate from Trips & board — enroll only.
 */
export function SecurityFaceEnrollScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [personType, setPersonType] = useState<PersonType>('student');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PersonHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PersonHit | null>(null);
  const [faceStatus, setFaceStatus] = useState<FaceStatus | null>(null);
  const [faceStatusLoading, setFaceStatusLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [enrolling, setEnrolling] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authDialogShown = useRef(false);

  useEffect(() => {
    setSelected(null);
    setHits([]);
    setQuery('');
    setCameraOpen(false);
    setFaceStatus(null);
  }, [personType]);

  useEffect(() => {
    if (!selected?.id) {
      setFaceStatus(null);
      setFaceStatusLoading(false);
      return;
    }
    let cancelled = false;
    setFaceStatusLoading(true);
    void (async () => {
      try {
        const res = await getTransportFaceStatus({
          person_id: selected.id,
          person_type: personType,
        });
        if (cancelled) return;
        setFaceStatus({
          enrolled: Boolean(res?.enrolled),
          embedding_status: res?.embedding_status ?? null,
          image_url: res?.image_url ?? null,
          updated_at: res?.updated_at ?? null,
        });
      } catch {
        if (!cancelled) setFaceStatus({ enrolled: false });
      } finally {
        if (!cancelled) setFaceStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id, personType]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (selected) {
      setHits([]);
      setSearching(false);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      void (async () => {
        try {
          if (personType === 'student') {
            const res = await searchTransportStudents(q, 40);
            setHits(dedupeHits((res?.students ?? []).map((s) => ({ ...s, person_type: 'student' as const }))));
          } else {
            const res = await searchTransportPeople(personType, q, 40);
            setHits(dedupeHits((res?.people ?? []) as PersonHit[]));
          }
        } catch (e) {
          setHits([]);
          const msg = e instanceof Error ? e.message : String(e);
          if (
            !authDialogShown.current &&
            /session expired|login to continue|401|unauthor/i.test(msg)
          ) {
            authDialogShown.current = true;
            showDialog({
              title: 'Desk session needed',
              message: 'Sign out and sign in again with password so Face enroll can search.',
              variant: 'warning',
            });
          }
        } finally {
          setSearching(false);
        }
      })();
    }, 280);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, personType, selected]);

  const pickPerson = (p: PersonHit) => {
    setSelected(p);
    setHits([]);
    setQuery('');
    setCameraOpen(false);
  };

  const clearSelected = () => {
    setSelected(null);
    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (!selected?.id) {
      showDialog({ title: 'Select a person', message: 'Search and pick someone first.', variant: 'warning' });
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showDialog({ title: 'Camera needed', message: 'Allow camera to capture the face.', variant: 'warning' });
        return;
      }
    }
    setCameraOpen(true);
  };

  const captureAndSave = async () => {
    if (!selected?.id) return;
    setEnrolling(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.45,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) throw new Error('Could not capture photo');
      // Nest saves image immediately and embeds in background — skip client jpeg-js detect/embed.
      await enrollTransportFaceImage({
        student_id: personType === 'student' ? selected.id : undefined,
        person_id: selected.id,
        person_type: personType,
        image_base64: photo.base64,
        model_version: TUKUA_FACE_MODEL,
      });
      setCameraOpen(false);
      showDialog({
        title: 'Face saved',
        message: `Photo stored for ${selected.name} — ready for boarding match.`,
        variant: 'success',
      });
      setSelected(null);
      setQuery('');
      setHits([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const friendly = /no clear face|no face|face detected/i.test(msg)
        ? msg
        : /network|fetch|timeout/i.test(msg)
          ? 'Network error — check connection and try again.'
          : msg;
      showDialog({
        title: 'Could not save face',
        message: friendly,
        variant: 'danger',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const metaFor = (p: PersonHit) =>
    p.student_number || p.admission_number || p.employee_number || p.email || p.class_label || '—';

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ModuleBackBar label="Face enroll" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <ModuleKicker>Security</ModuleKicker>
        <ModuleScreenHeader
          title="Save faces"
          description="Enroll students, teachers, or staff for boarding match."
        />

        <View style={styles.tabs}>
          {(['student', 'teacher', 'staff'] as PersonType[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, personType === t && styles.tabOn]}
              onPress={() => setPersonType(t)}
            >
              <Text style={[styles.tabText, personType === t && styles.tabTextOn]}>
                {t === 'student' ? 'Students' : t === 'teacher' ? 'Teachers' : 'Staff'}
              </Text>
            </Pressable>
          ))}
        </View>

        {!cameraOpen ? (
          <>
            {!selected ? (
              <ModuleGlassCard>
                <TextInput
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={
                    personType === 'student' ? 'Name or admission no…' : `${personType} name or ID…`
                  }
                  placeholderTextColor="#94a3b8"
                  autoCorrect={false}
                />
                {searching ? (
                  <ActivityIndicator color={Colors.brandGreenDark} style={{ marginVertical: 8 }} />
                ) : null}
                {query.trim().length >= 2 && !searching && hits.length === 0 ? (
                  <Text style={styles.empty}>No matches — try another spelling or admission number.</Text>
                ) : null}
                {/* Plain map — FlatList inside ScrollView triggers RN VirtualizedLists error */}
                <View>
                  {hits.map((p) => (
                    <Pressable key={p.id} style={styles.hit} onPress={() => pickPerson(p)}>
                      <Text style={styles.hitName}>{p.name}</Text>
                      <Text style={styles.hitMeta}>{metaFor(p)}</Text>
                    </Pressable>
                  ))}
                </View>
              </ModuleGlassCard>
            ) : (
              <ModuleGlassCard>
                <View style={styles.selectedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedLabel}>Selected</Text>
                    <Text style={styles.hitName}>{selected.name}</Text>
                    <Text style={styles.hitMeta}>{metaFor(selected)}</Text>
                  </View>
                  <Pressable onPress={clearSelected} hitSlop={8}>
                    <Text style={styles.changeLink}>Change</Text>
                  </Pressable>
                </View>

                {faceStatusLoading ? (
                  <ActivityIndicator color={Colors.brandGreenDark} style={{ marginVertical: 8 }} />
                ) : faceStatus?.enrolled ? (
                  <View style={styles.existingFace}>
                    {resolveDeskMediaUrl(faceStatus.image_url) ? (
                      <Image
                        source={{ uri: resolveDeskMediaUrl(faceStatus.image_url)! }}
                        style={styles.existingThumb}
                      />
                    ) : (
                      <View style={[styles.existingThumb, styles.existingThumbPlaceholder]}>
                        <Ionicons name="person" size={28} color="#94a3b8" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.existingTitle}>Face already enrolled</Text>
                      <Text style={styles.existingMeta}>
                        {faceStatus.embedding_status === 'ready'
                          ? 'Ready for boarding match'
                          : faceStatus.embedding_status === 'pending'
                            ? 'Processing match vector…'
                            : 'Saved — you can re-enroll to replace it'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.empty}>No face on file yet — enroll one below.</Text>
                )}

                <Pressable style={styles.scanBtn} onPress={() => void openCamera()}>
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={styles.scanBtnText}>
                    {faceStatus?.enrolled ? 'Re-enroll face (overwrite)' : 'Enroll face'}
                  </Text>
                </Pressable>
              </ModuleGlassCard>
            )}
          </>
        ) : (
          <>
            <View style={styles.camFrame}>
              <CameraView ref={cameraRef} style={styles.cam} facing={facing} />
              <View style={styles.ovalGuide} pointerEvents="none" />
              {enrolling && selected ? (
                <View style={styles.camOverlay} pointerEvents="none">
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={styles.overlayTitle}>Saving face…</Text>
                  <Text style={styles.overlayName}>{selected.name}</Text>
                  <Text style={styles.overlayMeta}>
                    {[
                      personType === 'student' ? 'Student' : personType === 'teacher' ? 'Teacher' : 'Staff',
                      metaFor(selected),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.camActions}>
              <Pressable
                style={styles.secondaryBtn}
                disabled={enrolling}
                onPress={() => setCameraOpen(false)}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                disabled={enrolling}
                onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
              >
                <Ionicons name="camera-reverse-outline" size={18} color={Colors.brandGreenDark} />
                <Text style={styles.secondaryBtnText}>Flip</Text>
              </Pressable>
              <Pressable style={styles.scanBtn} disabled={enrolling} onPress={() => void captureAndSave()}>
                {enrolling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.scanBtnText}>Capture & save</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 16, gap: 10 },
  h1: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
  },
  tabOn: { backgroundColor: Colors.brandGreenDark },
  tabText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  tabTextOn: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: Colors.ink,
  },
  empty: { fontSize: 13, color: '#64748b', paddingVertical: 8 },
  hit: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  hitName: { fontWeight: '700', color: Colors.ink },
  hitMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  selectedCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  selectedLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  changeLink: { fontSize: 13, fontWeight: '700', color: Colors.brandGreenDark },
  existingFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  existingThumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#e2e8f0' },
  existingThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  existingTitle: { fontWeight: '800', color: Colors.ink, fontSize: 14 },
  existingMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scanBtn: {
    marginTop: 8,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  camFrame: {
    minHeight: 360,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  cam: { minHeight: 360 },
  ovalGuide: {
    position: 'absolute',
    alignSelf: 'center',
    top: '18%',
    width: '62%',
    height: '52%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  overlayTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 8 },
  overlayName: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center' },
  overlayMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  camActions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryBtnText: { fontWeight: '700', color: Colors.brandGreenDark },
});
