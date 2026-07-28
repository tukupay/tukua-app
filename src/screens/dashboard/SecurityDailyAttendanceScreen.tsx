/**
 * Security daily attendance — face / QR / search for students, teachers, and parents/staff.
 * Marks Nest gate + day register (Desk calendar daily register pattern).
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { useDialog } from '../../context/DialogContext';
import { GateDirectionToggle } from '../../components/dashboard/GateDirectionToggle';
import {
  analyzeTransportFace,
  ensureDailyRegister,
  FACE_MATCH_THRESHOLD,
  fetchRegisterEntries,
  searchTransportPeople,
  searchTransportStudents,
  securityGateCheck,
  type TransportStudentMatch,
} from '../../lib/transportApi';
import { TUKUA_FACE_MODEL } from '../../lib/faceEmbedding';
import { GateDirection } from '../../lib/gateScanDirection';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SecurityDailyAttendance'>;

type PersonTab = 'student' | 'teacher' | 'parent';
type ScanMode = 'face' | 'search' | 'qr';

type RegisterRow = {
  id: string;
  full_name?: string | null;
  person_type?: string | null;
  person_id?: string | null;
  direction?: string | null;
  marked_at?: string | null;
  method?: string | null;
  id_number?: string | null;
  status?: string | null;
};

type FaceMatch = {
  person_id: string;
  person_type: PersonTab | 'staff';
  name: string;
  meta?: string | null;
  score?: number;
};

const PAGE = 40;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function personTabLabel(t: PersonTab): string {
  if (t === 'student') return 'Students';
  if (t === 'teacher') return 'Teachers';
  return 'Parents/Staff';
}

function facePersonType(tab: PersonTab): 'student' | 'teacher' | 'staff' {
  if (tab === 'student') return 'student';
  if (tab === 'teacher') return 'teacher';
  return 'staff';
}

function scorePct(score?: number | null): string | null {
  if (score == null || Number.isNaN(Number(score))) return null;
  return `${(Number(score) * 100).toFixed(0)}%`;
}

export function SecurityDailyAttendanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { showDialog } = useDialog();
  const [sessionDate, setSessionDate] = useState(todayIso());
  const [personTab, setPersonTab] = useState<PersonTab>('student');
  const [direction, setDirection] = useState<GateDirection>('in');
  const [mode, setMode] = useState<ScanMode>('face');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  /** Preview rotation (degrees) — helps when phone/camera orientation is sideways. */
  const [previewRotation, setPreviewRotation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [hint, setHint] = useState('Open camera — face auto-detects.');
  const [matched, setMatched] = useState<FaceMatch | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<TransportStudentMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [rows, setRows] = useState<RegisterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const coolDownRef = useRef(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRows = useCallback(
    async (p = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoadingList(true);
      try {
        const ensured = await ensureDailyRegister(sessionDate);
        const sid = ensured?.session?.id ?? null;
        setSessionId(sid);
        if (!sid) {
          setRows([]);
          setTotal(0);
          return;
        }
        const filterType = personTab === 'parent' ? 'parent' : personTab;
        const res = await fetchRegisterEntries(sid, {
          person_type: filterType,
          page: p,
          limit: PAGE,
        });
        const list = res?.entries ?? [];
        setRows((prev) => (append ? [...prev, ...list] : list));
        setTotal(Number(res?.total ?? list.length));
        setPage(p);
      } catch (e) {
        if (!append) {
          setRows([]);
          setTotal(0);
        }
        showDialog({
          title: 'Could not load',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
      } finally {
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [sessionDate, personTab, showDialog],
  );

  useEffect(() => {
    void loadRows(1, false);
  }, [loadRows]);

  useEffect(() => {
    if (mode !== 'search') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
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
          if (personTab === 'student') {
            const res = await searchTransportStudents(q, 20);
            setHits(res?.students ?? []);
          } else if (personTab === 'teacher') {
            const res = await searchTransportPeople('teacher', q, 20);
            setHits(res?.people ?? []);
          } else {
            const [staff, parents] = await Promise.all([
              searchTransportPeople('staff', q, 12),
              searchTransportPeople('parent', q, 12),
            ]);
            setHits([...(staff?.people ?? []), ...(parents?.people ?? [])]);
          }
        } catch {
          setHits([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 280);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, mode, personTab]);

  const isToday = sessionDate === todayIso();

  const mark = async (opts: {
    student_id?: string;
    admission_number?: string;
    teacher_id?: string;
    person_id?: string;
    person_type: 'student' | 'teacher' | 'staff' | 'parent';
    full_name?: string;
    qr_token?: string;
    method?: string;
  }) => {
    if (!isToday) {
      showDialog({
        title: 'Today only',
        message: 'Switch the date back to Today to mark attendance at the gate.',
        variant: 'warning',
      });
      return;
    }
    setBusy(true);
    try {
      await securityGateCheck({
        student_id: opts.student_id,
        admission_number: opts.admission_number,
        teacher_id: opts.teacher_id,
        person_id: opts.person_id,
        person_type: opts.person_type,
        full_name: opts.full_name,
        qr_token: opts.qr_token,
        action: direction,
        method: opts.method || (opts.qr_token ? 'qr' : 'manual'),
      });
      const pct = matched?.score != null ? scorePct(matched.score) : null;
      showDialog({
        title: direction === 'in' ? 'Checked in' : 'Checked out',
        message: [
          opts.full_name ? `${opts.full_name} marked ${direction}.` : `Marked ${direction}.`,
          pct ? `Match ${pct}` : null,
        ]
          .filter(Boolean)
          .join(' '),
        variant: 'success',
      });
      setMatched(null);
      setCameraOpen(false);
      coolDownRef.current = false;
      await loadRows(1, false);
    } catch (e) {
      showDialog({
        title: 'Mark failed',
        message: e instanceof Error ? e.message : String(e),
        variant: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  const runFaceIdentify = useCallback(async () => {
    if (busy || identifying || !cameraOpen || matched || coolDownRef.current) return;
    if (!cameraRef.current) return;
    coolDownRef.current = true;
    setIdentifying(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.45,
        base64: true,
        skipProcessing: true,
      });
      if (!photo?.base64) throw new Error('Could not capture photo');
      const analyzeType = facePersonType(personTab);
      const res = await analyzeTransportFace({
        image_base64: photo.base64,
        person_type: analyzeType,
        model_version: TUKUA_FACE_MODEL,
        threshold: FACE_MATCH_THRESHOLD,
      });
      const id = res?.person_id || res?.student_id;
      if (res?.match && id) {
        const pct = scorePct(res.score);
        setMatched({
          person_id: id,
          person_type: personTab === 'parent' ? 'staff' : personTab,
          name: res.name || (personTab === 'student' ? 'Student' : personTab === 'teacher' ? 'Teacher' : 'Staff'),
          meta: res.student_number ?? null,
          score: res.score,
        });
        setCameraOpen(false);
        setHint(pct ? `Matched · ${pct}` : 'Confirm the matched person.');
      } else {
        const pct = scorePct(res?.score);
        const base =
          res?.message ||
          (res?.reason === 'no_face'
            ? 'No face detected — center a face and try again.'
            : res?.reason === 'embedding_pending'
              ? 'Face still processing — wait a moment, then scan again.'
              : 'No match — try again or use Search.');
        setHint(pct ? `${base} (${pct})` : base);
        coolDownRef.current = false;
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Scan failed');
      coolDownRef.current = false;
    } finally {
      setIdentifying(false);
    }
  }, [busy, identifying, cameraOpen, matched, personTab]);

  useEffect(() => {
    if (mode !== 'face' || !permission?.granted || !cameraOpen || matched) return;
    const t = setInterval(() => {
      void runFaceIdentify();
    }, 2200);
    return () => clearInterval(t);
  }, [mode, permission?.granted, cameraOpen, matched, runFaceIdentify]);

  const confirmMatch = async () => {
    if (!matched) return;
    const pt =
      matched.person_type === 'staff'
        ? 'staff'
        : matched.person_type === 'parent'
          ? 'parent'
          : matched.person_type;
    await mark({
      student_id: pt === 'student' ? matched.person_id : undefined,
      teacher_id: pt === 'teacher' ? matched.person_id : undefined,
      person_id: pt === 'student' ? undefined : matched.person_id,
      person_type: pt,
      full_name: matched.name,
      method: 'face',
    });
  };

  const onQr = ({ data }: { data: string }) => {
    if (busy) return;
    let token = data.trim();
    let studentId: string | undefined;
    let teacherId: string | undefined;
    let personId: string | undefined;
    let admission: string | undefined;
    let fullName: string | undefined;
    let pType: 'student' | 'teacher' | 'staff' | 'parent' =
      personTab === 'parent' ? 'parent' : personTab;

    try {
      const parsed = JSON.parse(token) as Record<string, unknown>;
      if (parsed?.token) token = String(parsed.token);
      if (parsed?.student_id) studentId = String(parsed.student_id);
      if (parsed?.teacher_id) teacherId = String(parsed.teacher_id);
      if (parsed?.person_id) personId = String(parsed.person_id);
      if (parsed?.admission_number || parsed?.student_number) {
        admission = String(parsed.admission_number || parsed.student_number);
      }
      if (parsed?.full_name || parsed?.name) fullName = String(parsed.full_name || parsed.name);
      const t = String(parsed?.person_type || parsed?.type || '').toLowerCase();
      if (t.includes('student')) pType = 'student';
      else if (t.includes('teacher')) pType = 'teacher';
      else if (t.includes('staff')) pType = 'staff';
      else if (t.includes('parent')) pType = 'parent';
    } catch {
      // Plain admission / person code
      if (/^[A-Za-z0-9@._-]{3,40}$/.test(token) && !token.includes('{')) {
        if (personTab === 'student') admission = token;
        else personId = undefined;
      }
    }

    if (studentId || admission || teacherId || personId) {
      void mark({
        student_id: studentId,
        admission_number: admission,
        teacher_id: teacherId,
        person_id: personId || teacherId,
        person_type: studentId || admission ? 'student' : pType,
        full_name: fullName,
        method: 'qr',
      });
      return;
    }

    // Rotating gate display QR alone cannot identify a visitor — need person payload.
    showDialog({
      title: 'Need person QR',
      message: 'Scan a student/teacher/parent badge QR (or use Face / Search). Gate display QR is for self check-in.',
      variant: 'warning',
    });
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        showDialog({
          title: 'Camera needed',
          message: 'Allow camera to scan faces.',
          variant: 'warning',
        });
        return;
      }
    }
    setMatched(null);
    setCameraOpen(true);
    setFacing('back');
    setPreviewRotation(0);
    setHint('Hold still — auto-detecting…');
    coolDownRef.current = false;
  };

  const resetScanUi = () => {
    setMatched(null);
    setCameraOpen(false);
    coolDownRef.current = false;
    setHint('Open camera — face auto-detects.');
  };

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ModuleBackBar label="Daily attendance" onBack={() => navigation.goBack()} />
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) },
        ]}
        onEndReached={() => {
          if (loadingMore || loadingList) return;
          if (rows.length >= total) return;
          void loadRows(page + 1, true);
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <ModuleKicker>Security</ModuleKicker>
            <Text style={styles.h1}>Daily attendance</Text>
            <Text style={styles.sub}>
              Teachers · parents · students — face, QR, or search (Desk day register).
            </Text>

            <View style={styles.dateRow}>
              <Pressable style={styles.dateBtn} onPress={() => setSessionDate((d) => shiftDate(d, -1))}>
                <Ionicons name="chevron-back" size={18} color={Colors.ink} />
              </Pressable>
              <TextInput
                style={styles.dateInput}
                value={sessionDate}
                onChangeText={(t) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(t.trim())) setSessionDate(t.trim());
                  else setSessionDate(t);
                }}
                onBlur={() => {
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) setSessionDate(todayIso());
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <Pressable style={styles.dateBtn} onPress={() => setSessionDate((d) => shiftDate(d, 1))}>
                <Ionicons name="chevron-forward" size={18} color={Colors.ink} />
              </Pressable>
              <Pressable style={styles.todayBtn} onPress={() => setSessionDate(todayIso())}>
                <Text style={styles.todayBtnText}>Today</Text>
              </Pressable>
            </View>

            <View style={styles.tabs}>
              {(['student', 'teacher', 'parent'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.tab, personTab === t && styles.tabOn]}
                  onPress={() => {
                    setPersonTab(t);
                    setQuery('');
                    setHits([]);
                    resetScanUi();
                  }}>
                  <Text style={[styles.tabText, personTab === t && styles.tabTextOn]}>{personTabLabel(t)}</Text>
                </Pressable>
              ))}
            </View>

            <GateDirectionToggle
              value={direction}
              onChange={setDirection}
              disabled={busy || !isToday}
              hint={isToday ? `Mark ${direction}` : 'Viewing past day — marking disabled'}
            />

            {isToday ? (
            <View style={styles.tabs}>
              {(['face', 'search', 'qr'] as const).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.tab, mode === m && styles.tabOn]}
                  onPress={() => {
                    setMode(m);
                    resetScanUi();
                  }}>
                  <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>
                    {m === 'face' ? 'Face' : m === 'search' ? 'Search' : 'QR'}
                  </Text>
                </Pressable>
              ))}
            </View>
            ) : (
              <Text style={styles.hint}>Date picker is for reviewing marks. Use Today to scan.</Text>
            )}

            {isToday ? (
            <ModuleGlassCard>
              {mode === 'face' ? (
                matched ? (
                  <View style={{ gap: 8 }}>
                    <Text style={styles.matchLabel}>Matched</Text>
                    <Text style={styles.hitName}>{matched.name}</Text>
                    <Text style={styles.hint}>
                      {[matched.meta || '—', scorePct(matched.score) ? `match ${scorePct(matched.score)}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    <Pressable style={styles.btn} disabled={busy} onPress={() => void confirmMatch()}>
                      <Text style={styles.btnText}>{busy ? '…' : `Confirm ${direction}`}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondary}
                      disabled={busy}
                      onPress={() => {
                        setMatched(null);
                        void openCamera();
                      }}>
                      <Text style={styles.secondaryText}>Scan again</Text>
                    </Pressable>
                  </View>
                ) : !cameraOpen ? (
                  <Pressable style={styles.btn} onPress={() => void openCamera()}>
                    <Text style={styles.btnText}>Open face scan</Text>
                  </Pressable>
                ) : (
                  <View style={{ gap: 8 }}>
                    <View style={styles.cam}>
                      <CameraView
                        ref={cameraRef}
                        style={[
                          StyleSheet.absoluteFill,
                          { transform: [{ rotate: `${previewRotation}deg` }] },
                        ]}
                        facing={facing}
                      />
                      {identifying ? (
                        <View style={styles.scanOverlay}>
                          <ActivityIndicator color="#fff" />
                          <Text style={styles.scanOverlayText}>Matching…</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.hint}>{hint}</Text>
                    <View style={styles.row}>
                      <Pressable style={styles.secondary} onPress={() => setCameraOpen(false)}>
                        <Text style={styles.secondaryText}>Close</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondary}
                        onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}>
                        <Ionicons name="camera-reverse-outline" size={16} color={Colors.ink} />
                        <Text style={styles.secondaryText}>Flip</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondary}
                        onPress={() => setPreviewRotation((r) => (r + 90) % 360)}>
                        <Ionicons name="refresh-outline" size={16} color={Colors.ink} />
                        <Text style={styles.secondaryText}>Rotate</Text>
                      </Pressable>
                      <Pressable
                        style={styles.btn}
                        disabled={busy || identifying}
                        onPress={() => void runFaceIdentify()}>
                        <Text style={styles.btnText}>{identifying ? '…' : 'Scan now'}</Text>
                      </Pressable>
                    </View>
                  </View>
                )
              ) : mode === 'search' ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={
                      personTab === 'student'
                        ? 'Name or admission'
                        : personTab === 'teacher'
                          ? 'Teacher name or employee no.'
                          : 'Parent / staff name'
                    }
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                  {searching ? <ActivityIndicator color={Colors.brandGreenDark} /> : null}
                  {hits.map((h) => {
                    const hitType =
                      (h.person_type as 'student' | 'teacher' | 'staff' | 'parent' | undefined) ||
                      (personTab === 'parent' ? 'parent' : personTab);
                    const meta =
                      h.student_number ||
                      h.admission_number ||
                      h.employee_number ||
                      h.staff_number ||
                      h.parent_number ||
                      h.email ||
                      '—';
                    return (
                      <Pressable
                        key={`${hitType}-${h.id}`}
                        style={styles.hit}
                        disabled={busy}
                        onPress={() =>
                          void mark({
                            student_id: hitType === 'student' ? h.id : undefined,
                            teacher_id: hitType === 'teacher' ? h.id : undefined,
                            person_id: hitType === 'student' ? undefined : h.id,
                            person_type: hitType === 'student' ? 'student' : hitType,
                            full_name: h.name,
                            method: 'manual',
                          })
                        }>
                        <Text style={styles.hitName}>{h.name}</Text>
                        <Text style={styles.hint}>
                          {meta}
                          {h.class_label ? ` · ${h.class_label}` : ''}
                          {` · ${hitType}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : !permission?.granted ? (
                <Pressable style={styles.btn} onPress={() => void requestPermission()}>
                  <Text style={styles.btnText}>Allow camera for QR</Text>
                </Pressable>
              ) : (
                <View style={styles.cam}>
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={busy ? undefined : onQr}
                  />
                </View>
              )}
            </ModuleGlassCard>
            ) : null}

            <View style={styles.sectionRow}>
              <Text style={styles.section}>
                {sessionDate === todayIso() ? "Today" : sessionDate}&apos;s marks ({total})
              </Text>
              <Pressable onPress={() => void loadRows(1, false)} hitSlop={8}>
                <Text style={styles.refresh}>Refresh</Text>
              </Pressable>
            </View>
            {loadingList && rows.length === 0 ? (
              <ActivityIndicator color={Colors.brandGreenDark} />
            ) : null}
            {rows.length > 0 ? (
              <View style={styles.tableHead}>
                <Text style={[styles.th, styles.thName]}>Name</Text>
                <Text style={[styles.th, styles.thType]}>Type</Text>
                <Text style={[styles.th, styles.thDir]}>In/Out</Text>
                <Text style={[styles.th, styles.thTime]}>Time</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loadingList ? <Text style={styles.hint}>No register marks for this day yet.</Text> : null
        }
        ListFooterComponent={
          <View style={{ gap: 8, marginVertical: 12 }}>
            {loadingMore ? <ActivityIndicator color={Colors.brandGreenDark} /> : null}
            {total > 0 ? (
              <View style={styles.pager}>
                <Pressable
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1 || loadingList}
                  onPress={() => void loadRows(Math.max(1, page - 1), false)}>
                  <Text style={styles.pageBtnText}>Prev</Text>
                </Pressable>
                <Text style={styles.pageLabel}>
                  Page {page} · {rows.length}/{total}
                </Text>
                <Pressable
                  style={[styles.pageBtn, rows.length >= total && styles.pageBtnDisabled]}
                  disabled={rows.length >= total || loadingList || loadingMore}
                  onPress={() => void loadRows(page + 1, true)}>
                  <Text style={styles.pageBtnText}>More</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <View style={styles.tdName}>
              <Text style={styles.hitName} numberOfLines={1}>
                {item.full_name || '—'}
              </Text>
              {item.id_number || item.method ? (
                <Text style={styles.hint} numberOfLines={1}>
                  {[item.id_number, item.method].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <Text style={styles.tdType}>{item.person_type || '—'}</Text>
            <Text style={styles.tdDir}>{item.direction || '—'}</Text>
            <Text style={styles.tdTime}>
              {item.marked_at ? String(item.marked_at).slice(11, 16) : '—'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 8 },
  h1: { fontSize: 22, fontWeight: '800', color: Colors.ink },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  section: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  refresh: { fontSize: 13, fontWeight: '700', color: Colors.brandGreenDark },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.ink,
    fontWeight: '700',
    textAlign: 'center',
  },
  todayBtn: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  todayBtnText: { fontWeight: '700', color: Colors.ink, fontSize: 12 },
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  tabOn: { backgroundColor: Colors.brandGreenDark },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.mutedForeground },
  tabTextOn: { color: '#fff' },
  btn: {
    flex: 1,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  secondary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryText: { fontWeight: '700', color: Colors.ink },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cam: { height: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0b1220' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanOverlayText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 12, color: '#64748b' },
  matchLabel: { fontSize: 12, fontWeight: '700', color: Colors.brandGreenDark, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    color: Colors.ink,
  },
  hit: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  hitName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  record: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    gap: 4,
  },
  th: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  thName: { flex: 1.6 },
  thType: { width: 64, textAlign: 'center' },
  thDir: { width: 52, textAlign: 'center' },
  thTime: { width: 44, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 4,
  },
  tdName: { flex: 1.6 },
  tdType: { width: 64, textAlign: 'center', fontSize: 12, color: '#475569', fontWeight: '600' },
  tdDir: { width: 52, textAlign: 'center', fontSize: 12, color: Colors.ink, fontWeight: '700' },
  tdTime: { width: 44, textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: '600' },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontWeight: '700', color: Colors.ink, fontSize: 13 },
  pageLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
});
