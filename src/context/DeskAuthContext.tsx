/**
 * Desk auth + multi-school / student context.
 * Parents select a student (school follows). Teachers/admins fall back to school.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { Session } from '@supabase/supabase-js';
import {
  adoptSupabaseTokenAsDeskSession,
  clearDeskSession,
  deskFetchMe,
  deskLogin,
  DeskLoginResult,
  DeskUser,
  getCachedDeskUser,
  getDeskApiDebugInfo,
  getDeskToken,
  hasNestDeskToken,
  ensureNestDeskSession,
  onDeskSessionCleared,
  saveDeskCredentials,
  setDeskActiveContext,
  awaitDeskLoginInFlight,
} from '../lib/deskApi';
import {
  DeskPersona,
  deskRoleLabel,
  isParentDeskRole,
  normalizeDeskRoles,
  personaLabel,
  resolveDeskPersona,
  sortDeskRolesForPicker,
} from '../lib/deskRoles';
import { fetchUserSchools, flattenLinkedStudents, LinkedStudent, UserSchool } from '../lib/orgRoles';
import { fetchParentChildren } from '../lib/parentPortalApi';
import {
  clearSelectedContext,
  getSelectedContext,
  setSelectedContext,
  StoredContext,
} from '../lib/selectedContext';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

type DeskAuthContextType = {
  deskUser: DeskUser | null;
  deskToken: string | null;
  persona: DeskPersona;
  personaLabel: string;
  deskReady: boolean;
  schoolsReady: boolean;
  isDeskAuthenticated: boolean;
  deskApiUrl: string;
  schools: UserSchool[];
  linkedStudents: LinkedStudent[];
  selectedSchoolId: string | null;
  selectedSchool: UserSchool | null;
  selectedStudentId: string | null;
  selectedStudent: LinkedStudent | null;
  /** Active role hat at the selected school (when user has 2+ roles). */
  selectedRole: string | null;
  /** True when user must pick school, role, or student. */
  needsSchoolPick: boolean;
  /**
   * Picker UI mode. Flow: school → role → student (parent, multi-child).
   */
  pickerMode: 'student' | 'school' | 'role';
  /** Roles available at the selected school (for role picker). */
  schoolRoleOptions: string[];
  selectStudent: (student: LinkedStudent) => Promise<void>;
  selectSchool: (schoolId: string) => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  /** Step back within picker (role → school, student → role). */
  backInPicker: () => Promise<void>;
  /** Clear selection and show picker again. */
  requestSchoolChange: () => Promise<void>;
  connectDesk: (email: string, password: string) => Promise<DeskLoginResult>;
  refreshDeskUser: () => Promise<void>;
  clearDesk: () => Promise<void>;
};

const DeskAuthContext = createContext<DeskAuthContextType>({
  deskUser: null,
  deskToken: null,
  persona: 'individual',
  personaLabel: 'Individual',
  deskReady: false,
  schoolsReady: false,
  isDeskAuthenticated: false,
  deskApiUrl: '',
  schools: [],
  linkedStudents: [],
  selectedSchoolId: null,
  selectedSchool: null,
  selectedStudentId: null,
  selectedStudent: null,
  selectedRole: null,
  needsSchoolPick: false,
  pickerMode: 'student',
  schoolRoleOptions: [],
  selectStudent: async () => {},
  selectSchool: async () => {},
  selectRole: async () => {},
  backInPicker: async () => {},
  requestSchoolChange: async () => {},
  connectDesk: async () => {
    throw new Error('DeskAuth not ready');
  },
  refreshDeskUser: async () => {},
  clearDesk: async () => {},
});

/** Staff roles that use school context (not student picker). */
const STAFF_SCHOOL_PICK_ROLES = new Set([
  'teacher',
  'school_admin',
  'finance_officer',
  'staff',
  'user',
  'bom',
  'board_member',
  'board',
  'bom_member',
  'admin',
  'principal',
  'accountant',
  'bursar',
  'super_admin',
  'superadmin',
]);

/** Teachers/admins with membership at 2+ schools → Select school (not student). */
function prefersSchoolPicker(schools: UserSchool[]): boolean {
  if (schools.length < 2) return false;
  return schools.some((s) =>
    normalizeDeskRoles(s.roles).some((r) => STAFF_SCHOOL_PICK_ROLES.has(r)),
  );
}

function deskUserFromSession(
  session: Session,
  roles: string[],
  schoolId: string | null,
): DeskUser {
  const meta = session.user.user_metadata ?? {};
  const fullName = String(meta.full_name ?? session.user.email ?? '');
  const [first, ...rest] = fullName.split(' ').filter(Boolean);
  return {
    id: session.user.id,
    user_id: session.user.id,
    email: session.user.email ?? undefined,
    first_name: first,
    last_name: rest.join(' ') || undefined,
    username: fullName || session.user.email,
    school_id: schoolId,
    user_roles: roles.length ? roles : undefined,
  };
}

function uniqueSchoolRoles(roles: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of normalizeDeskRoles(roles)) {
    if (!seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return sortDeskRolesForPicker(out);
}

function linkedStudentsAtSchool(linked: LinkedStudent[], schoolId: string): LinkedStudent[] {
  return linked.filter((s) => s.schoolId === schoolId);
}

function resolveContext(
  schools: UserSchool[],
  linked: LinkedStudent[],
  stored: StoredContext | null,
  opts?: { forcePick?: boolean },
): {
  schoolId: string | null;
  studentId: string | null;
  activeRole: string | null;
  needsPick: boolean;
  pickerMode: 'student' | 'school' | 'role';
  schoolRoleOptions: string[];
} {
  const empty = {
    schoolId: null as string | null,
    studentId: null as string | null,
    activeRole: null as string | null,
    needsPick: false,
    pickerMode: 'school' as const,
    schoolRoleOptions: [] as string[],
  };

  if (!schools.length) {
    return {
      ...empty,
      needsPick: true,
      pickerMode: 'school',
    };
  }

  // ── Step 1: resolve school ──
  let schoolId: string | null = null;

  if (prefersSchoolPicker(schools)) {
    if (opts?.forcePick) {
      return { ...empty, needsPick: true, pickerMode: 'school' };
    }
    if (stored?.schoolId && schools.some((s) => s.id === stored.schoolId)) {
      schoolId = stored.schoolId;
    } else {
      return { ...empty, needsPick: true, pickerMode: 'school' };
    }
  } else if (schools.length === 1) {
    schoolId = schools[0].id;
  } else if (opts?.forcePick) {
    return { ...empty, needsPick: true, pickerMode: 'school' };
  } else if (stored?.schoolId && schools.some((s) => s.id === stored.schoolId)) {
    schoolId = stored.schoolId;
  } else {
    return { ...empty, needsPick: true, pickerMode: 'school' };
  }

  const school = schools.find((s) => s.id === schoolId)!;
  const schoolRoles = uniqueSchoolRoles(school.roles);
  const storedRole = stored?.activeRole ? String(stored.activeRole).toLowerCase().trim() : null;
  let activeRole = storedRole && schoolRoles.includes(storedRole) ? storedRole : null;

  // ── Step 2: resolve role at school ──
  if (schoolRoles.length > 1 && !activeRole) {
    return {
      schoolId,
      studentId: null,
      activeRole: null,
      needsPick: true,
      pickerMode: 'role',
      schoolRoleOptions: schoolRoles,
    };
  }
  if (schoolRoles.length === 1) activeRole = schoolRoles[0];

  // ── Step 3: parent → student (block dashboard until an approved child link) ──
  if (activeRole && isParentDeskRole(activeRole)) {
    const kids = linkedStudentsAtSchool(linked, schoolId);
    if (kids.length === 0) {
      // Linked to school but no approved students — stay on Select student + Add CTA.
      return {
        schoolId,
        studentId: null,
        activeRole,
        needsPick: true,
        pickerMode: 'student',
        schoolRoleOptions: schoolRoles,
      };
    }
    if (kids.length === 1) {
      return {
        schoolId,
        studentId: kids[0].id,
        activeRole,
        needsPick: false,
        pickerMode: 'student',
        schoolRoleOptions: schoolRoles,
      };
    }
    if (opts?.forcePick) {
      return {
        schoolId,
        studentId: null,
        activeRole,
        needsPick: true,
        pickerMode: 'student',
        schoolRoleOptions: schoolRoles,
      };
    }
    if (stored?.studentId) {
      const match = kids.find((s) => s.id === stored.studentId);
      if (match) {
        return {
          schoolId,
          studentId: match.id,
          activeRole,
          needsPick: false,
          pickerMode: 'student',
          schoolRoleOptions: schoolRoles,
        };
      }
    }
    return {
      schoolId,
      studentId: null,
      activeRole,
      needsPick: true,
      pickerMode: 'student',
      schoolRoleOptions: schoolRoles,
    };
  }

  return {
    schoolId,
    studentId: null,
    activeRole,
    needsPick: false,
    pickerMode: 'school',
    schoolRoleOptions: schoolRoles,
  };
}

export function DeskAuthProvider({ children }: { children: ReactNode }) {
  const [deskUser, setDeskUser] = useState<DeskUser | null>(null);
  const [deskToken, setDeskToken] = useState<string | null>(null);
  const [schools, setSchools] = useState<UserSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(null);
  const [selectedRole, setSelectedRoleState] = useState<string | null>(null);
  const [schoolRoleOptions, setSchoolRoleOptions] = useState<string[]>([]);
  /** Full row from picker (Nest-enriched name/class/photo) — linkedStudents alone often lacks photo. */
  const [studentSnapshot, setStudentSnapshot] = useState<LinkedStudent | null>(null);
  const [needsSchoolPick, setNeedsSchoolPick] = useState(false);
  const [pickerMode, setPickerMode] = useState<'student' | 'school' | 'role'>('student');
  const [deskReady, setDeskReady] = useState(false);
  const [schoolsReady, setSchoolsReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  /** Keep Nest password JWT — do not overwrite with Supabase soft-adopt (needed for /parents/me/*). */
  const preferNestDeskTokenRef = useRef(false);

  useEffect(() => {
    authUserIdRef.current = authUserId;
  }, [authUserId]);

  const linkedStudents = useMemo(() => flattenLinkedStudents(schools), [schools]);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId],
  );

  const selectedStudent = useMemo(() => {
    if (
      studentSnapshot &&
      studentSnapshot.id === selectedStudentId &&
      studentSnapshot.schoolId === selectedSchoolId
    ) {
      return studentSnapshot;
    }
    return (
      linkedStudents.find(
        (s) => s.id === selectedStudentId && s.schoolId === selectedSchoolId,
      ) ?? null
    );
  }, [linkedStudents, selectedStudentId, selectedSchoolId, studentSnapshot]);

  /** Push school + student + roles into deskFetch for every Nest call. */
  useEffect(() => {
    const fromUser = deskUser?.user_roles;
    const roles = selectedRole
      ? [selectedRole]
      : Array.isArray(fromUser)
        ? fromUser.map(String)
        : typeof fromUser === 'string' && fromUser
          ? [fromUser]
          : [];
    setDeskActiveContext({
      schoolId: selectedSchoolId ?? deskUser?.school_id ?? null,
      studentId: selectedStudentId,
      roles,
    });
  }, [selectedSchoolId, selectedStudentId, selectedRole, deskUser?.school_id, deskUser?.user_roles]);

  /** Enrich selected student name/class/photo from Nest (source of truth for ERP). */
  useEffect(() => {
    if (!deskToken || !selectedStudentId) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchParentChildren();
        if (cancelled) return;
        const kids = data?.children ?? [];
        const hit = kids.find((c) => c.student_id === selectedStudentId);
        if (!hit) return;
        const photo = hit.avatar_url || hit.photo_url || null;
        setStudentSnapshot((prev) => {
          const base =
            (prev && prev.id === selectedStudentId ? prev : null) ||
            linkedStudents.find(
              (s) => s.id === selectedStudentId && s.schoolId === selectedSchoolId,
            );
          if (!base) return prev;
          const nextName = hit.full_name?.trim() || base.name;
          const nextClass = hit.class_name ?? base.className;
          const nextAvatar = photo || base.avatarUrl;
          if (
            nextName === base.name &&
            nextClass === base.className &&
            nextAvatar === base.avatarUrl &&
            (hit.admission_number ?? base.admissionNumber) === base.admissionNumber
          ) {
            return prev ?? base;
          }
          return {
            ...base,
            name: nextName,
            admissionNumber: hit.admission_number ?? base.admissionNumber,
            className: nextClass,
            relationship: hit.relationship ?? base.relationship,
            avatarUrl: nextAvatar,
          };
        });
      } catch (e) {
        log.warn('DeskAuth', 'could not enrich selected student from Nest', String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally only when selection/token changes — not when snapshot updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deskToken, selectedStudentId, selectedSchoolId]);

  const orgRoles = selectedSchool?.roles ?? schools[0]?.roles ?? [];
  const activeRoles = selectedRole ? [selectedRole] : orgRoles;
  const orgSchoolId = selectedSchoolId ?? schools[0]?.id ?? null;

  const persona = useMemo(() => {
    const roles =
      deskUser?.user_roles &&
      (Array.isArray(deskUser.user_roles)
        ? deskUser.user_roles.length > 0
        : String(deskUser.user_roles).trim().length > 0)
        ? selectedRole
          ? [selectedRole]
          : deskUser.user_roles
        : activeRoles;

    const schoolId = selectedSchoolId ?? deskUser?.school_id ?? orgSchoolId;
    const next = resolveDeskPersona(roles, {
      schoolId,
      schoolLinked: Boolean(schoolId),
      hasDeskSession: Boolean(deskToken) || orgRoles.length > 0,
    });
    log.info('DeskAuth', 'persona', {
      persona: next,
      roles,
      orgRoles,
      deskRoles: deskUser?.user_roles,
      selectedRole,
      schoolId,
      studentId: selectedStudentId,
      hasDeskToken: Boolean(deskToken),
      schoolCount: schools.length,
      studentCount: linkedStudents.length,
    });
    return next;
  }, [
    deskUser,
    deskToken,
    orgRoles,
    activeRoles,
    selectedRole,
    orgSchoolId,
    selectedSchoolId,
    selectedStudentId,
    schools.length,
    linkedStudents.length,
  ]);

  const applySchoolsForUser = useCallback(
    async (userId: string, opts?: { quiet?: boolean; forcePick?: boolean }) => {
      // Keep existing list visible — only flash spinner on first load for this user.
      if (!opts?.quiet && authUserIdRef.current !== userId) setSchoolsReady(false);
      const list = await fetchUserSchools(userId);
      const linked = flattenLinkedStudents(list);

      if (opts?.forcePick) {
        await clearSelectedContext(userId);
      }
      const stored = opts?.forcePick ? null : await getSelectedContext(userId);
      const { schoolId, studentId, activeRole, needsPick, pickerMode: mode, schoolRoleOptions: roleOpts } =
        resolveContext(list, linked, stored, { forcePick: opts?.forcePick });

      if (!needsPick && schoolId) {
        const next: StoredContext = { schoolId, studentId, activeRole };
        const same =
          stored?.schoolId === next.schoolId &&
          stored?.studentId === next.studentId &&
          stored?.activeRole === next.activeRole;
        if (!same) {
          await setSelectedContext(userId, next);
        }
      }

      setSchools(list);
      setSelectedSchoolIdState(schoolId);
      setSelectedStudentIdState(studentId);
      setSelectedRoleState(activeRole);
      setSchoolRoleOptions(roleOpts);
      if (studentId && schoolId) {
        const snap = linked.find((s) => s.id === studentId && s.schoolId === schoolId) ?? null;
        setStudentSnapshot(snap);
      } else {
        setStudentSnapshot(null);
      }
      setNeedsSchoolPick(needsPick);
      setPickerMode(mode);
      setSchoolsReady(true);
      setDeskActiveContext({ schoolId, studentId });
      // Keep Nest/desk user_roles locked to the restored hat so resume doesn't fall to "individual".
      if (activeRole) {
        setDeskUser((prev) =>
          prev
            ? {
                ...prev,
                school_id: schoolId ?? prev.school_id,
                user_roles: [activeRole],
              }
            : prev,
        );
      }
      return { schools: list, schoolId, studentId, activeRole, needsPick, pickerMode: mode, schoolRoleOptions: roleOpts };
    },
    [],
  );

  const selectStudent = useCallback(
    async (student: LinkedStudent) => {
      if (!authUserId) return;
      const role = selectedRole ?? uniqueSchoolRoles(student.schoolRoles)[0] ?? 'parent';
      await setSelectedContext(authUserId, {
        schoolId: student.schoolId,
        studentId: student.id,
        activeRole: role,
      });
      setSelectedSchoolIdState(student.schoolId);
      setSelectedStudentIdState(student.id);
      setSelectedRoleState(role);
      setStudentSnapshot(student);
      setNeedsSchoolPick(false);
      setPickerMode('student');
      setDeskActiveContext({ schoolId: student.schoolId, studentId: student.id });

      setDeskUser((prev) =>
        prev
          ? {
              ...prev,
              school_id: student.schoolId,
              user_roles: [role],
            }
          : prev,
      );
      log.info('DeskAuth', 'student selected', {
        studentId: student.id,
        name: student.name,
        schoolId: student.schoolId,
        className: student.className,
        hasAvatar: Boolean(student.avatarUrl),
      });
    },
    [authUserId, selectedRole],
  );

  const selectRole = useCallback(
    async (role: string) => {
      if (!authUserId || !selectedSchoolId) return;
      const school = schools.find((s) => s.id === selectedSchoolId);
      if (!school) return;
      const roles = uniqueSchoolRoles(school.roles);
      if (!roles.includes(role)) return;

      await setSelectedContext(authUserId, {
        schoolId: selectedSchoolId,
        studentId: null,
        activeRole: role,
      });
      setSelectedRoleState(role);
      setDeskUser((prev) =>
        prev ? { ...prev, school_id: selectedSchoolId, user_roles: [role] } : prev,
      );

      if (isParentDeskRole(role)) {
        const kids = linkedStudentsAtSchool(linkedStudents, selectedSchoolId);
        if (kids.length === 1) {
          await selectStudent(kids[0]);
          return;
        }
        // Zero or multiple kids: never unlock parent persona without an active child.
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
        setNeedsSchoolPick(true);
        setPickerMode('student');
        setDeskActiveContext({ schoolId: selectedSchoolId, studentId: null });
        log.info('DeskAuth', 'role selected → student pick', {
          role,
          schoolId: selectedSchoolId,
          kids: kids.length,
        });
        return;
      }

      setSelectedStudentIdState(null);
      setStudentSnapshot(null);
      setNeedsSchoolPick(false);
      setPickerMode('school');
      setDeskActiveContext({ schoolId: selectedSchoolId, studentId: null });
      log.info('DeskAuth', 'role selected', { role, schoolId: selectedSchoolId });
    },
    [authUserId, selectedSchoolId, schools, linkedStudents, selectStudent],
  );

  const selectSchool = useCallback(
    async (schoolId: string) => {
      if (!authUserId) return;
      const school = schools.find((s) => s.id === schoolId);
      if (!school) return;

      const roles = uniqueSchoolRoles(school.roles);

      if (roles.length > 1) {
        setSelectedSchoolIdState(schoolId);
        setSelectedStudentIdState(null);
        setSelectedRoleState(null);
        setStudentSnapshot(null);
        setSchoolRoleOptions(roles);
        setNeedsSchoolPick(true);
        setPickerMode('role');
        setDeskActiveContext({ schoolId, studentId: null });
        log.info('DeskAuth', 'school selected → role pick', { schoolId, name: school.name });
        return;
      }

      const role = roles[0] ?? null;
      setSelectedSchoolIdState(schoolId);
      setSelectedRoleState(role);
      setSchoolRoleOptions(roles);

      if (role && isParentDeskRole(role)) {
        const kids = school.students ?? [];
        if (kids.length === 1) {
          await selectStudent({
            key: `${school.id}:${kids[0].id}`,
            id: kids[0].id,
            name: kids[0].name,
            admissionNumber: kids[0].admissionNumber,
            relationship: kids[0].relationship,
            className: kids[0].className,
            avatarUrl: kids[0].avatarUrl,
            schoolId: school.id,
            schoolName: school.name,
            schoolLogoUrl: school.logoUrl,
            schoolRoles: school.roles,
          });
          return;
        }
        // Zero or multiple: stay on Select student (block dashboard until approved child).
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
        setNeedsSchoolPick(true);
        setPickerMode('student');
        setDeskActiveContext({ schoolId, studentId: null });
        setDeskUser((prev) =>
          prev
            ? {
                ...prev,
                school_id: schoolId,
                user_roles: role ? [role] : prev.user_roles,
              }
            : prev,
        );
        log.info('DeskAuth', 'school selected → student pick', {
          schoolId,
          name: school.name,
          kids: kids.length,
        });
        return;
      }

      await setSelectedContext(authUserId, { schoolId, studentId: null, activeRole: role });
      setSelectedStudentIdState(null);
      setStudentSnapshot(null);
      setNeedsSchoolPick(false);
      setPickerMode('school');
      setDeskActiveContext({ schoolId, studentId: null });
      setDeskUser((prev) =>
        prev
          ? {
              ...prev,
              school_id: schoolId,
              user_roles: role ? [role] : prev.user_roles,
            }
          : prev,
      );
      log.info('DeskAuth', 'school selected', { schoolId, name: school.name, role });
    },
    [authUserId, schools, selectStudent],
  );

  const backInPicker = useCallback(async () => {
    if (!authUserId) return;
    if (pickerMode === 'student') {
      const school = schools.find((s) => s.id === selectedSchoolId);
      const roles = uniqueSchoolRoles(school?.roles ?? schoolRoleOptions);
      if (roles.length > 1) {
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
        setSelectedRoleState(null);
        setNeedsSchoolPick(true);
        setPickerMode('role');
        if (selectedSchoolId) {
          await setSelectedContext(authUserId, {
            schoolId: selectedSchoolId,
            studentId: null,
            activeRole: null,
          });
        }
        return;
      }
    }
    if (pickerMode === 'role' || pickerMode === 'student') {
      if (schools.length > 1 || prefersSchoolPicker(schools)) {
        await clearSelectedContext(authUserId);
        setSelectedSchoolIdState(null);
        setSelectedStudentIdState(null);
        setSelectedRoleState(null);
        setStudentSnapshot(null);
        setNeedsSchoolPick(true);
        setPickerMode('school');
        setDeskActiveContext({ schoolId: null, studentId: null });
      }
    }
  }, [authUserId, pickerMode, schools, selectedSchoolId, schoolRoleOptions]);

  const requestSchoolChange = useCallback(async () => {
    if (!authUserId) return;
    const canSwitch =
      schools.length > 1 ||
      linkedStudents.length > 1 ||
      schoolRoleOptions.length > 1 ||
      uniqueSchoolRoles(selectedSchool?.roles).length > 1;
    if (!canSwitch) return;
    await clearSelectedContext(authUserId);
    setSelectedSchoolIdState(null);
    setSelectedStudentIdState(null);
    setSelectedRoleState(null);
    setStudentSnapshot(null);
    setDeskActiveContext({ schoolId: null, studentId: null });
    setNeedsSchoolPick(true);
    setPickerMode(schools.length > 1 || prefersSchoolPicker(schools) ? 'school' : 'student');
    log.info('DeskAuth', 'context change requested');
  }, [authUserId, linkedStudents.length, schools, schoolRoleOptions.length, selectedSchool?.roles]);

  const syncSupabaseAsDesk = useCallback(
    async (session: Session | null, opts?: { quiet?: boolean; forceSchoolPick?: boolean }) => {
      if (!session?.access_token || !session.user) {
        setAuthUserId(null);
        setSchools([]);
        setSelectedSchoolIdState(null);
        setSelectedStudentIdState(null);
        setSelectedRoleState(null);
        setStudentSnapshot(null);
        setSchoolRoleOptions([]);
        setNeedsSchoolPick(false);
        setSchoolsReady(true);
        return;
      }

      const sameUser = authUserIdRef.current === session.user.id;
      const quiet = opts?.quiet || sameUser;

      setAuthUserId(session.user.id);
      authUserIdRef.current = session.user.id;
      const membership = await applySchoolsForUser(session.user.id, {
        quiet,
        forcePick: opts?.forceSchoolPick,
      });
      const activeRole = membership.activeRole;
      const roles = activeRole
        ? [activeRole]
        : membership.schoolId
          ? membership.schools.find((s) => s.id === membership.schoolId)?.roles ?? []
          : membership.schools[0]?.roles ?? [];
      const schoolId = membership.schoolId ?? membership.schools[0]?.id ?? null;

      const user = deskUserFromSession(session, roles, schoolId);

      // Nest password login already stored a desk JWT — keep it (Supabase JWT fails many /parents/me routes).
      if (preferNestDeskTokenRef.current || (await hasNestDeskToken())) {
        preferNestDeskTokenRef.current = true;
        let existing = await getDeskToken();
        if (!existing) {
          await awaitDeskLoginInFlight();
          existing = await getDeskToken();
        }
        if (!existing) {
          await ensureNestDeskSession();
          existing = await getDeskToken();
        }
        if (existing) {
          setDeskToken(existing);
          setDeskUser((prev) => ({
            ...(prev ?? user),
            ...user,
            school_id: schoolId ?? prev?.school_id ?? user.school_id,
            // Prefer restored hat; never wipe a saved role with a full multi-role Nest payload.
            user_roles: activeRole
              ? [activeRole]
              : prev?.user_roles?.length
                ? prev.user_roles
                : user.user_roles,
          }));
          return;
        }
      }

      await adoptSupabaseTokenAsDeskSession(session.access_token, user);
      setDeskToken(await getDeskToken());
      setDeskUser(user);

      // Never await auth/me on the picker / session path — Desk can hang on Supabase JWTs.
      if (!quiet) {
        void deskFetchMe().then((me) => {
          if (!me || preferNestDeskTokenRef.current) return;
          setDeskUser({
            ...user,
            ...me,
            user_roles: me.user_roles ?? user.user_roles,
            school_id: schoolId ?? me.school_id ?? user.school_id,
          });
        });
      }
    },
    [applySchoolsForUser],
  );

  const hydrate = useCallback(async () => {
    let schoolsMarked = false;
    try {
      const [{ data: sessionData }, cached] = await Promise.all([
        supabase.auth.getSession(),
        getCachedDeskUser(),
      ]);
      const session = sessionData.session;

      // Nest JWT required for /parents/me/* — reconnect before soft-adopting Supabase.
      const nestOk = await ensureNestDeskSession();
      let nestUser = nestOk ? (await getCachedDeskUser()) ?? cached : cached;
      if (nestOk) {
        preferNestDeskTokenRef.current = true;
        const token = await getDeskToken();
        setDeskToken(token);
        if (nestUser) {
          // Do not trust nestUser.user_roles yet — syncSupabaseAsDesk restores the saved hat.
          setDeskUser(nestUser);
        }
        log.info('DeskAuth', 'nest session ready on hydrate');
      }

      if (session?.access_token) {
        await syncSupabaseAsDesk(session, { quiet: true });
        schoolsMarked = true;
      } else if (nestOk) {
        // Nest-only login (PEA / platform) — no GoTrue session. syncSupabaseAsDesk never runs,
        // so without this branch schoolsReady stays false and AppNavigator spins forever.
        let uid = nestUser?.id || nestUser?.user_id || null;
        if (!uid) {
          try {
            const { restoreSession } = await import('../lib/auth');
            const nestAuth = await restoreSession();
            uid = nestAuth?.user?.id || null;
            if (!nestUser && nestAuth?.user) {
              nestUser = {
                id: nestAuth.user.id,
                email: nestAuth.user.email ?? undefined,
                school_id: null,
                user_roles: [],
              };
              setDeskUser(nestUser);
            }
          } catch {
            /* ignore */
          }
        }
        if (uid) {
          setAuthUserId(uid);
          authUserIdRef.current = uid;
          const membership = await applySchoolsForUser(uid, { quiet: true });
          schoolsMarked = true;
          const activeRole = membership.activeRole;
          const schoolId = membership.schoolId ?? membership.schools[0]?.id ?? null;
          setDeskUser((prev) =>
            prev
              ? {
                  ...prev,
                  id: prev.id || uid!,
                  school_id: schoolId ?? prev.school_id,
                  user_roles: activeRole
                    ? [activeRole]
                    : prev.user_roles?.length
                      ? prev.user_roles
                      : [],
                }
              : prev,
          );
        } else {
          setSchoolsReady(true);
          schoolsMarked = true;
        }
      } else {
        const token = await getDeskToken();
        setDeskToken(token);
        setDeskUser(cached);
        setSchoolsReady(true);
        schoolsMarked = true;
        if (token) {
          void deskFetchMe().then((me) => {
            if (me) setDeskUser(me);
          });
        }
      }
      log.info('DeskAuth', 'hydrated', getDeskApiDebugInfo());
    } finally {
      if (!schoolsMarked) setSchoolsReady(true);
      setDeskReady(true);
    }
  }, [applySchoolsForUser, syncSupabaseAsDesk]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Re-apply saved school/role/student when returning from background (OS may have dropped in-memory state).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const uid = authUserIdRef.current;
      if (!uid) return;
      void applySchoolsForUser(uid, { quiet: true }).then((membership) => {
        if (membership?.activeRole) {
          setDeskUser((prev) =>
            prev
              ? {
                  ...prev,
                  school_id: membership.schoolId ?? prev.school_id,
                  user_roles: [membership.activeRole!],
                }
              : prev,
          );
        }
      });
    });
    return () => sub.remove();
  }, [applySchoolsForUser]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.access_token) {
        if (event !== 'SIGNED_OUT') {
          return;
        }
        setAuthUserId(null);
        setSchools([]);
        setSelectedSchoolIdState(null);
        setSelectedStudentIdState(null);
        setSelectedRoleState(null);
        setStudentSnapshot(null);
        setSchoolRoleOptions([]);
        setNeedsSchoolPick(false);
        setSchoolsReady(true);
        return;
      }
      const run = async () => {
        // Soft reconnect Nest before soft-adopt so Select student gets real names.
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          const nestOk = await ensureNestDeskSession();
          if (nestOk) {
            preferNestDeskTokenRef.current = true;
            const token = await getDeskToken();
            const nestUser = await getCachedDeskUser();
            setDeskToken(token);
            if (nestUser) setDeskUser(nestUser);
          }
          await syncSupabaseAsDesk(session, { quiet: true });
          return;
        }
        await syncSupabaseAsDesk(session);
      };
      void run();
    });
    return () => sub.subscription.unsubscribe();
  }, [syncSupabaseAsDesk]);

  useEffect(() => {
    return onDeskSessionCleared(() => {
      setDeskToken(null);
      setDeskUser(null);
    });
  }, []);

  const connectDesk = useCallback(
    async (email: string, password: string) => {
      // Lock before network so SIGNED_IN cannot soft-adopt over a Nest JWT in flight.
      preferNestDeskTokenRef.current = true;
      try {
        const result = await deskLogin(email, password);
        setDeskToken(result.token);
        setDeskUser(result.user);
        log.info('DeskAuth', 'nest password session kept for parent APIs', {
          email: result.user.email,
          schoolId: result.user.school_id,
        });
        return result;
      } catch (e) {
        preferNestDeskTokenRef.current = false;
        // Keep password so ensureNestDeskSession can soft-reconnect when Desk/proxy is back.
        try {
          await saveDeskCredentials(email, password);
        } catch {
          // ignore
        }
        log.warn('DeskAuth', 'Nest password login failed; using supabase token', String(e));
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          await syncSupabaseAsDesk(data.session);
          return {
            token: data.session.access_token,
            user: deskUserFromSession(data.session, orgRoles, orgSchoolId),
          };
        }
        throw e;
      }
    },
    [orgRoles, orgSchoolId, syncSupabaseAsDesk],
  );

  const refreshDeskUser = useCallback(async () => {
    const me = await deskFetchMe();
    if (me) setDeskUser((prev) => ({ ...(prev ?? {}), ...me }));
  }, []);

  const clearDesk = useCallback(async () => {
    preferNestDeskTokenRef.current = false;
    if (authUserId) {
      await clearSelectedContext(authUserId);
    }
    await clearDeskSession();
    setDeskToken(null);
    setDeskUser(null);
    setSchools([]);
    setSelectedSchoolIdState(null);
    setSelectedStudentIdState(null);
    setSelectedRoleState(null);
    setStudentSnapshot(null);
    setSchoolRoleOptions([]);
    setNeedsSchoolPick(false);
  }, [authUserId]);

  const value = useMemo(
    () => ({
      deskUser,
      deskToken,
      persona,
      personaLabel: personaLabel(persona),
      deskReady,
      schoolsReady,
      isDeskAuthenticated: Boolean(deskToken),
      deskApiUrl: getDeskApiDebugInfo().deskResolved,
      schools,
      linkedStudents,
      selectedSchoolId,
      selectedSchool,
      selectedStudentId,
      selectedStudent,
      selectedRole,
      needsSchoolPick,
      pickerMode,
      schoolRoleOptions,
      selectStudent,
      selectSchool,
      selectRole,
      backInPicker,
      requestSchoolChange,
      connectDesk,
      refreshDeskUser,
      clearDesk,
    }),
    [
      deskUser,
      deskToken,
      persona,
      deskReady,
      schoolsReady,
      schools,
      linkedStudents,
      selectedSchoolId,
      selectedSchool,
      selectedStudentId,
      selectedStudent,
      selectedRole,
      needsSchoolPick,
      pickerMode,
      schoolRoleOptions,
      selectStudent,
      selectSchool,
      selectRole,
      backInPicker,
      requestSchoolChange,
      connectDesk,
      refreshDeskUser,
      clearDesk,
    ],
  );

  return <DeskAuthContext.Provider value={value}>{children}</DeskAuthContext.Provider>;
}

export function useDeskAuth() {
  return useContext(DeskAuthContext);
}
