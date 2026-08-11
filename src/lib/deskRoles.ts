/**
 * Desk (CBE/school) roles — mirrors yana/desktop packages/types + Login redirect hierarchy.
 *
 * Mobile dashboards (native): parent · student · teacher · security · individual.
 * School-admin / finance / BOM hats map into those (Desk remains the admin/finance surface).
 * Super-admin keeps a light switcher, then adopts one of the mobile hats.
 */

export type DeskPersona =
  | 'parent'
  | 'student'
  | 'teacher'
  | 'security'
  | 'school_admin'
  | 'super_admin'
  | 'individual';

/** Hats that have a first-class native mobile dashboard. */
export const MOBILE_DASHBOARD_ROLES = [
  'parent',
  'student',
  'teacher',
  'security',
  'individual',
] as const;

export type MobileDashboardRole = (typeof MOBILE_DASHBOARD_ROLES)[number];

/** Principal / school hub ops → teacher dashboard on mobile (Desk for heavy admin). */
const TEACHER_LIKE = new Set([
  'school_admin',
  'staff',
  'user',
  'admin',
  'principal',
  'org_admin',
]);

/** Finance / board → light individual-style dashboard (Desk for accounts). */
const INDIVIDUAL_LIKE = new Set([
  'bom',
  'board_member',
  'board',
  'bom_member',
  'accountant',
  'bursar',
  'finance_officer',
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
 * Collapse Desk hub roles into the mobile dashboard hat.
 * Platform SA stays `super_admin` until they adopt a school hat.
 */
export function mapRoleToMobileHat(role: string): string {
  const r = normalizeRole(role);
  if (r === 'super_admin' || r === 'superadmin') return 'super_admin';
  if (r === 'security') return 'security';
  if (r === 'teacher' || TEACHER_LIKE.has(r)) return 'teacher';
  if (r === 'parent') return 'parent';
  if (r === 'student') return 'student';
  if (r === 'individual') return 'individual';
  if (INDIVIDUAL_LIKE.has(r)) return 'individual';
  if (r === 'school_admin') return 'teacher';
  return r;
}

/** Role chips for the school picker / SA “use as” flow (no school_admin / SA hub). */
export function mobilePickerRolesFrom(rolesInput: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of normalizeDeskRoles(rolesInput)) {
    const hat = mapRoleToMobileHat(raw);
    if (hat === 'super_admin' || hat === 'school_admin') continue;
    if (!MOBILE_DASHBOARD_ROLES.includes(hat as MobileDashboardRole)) continue;
    if (seen.has(hat)) continue;
    seen.add(hat);
    out.push(hat);
  }
  return sortDeskRolesForPicker(out);
}

/** SA can switch into any native mobile persona at any school. */
export const SUPER_ADMIN_MOBILE_HATS: MobileDashboardRole[] = [
  'teacher',
  'security',
  'parent',
  'student',
  'individual',
];

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
  const hats = roles.map(mapRoleToMobileHat);
  const schoolLinked = Boolean(opts?.schoolLinked || opts?.schoolId);

  // Explicit SA-only (no adopted hat yet) → light switcher dashboard.
  if (hats.includes('super_admin') && !hats.some((h) => h !== 'super_admin')) {
    return 'super_admin';
  }

  // Prefer an adopted / concrete mobile hat over platform SA when both appear.
  if (hats.includes('security')) return 'security';
  if (hats.includes('teacher')) return 'teacher';
  if (hats.includes('parent')) return 'parent';
  if (hats.includes('student')) return 'student';
  if (hats.includes('individual')) return 'individual';
  if (hats.includes('super_admin')) return 'super_admin';

  if (schoolLinked) return 'individual';
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
      return 'Teacher';
    case 'super_admin':
      return 'Super admin';
    case 'individual':
      return 'Individual';
  }
}

/** Human label for a raw org/desk role slug (picker cards). */
export function deskRoleLabel(role: string): string {
  const r = normalizeRole(role);
  const hat = mapRoleToMobileHat(r);
  if (hat === 'parent') return 'Parent';
  if (hat === 'student') return 'Student';
  if (hat === 'teacher') return 'Teacher';
  if (hat === 'security') return 'Security';
  if (hat === 'individual') return 'Individual';
  if (hat === 'super_admin') return 'Super admin';
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Stable display order for multi-role picker. */
export function sortDeskRolesForPicker(roles: string[]): string[] {
  const order = [
    'teacher',
    'security',
    'parent',
    'student',
    'individual',
    'super_admin',
    'superadmin',
    'school_admin',
    'admin',
    'principal',
    'org_admin',
    'finance_officer',
    'accountant',
    'bursar',
    'staff',
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
  return mapRoleToMobileHat(normalizeRole(role)) === 'parent';
}
