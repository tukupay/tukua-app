/**
 * Desk (CBE/school) roles — mirrors yana/desktop packages/types + Login redirect hierarchy.
 */

export type DeskPersona =
  | 'parent'
  | 'student'
  | 'teacher'
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
  // Teacher check BEFORE school hub roles
  if (roles.includes('teacher')) return 'teacher';
  if (roles.some((r) => SCHOOL_HUB_ROLES.has(r))) {
    return 'school_admin';
  }
  if (roles.includes('parent')) return 'parent';
  if (roles.includes('student')) return 'student';

  // School-linked but no known persona role → don't invent school_admin
  // (parents/students often have membership without a role_slug).
  if (schoolLinked && roles.length === 0) return 'individual';
  if (schoolLinked) return 'school_admin';

  // Not linked to a school — individual Tukua user (courses / chat)
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
    case 'school_admin':
      return 'School admin';
    case 'super_admin':
      return 'Super admin';
    case 'individual':
      return 'Individual';
  }
}
