/**
 * School memberships from Supabase (organization_users + org_parents/org_students).
 * Supports multi-school parents/teachers.
 */

import { supabase } from './supabase';
import { log } from './logger';

export type OrgMembership = {
  roles: string[];
  organizationId: string | null;
  organizationName: string | null;
};

export type UserSchool = {
  id: string;
  name: string;
  logoUrl?: string | null;
  shortName?: string | null;
  roles: string[];
  /** Linked students for this school (parents). */
  students?: SchoolStudent[];
};

export type SchoolStudent = {
  id: string;
  name: string;
  admissionNumber?: string | null;
  relationship?: string | null;
  className?: string | null;
  avatarUrl?: string | null;
};

/** Parent-facing pick: one row per linked child (school is secondary). */
export type LinkedStudent = {
  key: string;
  id: string;
  name: string;
  admissionNumber?: string | null;
  relationship?: string | null;
  className?: string | null;
  avatarUrl?: string | null;
  schoolId: string;
  schoolName: string;
  schoolLogoUrl?: string | null;
  schoolRoles: string[];
};

export function flattenLinkedStudents(schools: UserSchool[]): LinkedStudent[] {
  const out: LinkedStudent[] = [];
  for (const school of schools) {
    for (const student of school.students ?? []) {
      out.push({
        key: `${school.id}:${student.id}`,
        id: student.id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        relationship: student.relationship,
        className: student.className,
        avatarUrl: student.avatarUrl,
        schoolId: school.id,
        schoolName: school.name,
        schoolLogoUrl: school.logoUrl,
        schoolRoles: school.roles,
      });
    }
  }
  return out;
}

/** Map Supabase org role slugs → desk persona role names. */
function mapOrgRoleSlug(slug: string): string {
  const s = slug.toLowerCase().trim();
  if (s === 'accountant' || s === 'bursar' || s === 'finance') return 'finance_officer';
  if (s === 'org_admin' || s === 'owner') return 'school_admin';
  return s;
}

async function loadOrganizationIds(userId: string): Promise<string[]> {
  const ids = new Set<string>();

  const [memRes, parentRes, studentRes] = await Promise.all([
    supabase
      .from('organization_users')
      .select('organization_id, status, is_primary')
      .eq('user_id', userId),
    supabase.from('org_parents').select('organization_id').eq('user_id', userId),
    supabase.from('org_students').select('organization_id').eq('user_id', userId),
  ]);

  if (memRes.error) {
    log.warn('OrgRoles', 'organization_users query failed', memRes.error.message);
    const { data: fallback } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId);
    for (const row of fallback ?? []) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  } else {
    const memberships = memRes.data ?? [];
    const active = memberships.filter(
      (m) => !m.status || String(m.status).toLowerCase() === 'active',
    );
    const list = active.length ? active : memberships;
    const sorted = [...list].sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)));
    for (const row of sorted) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  }

  if (parentRes.error) {
    log.warn('OrgRoles', 'org_parents scan failed', parentRes.error.message);
  } else {
    for (const row of parentRes.data ?? []) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  }

  if (studentRes.error) {
    log.warn('OrgRoles', 'org_students scan failed', studentRes.error.message);
  } else {
    for (const row of studentRes.data ?? []) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  }

  return [...ids];
}

async function rolesForOrg(userId: string, organizationId: string): Promise<string[]> {
  const { data: roleRows, error } = await supabase
    .from('organization_user_roles')
    .select('role_slug')
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error) {
    log.warn('OrgRoles', 'organization_user_roles query failed', error.message);
    const inferred = await inferSchoolPersonaRole(userId, organizationId);
    return inferred ? [inferred] : [];
  }

  let roles = (roleRows ?? [])
    .map((r) => mapOrgRoleSlug(String((r as { role_slug?: string }).role_slug ?? '')))
    .filter(Boolean);

  if (!roles.length) {
    const inferred = await inferSchoolPersonaRole(userId, organizationId);
    if (inferred) roles = [inferred];
  }
  return roles;
}

/** All schools the user belongs to (parents can have many). */
const schoolsInflight = new Map<string, Promise<UserSchool[]>>();

export async function fetchUserSchools(userId: string): Promise<UserSchool[]> {
  if (!userId) return [];

  const existing = schoolsInflight.get(userId);
  if (existing) return existing;

  const promise = (async (): Promise<UserSchool[]> => {
    try {
      const orgIds = await loadOrganizationIds(userId);
      if (!orgIds.length) return [];

      const [{ data: orgs, error: orgErr }, studentsByOrg, rolesList] = await Promise.all([
        supabase.from('organizations').select('id, name, short_name, logo_url').in('id', orgIds),
        fetchStudentsBySchool(userId, orgIds),
        Promise.all(orgIds.map((id) => rolesForOrg(userId, id))),
      ]);

      if (orgErr) {
        log.warn('OrgRoles', 'organizations query failed', orgErr.message);
        return orgIds.map((id, i) => ({
          id,
          name: 'School',
          roles: rolesList[i] ?? [],
          students: studentsByOrg.get(id) ?? [],
        }));
      }

      const byId = new Map((orgs ?? []).map((o) => [String(o.id), o]));
      const schools: UserSchool[] = orgIds.map((id, i) => {
        const org = byId.get(id);
        return {
          id,
          name: String(org?.name ?? org?.short_name ?? 'School'),
          shortName: org?.short_name ? String(org.short_name) : null,
          logoUrl: org?.logo_url ? String(org.logo_url) : null,
          roles: rolesList[i] ?? [],
          students: studentsByOrg.get(id) ?? [],
        };
      });

      log.info('OrgRoles', 'schools loaded', {
        userId,
        count: schools.length,
        ids: schools.map((s) => s.id),
      });
      return schools;
    } catch (e) {
      log.warn('OrgRoles', String(e));
      return [];
    } finally {
      schoolsInflight.delete(userId);
    }
  })();

  schoolsInflight.set(userId, promise);
  return promise;
}

/**
 * Legacy single-membership helper — prefers primary / first school.
 * Prefer `fetchUserSchools` for multi-school flows.
 */
export async function fetchOrgMembership(userId: string): Promise<OrgMembership> {
  const empty: OrgMembership = { roles: [], organizationId: null, organizationName: null };
  if (!userId) return empty;

  const schools = await fetchUserSchools(userId);
  if (!schools.length) return empty;

  const first = schools[0];
  return {
    roles: first.roles,
    organizationId: first.id,
    organizationName: first.name,
  };
}

/** Desk seed stores parents/students in membership tables, not always in role slugs. */
async function inferSchoolPersonaRole(
  userId: string,
  organizationId: string,
): Promise<'parent' | 'student' | null> {
  try {
    const { data: parentRow } = await supabase
      .from('org_parents')
      .select('user_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle();
    if (parentRow) return 'parent';

    const { data: studentRow } = await supabase
      .from('org_students')
      .select('user_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle();
    if (studentRow) return 'student';
  } catch (e) {
    log.warn('OrgRoles', 'inferSchoolPersonaRole failed', String(e));
  }
  return null;
}

async function fetchStudentsBySchool(
  parentUserId: string,
  organizationIds: string[],
): Promise<Map<string, SchoolStudent[]>> {
  const map = new Map<string, SchoolStudent[]>();
  if (!parentUserId || !organizationIds.length) return map;

  try {
    const { data: links, error } = await supabase
      .from('org_parent_students')
      .select('organization_id, student_user_id, relationship, is_active')
      .eq('parent_user_id', parentUserId)
      .in('organization_id', organizationIds);

    if (error) {
      log.warn('OrgRoles', 'org_parent_students query failed', error.message);
      return map;
    }

    const active = (links ?? []).filter((l) => l.is_active !== false);
    const studentIds = [...new Set(active.map((l) => String(l.student_user_id)).filter(Boolean))];
    if (!studentIds.length) return map;

    const [{ data: profiles }, { data: studentRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, avatar_url, username').in('id', studentIds),
      supabase
        .from('org_students')
        .select('organization_id, user_id, admission_number, current_class_id')
        .in('organization_id', organizationIds)
        .in('user_id', studentIds),
    ]);

    const classIds = [
      ...new Set(
        (studentRows ?? [])
          .map((s) => (s.current_class_id ? String(s.current_class_id) : ''))
          .filter(Boolean),
      ),
    ];
    let classById = new Map<string, { name?: string | null; code?: string | null; level?: string | null }>();
    if (classIds.length) {
      const { data: classes, error: classErr } = await supabase
        .from('org_classes')
        .select('id, name, code, level')
        .in('id', classIds);
      if (classErr) {
        log.warn('OrgRoles', 'org_classes query failed', classErr.message);
      } else {
        classById = new Map((classes ?? []).map((c) => [String(c.id), c]));
      }
    }

    const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
    const studentMetaByKey = new Map(
      (studentRows ?? []).map((s) => [
        `${s.organization_id}:${s.user_id}`,
        {
          admission: s.admission_number ? String(s.admission_number) : null,
          classId: s.current_class_id ? String(s.current_class_id) : null,
        },
      ]),
    );

    for (const link of active) {
      const orgId = String(link.organization_id);
      const studentId = String(link.student_user_id);
      const profile = profileById.get(studentId);
      const meta = studentMetaByKey.get(`${orgId}:${studentId}`);
      const classRow = meta?.classId ? classById.get(meta.classId) : undefined;
      const className =
        String(classRow?.name ?? '').trim() ||
        [classRow?.level, classRow?.code].filter(Boolean).join(' ').trim() ||
        null;
      const name =
        String(profile?.full_name ?? '').trim() ||
        String((profile as { username?: string | null })?.username ?? '').trim() ||
        String(profile?.email ?? '').split('@')[0] ||
        (meta?.admission ? `Student ${meta.admission}` : 'Student');
      const list = map.get(orgId) ?? [];
      list.push({
        id: studentId,
        name,
        admissionNumber: meta?.admission ?? null,
        relationship: link.relationship ? String(link.relationship) : null,
        className,
        avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : null,
      });
      map.set(orgId, list);
    }

    log.info('OrgRoles', 'students loaded for picker', {
      parentUserId,
      links: active.length,
      withClass: [...map.values()].flat().filter((s) => s.className).length,
    });
  } catch (e) {
    log.warn('OrgRoles', 'fetchStudentsBySchool failed', String(e));
  }

  return map;
}
