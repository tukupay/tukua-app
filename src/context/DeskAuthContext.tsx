/**
 * Desk auth + multi-school / student context.
 * Parents select a student (school follows). Teachers/admins fall back to school.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import type { Session } from '../lib/auth';
import {
  clearDeskSession,
  deskFetchMe,
  deskLogin,
  DeskLoginResult,
  DeskUser,
  getCachedDeskUser,
  getDeskApiDebugInfo,
  getDeskToken,
  getDeskTokenClaims,
  ensureNestDeskSession,
  onDeskSessionCleared,
  refreshDeskTokenIfRolesChanged,
  saveDeskCredentials,
  setDeskActiveContext,
  awaitDeskLoginInFlight,
} from '../lib/deskApi';
import {
  DeskPersona,
  isParentDeskRole,
  mapRoleToMobileHat,
  personaLabel,
  resolveDeskPersona,
  SUPER_ADMIN_MOBILE_HATS,
} from '../lib/deskRoles';
import { fetchUserSchools, flattenLinkedStudents, LinkedStudent, UserSchool } from '../lib/orgRoles';
import {
  activeRolesForHat,
  linkedStudentsAtSchool,
  preferRealSchoolRoles,
  prefersSchoolPicker,
  rememberedContextUsable,
  resolveContext,
  shouldForcePickAfterLogin,
  uniqueSchoolRoles,
  withTokenRoles,
} from '../lib/schoolContext';
import { fetchParentChildren } from '../lib/parentPortalApi';
import {
  clearSelectedContext,
  getSelectedContext,
  setSelectedContext as writeSelectedContext,
  StoredContext,
} from '../lib/selectedContext';
import { getLastContext, lastContextAsStored, rememberLastContext } from '../lib/lastContext';
import { resolveCourseOnlySchools } from '../lib/courseLearner';

/**
 * Save the context the user lands on, and remember it as their last user type (survives logout and
 * an abandoned "Switch profile", so the next login opens as it). A role-less mid-pick save is not remembered.
 */
async function setSelectedContext(userId: string, ctx: StoredContext): Promise<void> {
  await writeSelectedContext(userId, ctx);
  if (ctx.skipped || (ctx.schoolId && ctx.activeRole)) {
    await rememberLastContext(userId, ctx);
  }
}
import { log } from '../lib/logger';
import { refreshPlatformNestToken } from '../lib/platformNestAuth';
import { navigateDashboard } from '../navigation/rootNavigation';

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
  /** The person's own roles behind the active hat (bursar, deputy_principal…) — gate tiles on these. */
  activeRoles: string[];
  /** True when user must pick school, role, or student. */
  needsSchoolPick: boolean;
  /** No school open (none joined, or the picker was skipped) — the personal dashboard shows. */
  contextSkipped: boolean;
  /**
   * Schools where the person's learner role came only from a course (no school record): the learner
   * hat there opens the personal dashboard, and the picker says "You are a learner here (courses)".
   */
  courseOnlySchoolIds: string[];
  /**
   * School, role and child are settled and pushed into the API context. School-scoped dashboard
   * loads wait for this, so none goes out without the school header.
   */
  schoolContextReady: boolean;
  /**
   * Picker UI mode. Flow: school → role → student (parent, multi-child).
   */
  pickerMode: 'student' | 'school' | 'role';
  /** Roles available at the selected school (for role picker). */
  schoolRoleOptions: string[];
  selectStudent: (student: LinkedStudent) => Promise<void>;
  /**
   * Open a school. False when it is not in the membership list (yet). With `role` (e.g. the role just
   * joined) and the school granting it, that hat opens directly instead of the role picker.
   */
  selectSchool: (schoolId: string, opts?: { role?: string | null }) => Promise<boolean>;
  selectRole: (role: string) => Promise<void>;
  /** Continue as individual (student hat) without a school — the personal dashboard shows. */
  skipSchoolPick: () => Promise<void>;
  /**
   * Super-admin: adopt any school + mobile hat (teacher/security/parent/student/individual)
   * without requiring org membership at that school.
   */
  adoptSchoolRole: (opts: {
    schoolId: string;
    schoolName?: string | null;
    role: string;
  }) => Promise<void>;
  /** Step back within picker (role → school, student → role). */
  backInPicker: () => Promise<void>;
  /** Clear selection and show picker again (no schools yet → opens Join school instead). */
  requestSchoolChange: () => Promise<void>;
  /** Reload school/student links for the signed-in user (e.g. after leave/join). Returns the new list. */
  refreshSchools: (opts?: { quiet?: boolean; forcePick?: boolean }) => Promise<UserSchool[]>;
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
  activeRoles: [],
  needsSchoolPick: false,
  contextSkipped: false,
  courseOnlySchoolIds: [],
  schoolContextReady: false,
  pickerMode: 'student',
  schoolRoleOptions: [],
  selectStudent: async () => {},
  selectSchool: async () => false,
  selectRole: async () => {},
  skipSchoolPick: async () => {},
  adoptSchoolRole: async () => {},
  backInPicker: async () => {},
  requestSchoolChange: async () => {},
  refreshSchools: async () => [],
  connectDesk: async () => {
    throw new Error('DeskAuth not ready');
  },
  refreshDeskUser: async () => {},
  clearDesk: async () => {},
});

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
  const [contextSkipped, setContextSkipped] = useState(false);
  const [pickerMode, setPickerMode] = useState<'student' | 'school' | 'role'>('student');
  const [deskReady, setDeskReady] = useState(false);
  const [schoolsReady, setSchoolsReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const [courseOnlySchoolIds, setCourseOnlySchoolIds] = useState<string[]>([]);
  /** Keep Nest password JWT (needed for /parents/me/*). */
  const preferNestDeskTokenRef = useRef(false);

  useEffect(() => {
    authUserIdRef.current = authUserId;
  }, [authUserId]);

  const linkedStudents = useMemo(() => flattenLinkedStudents(schools), [schools]);

  /** Latest list for callbacks that run right after refreshSchools (state is one render behind). */
  const schoolsRef = useRef<UserSchool[]>([]);
  useEffect(() => {
    schoolsRef.current = schools;
  }, [schools]);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId],
  );

  const activeRoles = useMemo(
    () => (selectedRole || selectedSchool ? activeRolesForHat(selectedSchool?.roles ?? [], selectedRole) : []),
    [selectedRole, selectedSchool],
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

  /**
   * The school every school-scoped call and the persona use. While a pick is still open there is
   * none: the token's own school (deskUser.school_id) is not the one being chosen.
   */
  const contextSchoolId = selectedSchoolId ?? (needsSchoolPick ? null : deskUser?.school_id ?? null);

  /**
   * Push school + student + roles into deskFetch for every Nest call. A layout effect: it runs before
   * any screen's (passive) effects in the same commit, so the dashboard's loads for a newly opened
   * school never go out with the previous (or no) school.
   */
  useLayoutEffect(() => {
    // The server keeps only header roles the token holds, so send the person's real roles behind the
    // hat (["teacher","discipline_master"]), never the hat name ("school_admin" for a bursar).
    setDeskActiveContext({
      schoolId: contextSchoolId,
      studentId: selectedStudentId,
      roles: activeRoles,
    });
  }, [contextSchoolId, selectedStudentId, activeRoles]);

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
  const personaRoles = selectedRole ? [selectedRole] : orgRoles;
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
        : personaRoles;

    // While a school / role pick is open, no school is in force (the picker covers the tabs, but the
    // dashboard behind it is mounted and must not load as the token's school).
    const schoolId = needsSchoolPick ? selectedSchoolId : selectedSchoolId ?? deskUser?.school_id ?? orgSchoolId;
    const resolved = resolveDeskPersona(roles, {
      schoolId,
      schoolLinked: Boolean(schoolId),
      hasDeskSession: Boolean(deskToken) || orgRoles.length > 0,
    });
    // The learner hat has no school dashboard behind it when no school is open (none joined, or the
    // picker was skipped) or when the learner role there came only from a course (no school record):
    // show the personal one (courses, Tukua AI, Tukua Pay, Join school).
    const courseOnly = Boolean(schoolId && courseOnlySchoolIds.includes(schoolId));
    const next: DeskPersona =
      resolved === 'student' &&
      (!schoolId || courseOnly || (contextSkipped && !selectedSchoolId && schools.length > 0))
        ? 'individual'
        : resolved;
    log.info('DeskAuth', 'persona', {
      persona: next,
      roles,
      orgRoles,
      deskRoles: deskUser?.user_roles,
      selectedRole,
      schoolId,
      courseOnly,
      needsSchoolPick,
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
    personaRoles,
    selectedRole,
    orgSchoolId,
    selectedSchoolId,
    selectedStudentId,
    schools.length,
    linkedStudents.length,
    contextSkipped,
    needsSchoolPick,
    courseOnlySchoolIds,
  ]);

  const schoolContextReady = deskReady && schoolsReady && !needsSchoolPick;

  const applySchoolsForUser = useCallback(
    async (
      userId: string,
      opts?: {
        quiet?: boolean;
        forcePick?: boolean;
        rememberedFirst?: boolean;
        /** Force the picker only when the person holds 2+ hats (course-only learner hats not counted). */
        forcePickIfMultiRole?: boolean;
      },
    ) => {
      // Keep existing list visible — only flash spinner on first load for this user.
      if (!opts?.quiet && authUserIdRef.current !== userId) setSchoolsReady(false);
      let rows: UserSchool[];
      try {
        [rows] = await Promise.all([fetchUserSchools(userId), awaitDeskLoginInFlight()]);
      } catch (e) {
        // Never leave the school spinner up when the list could not be read; callers decide what to show.
        setSchoolsReady(true);
        log.warn('DeskAuth', 'school list failed', e instanceof Error ? e.message : String(e));
        throw e;
      }
      // The token's own roles win at its school (bursar, deputy principal… not the coarse membership slug).
      const list = withTokenRoles(rows, await getDeskTokenClaims());
      const linked = flattenLinkedStudents(list);

      // Learner roles that came only from a course (no school record) — known before any persona is
      // resolved, so a course learner never lands on the school-student dashboard. Remembered answers
      // are instant; a later re-check that changes them updates the list in place.
      const courseOnly = await resolveCourseOnlySchools(userId, list, (next) => {
        if (authUserIdRef.current !== userId) return;
        setCourseOnlySchoolIds([...next]);
      });
      setCourseOnlySchoolIds([...courseOnly]);

      // The last user type this person opened as (kept across logout). On login it wins over the
      // forced picker while that school + role is still theirs; otherwise it fills in when the
      // selected context is gone (logout, an abandoned switch).
      let forcePick =
        Boolean(opts?.forcePick) ||
        Boolean(opts?.forcePickIfMultiRole && shouldForcePickAfterLogin(preferRealSchoolRoles(list, courseOnly)));
      const last = forcePick && !opts?.rememberedFirst ? null : await getLastContext(userId);
      const remembered = last && rememberedContextUsable(list, last) ? lastContextAsStored(last) : null;
      if (forcePick && opts?.rememberedFirst && remembered) {
        forcePick = false;
        log.info('DeskAuth', 'login → last user type', {
          schoolId: remembered.schoolId,
          role: remembered.activeRole,
          skipped: remembered.skipped,
        });
      }

      if (forcePick) {
        await clearSelectedContext(userId);
      }
      let stored = forcePick ? null : await getSelectedContext(userId);
      let fromRemembered = false;
      if (!forcePick && remembered && (opts?.rememberedFirst || !stored)) {
        stored = remembered;
        fromRemembered = true;
      }
      const { schoolId, studentId, activeRole, needsPick, pickerMode: mode, schoolRoleOptions: roleOpts } =
        resolveContext(list, linked, stored, { forcePick, courseOnlySchoolIds: courseOnly });

      if (!needsPick && schoolId) {
        const next: StoredContext = { schoolId, studentId, activeRole, skipped: false };
        const same =
          !fromRemembered &&
          stored?.schoolId === next.schoolId &&
          stored?.studentId === next.studentId &&
          stored?.activeRole === next.activeRole &&
          !stored?.skipped;
        if (!same) {
          await setSelectedContext(userId, next);
        }
      } else if (!needsPick && !schoolId && activeRole === 'student') {
        const next: StoredContext = {
          schoolId: null,
          studentId: null,
          activeRole: 'student',
          skipped: true,
        };
        if (fromRemembered || !stored?.skipped || stored?.activeRole !== 'student') {
          // No school at all is the default, not a choice: keep it out of the remembered user type.
          if (list.length) await setSelectedContext(userId, next);
          else await writeSelectedContext(userId, next);
        }
      }

      schoolsRef.current = list;
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
      setContextSkipped(
        Boolean((!schoolId && activeRole === 'student') || (stored?.skipped && !schoolId && !needsPick)),
      );
      setPickerMode(mode);
      setSchoolsReady(true);
      setDeskActiveContext({
        schoolId,
        studentId,
        roles: activeRole
          ? activeRolesForHat(list.find((s) => s.id === schoolId)?.roles ?? [], activeRole)
          : undefined,
      });
      // Keep Nest/desk user_roles locked to the restored hat so resume doesn't fall to "individual".
      if (activeRole) {
        setDeskUser((prev) =>
          prev
            ? {
                ...prev,
                school_id: schoolId ?? prev.school_id ?? null,
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
      // Picking a child is always the parent hat (a teacher hat left over from another school is not).
      const role = isParentDeskRole(selectedRole)
        ? selectedRole!
        : uniqueSchoolRoles(student.schoolRoles).find((r) => isParentDeskRole(r)) ?? 'parent';
      await setSelectedContext(authUserId, {
        schoolId: student.schoolId,
        studentId: student.id,
        activeRole: role,
        skipped: false,
      });
      setSelectedSchoolIdState(student.schoolId);
      setSelectedStudentIdState(student.id);
      setSelectedRoleState(role);
      setStudentSnapshot(student);
      setNeedsSchoolPick(false);
      setContextSkipped(false);
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
      const school = schoolsRef.current.find((s) => s.id === selectedSchoolId);
      if (!school) return;
      const roles = uniqueSchoolRoles(school.roles);
      const hat = mapRoleToMobileHat(role);
      if (!roles.includes(role) && !roles.includes(hat)) return;
      const activeHat = roles.includes(hat) ? hat : role;

      await setSelectedContext(authUserId, {
        schoolId: selectedSchoolId,
        studentId: null,
        activeRole: activeHat,
        skipped: false,
      });
      setSelectedRoleState(activeHat);
      setContextSkipped(false);
      setDeskUser((prev) =>
        prev ? { ...prev, school_id: selectedSchoolId, user_roles: [activeHat] } : prev,
      );

      if (isParentDeskRole(activeHat)) {
        const kids = linkedStudentsAtSchool(flattenLinkedStudents(schoolsRef.current), selectedSchoolId);
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
          role: activeHat,
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
      log.info('DeskAuth', 'role selected', { role: activeHat, schoolId: selectedSchoolId });
    },
    [authUserId, selectedSchoolId, selectStudent],
  );

  const adoptSchoolRole = useCallback(
    async (opts: { schoolId: string; schoolName?: string | null; role: string }) => {
      if (!authUserId) return;
      const schoolId = String(opts.schoolId || '').trim();
      if (!schoolId) return;
      const hat = mapRoleToMobileHat(opts.role);
      const allowed = new Set<string>(SUPER_ADMIN_MOBILE_HATS);
      if (!allowed.has(hat)) {
        log.warn('DeskAuth', 'adoptSchoolRole rejected hat', hat);
        return;
      }
      const name = String(opts.schoolName || '').trim() || 'School';

      setSchools((prev) => {
        const existing = prev.find((s) => s.id === schoolId);
        if (existing) {
          const nextRoles = uniqueSchoolRoles([...(existing.roles || []), hat]);
          return prev.map((s) => (s.id === schoolId ? { ...s, name: existing.name || name, roles: nextRoles } : s));
        }
        const row: UserSchool = {
          id: schoolId,
          name,
          roles: [hat],
        };
        return [...prev, row];
      });
      setSchoolRoleOptions([...SUPER_ADMIN_MOBILE_HATS]);

      await setSelectedContext(authUserId, {
        schoolId,
        studentId: null,
        activeRole: hat,
        skipped: false,
      });
      setSelectedSchoolIdState(schoolId);
      setSelectedRoleState(hat);
      setContextSkipped(false);
      setDeskUser((prev) =>
        prev
          ? {
              ...prev,
              school_id: schoolId,
              user_roles: [hat],
            }
          : prev,
      );

      if (isParentDeskRole(hat)) {
        const kids = linkedStudentsAtSchool(linkedStudents, schoolId);
        if (kids.length === 1) {
          await selectStudent(kids[0]);
          return;
        }
        setSelectedStudentIdState(null);
        setStudentSnapshot(null);
        setNeedsSchoolPick(true);
        setPickerMode('student');
        setDeskActiveContext({ schoolId, studentId: null });
        log.info('DeskAuth', 'SA adopt → student pick', { schoolId, hat, kids: kids.length });
        return;
      }

      setSelectedStudentIdState(null);
      setStudentSnapshot(null);
      setNeedsSchoolPick(false);
      setPickerMode('school');
      setDeskActiveContext({ schoolId, studentId: null });
      log.info('DeskAuth', 'SA adopt school role', { schoolId, hat, name });
    },
    [authUserId, linkedStudents, selectStudent],
  );

  const selectSchool = useCallback(
    async (schoolId: string, opts?: { role?: string | null }): Promise<boolean> => {
      if (!authUserId) return false;
      // Ref, not state: Join school calls this right after refreshSchools, before a re-render.
      const school = schoolsRef.current.find((s) => s.id === schoolId);
      if (!school) {
        log.warn('DeskAuth', 'selectSchool: not a member (yet)', { schoolId });
        return false;
      }

      const roles = uniqueSchoolRoles(school.roles);
      // A role the caller asks for (the one just joined) opens directly when the school grants it.
      const wanted = opts?.role ? String(opts.role).toLowerCase().trim() : '';
      const wantedHat = wanted ? mapRoleToMobileHat(wanted) : '';
      const preferred = wantedHat && roles.includes(wantedHat) ? wantedHat : wanted && roles.includes(wanted) ? wanted : null;

      if (roles.length > 1 && !preferred) {
        setSelectedSchoolIdState(schoolId);
        setSelectedStudentIdState(null);
        setSelectedRoleState(null);
        setStudentSnapshot(null);
        setSchoolRoleOptions(roles);
        setNeedsSchoolPick(true);
        setPickerMode('role');
        setDeskActiveContext({ schoolId, studentId: null });
        log.info('DeskAuth', 'school selected → role pick', { schoolId, name: school.name });
        return true;
      }

      const role = preferred ?? roles[0] ?? null;
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
          return true;
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
        return true;
      }

      await setSelectedContext(authUserId, { schoolId, studentId: null, activeRole: role, skipped: false });
      setSelectedStudentIdState(null);
      setStudentSnapshot(null);
      setNeedsSchoolPick(false);
      setContextSkipped(false);
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
      return true;
    },
    [authUserId, selectStudent],
  );

  const skipSchoolPick = useCallback(async () => {
    if (!authUserId) return;
    const next: StoredContext = {
      schoolId: null,
      studentId: null,
      activeRole: 'student',
      skipped: true,
    };
    await setSelectedContext(authUserId, next);
    setSelectedSchoolIdState(null);
    setSelectedStudentIdState(null);
    setSelectedRoleState('student');
    setStudentSnapshot(null);
    setSchoolRoleOptions([]);
    setNeedsSchoolPick(false);
    setContextSkipped(true);
    setPickerMode('school');
    setDeskActiveContext({ schoolId: null, studentId: null, roles: ['student'] });
    setDeskUser((prev) =>
      prev
        ? {
            ...prev,
            school_id: null,
            user_roles: ['student'],
          }
        : prev,
    );
    log.info('DeskAuth', 'school pick skipped → individual as student');
  }, [authUserId]);

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
    if (schools.length === 0) {
      // Nothing to pick from: an empty picker is a dead end, so offer joining one instead.
      navigateDashboard('JoinSchool');
      return;
    }
    await clearSelectedContext(authUserId);
    setSelectedSchoolIdState(null);
    setSelectedStudentIdState(null);
    setSelectedRoleState(null);
    setStudentSnapshot(null);
    setContextSkipped(false);
    setDeskActiveContext({ schoolId: null, studentId: null });
    setNeedsSchoolPick(true);
    setPickerMode('school');
    log.info('DeskAuth', 'context change requested');
  }, [authUserId, schools]);

  const refreshSchools = useCallback(
    async (opts?: { quiet?: boolean; forcePick?: boolean }) => {
      if (!authUserId) return [];
      // A join just approved (or a role the school changed) is only in a new token.
      if (await refreshDeskTokenIfRolesChanged()) setDeskToken(await getDeskToken());
      // The platform token (used by people with no Desk profile, e.g. just joined) re-reads roles on refresh.
      await refreshPlatformNestToken();
      const membership = await applySchoolsForUser(authUserId, {
        quiet: opts?.quiet ?? true,
        forcePick: opts?.forcePick,
      });
      return membership.schools;
    },
    [authUserId, applySchoolsForUser],
  );

  const syncAuthSessionAsDesk = useCallback(
    async (session: Session | null, opts?: { quiet?: boolean; forceSchoolPick?: boolean }) => {
      if (!session?.access_token || !session.user) {
        setAuthUserId(null);
        setSchools([]);
        setCourseOnlySchoolIds([]);
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
        rememberedFirst: true,
      });
      const activeRole = membership.activeRole;
      const roles = activeRole
        ? [activeRole]
        : membership.schoolId
          ? membership.schools.find((s) => s.id === membership.schoolId)?.roles ?? []
          : membership.schools[0]?.roles ?? [];
      const schoolId = membership.schoolId ?? membership.schools[0]?.id ?? null;

      const user = deskUserFromSession(session, roles, schoolId);

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
          user_roles: activeRole
            ? [activeRole]
            : prev?.user_roles?.length
              ? prev.user_roles
              : user.user_roles,
        }));
        return;
      }

      setDeskUser((prev) => ({
        ...(prev ?? user),
        ...user,
        school_id: schoolId ?? prev?.school_id ?? user.school_id,
        user_roles: activeRole
          ? [activeRole]
          : prev?.user_roles?.length
            ? prev.user_roles
            : user.user_roles,
      }));
    },
    [applySchoolsForUser],
  );

  const hydrate = useCallback(async () => {
    let schoolsMarked = false;
    try {
      const cached = await getCachedDeskUser();
      const nestOk = await ensureNestDeskSession();
      let nestUser = nestOk ? (await getCachedDeskUser()) ?? cached : cached;
      if (nestOk) {
        preferNestDeskTokenRef.current = true;
        const token = await getDeskToken();
        setDeskToken(token);
        if (nestUser) {
          setDeskUser(nestUser);
        }
        log.info('DeskAuth', 'nest session ready on hydrate');
      }

      const { restoreSession } = await import('../lib/auth');
      const nestAuth = await restoreSession();

      if (nestAuth?.access_token && nestAuth.user?.id) {
        await syncAuthSessionAsDesk(nestAuth, { quiet: true });
        schoolsMarked = true;
      } else if (nestOk) {
        let uid = nestUser?.id || nestUser?.user_id || null;
        if (!uid && nestAuth?.user?.id) {
          uid = nestAuth.user.id;
          if (!nestUser) {
            nestUser = {
              id: nestAuth.user.id,
              email: nestAuth.user.email ?? undefined,
              school_id: null,
              user_roles: [],
            };
            setDeskUser(nestUser);
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
  }, [applySchoolsForUser, syncAuthSessionAsDesk]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Re-apply saved school/role/student when returning from background (OS may have dropped in-memory state).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const uid = authUserIdRef.current;
      if (!uid) return;
      void (async () => {
        // Back in the app: pick up roles the school changed while it was in the background.
        if (await refreshDeskTokenIfRolesChanged()) setDeskToken(await getDeskToken());
        await refreshPlatformNestToken();
        return applySchoolsForUser(uid, { quiet: true });
      })()
        .then((membership) => {
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
        })
        .catch((e) => {
          // Offline on return to the app: keep the school/role already on screen.
          log.warn('DeskAuth', 'foreground refresh failed', e instanceof Error ? e.message : String(e));
        });
    });
    return () => sub.remove();
  }, [applySchoolsForUser]);

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
        const uid = String(result.user.id || result.user.user_id || '').trim();
        if (uid) {
          setAuthUserId(uid);
          authUserIdRef.current = uid;
          await applySchoolsForUser(uid, {
            quiet: false,
            // Picker only for 2+ hats; a course-only learner hat beside a real role does not count.
            forcePickIfMultiRole: true,
            // Open as the last user type when it is still theirs; picker only when it is gone.
            rememberedFirst: true,
          });
        }
        return result;
      } catch (e) {
        preferNestDeskTokenRef.current = false;
        try {
          await saveDeskCredentials(email, password);
        } catch {
          // ignore
        }
        log.warn('DeskAuth', 'Nest password login failed', String(e));
        throw e;
      }
    },
    [applySchoolsForUser],
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
    setContextSkipped(false);
    setCourseOnlySchoolIds([]);
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
      activeRoles,
      needsSchoolPick,
      contextSkipped,
      courseOnlySchoolIds,
      schoolContextReady,
      pickerMode,
      schoolRoleOptions,
      selectStudent,
      selectSchool,
      selectRole,
      skipSchoolPick,
      adoptSchoolRole,
      backInPicker,
      requestSchoolChange,
      refreshSchools,
      connectDesk,
      refreshDeskUser,
      clearDesk,
    }),
    [
      courseOnlySchoolIds,
      schoolContextReady,
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
      activeRoles,
      needsSchoolPick,
      contextSkipped,
      pickerMode,
      schoolRoleOptions,
      selectStudent,
      selectSchool,
      selectRole,
      skipSchoolPick,
      adoptSchoolRole,
      backInPicker,
      requestSchoolChange,
      refreshSchools,
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
