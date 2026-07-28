/**
 * Desk (CBE/school) roles — mirrors yana/desktop packages/types + Login redirect hierarchy.
 */

export type DeskPersona =
  | 'parent'
  | 'student'
  | 'teacher'
  | 'security'
  | 'school_admin'
  | 'super_admin'
  | 'individual';

const SCHOOL_HUB_ROLES = new Set([
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
]);

function normalizeRole(raw: unknown): string {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

export function normalizeDeskRoles(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(normalizeRole).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      if (trimmed.startsWith('[')) {
        return normalizeDeskRoles(JSON.parse(trimmed));
      }
    } catch {
      // fall through
    }
    return [normalizeRole(trimmed)];
  }
  return [];
}

/**
 * Primary mobile dashboard persona after login.
 * - Desk Nest roles preferred when present
 * - Else Supabase org roles (same school roles)
 * - No roles / no school → individual (Tukua learner)
 */
export function resolveDeskPersona(
  rolesInput: unknown,
  opts?: { schoolId?: string | null; schoolLinked?: boolean; hasDeskSession?: boolean },
): DeskPersona {
  const roles = normalizeDeskRoles(rolesInput);
  const schoolLinked = Boolean(opts?.schoolLinked || opts?.schoolId);

  if (roles.includes('super_admin') || roles.includes('superadmin')) {
    return 'super_admin';
  }
  if (roles.includes('security')) return 'security';
  // Teacher check BEFORE school hub roles
  if (roles.includes('teacher')) return 'teacher';
  if (roles.some((r) => SCHOOL_HUB_ROLES.has(r))) {
    return 'school_admin';
  }
  if (roles.includes('parent')) return 'parent';
  if (roles.includes('student')) return 'student';

  if (schoolLinked && roles.length === 0) return 'individual';
  if (schoolLinked) return 'school_admin';

  return 'individual';
}

export function personaLabel(persona: DeskPersona): string {
  switch (persona) {
    case 'parent':
      return 'Parent';
    case 'student':
      return 'Student';
    case 'teacher':
      return 'Teacher';
    case 'security':
      return 'Security';
    case 'school_admin':
      return 'School admin';
    case 'super_admin':
      return 'Super admin';
    case 'individual':
      return 'Individual';
  }
}

/** Human label for a raw org/desk role slug (picker cards). */
export function deskRoleLabel(role: string): string {
  const r = normalizeRole(role);
  if (r === 'parent') return 'Parent';
  if (r === 'student') return 'Student';
  if (r === 'teacher') return 'Teacher';
  if (r === 'security') return 'Security';
  if (r === 'finance_officer' || r === 'accountant' || r === 'bursar') return 'Finance';
  if (r === 'school_admin' || r === 'org_admin' || r === 'admin' || r === 'principal') {
    return 'School admin';
  }
  if (r === 'super_admin' || r === 'superadmin') return 'Super admin';
  if (r === 'bom' || r === 'board_member' || r === 'board' || r === 'bom_member') return 'Board';
  if (r === 'staff' || r === 'user') return 'Staff';
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Stable display order for multi-role picker. */
export function sortDeskRolesForPicker(roles: string[]): string[] {
  const order = [
    'super_admin',
    'superadmin',
    'school_admin',
    'admin',
    'principal',
    'org_admin',
    'finance_officer',
    'accountant',
    'bursar',
    'teacher',
    'security',
    'staff',
    'parent',
    'student',
    'bom',
    'board_member',
  ];
  const rank = (r: string) => {
    const i = order.indexOf(r);
    return i >= 0 ? i : 99;
  };
  return [...roles].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export function isParentDeskRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'parent';
}
