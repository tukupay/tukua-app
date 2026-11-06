/**
 * Desk (CBE/school) roles — mirrors yana/desktop packages/types + Login redirect hierarchy.
 *
 * Mobile dashboards (native): parent · student · teacher · security · school_admin · individual.
 * Principal / deputy / admin / bursar / accountant / registrar → school_admin (office dashboard; actions are
 * still gated by the person's own roles). BOM hats stay individual.
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
  'school_admin',
  'individual',
] as const;

export type MobileDashboardRole = (typeof MOBILE_DASHBOARD_ROLES)[number];

/** Generic staff → teacher dashboard. */
const TEACHER_LIKE = new Set(['staff', 'user']);

/** Teaching specialists (Desk staff roles) → teacher dashboard; their own tiles stay role-gated. */
const TEACHING_SPECIALIST = new Set([
  'class_teacher',
  'dean_of_studies',
  'dean',
  'hod',
  'head_of_department',
  'discipline_master',
  'timetable_manager',
  'librarian',
  'games_master',
  'exams_officer',
]);

/** Catch-all roles that never decide a dashboard when the person holds a specific one. */
const GENERIC_ROLES = new Set(['staff', 'user', 'individual']);

/** School office: leadership, finance and registry → school_admin dashboard. */
const ADMIN_LIKE = new Set([
  'school_admin',
  'admin',
  'principal',
  'deputy',
  'deputy_principal',
  'org_admin',
  'bursar',
  'accountant',
  'accounts_clerk',
  'finance_officer',
  'registrar',
]);

/** Board → light individual-style dashboard. */
const INDIVIDUAL_LIKE = new Set(['bom', 'board_member', 'board', 'bom_member']);

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
  if (ADMIN_LIKE.has(r) || r === 'owner') return 'school_admin';
  if (r === 'teacher' || TEACHER_LIKE.has(r) || TEACHING_SPECIALIST.has(r)) return 'teacher';
  if (r === 'parent') return 'parent';
  if (r === 'student') return 'student';
  if (r === 'individual') return 'individual';
  if (INDIVIDUAL_LIKE.has(r)) return 'individual';
  return r;
}

/**
 * Collapse learner hats: individual + student count as one role for the picker.
 * Prefer `student` when either appears (school learner / Tukua individual).
 */
export function collapseLearnerHats(hats: string[]): string[] {
  const out: string[] = [];
  let sawLearner = false;
  for (const hat of hats) {
    if (hat === 'individual' || hat === 'student') {
      if (sawLearner) continue;
      sawLearner = true;
      out.push('student');
      continue;
    }
    out.push(hat);
  }
  return out;
}

/**
 * Drop catch-all roles (staff, user, individual) when a specific school role is held, so a bursar
 * holding ["staff","bursar"] is offered the office dashboard only, not a teacher one as well.
 */
export function withoutGenericRoles(rolesInput: unknown): string[] {
  const roles = normalizeDeskRoles(rolesInput);
  const specific = roles.filter((r) => !GENERIC_ROLES.has(r));
  return specific.length ? specific : roles;
}

/**
 * The person's own roles that sit behind one dashboard hat, plus the catch-alls (staff, user) the
 * server still checks on shared routes. Sent as X-Desk-Roles (the server keeps only roles the token
 * holds) and used to gate tiles: a deputy principal on the teacher hat keeps "teacher", a discipline
 * master keeps "discipline_master", and the hat name itself is never added as if it were a role.
 */
export function rolesForHat(rolesInput: unknown, hat: string | null | undefined): string[] {
  const roles = normalizeDeskRoles(rolesInput);
  if (!hat) return roles;
  const want = mapRoleToMobileHat(hat);
  // The office dashboard is the widest view: keep every role (a deputy principal still teaches,
  // a bursar is still "staff"), so its reads match the Desk office app.
  if (want === 'school_admin') {
    return roles.some((r) => mapRoleToMobileHat(r) === 'school_admin') ? roles.filter((r) => r !== 'individual') : [];
  }
  const mine = roles.filter((r) => mapRoleToMobileHat(r) === want && !GENERIC_ROLES.has(r));
  if (!mine.length) return [];
  const generic = roles.filter((r) => r === 'staff' || r === 'user');
  return [...new Set([...mine, ...generic])];
}

/** Role chips for the school picker / SA “use as” flow (no school_admin / SA hub). */
export function mobilePickerRolesFrom(rolesInput: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of withoutGenericRoles(rolesInput)) {
    const hat = mapRoleToMobileHat(raw);
    if (hat === 'super_admin') continue;
    if (!MOBILE_DASHBOARD_ROLES.includes(hat as MobileDashboardRole)) continue;
    if (seen.has(hat)) continue;
    seen.add(hat);
    out.push(hat);
  }
  return sortDeskRolesForPicker(collapseLearnerHats(out));
}

/** SA can switch into any native mobile persona at any school. */
export const SUPER_ADMIN_MOBILE_HATS: MobileDashboardRole[] = [
  'school_admin',
  'teacher',
  'security',
  'parent',
  'student',
  'individual',
];

/**
 * Primary mobile dashboard persona after login.
 * - Desk Nest roles preferred when present
 * - Else Nest org roles (same school roles)
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
  if (hats.includes('school_admin')) return 'school_admin';
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
  const hat = mapRoleToMobileHat(r);
  if (hat === 'parent') return 'Parent';
  if (hat === 'student') return 'Student';
  if (hat === 'teacher') return 'Teacher';
  if (hat === 'security') return 'Security';
  if (hat === 'individual') return 'Individual';
  if (hat === 'super_admin') return 'Super admin';
  // Office hats keep their own title on the picker (Principal, Bursar, Registrar…).
  return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Stable display order for multi-role picker. */
export function sortDeskRolesForPicker(roles: string[]): string[] {
  const order = [
    'school_admin',
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

/** Roles the server adds to what a person holds (auth-claim.util.ts withImpliedRoles). */
const IMPLIED_ROLES: Record<string, string> = {
  principal: 'school_admin',
  bursar: 'finance_officer',
  accountant: 'finance_officer',
};

/**
 * Tile gate: exact role names (plus the server's implied ones). Substring matching let
 * "deputy_principal" pass a "principal" gate and showed tiles the server then refused.
 */
export function holdsAnyRole(held: string[], need: string[]): boolean {
  const have = new Set<string>();
  for (const r of held.map(normalizeRole)) {
    have.add(r);
    if (IMPLIED_ROLES[r]) have.add(IMPLIED_ROLES[r]);
  }
  return need.some((n) => have.has(normalizeRole(n)));
}

export function isParentDeskRole(role: string | null | undefined): boolean {
  return mapRoleToMobileHat(normalizeRole(role)) === 'parent';
}
