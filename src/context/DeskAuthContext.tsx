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
  setDeskActiveContext,
} from '../lib/deskApi';
import {
  DeskPersona,
  normalizeDeskRoles,
  personaLabel,
  resolveDeskPersona,
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
  /** True when parent/teacher must pick a student (or school fallback). */
  needsSchoolPick: boolean;
  /**
   * Picker UI mode. Teachers/admins with 2+ schools always pick school
   * (even if they also have linked students as parents).
   */
  pickerMode: 'student' | 'school';
  selectStudent: (student: LinkedStudent) => Promise<void>;
  selectSchool: (schoolId: string) => Promise<void>;
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
  needsSchoolPick: false,
  pickerMode: 'student',
  selectStudent: async () => {},
  selectSchool: async () => {},
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

function resolveContext(
  schools: UserSchool[],
  linked: LinkedStudent[],
  stored: StoredContext | null,
  opts?: { forcePick?: boolean },
): {
  schoolId: string | null;
  studentId: string | null;
  needsPick: boolean;
  pickerMode: 'student' | 'school';
} {
  // Teachers/admins at 2+ schools → always Select school (even with parent links)
  if (prefersSchoolPicker(schools)) {
    if (opts?.forcePick) {
      return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'school' };
    }
    if (stored?.schoolId && schools.some((s) => s.id === stored.schoolId)) {
      return {
        schoolId: stored.schoolId,
        studentId: null,
        needsPick: false,
        pickerMode: 'school',
      };
    }
    return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'school' };
  }

  // Parent path: pick a student
  if (linked.length > 0) {
    if (linked.length === 1) {
      return {
        schoolId: linked[0].schoolId,
        studentId: linked[0].id,
        needsPick: false,
        pickerMode: 'student',
      };
    }
    if (opts?.forcePick) {
      return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'student' };
    }
    if (stored?.studentId && stored.schoolId) {
      const match = linked.find(
        (s) => s.id === stored.studentId && s.schoolId === stored.schoolId,
      );
      if (match) {
        return {
          schoolId: match.schoolId,
          studentId: match.id,
          needsPick: false,
          pickerMode: 'student',
        };
      }
    }
    // Legacy school-only: auto if exactly one child at that school
    if (stored?.schoolId && !stored.studentId) {
      const atSchool = linked.filter((s) => s.schoolId === stored.schoolId);
      if (atSchool.length === 1) {
        return {
          schoolId: atSchool[0].schoolId,
          studentId: atSchool[0].id,
          needsPick: false,
          pickerMode: 'student',
        };
      }
    }
    return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'student' };
  }

  // No linked students — school context (teachers / admins)
  if (!schools.length) {
    return { schoolId: null, studentId: null, needsPick: false, pickerMode: 'school' };
  }
  if (schools.length === 1) {
    return {
      schoolId: schools[0].id,
      studentId: null,
      needsPick: false,
      pickerMode: 'school',
    };
  }
  if (opts?.forcePick) {
    return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'school' };
  }
  if (stored?.schoolId && schools.some((s) => s.id === stored.schoolId)) {
    return {
      schoolId: stored.schoolId,
      studentId: null,
      needsPick: false,
      pickerMode: 'school',
    };
  }
  return { schoolId: null, studentId: null, needsPick: true, pickerMode: 'school' };
}

export function DeskAuthProvider({ children }: { children: ReactNode }) {
  const [deskUser, setDeskUser] = useState<DeskUser | null>(null);
  const [deskToken, setDeskToken] = useState<string | null>(null);
  const [schools, setSchools] = useState<UserSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolIdState] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(null);
  /** Full row from picker (Nest-enriched name/class/photo) — linkedStudents alone often lacks photo. */
  const [studentSnapshot, setStudentSnapshot] = useState<LinkedStudent | null>(null);
  const [needsSchoolPick, setNeedsSchoolPick] = useState(false);
  const [pickerMode, setPickerMode] = useState<'student' | 'school'>('student');
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

  /** Push school + student into deskFetch for every Nest call. */
  useEffect(() => {
    setDeskActiveContext({
      schoolId: selectedSchoolId ?? deskUser?.school_id ?? null,
      studentId: selectedStudentId,
    });
  }, [selectedSchoolId, selectedStudentId, deskUser?.school_id]);

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
  const orgSchoolId = selectedSchoolId ?? schools[0]?.id ?? null;

  const persona = useMemo(() => {
    const roles =
      deskUser?.user_roles &&
      (Array.isArray(deskUser.user_roles)
        ? deskUser.user_roles.length > 0
        : String(deskUser.user_roles).trim().length > 0)
        ? deskUser.user_roles
        : orgRoles;

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
      const { schoolId, studentId, needsPick, pickerMode: mode } = resolveContext(
        list,
        linked,
        stored,
        { forcePick: opts?.forcePick },
      );

      if (!needsPick && schoolId) {
        const next: StoredContext = { schoolId, studentId };
        const same =
          stored?.schoolId === next.schoolId && stored?.studentId === next.studentId;
        if (!same) {
          await setSelectedContext(userId, next);
        }
      }

      setSchools(list);
      setSelectedSchoolIdState(schoolId);
      setSelectedStudentIdState(studentId);
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
      return { schools: list, schoolId, studentId, needsPick, pickerMode: mode };
    },
    [],
  );

  const selectStudent = useCallback(
    async (student: LinkedStudent) => {
      if (!authUserId) return;
      await setSelectedContext(authUserId, {
        schoolId: student.schoolId,
        studentId: student.id,
      });
      setSelectedSchoolIdState(student.schoolId);
      setSelectedStudentIdState(student.id);
      setStudentSnapshot(student);
      setNeedsSchoolPick(false);
      setPickerMode('student');
      setDeskActiveContext({ schoolId: student.schoolId, studentId: student.id });

      setDeskUser((prev) =>
        prev
          ? {
              ...prev,
              school_id: student.schoolId,
              user_roles: student.schoolRoles?.length ? student.schoolRoles : prev.user_roles,
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
    [authUserId],
  );

  const selectSchool = useCallback(
    async (schoolId: string) => {
      if (!authUserId) return;
      const school = schools.find((s) => s.id === schoolId);
      if (!school) return;

      // Staff multi-school: school only (ignore linked children for this pick)
      if (prefersSchoolPicker(schools)) {
        await setSelectedContext(authUserId, { schoolId, studentId: null });
        setSelectedSchoolIdState(schoolId);
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
                user_roles: school.roles?.length ? school.roles : prev.user_roles,
              }
            : prev,
        );
        log.info('DeskAuth', 'school selected (staff)', { schoolId, name: school.name });
        return;
      }

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
      if (kids.length > 1) {
        // School chosen but multiple children — still need a student
        setSelectedSchoolIdState(schoolId);
        setSelectedStudentIdState(null);
        setNeedsSchoolPick(true);
        setPickerMode('student');
        return;
      }

      await setSelectedContext(authUserId, { schoolId, studentId: null });
      setSelectedSchoolIdState(schoolId);
      setSelectedStudentIdState(null);
      setNeedsSchoolPick(false);
      setPickerMode('school');
      setDeskUser((prev) =>
        prev
          ? {
              ...prev,
              school_id: schoolId,
              user_roles: school.roles?.length ? school.roles : prev.user_roles,
            }
          : prev,
      );
      log.info('DeskAuth', 'school selected', { schoolId, name: school.name });
    },
    [authUserId, schools, selectStudent],
  );

  const requestSchoolChange = useCallback(async () => {
    if (!authUserId) return;
    const canSwitch = schools.length > 1 || linkedStudents.length > 1;
    if (!canSwitch) return;
    await clearSelectedContext(authUserId);
    setSelectedSchoolIdState(null);
    setSelectedStudentIdState(null);
    setStudentSnapshot(null);
    setDeskActiveContext({ schoolId: null, studentId: null });
    setNeedsSchoolPick(true);
    setPickerMode(
      prefersSchoolPicker(schools) ? 'school' : linkedStudents.length > 0 ? 'student' : 'school',
    );
    log.info('DeskAuth', 'context change requested');
  }, [authUserId, linkedStudents.length, schools]);

  const syncSupabaseAsDesk = useCallback(
    async (session: Session | null, opts?: { quiet?: boolean; forceSchoolPick?: boolean }) => {
      if (!session?.access_token || !session.user) {
        setAuthUserId(null);
        setSchools([]);
        setSelectedSchoolIdState(null);
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
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
      const roles = membership.schoolId
        ? membership.schools.find((s) => s.id === membership.schoolId)?.roles ?? []
        : membership.schools[0]?.roles ?? [];
      const schoolId = membership.schoolId ?? membership.schools[0]?.id ?? null;

      const user = deskUserFromSession(session, roles, schoolId);

      // Nest password login already stored a desk JWT — keep it (Supabase JWT fails many /parents/me routes).
      if (preferNestDeskTokenRef.current || (await hasNestDeskToken())) {
        preferNestDeskTokenRef.current = true;
        const existing = await getDeskToken();
        if (existing) {
          setDeskToken(existing);
          setDeskUser((prev) => ({
            ...(prev ?? user),
            ...user,
            school_id: schoolId ?? prev?.school_id ?? user.school_id,
            user_roles: prev?.user_roles ?? user.user_roles,
          }));
          return;
        }
        preferNestDeskTokenRef.current = false;
      }

      await adoptSupabaseTokenAsDeskSession(session.access_token, user);
      setDeskToken(session.access_token);
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
    try {
      const [{ data: sessionData }, cached] = await Promise.all([
        supabase.auth.getSession(),
        getCachedDeskUser(),
      ]);
      const session = sessionData.session;

      // Nest JWT required for /parents/me/* — reconnect before soft-adopting Supabase.
      const nestOk = await ensureNestDeskSession();
      if (nestOk) {
        preferNestDeskTokenRef.current = true;
        const token = await getDeskToken();
        const nestUser = (await getCachedDeskUser()) ?? cached;
        setDeskToken(token);
        if (nestUser) setDeskUser(nestUser);
        log.info('DeskAuth', 'nest session ready on hydrate');
      }

      if (session?.access_token) {
        await syncSupabaseAsDesk(session, { quiet: true });
      } else if (!nestOk) {
        const token = await getDeskToken();
        setDeskToken(token);
        setDeskUser(cached);
        setSchoolsReady(true);
        if (token) {
          void deskFetchMe().then((me) => {
            if (me) setDeskUser(me);
          });
        }
      }
      log.info('DeskAuth', 'hydrated', getDeskApiDebugInfo());
    } finally {
      setDeskReady(true);
    }
  }, [syncSupabaseAsDesk]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.access_token) {
        setAuthUserId(null);
        setSchools([]);
        setSelectedSchoolIdState(null);
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
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
    setStudentSnapshot(null);
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
      needsSchoolPick,
      pickerMode,
      selectStudent,
      selectSchool,
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
      needsSchoolPick,
      pickerMode,
      selectStudent,
      selectSchool,
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
