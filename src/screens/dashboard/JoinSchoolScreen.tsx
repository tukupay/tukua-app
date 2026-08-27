/**
 * Join School — parent / student / teacher / staff onboarding wizard.
 * Pending until school admin approves (Admin → Approve on Desk).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset, TAB_BAR_BODY_HEIGHT } from '../../constants/layout';
import { useDialog } from '../../context/DialogContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { DashboardStackParamList } from '../../navigation/types';
import {
  createJoinRequest,
  leaveMyMembership,
  listJoinClasses,
  listJoinSubjects,
  listMyJoinRequests,
  listMyMemberships,
  searchJoinSchools,
  searchJoinStudents,
  type JoinClassHit,
  type JoinSchoolHit,
  type JoinStudentHit,
  type JoinSubjectHit,
  type MembershipHit,
  type MyJoinRequestHit,
} from '../../lib/joinRequestApi';

type JoinRole = 'parent' | 'student' | 'teacher' | 'staff';
type Step = 'role' | 'school' | 'details' | 'done';

export const JOIN_PROMPT_SEEN_KEY = 'tukua_seen_join_prompt_v1';

const ROLE_OPTIONS: Array<{
  id: JoinRole;
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'parent', title: 'Parent / guardian', hint: 'Link to your child', icon: 'people' },
  { id: 'student', title: 'Student', hint: 'Join a class', icon: 'school' },
  { id: 'teacher', title: 'Teacher', hint: 'Subjects & class teacher', icon: 'book' },
  { id: 'staff', title: 'Staff', hint: 'Accountant, librarian, …', icon: 'briefcase' },
];

const STAFF_ROLES = [
  { id: 'accountant', label: 'Accountant' },
  { id: 'bursar', label: 'Bursar' },
  { id: 'librarian', label: 'Librarian' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'security', label: 'Security' },
  { id: 'receptionist', label: 'Receptionist' },
  { id: 'driver', label: 'Driver' },
  { id: 'clerk', label: 'Clerk' },
  { id: 'laboratory_technician', label: 'Lab technician' },
  { id: 'staff', label: 'Other staff' },
];

type WorkloadLine = {
  key: string;
  subject_id: string;
  class_id: string;
  lessons_per_week: string;
  showSubjectPicker?: boolean;
  showClassPicker?: boolean;
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function LogoAvatar({
  uri,
  name,
  fallbackIcon,
  tint,
}: {
  uri?: string | null;
  name: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatarImg} />;
  }
  return (
    <View style={[styles.avatarFallback, { backgroundColor: `${tint}14` }]}>
      {fallbackIcon ? (
        <Ionicons name={fallbackIcon} size={18} color={tint} />
      ) : (
        <Text style={[styles.avatarInitials, { color: tint }]}>{initials(name)}</Text>
      )}
    </View>
  );
}

export function JoinSchoolScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<DashboardStackParamList, 'JoinSchool'>>();
  const firstLogin = Boolean(route.params?.firstLogin);
  const preferRole = route.params?.preferRole;
  const { showDialog } = useDialog();
  const { palette } = useAppTheme();
  const { selectSchool, refreshSchools } = useDeskAuth();
  const bottomPad = TAB_BAR_BODY_HEIGHT + insets.bottom + 24;
  const hero = palette.primary;

  const [step, setStep] = useState<Step>(preferRole ? 'school' : 'role');
  const [role, setRole] = useState<JoinRole | null>(preferRole ?? null);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolHits, setSchoolHits] = useState<JoinSchoolHit[]>([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [school, setSchool] = useState<JoinSchoolHit | null>(null);

  const [studentQuery, setStudentQuery] = useState('');
  const [studentHits, setStudentHits] = useState<JoinStudentHit[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [students, setStudents] = useState<JoinStudentHit[]>([]);
  const [relationship, setRelationship] = useState('guardian');

  const [classes, setClasses] = useState<JoinClassHit[]>([]);
  const [subjects, setSubjects] = useState<JoinSubjectHit[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [classId, setClassId] = useState('');
  const [classOrCourse, setClassOrCourse] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [asTeacher, setAsTeacher] = useState(true);
  const [asClassTeacher, setAsClassTeacher] = useState(false);
  const [workloads, setWorkloads] = useState<WorkloadLine[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memberships, setMemberships] = useState<MembershipHit[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<MyJoinRequestHit[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const schoolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markJoinPromptSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(JOIN_PROMPT_SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Do not mark "seen" on open — login must re-check incomplete teacher/parent onboarding.
  // Seen is set only when they skip or successfully submit (below).

  const reloadMemberships = useCallback(async () => {
    setLoadingMemberships(true);
    setLoadingPending(true);
    try {
      const [mem, mine] = await Promise.all([listMyMemberships(), listMyJoinRequests()]);
      setMemberships(Array.isArray(mem.memberships) ? mem.memberships : []);
      const reqs = Array.isArray(mine.requests) ? mine.requests : [];
      setPendingRequests(
        reqs.filter((r) => {
          const s = String(r.status || '').toLowerCase();
          return s === 'pending' || s === 'rejected';
        }),
      );
    } catch {
      setMemberships([]);
      setPendingRequests([]);
    } finally {
      setLoadingMemberships(false);
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    void reloadMemberships();
  }, [reloadMemberships]);

  useEffect(() => {
    if (schoolTimer.current) clearTimeout(schoolTimer.current);
    const q = schoolQuery.trim();
    if (q.length < 1) {
      setSchoolHits([]);
      return;
    }
    schoolTimer.current = setTimeout(() => {
      void (async () => {
        setSearchingSchools(true);
        try {
          const res = await searchJoinSchools(q);
          setSchoolHits(res.schools || []);
        } catch {
          setSchoolHits([]);
        } finally {
          setSearchingSchools(false);
        }
      })();
    }, 220);
    return () => {
      if (schoolTimer.current) clearTimeout(schoolTimer.current);
    };
  }, [schoolQuery]);

  useEffect(() => {
    if (role !== 'parent' || !school) return;
    if (studentTimer.current) clearTimeout(studentTimer.current);
    const q = studentQuery.trim();
    if (q.length < 2) {
      setStudentHits([]);
      return;
    }
    studentTimer.current = setTimeout(() => {
      void (async () => {
        setSearchingStudents(true);
        try {
          const res = await searchJoinStudents(school.id, q);
          const selected = new Set(students.map((s) => s.id));
          setStudentHits((res.students || []).filter((s) => !selected.has(s.id)));
        } catch {
          setStudentHits([]);
        } finally {
          setSearchingStudents(false);
        }
      })();
    }, 320);
    return () => {
      if (studentTimer.current) clearTimeout(studentTimer.current);
    };
  }, [studentQuery, school, role, students]);

  const loadMeta = useCallback(async (schoolId: string, joinRole: JoinRole) => {
    if (joinRole !== 'student' && joinRole !== 'teacher') return;
    setLoadingMeta(true);
    try {
      const [cRes, sRes] = await Promise.all([
        listJoinClasses(schoolId),
        joinRole === 'teacher'
          ? listJoinSubjects(schoolId)
          : Promise.resolve({ subjects: [] as JoinSubjectHit[] }),
      ]);
      setClasses(cRes.classes || []);
      setSubjects(sRes.subjects || []);
    } catch {
      setClasses([]);
      setSubjects([]);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const pickRole = (r: JoinRole) => {
    setRole(r);
    setStep('school');
  };

  const pickSchool = async (s: JoinSchoolHit) => {
    setSchool(s);
    setSchoolHits([]);
    setSchoolQuery(s.name);
    setStudents([]);
    setStudentQuery('');
    setStudentHits([]);
    setClassId('');
    setShowClassPicker(false);
    setStaffRoles([]);
    setShowStaffPicker(false);
    setWorkloads([]);
    setAsTeacher(true);
    setAsClassTeacher(false);
    if (role) await loadMeta(s.id, role);
    setStep('details');
  };

  const addStudent = (s: JoinStudentHit) => {
    setStudents((prev) => (prev.some((x) => x.id === s.id) ? prev : [...prev, s]));
    setStudentHits([]);
    setStudentQuery('');
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const openMembership = async (m: MembershipHit) => {
    await refreshSchools({ quiet: true });
    try {
      await selectSchool(m.school_id);
      navigation.goBack();
    } catch {
      showDialog({
        title: 'Could not open school',
        message: 'Try switching school from the dashboard avatar.',
        variant: 'warning',
        icon: 'alert-circle',
      });
    }
  };

  const leaveSchool = (m: MembershipHit) => {
    Alert.alert(
      'Leave school?',
      `This removes you from ${m.school_name}.\n\nTo join again later you must submit a new request and wait for school approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave school',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setLeavingId(m.school_id);
              try {
                await leaveMyMembership(m.school_id);
                await refreshSchools({ quiet: true, forcePick: true });
                showDialog({
                  title: 'Left school',
                  message: `Removed from ${m.school_name}. Rejoining needs a new approval.`,
                  variant: 'success',
                  icon: 'checkmark-circle',
                });
                await reloadMemberships();
              } catch (e) {
                showDialog({
                  title: 'Could not leave',
                  message: e instanceof Error ? e.message : 'Try again',
                  variant: 'warning',
                  icon: 'alert-circle',
                });
              } finally {
                setLeavingId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const selectedClassLabel = useMemo(() => {
    const c = classes.find((x) => x.id === classId);
    if (!c) return '';
    return [c.name, c.stream].filter(Boolean).join(' · ');
  }, [classes, classId]);

  const canSubmit = (() => {
    if (!school || !role) return false;
    if (role === 'parent') return students.length > 0;
    if (role === 'student') return true;
    if (role === 'staff') return staffRoles.length > 0;
    if (role === 'teacher') {
      if (asClassTeacher && !classId) return false;
      return asTeacher || asClassTeacher;
    }
    return false;
  })();

  const submit = async () => {
    if (!school || !role || !canSubmit) return;
    const alreadyPendingForSchool = pendingRequests.some(
      (r) =>
        r.school_id === school.id &&
        String(r.role_slug || '').toLowerCase() === role &&
        String(r.status || '').toLowerCase() === 'pending',
    );
    if (alreadyPendingForSchool) {
      showDialog({
        title: 'Already pending',
        message: `You already have a pending ${role} request for ${school.name}. Wait for school approval instead of sending again.`,
        variant: 'warning',
        icon: 'time-outline',
      });
      return;
    }
    setSubmitting(true);
    try {
      const teacherRoles: string[] = [];
      if (role === 'teacher') {
        if (asTeacher) teacherRoles.push('teacher');
        if (asClassTeacher) teacherRoles.push('class_teacher');
      }
      const mappedWorkloads = workloads
        .filter((w) => w.subject_id)
        .map((w) => ({
          subject_id: w.subject_id,
          class_id: w.class_id || undefined,
          lessons_per_week: Math.max(1, Math.min(40, Number(w.lessons_per_week) || 1)),
        }));

      if (role === 'parent') {
        let already = 0;
        let created = 0;
        for (const student of students) {
          const res = await createJoinRequest({
            school_id: school.id,
            role_slug: 'parent',
            note: note.trim() || undefined,
            target_student_id: student.id,
            relationship,
          });
          if (res.already_pending) already += 1;
          else created += 1;
        }
        await markJoinPromptSeen();
        setStep('done');
        showDialog({
          title: already && !created ? 'Already pending' : 'Requests submitted',
          message:
            students.length > 1
              ? `${created} new · ${already} already pending. Waiting for school approval.`
              : 'Waiting for school admin approval.',
          variant: 'success',
          icon: 'checkmark-circle',
        });
      } else {
        const res = await createJoinRequest({
          school_id: school.id,
          role_slug: role,
          note: note.trim() || undefined,
          ...(role === 'student' && classOrCourse.trim()
            ? { class_or_course: classOrCourse.trim() }
            : {}),
          ...(role === 'student' && classId
            ? { target_class_id: classId }
            : role === 'teacher' && asClassTeacher && classId
              ? { target_class_id: classId }
              : {}),
          ...(role === 'staff'
            ? { staff_role_slugs: staffRoles, staff_role_slug: staffRoles[0] }
            : {}),
          ...(role === 'teacher'
            ? {
                teacher_roles: teacherRoles.length ? teacherRoles : ['teacher'],
                is_class_teacher: asClassTeacher,
                workloads: mappedWorkloads,
                lessons_per_week: mappedWorkloads.reduce((s, w) => s + w.lessons_per_week, 0),
              }
            : {}),
        });
        await markJoinPromptSeen();
        setStep('done');
        showDialog({
          title: res.already_pending
            ? 'Already pending'
            : (res as { auto_approved?: boolean }).auto_approved
              ? 'You are in'
              : 'Request submitted',
          message: (res as { auto_approved?: boolean }).auto_approved
            ? 'Open the dashboard for this school.'
            : 'Waiting for school admin approval.',
          variant: 'success',
          icon: 'checkmark-circle',
        });
      }
      void reloadMemberships();
    } catch (e) {
      showDialog({
        title: 'Could not submit',
        message: e instanceof Error ? e.message : 'Try again',
        variant: 'warning',
        icon: 'alert-circle',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const skipFirstLogin = async () => {
    await markJoinPromptSeen();
    navigation.goBack();
  };

  const pendingBox =
    step === 'role' ? (
      <View style={styles.joinedBox}>
        <Text style={styles.joinedTitle}>Your requests</Text>
        <Text style={styles.joinedHint}>
          Pending requests are waiting for school approval. You cannot send another request for the same school while
          pending.
        </Text>
        {loadingPending ? <ActivityIndicator color={hero} /> : null}
        {!loadingPending && pendingRequests.length === 0 ? (
          <Text style={styles.hint}>No join requests yet.</Text>
        ) : null}
        {pendingRequests.map((r) => {
          const rejected = String(r.status || '').toLowerCase() === 'rejected';
          return (
            <View key={r.id} style={styles.joinedCard}>
              <View style={styles.joinedMain}>
                <LogoAvatar
                  name={r.school_name || 'School'}
                  fallbackIcon={rejected ? 'close-circle' : 'time'}
                  tint={rejected ? '#B91C1C' : hero}
                />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {r.school_name || 'School'}
                  </Text>
                  <View style={styles.tagRow}>
                    <View style={[styles.tag, { backgroundColor: `${hero}14` }]}>
                      <Text style={[styles.tagText, { color: hero }]}>
                        {(r.role_slug || 'member').replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View
                      style={[styles.tag, { backgroundColor: rejected ? '#FEE2E2' : '#FEF3C7' }]}>
                      <Text style={[styles.tagText, { color: rejected ? '#B91C1C' : '#B45309' }]}>
                        {rejected ? 'not approved' : 'pending'}
                      </Text>
                    </View>
                  </View>
                  {rejected ? (
                    <Text style={styles.rejectedNote}>
                      Your request was not approved by {r.school_name || 'the school'}. Talk to the school office, then
                      send a new request.
                    </Text>
                  ) : null}
                  {r.created_at ? (
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      Sent {new Date(r.created_at).toLocaleString()}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    ) : null;

  const alreadyJoined =
    step === 'role' ? (
      <View style={styles.joinedBox}>
        <Text style={styles.joinedTitle}>Already joined</Text>
        <Text style={styles.joinedHint}>
          Tap a school to open it. Leave removes you — rejoining needs a new approval.
        </Text>
        {loadingMemberships ? <ActivityIndicator color={hero} /> : null}
        {!loadingMemberships && memberships.length === 0 ? (
          <Text style={styles.hint}>No approved school links yet.</Text>
        ) : null}
        {memberships.map((m) => (
          <View key={m.school_id} style={styles.joinedCard}>
            <Pressable
              style={styles.joinedMain}
              onPress={() => void openMembership(m)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${m.school_name}`}>
              <LogoAvatar uri={m.logo_url} name={m.school_name} fallbackIcon="business" tint={hero} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {m.school_name}
                </Text>
                <View style={styles.tagRow}>
                  {(m.roles.length ? m.roles : ['member']).map((r) => (
                    <View key={r} style={[styles.tag, { backgroundColor: `${hero}14` }]}>
                      <Text style={[styles.tagText, { color: hero }]}>{r.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
                {m.detail ? (
                  <Text style={styles.cardMeta} numberOfLines={2}>
                    {m.detail}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
            </Pressable>
            <Pressable
              style={styles.leaveBtn}
              disabled={leavingId === m.school_id}
              onPress={() => leaveSchool(m)}>
              {leavingId === m.school_id ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <Text style={styles.leaveText}>Leave</Text>
              )}
            </Pressable>
          </View>
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: floatingHeaderInset(insets.top), paddingBottom: bottomPad },
        ]}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            if (step === 'details') setStep('school');
            else if (step === 'school') setStep('role');
            else navigation.goBack();
          }}
          style={styles.backRow}
          accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={hero} />
          <Text style={[styles.backText, { color: hero }]}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Join school</Text>
        <Text style={styles.moduleDesc}>
          {firstLogin
            ? preferRole === 'teacher'
              ? 'Add at least one subject / class workload for your school. You can skip and finish later — we will remind you on login.'
              : preferRole === 'parent'
                ? 'Select your student at the school. You can skip and finish later — we will remind you on login.'
                : 'Join a school now, or skip and fill this later after login.'
            : 'Request to join a school. An admin must approve before you’re linked.'}
        </Text>

        {(firstLogin || preferRole) && step === 'role' ? (
          <View style={[styles.promptBox, { borderColor: `${hero}33`, backgroundColor: `${hero}0A` }]}>
            <Text style={styles.promptTitle}>School details</Text>
            <Text style={styles.hint}>
              Teachers add workload · Parents link a student · Students need nothing extra. You can skip for now.
            </Text>
            <Pressable style={[styles.skipBtn, { borderColor: `${hero}55` }]} onPress={() => void skipFirstLogin()}>
              <Text style={[styles.skipText, { color: hero }]}>Skip for now</Text>
            </Pressable>
          </View>
        ) : null}

        {preferRole && step !== 'role' ? (
          <Pressable style={[styles.skipBtn, { borderColor: `${hero}55`, marginBottom: 12 }]} onPress={() => void skipFirstLogin()}>
            <Text style={[styles.skipText, { color: hero }]}>Skip for now — fill later</Text>
          </Pressable>
        ) : null}

        {step === 'role' ? (
          <View style={styles.stack}>
            {ROLE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => pickRole(opt.id)}>
                <View style={[styles.iconBox, { backgroundColor: `${hero}14` }]}>
                  <Ionicons name={opt.icon} size={22} color={hero} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{opt.title}</Text>
                  <Text style={styles.cardMeta}>{opt.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
              </Pressable>
            ))}
            {pendingBox}
            {alreadyJoined}
          </View>
        ) : null}

        {step === 'school' && role ? (
          <View style={styles.stack}>
            <Text style={[styles.chip, { backgroundColor: `${hero}14`, color: hero }]}>
              {ROLE_OPTIONS.find((r) => r.id === role)?.title}
            </Text>
            <TextInput
              style={styles.input}
              value={schoolQuery}
              onChangeText={setSchoolQuery}
              placeholder="Type school name, code, place…"
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Schools only — updates as you type.</Text>
            {searchingSchools ? <ActivityIndicator color={hero} /> : null}
            {schoolHits.map((s) => {
              const line = [
                s.description,
                s.location || s.county,
                s.principal_name ? `Principal: ${s.principal_name}` : null,
                s.code,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <Pressable
                  key={s.id}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  onPress={() => void pickSchool(s)}>
                  <LogoAvatar uri={s.logo_url} name={s.name} fallbackIcon="business" tint={hero} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {line || 'School'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 'details' && school && role ? (
          <View style={styles.stack}>
            <View style={styles.card}>
              <LogoAvatar uri={school.logo_url} name={school.name} fallbackIcon="business" tint={hero} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{school.name}</Text>
                <Text style={styles.cardMeta}>as {role}</Text>
              </View>
              <Pressable onPress={() => setStep('school')}>
                <Text style={[styles.link, { color: hero }]}>Change</Text>
              </Pressable>
            </View>
            {loadingMeta ? <ActivityIndicator color={hero} /> : null}

            {role === 'parent' ? (
              <>
                <Text style={styles.label}>Students</Text>
                <View style={styles.tagRow}>
                  {students.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.tagRemovable, { backgroundColor: `${hero}1A` }]}
                      onPress={() => removeStudent(s.id)}>
                      <Text style={[styles.tagText, { color: hero }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Ionicons name="close" size={14} color={hero} />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={studentQuery}
                  onChangeText={setStudentQuery}
                  placeholder="Search another student…"
                  placeholderTextColor="#94a3b8"
                  autoCorrect={false}
                />
                {searchingStudents ? <ActivityIndicator color={hero} /> : null}
                {studentHits.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() => addStudent(s)}>
                    <LogoAvatar uri={s.photo_url} name={s.name} tint={hero} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{s.name}</Text>
                      <Text style={styles.cardMeta}>
                        {[s.admission_number || s.admission_masked, s.class_name]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <Text style={styles.label}>Relationship</Text>
                <View style={styles.chipRow}>
                  {['guardian', 'mother', 'father', 'other'].map((r) => (
                    <Pressable
                      key={r}
                      style={[
                        styles.pill,
                        { backgroundColor: `${hero}10` },
                        relationship === r && { backgroundColor: hero },
                      ]}
                      onPress={() => setRelationship(r)}>
                      <Text
                        style={[
                          styles.pillText,
                          { color: hero },
                          relationship === r && styles.pillTextOn,
                        ]}>
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {role === 'student' ? (
              <>
                <Text style={styles.label}>Class / course (optional)</Text>
                <Text style={styles.hint}>
                  e.g. Computer Science 2022 — skip and set later in Desk.
                </Text>
                <TextInput
                  style={styles.input}
                  value={classOrCourse}
                  onChangeText={setClassOrCourse}
                  placeholder="Computer Science 2022"
                  placeholderTextColor={Colors.mutedForeground}
                  autoCorrect={false}
                />
              </>
            ) : null}

            {role === 'staff' ? (
              <>
                <Text style={styles.label}>Staff roles</Text>
                <View style={styles.tagRow}>
                  {staffRoles.map((slug) => {
                    const label = STAFF_ROLES.find((r) => r.id === slug)?.label || slug;
                    return (
                      <Pressable
                        key={slug}
                        style={[styles.tagRemovable, { backgroundColor: `${hero}1A` }]}
                        onPress={() => setStaffRoles((prev) => prev.filter((x) => x !== slug))}>
                        <Text style={[styles.tagText, { color: hero }]}>{label}</Text>
                        <Ionicons name="close" size={14} color={hero} />
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable style={styles.card} onPress={() => setShowStaffPicker((v) => !v)}>
                  <Text style={styles.cardTitle}>
                    {showStaffPicker ? 'Hide roles' : 'Add a staff role…'}
                  </Text>
                  <Ionicons
                    name={showStaffPicker ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.mutedForeground}
                  />
                </Pressable>
                {showStaffPicker
                  ? STAFF_ROLES.filter((r) => !staffRoles.includes(r.id)).map((r) => (
                      <Pressable
                        key={r.id}
                        style={styles.card}
                        onPress={() => {
                          setStaffRoles((prev) => [...prev, r.id]);
                          setShowStaffPicker(false);
                        }}>
                        <Text style={styles.cardTitle}>{r.label}</Text>
                      </Pressable>
                    ))
                  : null}
              </>
            ) : null}

            {role === 'teacher' ? (
              <>
                <Text style={styles.label}>Roles</Text>
                <Pressable style={styles.checkRow} onPress={() => setAsTeacher((v) => !v)}>
                  <Ionicons name={asTeacher ? 'checkbox' : 'square-outline'} size={22} color={hero} />
                  <Text style={styles.checkLabel}>Teacher</Text>
                </Pressable>
                <Pressable
                  style={styles.checkRow}
                  onPress={() => {
                    setAsClassTeacher((v) => !v);
                    setShowClassPicker(false);
                  }}>
                  <Ionicons
                    name={asClassTeacher ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={hero}
                  />
                  <Text style={styles.checkLabel}>Class teacher</Text>
                </Pressable>
                {asClassTeacher ? (
                  <>
                    <Text style={styles.label}>Class (class teacher)</Text>
                    {classId ? (
                      <View style={styles.tagRow}>
                        <Pressable
                          style={[styles.tagRemovable, { backgroundColor: `${hero}1A` }]}
                          onPress={() => {
                            setClassId('');
                            setShowClassPicker(true);
                          }}>
                          <Text style={[styles.tagText, { color: hero }]}>{selectedClassLabel}</Text>
                          <Ionicons name="close" size={14} color={hero} />
                        </Pressable>
                      </View>
                    ) : null}
                    <Pressable style={styles.card} onPress={() => setShowClassPicker((v) => !v)}>
                      <Text style={styles.cardTitle}>
                        {showClassPicker
                          ? 'Hide classes'
                          : classId
                            ? 'Change class…'
                            : 'Select a class…'}
                      </Text>
                      <Ionicons
                        name={showClassPicker ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.mutedForeground}
                      />
                    </Pressable>
                    {showClassPicker
                      ? classes.map((c) => (
                          <Pressable
                            key={c.id}
                            style={styles.card}
                            onPress={() => {
                              setClassId(c.id);
                              setShowClassPicker(false);
                            }}>
                            <Text style={styles.cardTitle}>
                              {[c.name, c.stream].filter(Boolean).join(' · ')}
                            </Text>
                          </Pressable>
                        ))
                      : null}
                  </>
                ) : null}
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Workload</Text>
                  <Pressable
                    onPress={() =>
                      setWorkloads((prev) => [
                        ...prev,
                        {
                          key: `${Date.now()}`,
                          subject_id: '',
                          class_id: '',
                          lessons_per_week: '1',
                          showSubjectPicker: true,
                          showClassPicker: false,
                        },
                      ])
                    }>
                    <Text style={[styles.link, { color: hero }]}>+ Add subject</Text>
                  </Pressable>
                </View>
                {workloads.map((w, idx) => {
                  const subjectName =
                    subjects.find((s) => s.id === w.subject_id)?.name || 'Subject';
                  const className = classes.find((c) => c.id === w.class_id);
                  const classLabel = className
                    ? [className.name, className.stream].filter(Boolean).join(' · ')
                    : '';
                  return (
                    <View key={w.key} style={styles.workloadBox}>
                      <Text style={styles.hint}>Subject</Text>
                      {w.subject_id ? (
                        <View style={styles.tagRow}>
                          <Pressable
                            style={[styles.tagRemovable, { backgroundColor: `${hero}1A` }]}
                            onPress={() =>
                              setWorkloads((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? { ...row, subject_id: '', showSubjectPicker: true }
                                    : row,
                                ),
                              )
                            }>
                            <Text style={[styles.tagText, { color: hero }]}>{subjectName}</Text>
                            <Ionicons name="close" size={14} color={hero} />
                          </Pressable>
                        </View>
                      ) : null}
                      <Pressable
                        style={styles.card}
                        onPress={() =>
                          setWorkloads((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, showSubjectPicker: !row.showSubjectPicker }
                                : { ...row, showSubjectPicker: false },
                            ),
                          )
                        }>
                        <Text style={styles.cardTitle}>
                          {w.showSubjectPicker
                            ? 'Hide subjects'
                            : w.subject_id
                              ? 'Change subject…'
                              : 'Select subject…'}
                        </Text>
                        <Ionicons
                          name={w.showSubjectPicker ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={Colors.mutedForeground}
                        />
                      </Pressable>
                      {w.showSubjectPicker
                        ? subjects.map((s) => (
                            <Pressable
                              key={s.id}
                              style={styles.card}
                              onPress={() =>
                                setWorkloads((prev) =>
                                  prev.map((row, i) =>
                                    i === idx
                                      ? {
                                          ...row,
                                          subject_id: s.id,
                                          showSubjectPicker: false,
                                        }
                                      : row,
                                  ),
                                )
                              }>
                              <Text style={styles.cardTitle}>{s.name}</Text>
                            </Pressable>
                          ))
                        : null}

                      <Text style={styles.hint}>Class (optional)</Text>
                      {w.class_id ? (
                        <View style={styles.tagRow}>
                          <Pressable
                            style={[styles.tagRemovable, { backgroundColor: `${hero}1A` }]}
                            onPress={() =>
                              setWorkloads((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? { ...row, class_id: '', showClassPicker: true }
                                    : row,
                                ),
                              )
                            }>
                            <Text style={[styles.tagText, { color: hero }]}>{classLabel}</Text>
                            <Ionicons name="close" size={14} color={hero} />
                          </Pressable>
                        </View>
                      ) : null}
                      <Pressable
                        style={styles.card}
                        onPress={() =>
                          setWorkloads((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? { ...row, showClassPicker: !row.showClassPicker }
                                : { ...row, showClassPicker: false },
                            ),
                          )
                        }>
                        <Text style={styles.cardTitle}>
                          {w.showClassPicker
                            ? 'Hide classes'
                            : w.class_id
                              ? 'Change class…'
                              : 'Select class…'}
                        </Text>
                        <Ionicons
                          name={w.showClassPicker ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={Colors.mutedForeground}
                        />
                      </Pressable>
                      {w.showClassPicker
                        ? classes.map((c) => (
                            <Pressable
                              key={c.id}
                              style={styles.card}
                              onPress={() =>
                                setWorkloads((prev) =>
                                  prev.map((row, i) =>
                                    i === idx
                                      ? {
                                          ...row,
                                          class_id: c.id,
                                          showClassPicker: false,
                                        }
                                      : row,
                                  ),
                                )
                              }>
                              <Text style={styles.cardTitle}>
                                {[c.name, c.stream].filter(Boolean).join(' · ')}
                              </Text>
                            </Pressable>
                          ))
                        : null}

                      <Text style={styles.hint}>Lessons / week</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={w.lessons_per_week}
                        onChangeText={(t) =>
                          setWorkloads((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, lessons_per_week: t } : row,
                            ),
                          )
                        }
                      />
                      <Pressable
                        onPress={() => setWorkloads((prev) => prev.filter((_, i) => i !== idx))}>
                        <Text style={styles.danger}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </>
            ) : null}

            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Note for school admin…"
              placeholderTextColor="#94a3b8"
            />

            <Pressable
              style={[
                styles.submit,
                { backgroundColor: hero },
                (!canSubmit || submitting) && styles.submitDisabled,
              ]}
              disabled={!canSubmit || submitting}
              onPress={() => void submit()}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {role === 'parent' && students.length > 1
                    ? `Submit ${students.length} join requests`
                    : 'Submit join request'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {step === 'done' ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={48} color={palette.tertiary} />
            <Text style={styles.doneTitle}>Request pending</Text>
            <Text style={styles.subtitle}>
              {school?.name
                ? `Your ${role} request for ${school.name} is waiting for approval.`
                : 'Waiting for school approval.'}
            </Text>
            <Pressable
              style={[styles.submit, { backgroundColor: hero }]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.submitText}>Done</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ink },
  moduleDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.mutedForeground,
    marginBottom: 14,
  },
  subtitle: { marginTop: 6, fontSize: 14, color: Colors.mutedForeground, marginBottom: 16 },
  promptBox: {
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  promptTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  skipBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  skipText: { fontSize: 13, fontWeight: '700' },
  stack: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.12)',
    backgroundColor: '#fff',
  },
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e2e8f0' },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 12, fontWeight: '800' },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  rejectedNote: { marginTop: 4, fontSize: 12, lineHeight: 17, color: '#B91C1C' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.ink,
    backgroundColor: '#fff',
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  label: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginTop: 6 },
  hint: { fontSize: 12, color: Colors.mutedForeground },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '100%',
  },
  tagText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', maxWidth: 220 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  pillTextOn: { color: '#fff' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  link: { fontSize: 13, fontWeight: '700' },
  workloadBox: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.12)',
  },
  danger: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  submit: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  doneBox: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: Colors.ink },
  joinedBox: {
    marginTop: 8,
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.12)',
    backgroundColor: 'rgba(21,65,29,0.03)',
  },
  joinedTitle: { fontSize: 14, fontWeight: '800', color: Colors.ink },
  joinedHint: { fontSize: 12, color: Colors.mutedForeground, marginBottom: 4 },
  joinedCard: {
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10,61,46,0.1)',
  },
  joinedMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leaveBtn: {
    alignSelf: 'flex-start',
    marginLeft: 50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220,38,38,0.35)',
  },
  leaveText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
});
