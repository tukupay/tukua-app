/**
 * Which school, role hat and child the app opens on — pure functions (no React, no storage) so the
 * rules can be tested outside the app. DeskAuthContext feeds them the schools from orgRoles, the
 * stored pick and the desk token's own roles.
 */

import {
  isParentDeskRole,
  mapRoleToMobileHat,
  mobilePickerRolesFrom,
  normalizeDeskRoles,
  rolesForHat,
  withoutGenericRoles,
} from './deskRoles';
import type { LinkedStudent, UserSchool } from './orgRoles';
import type { StoredContext } from './selectedContext';

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

export type ResolvedContext = {
  schoolId: string | null;
  studentId: string | null;
  activeRole: string | null;
  needsPick: boolean;
  pickerMode: 'student' | 'school' | 'role';
  schoolRoleOptions: string[];
};

/** Collapse hub roles (school_admin → teacher, finance → individual) for the picker. */
export function uniqueSchoolRoles(roles: unknown): string[] {
  return mobilePickerRolesFrom(roles);
}

/** Teachers/admins with membership at 2+ schools → Select school (not student). */
export function prefersSchoolPicker(schools: UserSchool[]): boolean {
  if (schools.length < 2) return false;
  return schools.some((s) =>
    normalizeDeskRoles(s.roles).some((r) => STAFF_SCHOOL_PICK_ROLES.has(r)),
  );
}

/** Distinct mobile hats across all schools (individual+student already collapsed). */
export function distinctHatsAcrossSchools(schools: UserSchool[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of schools) {
    for (const hat of uniqueSchoolRoles(s.roles)) {
      if (seen.has(hat)) continue;
      seen.add(hat);
      out.push(hat);
    }
  }
  return out;
}

/**
 * Force the picker only when the user has more than one role hat.
 * Single role (incl. individual+student as one) → restore stored school / auto-pick.
 * Multi-school with one role still uses stored school; user can switch from the header.
 */
export function shouldForcePickAfterLogin(schools: UserSchool[]): boolean {
  if (!schools.length) return false;
  return distinctHatsAcrossSchools(schools).length > 1;
}

export function linkedStudentsAtSchool(linked: LinkedStudent[], schoolId: string): LinkedStudent[] {
  return linked.filter((s) => s.schoolId === schoolId);
}

/**
 * The desk token is issued for one school with the person's staff roles from that school
 * (e.g. ["staff","bursar"], ["teacher","deputy_principal"]). Membership rows only hold coarse
 * slugs (accountant, teacher), and sometimes roles the server no longer grants. For the token's
 * school the token is what the server acts on, so its roles replace the membership ones whenever
 * it holds a specific school role; other schools keep their membership roles.
 */
export function withTokenRoles(
  schools: UserSchool[],
  claims: { schoolId: string | null; roles: string[] } | null | undefined,
): UserSchool[] {
  if (!claims?.schoolId) return schools;
  const specific = withoutGenericRoles(claims.roles).filter(
    (r) => r !== 'individual' && r !== 'super_admin' && r !== 'superadmin',
  );
  if (!specific.length) return schools;
  // Keep "staff" with the specific roles: the picker ignores it, but the server still opens shared
  // routes (fleet map, discipline) on it, so it must travel in X-Desk-Roles.
  const roles = claims.roles.filter((r) => r !== 'individual' && r !== 'super_admin' && r !== 'superadmin');
  return schools.map((s) => (s.id === claims.schoolId ? { ...s, roles } : s));
}

/**
 * Roles to send as X-Desk-Roles and to gate tiles with: the person's own roles behind the active
 * hat at the selected school, or the hat itself when the school row has none of its roles
 * (super-admin adopting a hat, learner without role tags).
 */
export function activeRolesForHat(schoolRoles: unknown, hat: string | null | undefined): string[] {
  if (!hat) return normalizeDeskRoles(schoolRoles);
  const mine = rolesForHat(schoolRoles, hat);
  return mine.length ? mine : [mapRoleToMobileHat(hat)];
}

/**
 * Is a remembered context (last school + role the user opened as) still one the user holds?
 * Individual (skipped) is always available; a school must still list the user and still grant the hat.
 */
export function rememberedContextUsable(
  schools: UserSchool[],
  remembered: { schoolId: string | null; role: string | null; skipped?: boolean } | null | undefined,
): boolean {
  if (!remembered) return false;
  if (remembered.skipped) return true;
  if (!remembered.schoolId) return false;
  const school = schools.find((s) => s.id === remembered.schoolId);
  if (!school) return false;
  const hats = uniqueSchoolRoles(school.roles);
  if (!remembered.role) return hats.length <= 1;
  const raw = String(remembered.role).toLowerCase().trim();
  return hats.includes(raw) || hats.includes(mapRoleToMobileHat(raw));
}

export function resolveContext(
  schools: UserSchool[],
  linked: LinkedStudent[],
  stored: StoredContext | null,
  opts?: { forcePick?: boolean },
): ResolvedContext {
  const empty: ResolvedContext = {
    schoolId: null,
    studentId: null,
    activeRole: null,
    needsPick: false,
    pickerMode: 'school',
    schoolRoleOptions: [],
  };

  if (!schools.length) {
    // No school link → individual/student dashboard (same hat). Do not block on Select school.
    return { ...empty, activeRole: 'student' };
  }

  if (stored?.skipped && !opts?.forcePick) {
    return { ...empty, activeRole: 'student' };
  }

  // ── Step 1: resolve school ──
  let schoolId: string | null = null;
  const multiRole = distinctHatsAcrossSchools(schools).length > 1;

  if (schools.length === 1) {
    schoolId = schools[0].id;
  } else if (opts?.forcePick && multiRole) {
    return { ...empty, needsPick: true, pickerMode: 'school' };
  } else if (stored?.schoolId && schools.some((s) => s.id === stored.schoolId)) {
    schoolId = stored.schoolId;
  } else if (!multiRole) {
    // One role (individual+student collapsed) across schools — auto-pick; switcher later. A parent
    // opens where they have children, not on an empty school.
    schoolId = (schools.find((s) => (s.students?.length ?? 0) > 0) ?? schools[0]).id;
  } else {
    return { ...empty, needsPick: true, pickerMode: 'school' };
  }

  const school = schools.find((s) => s.id === schoolId)!;
  const schoolRoles = uniqueSchoolRoles(school.roles);
  const storedRaw = stored?.activeRole ? String(stored.activeRole).toLowerCase().trim() : null;
  const storedHat = storedRaw ? mapRoleToMobileHat(storedRaw) : null;
  // A hat the school no longer grants (role changed or removed) is dropped, not reopened.
  let activeRole =
    storedHat && schoolRoles.includes(storedHat)
      ? storedHat
      : storedRaw && schoolRoles.includes(storedRaw)
        ? storedRaw
        : null;

  // ── Step 2: resolve role at school (never ask when exactly one role) ──
  if (schoolRoles.length === 1) {
    activeRole = schoolRoles[0];
  } else if (schoolRoles.length > 1 && !activeRole) {
    return {
      schoolId,
      studentId: null,
      activeRole: null,
      needsPick: true,
      pickerMode: 'role',
      schoolRoleOptions: schoolRoles,
    };
  } else if (schoolRoles.length === 0) {
    // Membership with no role tags — continue with null role (dashboard may be limited).
    activeRole = null;
  }

  // ── Step 3: parent → student (block dashboard until an approved child link) ──
  if (activeRole && isParentDeskRole(activeRole)) {
    const kids = linkedStudentsAtSchool(linked, schoolId);
    const base = { schoolId, activeRole, schoolRoleOptions: schoolRoles, pickerMode: 'student' as const };
    if (kids.length === 1) {
      return { ...base, studentId: kids[0].id, needsPick: false };
    }
    if (kids.length > 1 && !opts?.forcePick && stored?.studentId) {
      const match = kids.find((s) => s.id === stored.studentId);
      if (match) return { ...base, studentId: match.id, needsPick: false };
    }
    // None yet (stay on Select student + Add) or several to choose from.
    return { ...base, studentId: null, needsPick: true };
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

/** Re-exported for the role tests (desktop/scripts/testing/mobile-roles-unit.mjs). */
export { holdsAnyRole } from './deskRoles';
