/**
 * Join School — parent / student / teacher / staff onboarding wizard.
 * Pending until school admin approves (Admin → Approve on Desk).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset, TAB_BAR_BODY_HEIGHT } from '../../constants/layout';
import { useDialog } from '../../context/DialogContext';
import {
  createJoinRequest,
  leaveMyMembership,
  listJoinClasses,
  listJoinSubjects,
  listMyMemberships,
  searchJoinSchools,
  searchJoinStudents,
  type JoinClassHit,
  type JoinSchoolHit,
  type JoinStudentHit,
  type JoinSubjectHit,
  type MembershipHit,
} from '../../lib/joinRequestApi';

type JoinRole = 'parent' | 'student' | 'teacher' | 'staff';
type Step = 'role' | 'school' | 'details' | 'done';

const HERO = '#15411D';

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
}: {
  uri?: string | null;
  name: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatarImg} />;
  }
  return (
    <View style={styles.avatarFallback}>
      {fallbackIcon ? (
        <Ionicons name={fallbackIcon} size={18} color={HERO} />
      ) : (
        <Text style={styles.avatarInitials}>{initials(name)}</Text>
      )}
    </View>
  );
}

export function JoinSchoolScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showDialog } = useDialog();
  const bottomPad = TAB_BAR_BODY_HEIGHT + insets.bottom + 24;

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<JoinRole | null>(null);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolHits, setSchoolHits] = useState<JoinSchoolHit[]>([]);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [school, setSchool] = useState<JoinSchoolHit | null>(null);

  const [studentQuery, setStudentQuery] = useState('');
  const [studentHits, setStudentHits] = useState<JoinStudentHit[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [student, setStudent] = useState<JoinStudentHit | null>(null);
  const [relationship, setRelationship] = useState('guardian');

  const [classes, setClasses] = useState<JoinClassHit[]>([]);
  const [subjects, setSubjects] = useState<JoinSubjectHit[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [classId, setClassId] = useState('');
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [asTeacher, setAsTeacher] = useState(true);
  const [asClassTeacher, setAsClassTeacher] = useState(false);
  const [workloads, setWorkloads] = useState<WorkloadLine[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memberships, setMemberships] = useState<MembershipHit[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const schoolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadMemberships = useCallback(async () => {
    setLoadingMemberships(true);
    try {
      const res = await listMyMemberships();
      setMemberships(Array.isArray(res.memberships) ? res.memberships : []);
    } catch {
      setMemberships([]);
    } finally {
      setLoadingMemberships(false);
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
          setStudentHits(res.students || []);
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
  }, [studentQuery, school, role]);

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
    setStudent(null);
    setStudentQuery('');
    setStudentHits([]);
    setClassId('');
    setStaffRoles([]);
    setShowStaffPicker(false);
    setWorkloads([]);
    setAsTeacher(true);
    setAsClassTeacher(false);
    if (role) await loadMeta(s.id, role);
    setStep('details');
  };

  const pickStudent = (s: JoinStudentHit) => {
    setStudent(s);
    setStudentHits([]);
    setStudentQuery(s.name);
  };

  const leaveSchool = (m: MembershipHit) => {
    Alert.alert('Leave school', `Leave ${m.school_name}? You can join again later.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLeavingId(m.school_id);
            try {
              await leaveMyMembership(m.school_id);
              showDialog({
                title: 'Left school',
                message: `Removed your link to ${m.school_name}.`,
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
    ]);
  };

  const canSubmit = (() => {
    if (!school || !role) return false;
    if (role === 'parent') return Boolean(student?.id);
    if (role === 'student') return Boolean(classId);
    if (role === 'staff') return staffRoles.length > 0;
    if (role === 'teacher') {
      if (asClassTeacher && !classId) return false;
      if (!workloads.some((w) => w.subject_id)) return false;
      return asTeacher || asClassTeacher;
    }
    return false;
  })();

  const submit = async () => {
    if (!school || !role || !canSubmit) return;
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
      const res = await createJoinRequest({
        school_id: school.id,
        role_slug: role,
        note: note.trim() || undefined,
        ...(role === 'parent' && student
          ? { target_student_id: student.id, relationship }
          : {}),
        ...(role === 'student' || (role === 'teacher' && asClassTeacher)
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
      setStep('done');
      showDialog({
        title: res.already_pending ? 'Already pending' : 'Request submitted',
        message: 'Waiting for school admin approval.',
        variant: 'success',
        icon: 'checkmark-circle',
      });
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

  const alreadyJoined = (
    <View style={styles.joinedBox}>
      <Text style={styles.joinedTitle}>Already joined</Text>
      <Text style={styles.joinedHint}>
        Schools on this account. Leave anytime, or join another below.
      </Text>
      {loadingMemberships ? <ActivityIndicator color={HERO} /> : null}
      {!loadingMemberships && memberships.length === 0 ? (
        <Text style={styles.hint}>No approved school links yet.</Text>
      ) : null}
      {memberships.map((m) => (
        <View key={m.school_id} style={styles.joinedCard}>
          <LogoAvatar uri={m.logo_url} name={m.school_name} fallbackIcon="business" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {m.school_name}
            </Text>
            <View style={styles.tagRow}>
              {(m.roles.length ? m.roles : ['member']).map((r) => (
                <View key={r} style={styles.tag}>
                  <Text style={styles.tagText}>{r.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
            {m.detail ? (
              <Text style={styles.cardMeta} numberOfLines={2}>
                {m.detail}
              </Text>
            ) : null}
          </View>
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
  );

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
          <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Join school</Text>
        <Text style={styles.subtitle}>
          Request to join a school. An admin must approve before you’re linked.
        </Text>

        {step === 'role' ? (
          <View style={styles.stack}>
            {ROLE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => pickRole(opt.id)}>
                <View style={styles.iconBox}>
                  <Ionicons name={opt.icon} size={22} color={HERO} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{opt.title}</Text>
                  <Text style={styles.cardMeta}>{opt.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
              </Pressable>
            ))}
            {alreadyJoined}
          </View>
        ) : null}

        {step === 'school' && role ? (
          <View style={styles.stack}>
            <Text style={styles.chip}>{ROLE_OPTIONS.find((r) => r.id === role)?.title}</Text>
            {alreadyJoined}
            <TextInput
              style={styles.input}
              value={schoolQuery}
              onChangeText={setSchoolQuery}
              placeholder="Type school name, code, place…"
              placeholderTextColor="#94a3b8"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Schools only — updates as you type.</Text>
            {searchingSchools ? <ActivityIndicator color={HERO} /> : null}
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
                  <LogoAvatar uri={s.logo_url} name={s.name} fallbackIcon="business" />
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
              <LogoAvatar uri={school.logo_url} name={school.name} fallbackIcon="business" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{school.name}</Text>
                <Text style={styles.cardMeta}>as {role}</Text>
              </View>
              <Pressable onPress={() => setStep('school')}>
                <Text style={styles.link}>Change</Text>
              </Pressable>
            </View>
            {loadingMeta ? <ActivityIndicator color={HERO} /> : null}

            {role === 'parent' ? (
              <>
                <TextInput
                  style={styles.input}
                  value={studentQuery}
                  onChangeText={(t) => {
                    setStudentQuery(t);
                    if (student) setStudent(null);
                  }}
                  placeholder="Student name or admission…"
                  placeholderTextColor="#94a3b8"
                  autoCorrect={false}
                />
                {student ? (
                  <View style={[styles.card, styles.cardSelected]}>
                    <LogoAvatar uri={student.photo_url} name={student.name} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{student.name}</Text>
                      <Text style={styles.cardMeta}>
                        {[student.admission_number || student.admission_masked, student.class_name]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={HERO} />
                    <Pressable
                      onPress={() => {
                        setStudent(null);
                        setStudentQuery('');
                      }}>
                      <Text style={styles.link}>Clear</Text>
                    </Pressable>
                  </View>
                ) : null}
                {searchingStudents ? <ActivityIndicator color={HERO} /> : null}
                {!student
                  ? studentHits.map((s) => (
                      <Pressable
                        key={s.id}
                        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                        onPress={() => pickStudent(s)}>
                        <LogoAvatar uri={s.photo_url} name={s.name} />
                        <View style={styles.cardText}>
                          <Text style={styles.cardTitle}>{s.name}</Text>
                          <Text style={styles.cardMeta}>
                            {[s.admission_number || s.admission_masked, s.class_name]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  : null}
                <Text style={styles.label}>Relationship</Text>
                <View style={styles.chipRow}>
                  {['guardian', 'mother', 'father', 'other'].map((r) => (
                    <Pressable
                      key={r}
                      style={[styles.pill, relationship === r && styles.pillOn]}
                      onPress={() => setRelationship(r)}>
                      <Text style={[styles.pillText, relationship === r && styles.pillTextOn]}>
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {role === 'student' ? (
              <>
                <Text style={styles.label}>Class</Text>
                {classes.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.card, classId === c.id && styles.cardSelected]}
                    onPress={() => setClassId(c.id)}>
                    <Text style={styles.cardTitle}>
                      {[c.name, c.stream].filter(Boolean).join(' · ')}
                    </Text>
                  </Pressable>
                ))}
                {!classes.length && !loadingMeta ? (
                  <Text style={styles.hint}>No classes found for this school.</Text>
                ) : null}
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
                        style={styles.tagRemovable}
                        onPress={() => setStaffRoles((prev) => prev.filter((x) => x !== slug))}>
                        <Text style={styles.tagText}>{label}</Text>
                        <Ionicons name="close" size={14} color={HERO} />
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={styles.card}
                  onPress={() => setShowStaffPicker((v) => !v)}>
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
                  <Ionicons
                    name={asTeacher ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={HERO}
                  />
                  <Text style={styles.checkLabel}>Teacher</Text>
                </Pressable>
                <Pressable
                  style={styles.checkRow}
                  onPress={() => setAsClassTeacher((v) => !v)}>
                  <Ionicons
                    name={asClassTeacher ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={HERO}
                  />
                  <Text style={styles.checkLabel}>Class teacher</Text>
                </Pressable>
                {asClassTeacher ? (
                  <>
                    <Text style={styles.label}>Class (class teacher)</Text>
                    {classes.map((c) => (
                      <Pressable
                        key={c.id}
                        style={[styles.card, classId === c.id && styles.cardSelected]}
                        onPress={() => setClassId(c.id)}>
                        <Text style={styles.cardTitle}>
                          {[c.name, c.stream].filter(Boolean).join(' · ')}
                        </Text>
                      </Pressable>
                    ))}
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
                        },
                      ])
                    }>
                    <Text style={styles.link}>+ Add subject</Text>
                  </Pressable>
                </View>
                {workloads.map((w, idx) => (
                  <View key={w.key} style={styles.workloadBox}>
                    <Text style={styles.hint}>Subject</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.chipRow}>
                        {subjects.map((s) => (
                          <Pressable
                            key={s.id}
                            style={[styles.pill, w.subject_id === s.id && styles.pillOn]}
                            onPress={() =>
                              setWorkloads((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, subject_id: s.id } : row,
                                ),
                              )
                            }>
                            <Text
                              style={[
                                styles.pillText,
                                w.subject_id === s.id && styles.pillTextOn,
                              ]}>
                              {s.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
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
                      onPress={() =>
                        setWorkloads((prev) => prev.filter((_, i) => i !== idx))
                      }>
                      <Text style={styles.danger}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
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
              style={[styles.submit, (!canSubmit || submitting) && styles.submitDisabled]}
              disabled={!canSubmit || submitting}
              onPress={() => void submit()}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit join request</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {step === 'done' ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
            <Text style={styles.doneTitle}>Request pending</Text>
            <Text style={styles.subtitle}>
              {school?.name
                ? `Your ${role} request for ${school.name} is waiting for approval.`
                : 'Waiting for school approval.'}
            </Text>
            <Pressable style={styles.submit} onPress={() => navigation.goBack()}>
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
  backText: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ink },
  subtitle: { marginTop: 6, fontSize: 14, color: Colors.mutedForeground, marginBottom: 16 },
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
  cardSelected: { borderColor: HERO, backgroundColor: 'rgba(21,65,29,0.06)' },
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,65,29,0.08)',
  },
  avatarImg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e2e8f0' },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,65,29,0.08)',
  },
  avatarInitials: { fontSize: 12, fontWeight: '800', color: HERO },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
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
    backgroundColor: 'rgba(21,65,29,0.08)',
    color: HERO,
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
    backgroundColor: 'rgba(21,65,29,0.08)',
  },
  tagRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(21,65,29,0.1)',
  },
  tagText: { fontSize: 11, fontWeight: '700', color: HERO, textTransform: 'capitalize' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10,61,46,0.06)',
  },
  pillOn: { backgroundColor: HERO },
  pillText: { fontSize: 12, fontWeight: '700', color: HERO, textTransform: 'capitalize' },
  pillTextOn: { color: '#fff' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  link: { fontSize: 13, fontWeight: '700', color: HERO },
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
    backgroundColor: HERO,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10,61,46,0.1)',
  },
  leaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220,38,38,0.35)',
  },
  leaveText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
});
