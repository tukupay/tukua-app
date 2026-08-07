import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../context/DeskAuthContext';
import { LinkedStudent, UserSchool } from '../lib/orgRoles';
import { deskRoleLabel } from '../lib/deskRoles';
import { Colors } from '../theme/yana';
import { LiquidGlassBackdrop } from '../components/dashboard/LiquidGlassBackdrop';
import { GlassPanel } from '../components/dashboard/Glass';
import { floatingHeaderInset, TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { ProfileAvatar } from '../components/navigation/ProfileAvatar';
import { deskFetch, ensureNestDeskSession } from '../lib/deskApi';
import { log } from '../lib/logger';
import {
  createJoinRequest,
  searchJoinSchools,
  searchJoinStudents,
  type JoinSchoolHit,
  type JoinStudentHit,
} from '../lib/joinRequestApi';
import { useDialog } from '../context/DialogContext';
import { SafeRemoteImage } from '../components/SafeRemoteImage';

type DeskChild = {
  student_id?: string;
  admission_number?: string | null;
  full_name?: string;
  class_name?: string | null;
  relationship?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
};

type DisplayStudent = LinkedStudent & {
  className?: string | null;
};

type CardDensity = 'comfy' | 'normal' | 'tight';

const HERO_GREEN = '#15411D';
const PICKER_LOAD_TIMEOUT_MS = 8000;

function roleIcon(role: string): keyof typeof Ionicons.glyphMap {
  const r = role.toLowerCase();
  if (r === 'parent') return 'people';
  if (r === 'student') return 'person';
  if (r === 'teacher') return 'school';
  if (r === 'security') return 'shield-checkmark';
  if (r === 'finance_officer' || r === 'accountant' || r === 'bursar') return 'wallet';
  return 'briefcase';
}

function densityForCount(count: number): CardDensity {
  if (count >= 6) return 'tight';
  if (count >= 4) return 'normal';
  return 'comfy';
}

function enrichFromDesk(student: LinkedStudent, deskKids: DeskChild[]): DisplayStudent {
  if (!deskKids.length) return student;
  const adm = student.admissionNumber?.trim().toLowerCase();
  const name = student.name.trim().toLowerCase();
  const hit =
    deskKids.find((c) => c.student_id && c.student_id === student.id) ||
    deskKids.find(
      (c) =>
        adm &&
        c.admission_number &&
        String(c.admission_number).trim().toLowerCase() === adm,
    ) ||
    deskKids.find((c) => c.full_name && c.full_name.trim().toLowerCase() === name);

  if (!hit) return student;
  const photo = hit.avatar_url || hit.photo_url || null;
  return {
    ...student,
    name: hit.full_name?.trim() || student.name,
    admissionNumber: hit.admission_number || student.admissionNumber || null,
    relationship: hit.relationship || student.relationship || null,
    className: hit.class_name || student.className || null,
    avatarUrl: photo || student.avatarUrl || null,
  };
}

/** Prefer Desk children rows when Nest returned richer details (name + class). */
function mergePickerStudents(
  linked: LinkedStudent[],
  deskKids: DeskChild[],
  schools: UserSchool[],
): DisplayStudent[] {
  if (deskKids.length > 0) {
    const byId = new Map(linked.map((s) => [s.id, s]));
    const byAdm = new Map(
      linked
        .filter((s) => s.admissionNumber)
        .map((s) => [String(s.admissionNumber).trim().toLowerCase(), s]),
    );
    const defaultSchool = schools[0];
    const out: DisplayStudent[] = [];
    const seen = new Set<string>();

    for (const c of deskKids) {
      const sid = String(c.student_id ?? '');
      const adm = c.admission_number ? String(c.admission_number).trim().toLowerCase() : '';
      const org = (sid && byId.get(sid)) || (adm && byAdm.get(adm)) || null;
      const school =
        (org && schools.find((s) => s.id === org.schoolId)) ||
        schools.find((sch) => (sch.students ?? []).some((st) => st.id === sid)) ||
        defaultSchool;
      if (!school) continue;
      const id = sid || org?.id || `desk-${adm || out.length}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        key: `${school.id}:${id}`,
        id,
        name: c.full_name?.trim() || org?.name || 'Student',
        admissionNumber: c.admission_number ?? org?.admissionNumber ?? null,
        relationship: c.relationship ?? org?.relationship ?? null,
        className: c.class_name ?? org?.className ?? null,
        avatarUrl: c.avatar_url || c.photo_url || org?.avatarUrl || null,
        schoolId: school.id,
        schoolName: school.name,
        schoolLogoUrl: school.logoUrl,
        schoolRoles: school.roles,
      });
    }

    for (const s of linked) {
      if (seen.has(s.id)) continue;
      out.push(enrichFromDesk(s, deskKids));
      seen.add(s.id);
    }
    return out;
  }

  return linked.map((s) => enrichFromDesk(s, deskKids));
}

/** Full-screen loader — never flash Chat or a half-ready picker underneath. */
export function ContextPickLoader({ message = 'Preparing your school…' }: { message?: string }) {
  const insets = useSafeAreaInsets();
  const tabReserve = TAB_BAR_BODY_HEIGHT + insets.bottom;
  return (
    <View style={[styles.root, { bottom: tabReserve }]}>
      <LiquidGlassBackdrop />
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={HERO_GREEN} size="large" />
        <Text style={styles.loaderText}>{message}</Text>
      </View>
    </View>
  );
}

function PickerLoadError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const tabReserve = TAB_BAR_BODY_HEIGHT + insets.bottom;
  return (
    <View style={[styles.root, { bottom: tabReserve }]}>
      <LiquidGlassBackdrop />
      <View style={[styles.loaderWrap, styles.errorWrap]}>
        <Ionicons name="cloud-offline-outline" size={36} color={HERO_GREEN} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.waitHint}>{message}</Text>
        {onRetry ? (
          <Pressable style={styles.addStudentBtn} onPress={onRetry} accessibilityRole="button">
            <Text style={styles.addStudentBtnText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function SchoolPickerScreen() {
  const insets = useSafeAreaInsets();
  const {
    schools,
    linkedStudents,
    selectStudent,
    selectSchool,
    selectRole,
    backInPicker,
    refreshSchools,
    schoolsReady,
    selectedStudentId,
    selectedSchoolId,
    selectedSchool,
    selectedRole,
    deskToken,
    pickerMode,
    schoolRoleOptions,
  } = useDeskAuth();

  const [deskChildren, setDeskChildren] = useState<DeskChild[]>([]);
  const [deskKidsFetched, setDeskKidsFetched] = useState(false);
  const { showDialog } = useDialog();

  /** Inline “Add your student” — same page, 2 steps. */
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  /** Filter already-linked schools / students when switching context. */
  const [pickerFilter, setPickerFilter] = useState('');
  const [schoolHits, setSchoolHits] = useState<JoinSchoolHit[]>([]);
  const [studentHits, setStudentHits] = useState<JoinStudentHit[]>([]);
  const [joinedSchool, setJoinedSchool] = useState<JoinSchoolHit | null>(null);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [pickerTimedOut, setPickerTimedOut] = useState(false);
  const schoolSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roleMode = pickerMode === 'role' && schoolRoleOptions.length > 1;
  const studentList = useMemo(() => {
    if (!selectedSchoolId) return linkedStudents;
    return linkedStudents.filter((s) => s.schoolId === selectedSchoolId);
  }, [linkedStudents, selectedSchoolId]);
  // Parent student step — include empty list so Add CTA + waiting message stay visible.
  const showStudentMode = pickerMode === 'student';
  const density = densityForCount(
    roleMode
      ? schoolRoleOptions.length
      : showStudentMode
        ? Math.max(studentList.length, 1)
        : schools.length,
  );
  const canGoBack =
    (pickerMode === 'role' && schools.length > 1) ||
    (pickerMode === 'student' && (schools.length > 1 || schoolRoleOptions.length > 1));

  // Android / system back — same as on-screen Back (add-student steps + picker).
  useEffect(() => {
    const onHardwareBack = () => {
      if (addOpen) {
        if (addStep === 2) {
          setAddStep(1);
          setJoinedSchool(null);
          setStudentQuery('');
          setStudentHits([]);
          return true;
        }
        setAddOpen(false);
        setAddStep(1);
        setJoinedSchool(null);
        setSchoolQuery('');
        setSchoolHits([]);
        setStudentQuery('');
        setStudentHits([]);
        return true;
      }
      if (canGoBack) {
        void backInPicker();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [addOpen, addStep, canGoBack, backInPicker]);

  useEffect(() => {
    if (!showStudentMode || !deskToken) {
      setDeskChildren([]);
      setDeskKidsFetched(true);
      return;
    }
    let cancelled = false;
    setDeskKidsFetched(false);
    void (async () => {
      try {
        // Session restore often has Supabase JWT only — Nest reconnect first.
        await ensureNestDeskSession();
        if (cancelled) return;
        const data = await deskFetch<{ children?: DeskChild[] }>('/parents/me/children');
        if (!cancelled) {
          const kids = Array.isArray(data?.children) ? data.children : [];
          setDeskChildren(kids);
          log.info('StudentPicker', 'desk children loaded', { count: kids.length });
        }
      } catch (e) {
        log.warn('StudentPicker', 'desk children details unavailable', String(e));
        if (!cancelled) setDeskChildren([]);
      } finally {
        if (!cancelled) setDeskKidsFetched(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showStudentMode, deskToken]);

  const displayStudents = useMemo(
    () => mergePickerStudents(studentList, deskChildren, schools),
    [studentList, deskChildren, schools],
  );

  const showPickerLoader =
    !schoolsReady ||
    (showStudentMode && !!deskToken && !deskKidsFetched) ||
    (pickerMode === 'role' && schoolRoleOptions.length <= 1 && schools.length <= 1) ||
    (showStudentMode && !addOpen && displayStudents.length === 1);

  useEffect(() => {
    if (!showPickerLoader) {
      setPickerTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setPickerTimedOut(true), PICKER_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [showPickerLoader]);

  const filteredSchools = useMemo(() => {
    const q = pickerFilter.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => {
      const roles = (s.roles ?? []).join(' ').toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        String((s as { code?: string }).code || '').toLowerCase().includes(q) ||
        roles.includes(q)
      );
    });
  }, [schools, pickerFilter]);

  const filteredDisplayStudents = useMemo(() => {
    const q = pickerFilter.trim().toLowerCase();
    if (!q) return displayStudents;
    return displayStudents.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        String(s.admissionNumber || '').toLowerCase().includes(q) ||
        String(s.schoolName || '').toLowerCase().includes(q) ||
        String((s as DisplayStudent).className || '').toLowerCase().includes(q)
      );
    });
  }, [displayStudents, pickerFilter]);

  // One role only → skip picker.
  useEffect(() => {
    if (!schoolsReady || !roleMode) return;
    if (schoolRoleOptions.length === 1) {
      void selectRole(schoolRoleOptions[0]);
    }
  }, [schoolsReady, roleMode, schoolRoleOptions, selectRole]);

  // One student only → skip picker (go straight through to Chat / dashboard).
  // Zero students → stay on this screen so parent can “Add your student”.
  useEffect(() => {
    if (!schoolsReady) return;
    if (showStudentMode && !deskKidsFetched) return;
    if (!showStudentMode) return;
    if (addOpen) return;
    if (displayStudents.length === 1) {
      void selectStudent(displayStudents[0]);
    }
  }, [schoolsReady, showStudentMode, deskKidsFetched, displayStudents, selectStudent, addOpen]);

  useEffect(() => {
    if (!addOpen || addStep !== 1) return;
    if (schoolSearchTimer.current) clearTimeout(schoolSearchTimer.current);
    const q = schoolQuery.trim();
    if (q.length < 2) {
      setSchoolHits([]);
      setSearchingSchools(false);
      return;
    }
    setSearchingSchools(true);
    schoolSearchTimer.current = setTimeout(() => {
      void (async () => {
        try {
          await ensureNestDeskSession();
          const res = await searchJoinSchools(q);
          setSchoolHits(Array.isArray(res?.schools) ? res.schools : []);
        } catch (e) {
          log.warn('AddStudent', 'school search failed', String(e));
          setSchoolHits([]);
        } finally {
          setSearchingSchools(false);
        }
      })();
    }, 250);
    return () => {
      if (schoolSearchTimer.current) clearTimeout(schoolSearchTimer.current);
    };
  }, [addOpen, addStep, schoolQuery]);

  useEffect(() => {
    if (!addOpen || addStep !== 2 || !joinedSchool?.id) return;
    if (studentSearchTimer.current) clearTimeout(studentSearchTimer.current);
    const q = studentQuery.trim();
    if (q.length < 2) {
      setStudentHits([]);
      setSearchingStudents(false);
      return;
    }
    setSearchingStudents(true);
    studentSearchTimer.current = setTimeout(() => {
      void (async () => {
        try {
          await ensureNestDeskSession();
          const res = await searchJoinStudents(joinedSchool.id, q);
          setStudentHits(Array.isArray(res?.students) ? res.students : []);
        } catch (e) {
          log.warn('AddStudent', 'student search failed', String(e));
          setStudentHits([]);
        } finally {
          setSearchingStudents(false);
        }
      })();
    }, 250);
    return () => {
      if (studentSearchTimer.current) clearTimeout(studentSearchTimer.current);
    };
  }, [addOpen, addStep, studentQuery, joinedSchool?.id]);

  const openAddStudent = useCallback(() => {
    setAddOpen(true);
    setAddStep(1);
    setSchoolQuery('');
    setStudentQuery('');
    setPickerFilter('');
    setSchoolHits([]);
    setStudentHits([]);
    setJoinedSchool(null);
  }, []);

  const closeAddStudent = useCallback(() => {
    setAddOpen(false);
    setAddStep(1);
    setJoinedSchool(null);
  }, []);

  const onJoinSchool = useCallback((school: JoinSchoolHit) => {
    setJoinedSchool(school);
    setAddStep(2);
    setStudentQuery('');
    setStudentHits([]);
  }, []);

  const onAddStudentRequest = useCallback(
    async (student: JoinStudentHit) => {
      if (!joinedSchool?.id || !student?.id) return;
      setSubmittingJoin(true);
      try {
        await ensureNestDeskSession();
        const res = await createJoinRequest({
          school_id: joinedSchool.id,
          target_student_id: student.id,
          role_slug: 'parent',
          relationship: 'guardian',
        });
        closeAddStudent();
        showDialog({
          title: res?.already_pending ? 'Already requested' : 'Request sent',
          message: res?.already_pending
            ? 'You already have a pending request for this student. Wait for the school to approve.'
            : `${student.name} was requested at ${joinedSchool.name}. They stay inactive until the school accepts.`,
          variant: 'success',
        });
      } catch (e) {
        showDialog({
          title: 'Could not add student',
          message: e instanceof Error ? e.message : String(e),
          variant: 'danger',
        });
      } finally {
        setSubmittingJoin(false);
      }
    },
    [joinedSchool, closeAddStudent, showDialog],
  );

  const onSelectRole = useCallback(
    async (role: string) => {
      await selectRole(role);
    },
    [selectRole],
  );

  const onSelectStudent = useCallback(
    async (student: LinkedStudent) => {
      await selectStudent(student);
    },
    [selectStudent],
  );

  const onSelectSchool = useCallback(
    async (school: UserSchool) => {
      await selectSchool(school.id);
    },
    [selectSchool],
  );

  const bottomPad = 16;
  const tabReserve = TAB_BAR_BODY_HEIGHT + insets.bottom;
  const avatarSize = density === 'tight' ? 40 : density === 'normal' ? 44 : 48;
  const listGap = density === 'tight' ? 8 : density === 'normal' ? 10 : 12;

  if (showPickerLoader && !pickerTimedOut) {
    return <ContextPickLoader />;
  }

  if (showPickerLoader && pickerTimedOut && !schoolsReady) {
    return (
      <PickerLoadError
        title="Could not load schools"
        message="Check your connection, then try again. You can still open Profile or Dashboard from the tabs below."
        onRetry={() => {
          setPickerTimedOut(false);
          void refreshSchools({ forcePick: true });
        }}
      />
    );
  }

  const headerBack = canGoBack ? (
    <Pressable
      style={styles.backBtn}
      onPress={() => void backInPicker()}
      accessibilityRole="button"
      accessibilityLabel="Go back">
      <Ionicons name="chevron-back" size={22} color={HERO_GREEN} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  ) : null;

  const addStudentBtn = (
    <Pressable
      style={styles.addStudentBtn}
      onPress={openAddStudent}
      accessibilityRole="button"
      accessibilityLabel="Add your student">
      <Ionicons name="person-add-outline" size={14} color={HERO_GREEN} />
      <Text style={styles.addStudentBtnText}>Add your student</Text>
    </Pressable>
  );

  const addStudentFooter = (
    <View style={styles.addStudentFooter}>
      {addStudentBtn}
    </View>
  );

  if (addOpen) {
    return (
      <View style={[styles.root, { bottom: tabReserve }]}>
        <LiquidGlassBackdrop />
        <View style={styles.page}>
          <FlatList
            data={addStep === 1 ? schoolHits : studentHits}
            keyExtractor={(item) => item.id}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                <Pressable
                  style={styles.backBtn}
                  onPress={() => {
                    if (addStep === 2) {
                      setAddStep(1);
                      setJoinedSchool(null);
                      setStudentQuery('');
                      setStudentHits([]);
                    } else {
                      closeAddStudent();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back">
                  <Ionicons name="chevron-back" size={22} color={HERO_GREEN} />
                  <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Text style={styles.title}>
                  {addStep === 1 ? 'Find your school' : 'Find your student'}
                </Text>
                <Text style={styles.subtitle}>
                  {addStep === 1
                    ? 'Search by school name or code, then tap Join.'
                    : `At ${joinedSchool?.name ?? 'school'} — search by name or admission. Second name is partially hidden until approved.`}
                </Text>
                {addStep === 1 ? (
                  <TextInput
                    style={styles.searchInput}
                    value={schoolQuery}
                    onChangeText={setSchoolQuery}
                    placeholder="School name or code…"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                ) : (
                  <>
                    {joinedSchool ? (
                      <GlassPanel tone="frost" radius={14} shine={false} style={styles.joinedCard}>
                        <View style={styles.cardInner}>
                          <View style={[styles.logoWrap, { width: 40, height: 40 }]}>
                            <SafeRemoteImage
                              uri={joinedSchool.logo_url}
                              style={{ width: 40, height: 40, borderRadius: 10 }}
                              containerStyle={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                              fallback={<Ionicons name="school" size={20} color={HERO_GREEN} />}
                              accessibilityLabel={`${joinedSchool.name} logo`}
                            />
                          </View>
                          <View style={styles.rowText}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                              {joinedSchool.name}
                            </Text>
                            <Text style={styles.cardMeta} numberOfLines={1}>
                              {joinedSchool.code || 'School'} · Joined
                            </Text>
                          </View>
                        </View>
                      </GlassPanel>
                    ) : null}
                    <TextInput
                      style={styles.searchInput}
                      value={studentQuery}
                      onChangeText={setStudentQuery}
                      placeholder="Student name or ADM…"
                      placeholderTextColor="#94a3b8"
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </>
                )}
                {(addStep === 1 ? searchingSchools : searchingStudents) ? (
                  <ActivityIndicator color={HERO_GREEN} style={{ marginTop: 10 }} />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              !(addStep === 1 ? searchingSchools : searchingStudents) &&
              (addStep === 1 ? schoolQuery : studentQuery).trim().length >= 2 ? (
                <Text style={styles.emptyHint}>No matches — try another spelling.</Text>
              ) : null
            }
            renderItem={({ item }) => {
              if (addStep === 1) {
                const school = item as JoinSchoolHit;
                return (
                  <GlassPanel tone="frost" radius={16} shine={false} style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={[styles.logoWrap, { width: avatarSize, height: avatarSize }]}>
                        <SafeRemoteImage
                          uri={school.logo_url}
                          style={{ width: avatarSize, height: avatarSize, borderRadius: 10 }}
                          containerStyle={{
                            width: avatarSize,
                            height: avatarSize,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          fallback={<Ionicons name="school" size={22} color={HERO_GREEN} />}
                          accessibilityLabel={`${school.name} logo`}
                        />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {school.name}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {[school.code, school.county].filter(Boolean).join(' · ') || 'School'}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.joinBtn}
                        onPress={() => onJoinSchool(school)}
                        accessibilityRole="button"
                        accessibilityLabel={`Join ${school.name}`}>
                        <Text style={styles.joinBtnText}>Join</Text>
                      </Pressable>
                    </View>
                  </GlassPanel>
                );
              }
              const student = item as JoinStudentHit;
              const adm = student.admission_number || student.admission_masked || null;
              const meta = [student.class_name, adm ? `Adm ${adm}` : null].filter(Boolean).join(' · ');
              return (
                <GlassPanel tone="frost" radius={16} shine={false} style={styles.card}>
                  <View style={styles.cardInner}>
                    <ProfileAvatar name={student.name} uri={null} size={avatarSize} />
                    <View style={styles.rowText}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {student.name}
                      </Text>
                      {meta ? (
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {meta}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      style={[styles.joinBtn, submittingJoin && { opacity: 0.6 }]}
                      disabled={submittingJoin}
                      onPress={() => void onAddStudentRequest(student)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${student.name}`}>
                      {submittingJoin ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.joinBtnText}>Add</Text>
                      )}
                    </Pressable>
                  </View>
                </GlassPanel>
              );
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { bottom: tabReserve }]}>
      <LiquidGlassBackdrop />
      <View style={styles.page}>
        {roleMode ? (
          <FlatList
            data={schoolRoleOptions}
            keyExtractor={(item) => item}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                {headerBack}
                <Text style={styles.title}>Select school and role</Text>
                <Text style={styles.subtitle}>
                  Choose your role at {selectedSchool?.name ?? 'this school'}. You can switch anytime
                  from the dashboard.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = item === selectedRole;
              return (
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => void onSelectRole(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open as ${deskRoleLabel(item)}`}>
                  <GlassPanel
                    tone="frost"
                    radius={16}
                    shine={false}
                    accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}
                    style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={[styles.logoWrap, { width: avatarSize, height: avatarSize }]}>
                        <Ionicons name={roleIcon(item)} size={22} color={HERO_GREEN} />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {deskRoleLabel(item)}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {selectedSchool?.name ?? 'School workspace'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            }}
          />
        ) : showStudentMode ? (
          <FlatList
            data={filteredDisplayStudents}
            keyExtractor={(item) => item.key}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                {headerBack}
                <Text style={styles.title}>Select student</Text>
                <Text style={styles.subtitle}>
                  {displayStudents.length === 0
                    ? 'Add a student to request a link. The school must approve before you can open this workspace.'
                    : 'Choose who to open. You can switch anytime from the dashboard.'}
                </Text>
                {displayStudents.length > 0 ? (
                  <TextInput
                    style={styles.searchInput}
                    value={pickerFilter}
                    onChangeText={setPickerFilter}
                    placeholder="Search name or admission…"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.emptyHint}>
                {pickerFilter.trim()
                  ? 'No students match that search.'
                  : 'No approved students yet. Use Add your student below — pending requests stay inactive until the school accepts.'}
              </Text>
            }
            ListFooterComponent={addStudentFooter}
            renderItem={({ item }) => {
              const selected =
                item.id === selectedStudentId && item.schoolId === selectedSchoolId;
              const meta = [
                item.className,
                item.admissionNumber ? `Adm ${item.admissionNumber}` : null,
                item.relationship,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => void onSelectStudent(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}>
                  <GlassPanel
                    tone="frost"
                    radius={16}
                    shine={false}
                    accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}
                    style={styles.card}>
                    <View
                      style={[
                        styles.cardInner,
                        density === 'tight' && styles.cardInnerTight,
                        density === 'normal' && styles.cardInnerNormal,
                      ]}>
                      <ProfileAvatar name={item.name} uri={item.avatarUrl} size={avatarSize} />
                      <View style={styles.rowText}>
                        <Text
                          style={[styles.cardTitle, density === 'tight' && styles.cardTitleTight]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        {meta ? (
                          <Text style={styles.cardMeta} numberOfLines={1}>
                            {meta}
                          </Text>
                        ) : null}
                        <Text style={styles.schoolLine} numberOfLines={1}>
                          {item.schoolName}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredSchools}
            keyExtractor={(item) => item.id}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                <Text style={styles.title}>Select school and role</Text>
                <Text style={styles.subtitle}>
                  Choose the school (and role next if you have more than one). Skipped automatically
                  when you belong to only one school with one role.
                </Text>
                {schools.length > 0 ? (
                  <TextInput
                    style={styles.searchInput}
                    value={pickerFilter}
                    onChangeText={setPickerFilter}
                    placeholder="Search school name…"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              schools.length > 0 && pickerFilter.trim() ? (
                <Text style={styles.emptyHint}>No schools match that search.</Text>
              ) : null
            }
            ListFooterComponent={
              schools.length === 0 ? (
                <View style={styles.addStudentFooter}>
                  <Text style={styles.waitHint}>
                    No schools linked yet. Add your student to find a school and request access.
                  </Text>
                  {addStudentBtn}
                </View>
              ) : (
                <View style={styles.addStudentFooter}>{addStudentBtn}</View>
              )
            }
            renderItem={({ item }) => {
              const selected = item.id === selectedSchoolId;
              return (
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => void onSelectSchool(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}>
                  <GlassPanel
                    tone="frost"
                    radius={16}
                    shine={false}
                    accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}
                    style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={[styles.logoWrap, { width: avatarSize, height: avatarSize }]}>
                        <SafeRemoteImage
                          uri={item.logoUrl}
                          style={{ width: avatarSize, height: avatarSize, borderRadius: 10 }}
                          containerStyle={{
                            width: avatarSize,
                            height: avatarSize,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          fallback={<Ionicons name="school" size={22} color={HERO_GREEN} />}
                          accessibilityLabel={`${item.name} logo`}
                        />
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {(item.roles ?? []).join(' · ') || 'School'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    top: 0,
    left: 0,
    right: 0,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  errorWrap: {
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  page: { flex: 1 },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16 },
  headerChrome: { paddingBottom: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  backText: { fontSize: 15, fontWeight: '700', color: HERO_GREEN },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  card: { overflow: 'hidden' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.992 }] },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardInnerNormal: { paddingVertical: 12 },
  cardInnerTight: { paddingVertical: 10 },
  rowText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  cardTitleTight: { fontSize: 15 },
  cardMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  schoolLine: { marginTop: 2, fontSize: 12, fontWeight: '600', color: HERO_GREEN },
  logoWrap: {
    borderRadius: 10,
    backgroundColor: '#EDF1FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addStudentBtn: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(21,65,29,0.35)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addStudentBtnText: { color: HERO_GREEN, fontWeight: '600', fontSize: 13 },
  addStudentFooter: {
    marginTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  waitHint: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  searchInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: Colors.ink,
    fontSize: 15,
  },
  joinBtn: {
    backgroundColor: HERO_GREEN,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 64,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  joinedCard: { marginTop: 12, overflow: 'hidden' },
  emptyHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
