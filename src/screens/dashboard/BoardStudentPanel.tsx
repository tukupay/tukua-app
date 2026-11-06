/**
 * Security boarding: face-first identify (camera closed until Scan), then confirm, search fallback.
 * Shows all onboarded students for the current trip with vertical infinite scroll.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import {
  boardSecurityStudent,
  dropTripStudents,
  analyzeTransportFace,
  fetchBoardedStudents,
  searchTransportStudents,
  FACE_MATCH_THRESHOLD,
  type BoardedStudent,
  type FaceMatchCandidate,
  type TransportStudentMatch,
} from '../../lib/transportApi';
import { TUKUA_FACE_MODEL } from '../../lib/faceEmbedding';
import { useDialog } from '../../context/DialogContext';

type Props = {
  tripId: string | null;
  tripActive: boolean;
  onBoarded?: () => void;
  onCancel?: () => void;
};

type FaceMatch = {
  student_id: string;
  name: string;
  student_number?: string | null;
  score?: number;
};

const PAGE_SIZE = 30;

/** The time on this phone's clock, as 16:35. */
function localClock(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function BoardStudentPanel({ tripId, tripActive, onBoarded, onCancel }: Props) {
  const { showDialog } = useDialog();
  const [mode, setMode] = useState<'face' | 'search'>('face');
  const [permission, requestPermission] = useCameraPermissions();
  const [boarding, setBoarding] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [faceHint, setFaceHint] = useState('Pick Scan to open the camera.');
  const [matched, setMatched] = useState<FaceMatch | null>(null);
  const [faceCandidates, setFaceCandidates] = useState<FaceMatchCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TransportStudentMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [boarded, setBoarded] = useState<BoardedStudent[]>([]);
  const [boardedTotal, setBoardedTotal] = useState(0);
  /** The learner being dropped off right now, or 'all'. */
  const [dropping, setDropping] = useState<string | null>(null);
  /** "Drop all" asks for a second tap, so a slip of the thumb does not text every guardian. */
  const [confirmDropAll, setConfirmDropAll] = useState(false);
  const [boardedPage, setBoardedPage] = useState(1);
  const [boardedLoading, setBoardedLoading] = useState(false);
  const [boardedLoadingMore, setBoardedLoadingMore] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const coolDownRef = useRef(false);

  const loadBoarded = useCallback(
    async (page = 1, append = false) => {
      if (!tripId || !tripActive) {
        setBoarded([]);
        setBoardedTotal(0);
        setBoardedPage(1);
        return;
      }
      if (append) setBoardedLoadingMore(true);
      else setBoardedLoading(true);
      try {
        const res = await fetchBoardedStudents(tripId, page, PAGE_SIZE);
        const rows = res?.students ?? [];
        setBoarded((prev) => (append ? [...prev, ...rows] : rows));
        setBoardedTotal(Number(res?.total ?? rows.length));
        setBoardedPage(page);
      } catch {
        if (!append) {
          setBoarded([]);
          setBoardedTotal(0);
        }
      } finally {
        setBoardedLoading(false);
        setBoardedLoadingMore(false);
      }
    },
    [tripId, tripActive],
  );

  useEffect(() => {
    void loadBoarded(1, false);
  }, [loadBoarded]);

  useEffect(() => {
    if (mode !== 'search') return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = searchQuery.trim();
    setSearching(true);
    setSearchError('');
    searchTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await searchTransportStudents(q);
          setSearchResults(res?.students ?? []);
          if (!(res?.students?.length)) {
            setSearchError(
              q.length >= 2
                ? 'No students match that name or admission number.'
                : 'No active students found for this school.',
            );
          }
        } catch (e) {
          setSearchResults([]);
          setSearchError(e instanceof Error ? e.message : 'Could not search students.');
        } finally {
          setSearching(false);
        }
      })();
    }, 280);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, mode]);

  const board = useCallback(
    async (opts: { student_id?: string; admission_number?: string; method?: string; name?: string }) => {
      if (!tripId || !tripActive) {
        showDialog({ title: 'No active trip', message: 'Start a trip first.', variant: 'warning' });
        return;
      }
      if (!opts.student_id && !opts.admission_number) {
        showDialog({ title: 'No student', message: 'Scan face or pick a student.', variant: 'warning' });
        return;
      }
      setBoarding(true);
      try {
        const res = await boardSecurityStudent(tripId, {
          student_id: opts.student_id,
          admission_number: opts.admission_number,
          method: opts.method || 'manual',
        });
        if (res?.boarded_students) {
          setBoarded(res.boarded_students);
          setBoardedTotal(Number(res.boarded_total ?? res.boarded_students.length));
          setBoardedPage(1);
        } else {
          await loadBoarded(1, false);
        }
        // Say whether the guardian was told, and why not when they were not.
        const who = opts.name || 'The learner';
        const told = res?.notification?.notified === true;
        const duplicate = (res as { duplicate?: boolean } | undefined)?.duplicate === true;
        showDialog({
          title: duplicate ? 'Already on the bus' : 'Boarded',
          message: duplicate
            ? `${who} was boarded earlier on this trip.`
            : told
              ? `${who} is on the bus. The guardian has been sent a text.`
              : `${who} is on the bus, but the guardian was NOT told. ${res?.notification?.detail ?? 'The text could not be sent.'}`,
          variant: duplicate || told ? 'success' : 'warning',
        });
        setMatched(null);
        setCameraOpen(false);
        onBoarded?.();
      } catch (e) {
        showDialog({
          title: 'Board failed',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
      } finally {
        setBoarding(false);
      }
    },
    [tripId, tripActive, showDialog, onBoarded, loadBoarded],
  );

  const cancelFace = useCallback(() => {
    setMatched(null);
    setFaceCandidates([]);
    setCameraOpen(false);
    setFaceHint('Pick Scan to open the camera.');
    coolDownRef.current = false;
    onCancel?.();
  }, [onCancel]);

  const openCamera = async () => {
    if (!tripActive) {
      showDialog({ title: 'No active trip', message: 'Start a trip first.', variant: 'warning' });
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showDialog({ title: 'Camera needed', message: 'Allow camera to scan faces.', variant: 'warning' });
        return;
      }
    }
    setMatched(null);
    setFaceCandidates([]);
    setCameraOpen(true);
    setFacing('back');
    setFaceHint('Hold still — scanning face…');
    coolDownRef.current = false;
  };

  const pickCandidate = useCallback((c: FaceMatchCandidate) => {
    const id = String(c.person_id || c.student_id || '');
    if (!id) return;
    setFaceCandidates([]);
    setMatched({
      student_id: id,
      name: c.name || 'Student',
      student_number: c.student_number ?? null,
      score: c.score,
    });
    setCameraOpen(false);
    setFaceHint('Confirm the matched student.');
  }, []);

  const runFaceIdentify = useCallback(async () => {
    if (!tripActive || boarding || identifying || !cameraOpen || matched || coolDownRef.current) return;
    if (faceCandidates.length) return;
    if (!cameraRef.current) return;
    coolDownRef.current = true;
    setIdentifying(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.45,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) throw new Error('Could not capture photo — check camera and try again.');
      const res = await analyzeTransportFace({
        image_base64: photo.base64,
        person_type: 'student',
        model_version: TUKUA_FACE_MODEL,
        threshold: FACE_MATCH_THRESHOLD,
      });
      const ranked = Array.isArray(res?.candidates)
        ? [...res.candidates].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
        : [];
      if (res?.match && res.student_id) {
        setFaceCandidates([]);
        setMatched({
          student_id: res.student_id,
          name: res.name || 'Student',
          student_number: res.student_number ?? null,
          score: res.score,
        });
        setCameraOpen(false);
        setFaceHint('Confirm the matched student.');
      } else if (res?.reason === 'ambiguous' && ranked.length > 0) {
        setFaceCandidates(ranked);
        setCameraOpen(false);
        setFaceHint('Several close matches — pick the right student (highest score first).');
        coolDownRef.current = false;
      } else {
        const hint =
          res?.message ||
          (res?.reason === 'no_face'
            ? 'No face detected — center a face and try again.'
            : res?.reason === 'embedding_pending'
              ? 'Face still processing — wait a moment, then scan again.'
              : 'No confident match — try again or use Search.');
        setFaceHint(hint);
        coolDownRef.current = false;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Face scan failed';
      const networkish = /network|fetch|timeout|failed to connect/i.test(msg);
      setFaceHint(networkish ? 'Network error — check connection and try again.' : msg);
      coolDownRef.current = false;
    } finally {
      setIdentifying(false);
    }
  }, [tripActive, boarding, identifying, cameraOpen, matched, faceCandidates.length]);

  useEffect(() => {
    if (mode !== 'face' || !tripActive || !permission?.granted || !cameraOpen || matched) return;
    if (faceCandidates.length) return;
    const t = setInterval(() => {
      void runFaceIdentify();
    }, 2200);
    return () => clearInterval(t);
  }, [mode, tripActive, permission?.granted, cameraOpen, matched, faceCandidates.length, runFaceIdentify]);

  const loadMoreBoarded = () => {
    if (boardedLoadingMore || boardedLoading) return;
    if (boarded.length >= boardedTotal) return;
    void loadBoarded(boardedPage + 1, true);
  };

  const stillOnBoard = boarded.filter((b) => !b.dropped_at);

  /** Drop one learner at their stop, or everyone still on board. No scan; guardians are texted. */
  const dropOff = async (student?: BoardedStudent) => {
    if (!tripId || dropping) return;
    setDropping(student ? student.student_id : 'all');
    try {
      const res = await dropTripStudents(tripId, student ? { student_id: student.student_id } : { all: true });
      if (res?.boarded_students) {
        setBoarded(res.boarded_students);
        setBoardedTotal(Number(res.boarded_total ?? res.boarded_students.length));
        setBoardedPage(1);
      } else {
        await loadBoarded(1, false);
      }
      const count = Number(res?.dropped ?? 0);
      if (student) {
        const one = res?.results?.[0];
        showDialog({
          title: count ? 'Dropped off' : 'Already dropped off',
          message: !count
            ? `${student.name} had already been dropped off.`
            : one?.notified
              ? `${student.name} is off the bus. The guardian has been sent a text.`
              : `${student.name} is off the bus, but the guardian was NOT told. ${one?.detail ?? 'The text could not be sent.'}`,
          variant: !count || one?.notified ? 'success' : 'warning',
        });
      } else {
        showDialog({
          title: count ? 'Everyone dropped off' : 'No one is on board',
          message: count ? `${count} learner${count === 1 ? ' is' : 's are'} off the bus. Their guardians are being sent a text.` : 'Everyone had already been dropped off.',
          variant: 'success',
        });
      }
      onBoarded?.();
    } catch (e) {
      showDialog({ title: 'Could not drop off', message: e instanceof Error ? e.message : String(e), variant: 'danger' });
    } finally {
      setDropping(null);
      setConfirmDropAll(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Board student</Text>
        <Pressable onPress={cancelFace} hitSlop={8}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Face scan first · confirm student · search if match fails</Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mode === 'face' && styles.tabOn]}
          onPress={() => {
            setMode('face');
            setMatched(null);
            setFaceCandidates([]);
            setCameraOpen(false);
            setFaceHint('Pick Scan to open the camera.');
          }}>
          <Text style={[styles.tabText, mode === 'face' && styles.tabTextOn]}>Face</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === 'search' && styles.tabOn]}
          onPress={() => {
            setMode('search');
            setCameraOpen(false);
            setFaceCandidates([]);
          }}>
          <Text style={[styles.tabText, mode === 'search' && styles.tabTextOn]}>Search</Text>
        </Pressable>
      </View>

      {!tripActive ? (
        <Text style={styles.hint}>Start a trip to enable boarding.</Text>
      ) : mode === 'face' ? (
        <View style={styles.scanBox}>
          {matched ? (
            <View style={styles.matchCard}>
              <Text style={styles.matchLabel}>Matched student</Text>
              <Text style={styles.matchName}>{matched.name}</Text>
              <Text style={styles.matchMeta}>
                {matched.student_number || '—'}
                {matched.score != null ? ` · score ${(matched.score * 100).toFixed(0)}%` : ''}
              </Text>
              <Pressable
                style={styles.btn}
                disabled={boarding}
                onPress={() =>
                  void board({
                    student_id: matched.student_id,
                    method: 'face',
                    name: matched.name,
                  })
                }>
                <Text style={styles.btnText}>{boarding ? 'Boarding…' : 'Confirm board'}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                disabled={boarding}
                onPress={() => {
                  setMatched(null);
                  setFaceCandidates([]);
                  void openCamera();
                }}>
                <Text style={styles.secondaryBtnText}>Scan again</Text>
              </Pressable>
            </View>
          ) : faceCandidates.length > 0 ? (
            <View style={styles.matchCard}>
              <Text style={styles.matchLabel}>Close matches — pick one</Text>
              <Text style={styles.hint}>{faceHint}</Text>
              {faceCandidates.map((c) => {
                const id = String(c.person_id || c.student_id || '');
                return (
                  <Pressable
                    key={id}
                    style={styles.candidateRow}
                    disabled={boarding}
                    onPress={() => pickCandidate(c)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.matchName}>{c.name || 'Student'}</Text>
                      <Text style={styles.matchMeta}>{c.student_number || '—'}</Text>
                    </View>
                    <Text style={styles.candidateScore}>
                      {c.score != null ? `${(Number(c.score) * 100).toFixed(0)}%` : '—'}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.secondaryBtn}
                disabled={boarding}
                onPress={() => {
                  setFaceCandidates([]);
                  void openCamera();
                }}>
                <Text style={styles.secondaryBtnText}>Scan again</Text>
              </Pressable>
            </View>
          ) : !cameraOpen ? (
            <View style={styles.idleBox}>
              <Text style={styles.hint}>{faceHint}</Text>
              <Pressable style={styles.scanBtn} onPress={() => void openCamera()}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.btnText}>Scan face</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.camFrame}>
                <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
                <View style={styles.ovalGuide} pointerEvents="none" />
                {identifying ? (
                  <View style={styles.scanOverlay}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.scanOverlayText}>Matching…</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>{faceHint}</Text>
              <View style={styles.camActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => setCameraOpen(false)}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}>
                  <Ionicons name="camera-reverse-outline" size={18} color={Colors.ink} />
                  <Text style={styles.secondaryBtnText}>Flip</Text>
                </Pressable>
                <Pressable
                  style={styles.btn}
                  disabled={boarding || identifying}
                  onPress={() => void runFaceIdentify()}>
                  <Text style={styles.btnText}>Scan now</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : (
        <View>
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Name or admission no."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            editable={!boarding}
          />
          {searching ? <ActivityIndicator style={{ marginVertical: 8 }} color={Colors.brandGreenDark} /> : null}
          {!searching && searchError && searchResults.length === 0 ? (
            <Text style={styles.hint}>{searchError}</Text>
          ) : null}
          {searchResults.map((s) => (
            <Pressable
              key={s.id}
              style={styles.result}
              disabled={boarding}
              onPress={() => void board({ student_id: s.id, method: 'manual', name: s.name })}>
              <Text style={styles.resultName}>{s.name}</Text>
              <Text style={styles.resultMeta}>
                {s.student_number || '—'}
                {s.class_label ? ` · ${s.class_label}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {tripActive ? (
        <View style={styles.onboardedBox}>
          <View style={styles.onboardedHead}>
            <Text style={styles.onboardedTitle}>
              On board ({stillOnBoard.length}
              {boardedTotal > stillOnBoard.length ? ` of ${boardedTotal}` : ''})
            </Text>
            <Pressable onPress={() => void loadBoarded(1, false)} hitSlop={8}>
              <Text style={styles.refreshLink}>Refresh</Text>
            </Pressable>
          </View>
          {stillOnBoard.length > 0 ? (
            <Pressable
              onPress={() => (confirmDropAll ? void dropOff() : setConfirmDropAll(true))}
              disabled={Boolean(dropping)}
              style={[styles.dropAllBtn, confirmDropAll && styles.dropAllBtnConfirm, Boolean(dropping) && styles.dropBtnBusy]}
              accessibilityRole="button"
              accessibilityLabel={confirmDropAll ? 'Confirm: drop everyone off' : 'Drop everyone off'}>
              {dropping === 'all' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.dropAllText}>
                  {confirmDropAll
                    ? `Tap again to drop all ${stillOnBoard.length} and text their guardians`
                    : `Drop all ${stillOnBoard.length} off`}
                </Text>
              )}
            </Pressable>
          ) : null}
          {boardedLoading && boarded.length === 0 ? (
            <ActivityIndicator color={Colors.brandGreenDark} />
          ) : boarded.length === 0 ? (
            <Text style={styles.hint}>No students boarded yet.</Text>
          ) : (
            <FlatList
              data={boarded}
              keyExtractor={(item) => item.boarding_id || item.student_id}
              style={styles.onboardedList}
              nestedScrollEnabled
              onEndReached={loadMoreBoarded}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                boardedLoadingMore ? (
                  <ActivityIndicator style={{ marginVertical: 8 }} color={Colors.brandGreenDark} />
                ) : null
              }
              renderItem={({ item }) => (
                <View style={[styles.onboardedRow, styles.onboardedRowSplit, item.dropped_at ? styles.onboardedRowOff : null]}>
                  <View style={styles.onboardedWho}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultMeta}>
                      {item.student_number || '—'}
                      {item.class_name ? ` · ${item.class_name}` : ''}
                    </Text>
                  </View>
                  {item.dropped_at ? (
                    <View style={styles.droppedTag}>
                      <Text style={styles.droppedText}>Got off {localClock(item.dropped_at)}</Text>
                      <Text style={styles.droppedSub}>{item.drop_guardian_told ? 'Guardian told' : 'Guardian not told'}</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => void dropOff(item)}
                      disabled={Boolean(dropping)}
                      style={[styles.dropBtn, Boolean(dropping) && styles.dropBtnBusy]}
                      accessibilityRole="button"
                      accessibilityLabel={`Drop ${item.name} off`}>
                      {dropping === item.student_id ? <ActivityIndicator color={Colors.brandGreenDark} /> : <Text style={styles.dropText}>Drop off</Text>}
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  cancelLink: { fontSize: 14, fontWeight: '700', color: Colors.orange },
  sub: { fontSize: 13, color: Colors.mutedForeground },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabOn: { backgroundColor: Colors.brandGreenDark },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.mutedForeground },
  tabTextOn: { color: Colors.white },
  scanBox: { gap: 10 },
  idleBox: { gap: 12, paddingVertical: 8 },
  camFrame: {
    minHeight: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
    position: 'relative',
  },
  camera: { ...StyleSheet.absoluteFill },
  ovalGuide: {
    position: 'absolute',
    alignSelf: 'center',
    top: '18%',
    width: '58%',
    height: '52%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanOverlayText: { color: '#fff', fontWeight: '700' },
  camActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  hint: { fontSize: 13, color: Colors.mutedForeground },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btn: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: Colors.white, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 88,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.ink, fontWeight: '700' },
  matchCard: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(10,61,46,0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchLabel: { fontSize: 12, fontWeight: '700', color: Colors.mutedForeground, textTransform: 'uppercase' },
  matchName: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  matchMeta: { fontSize: 13, color: Colors.mutedForeground },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  candidateScore: { fontSize: 16, fontWeight: '800', color: Colors.brandGreenDark },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 8,
  },
  result: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  resultName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  resultMeta: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  onboardedBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  onboardedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  onboardedTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  onboardedRowSplit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onboardedRowOff: { opacity: 0.6 },
  onboardedWho: { flex: 1, minWidth: 0 },
  dropBtn: {
    minWidth: 92,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.brandGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropBtnBusy: { opacity: 0.5 },
  dropText: { fontSize: 13, fontWeight: '800', color: Colors.brandGreenDark },
  dropAllBtn: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: Colors.brandGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  dropAllBtnConfirm: { backgroundColor: Colors.orange },
  dropAllText: { fontSize: 14, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  droppedTag: { alignItems: 'flex-end' },
  droppedText: { fontSize: 12, fontWeight: '700', color: Colors.ink },
  droppedSub: { fontSize: 11, color: Colors.mutedForeground },
  refreshLink: { fontSize: 13, fontWeight: '700', color: Colors.brandGreenDark },
  onboardedList: { maxHeight: 280 },
  onboardedRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
});
