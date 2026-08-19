/**
 * School memberships via Nest REST (`POST /platform/db` + `/parents/me/children`).
 * Supports multi-school parents/teachers via Nest REST.
 */

import { getNestApiBaseUrl } from './localHost';
import { log } from './logger';
import { resolveNestAccessTokenForWebView } from './platformNestAuth';

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

type PlatformDbFilter = {
  op: 'eq' | 'neq' | 'in' | 'ilike' | 'gte' | 'lte' | 'gt' | 'lt' | 'is';
  column: string;
  value: unknown;
};

async function platformDbSelect<T = Record<string, unknown>>(opts: {
  table: string;
  select?: string;
  filters?: PlatformDbFilter[];
  limit?: number;
  maybeSingle?: boolean;
}): Promise<{ data: T[] | T | null; error: string | null }> {
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (!token) return { data: opts.maybeSingle ? null : [], error: 'Sign in required' };
    const base = getNestApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/platform/db`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        table: opts.table,
        action: 'select',
        select: opts.select || '*',
        filters: opts.filters || [],
        limit: opts.limit,
        maybeSingle: opts.maybeSingle,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        (typeof json?.message === 'string' && json.message) ||
        (typeof json?.error === 'string' && json.error) ||
        `platform/db ${res.status}`;
      return { data: opts.maybeSingle ? null : [], error: msg };
    }
    const payload = json?.data?.data ?? json?.data ?? null;
    if (opts.maybeSingle) {
      return { data: (payload as T) ?? null, error: null };
    }
    return { data: (Array.isArray(payload) ? payload : []) as T[], error: null };
  } catch (e) {
    return {
      data: opts.maybeSingle ? null : [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

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

/** Map org role slugs → desk persona role names. */
function mapOrgRoleSlug(slug: string): string {
  const s = slug.toLowerCase().trim();
  if (s === 'accountant' || s === 'bursar' || s === 'finance') return 'finance_officer';
  if (s === 'org_admin' || s === 'owner') return 'school_admin';
  return s;
}

async function loadOrganizationIds(userId: string): Promise<string[]> {
  const ids = new Set<string>();

  const [memRes, parentRes, studentRes] = await Promise.all([
    platformDbSelect<{ organization_id?: string; status?: string; is_primary?: boolean }>({
      table: 'organization_users',
      select: 'organization_id, status, is_primary',
      filters: [{ op: 'eq', column: 'user_id', value: userId }],
    }),
    platformDbSelect<{ organization_id?: string }>({
      table: 'org_parents',
      select: 'organization_id',
      filters: [{ op: 'eq', column: 'user_id', value: userId }],
    }),
    platformDbSelect<{ organization_id?: string }>({
      table: 'org_students',
      select: 'organization_id',
      filters: [{ op: 'eq', column: 'user_id', value: userId }],
    }),
  ]);

  if (memRes.error) {
    log.warn('OrgRoles', 'organization_users query failed', memRes.error);
  } else {
    const memberships = (Array.isArray(memRes.data) ? memRes.data : []) as Array<{
      organization_id?: string;
      status?: string;
      is_primary?: boolean;
    }>;
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
    log.warn('OrgRoles', 'org_parents scan failed', parentRes.error);
  } else {
    for (const row of (Array.isArray(parentRes.data) ? parentRes.data : []) as Array<{
      organization_id?: string;
    }>) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  }

  if (studentRes.error) {
    log.warn('OrgRoles', 'org_students scan failed', studentRes.error);
  } else {
    for (const row of (Array.isArray(studentRes.data) ? studentRes.data : []) as Array<{
      organization_id?: string;
    }>) {
      if (row.organization_id) ids.add(String(row.organization_id));
    }
  }

  return [...ids];
}

async function rolesForOrg(userId: string, organizationId: string): Promise<string[]> {
  const { data: roleRows, error } = await platformDbSelect<{ role_slug?: string }>({
    table: 'organization_user_roles',
    select: 'role_slug',
    filters: [
      { op: 'eq', column: 'user_id', value: userId },
      { op: 'eq', column: 'organization_id', value: organizationId },
    ],
  });

  if (error) {
    log.warn('OrgRoles', 'organization_user_roles query failed', error);
    const inferred = await inferSchoolPersonaRole(userId, organizationId);
    return inferred ? [inferred] : [];
  }

  let roles = (Array.isArray(roleRows) ? roleRows : [])
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
        platformDbSelect<{ id?: string; name?: string; short_name?: string; logo_url?: string }>({
          table: 'organizations',
          select: 'id, name, short_name, logo_url',
          filters: [{ op: 'in', column: 'id', value: orgIds }],
        }),
        fetchStudentsBySchool(userId, orgIds),
        Promise.all(orgIds.map((id) => rolesForOrg(userId, id))),
      ]);

      if (orgErr) {
        log.warn('OrgRoles', 'organizations query failed', orgErr);
        return orgIds.map((id, i) => ({
          id,
          name: 'School',
          roles: rolesList[i] ?? [],
          students: studentsByOrg.get(id) ?? [],
        }));
      }

      const orgList = (Array.isArray(orgs) ? orgs : []) as Array<{
        id?: string;
        name?: string;
        short_name?: string;
        logo_url?: string;
      }>;
      const byId = new Map(orgList.map((o) => [String(o.id), o]));
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
    const { data: parentRow } = await platformDbSelect<{ user_id?: string }>({
      table: 'org_parents',
      select: 'user_id',
      filters: [
        { op: 'eq', column: 'user_id', value: userId },
        { op: 'eq', column: 'organization_id', value: organizationId },
      ],
      limit: 1,
      maybeSingle: true,
    });
    if (parentRow) return 'parent';

    const { data: studentRow } = await platformDbSelect<{ user_id?: string }>({
      table: 'org_students',
      select: 'user_id',
      filters: [
        { op: 'eq', column: 'user_id', value: userId },
        { op: 'eq', column: 'organization_id', value: organizationId },
      ],
      limit: 1,
      maybeSingle: true,
    });
    if (studentRow) return 'student';
  } catch (e) {
    log.warn('OrgRoles', 'inferSchoolPersonaRole failed', String(e));
  }
  return null;
}

async function nestParentsChildren(organizationId: string): Promise<SchoolStudent[]> {
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (!token) return [];
    const base = getNestApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/parents/me/children`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Desk-School-Id': organizationId,
      },
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const data = json?.data ?? json;
    const children = Array.isArray(data?.children) ? data.children : [];
    return children.map(
      (c: {
        student_id?: string;
        full_name?: string;
        admission_number?: string | null;
        relationship?: string | null;
        class_name?: string | null;
        avatar_url?: string | null;
        photo_url?: string | null;
      }) => ({
        id: String(c.student_id || ''),
        name: String(c.full_name || '').trim() || 'Student',
        admissionNumber: c.admission_number ? String(c.admission_number) : null,
        relationship: c.relationship ? String(c.relationship) : null,
        className: c.class_name ? String(c.class_name) : null,
        avatarUrl: c.avatar_url || c.photo_url ? String(c.avatar_url || c.photo_url) : null,
      }),
    ).filter((s: SchoolStudent) => s.id);
  } catch {
    return [];
  }
}

async function fetchStudentsBySchool(
  parentUserId: string,
  organizationIds: string[],
): Promise<Map<string, SchoolStudent[]>> {
  const map = new Map<string, SchoolStudent[]>();
  if (!parentUserId || !organizationIds.length) return map;

  try {
    // Prefer Nest parent portal (names + class) per school via X-Desk-School-Id.
    const nested = await Promise.all(
      organizationIds.map(async (orgId) => {
        const kids = await nestParentsChildren(orgId);
        return [orgId, kids] as const;
      }),
    );
    let anyKids = false;
    for (const [orgId, kids] of nested) {
      if (kids.length) {
        anyKids = true;
        map.set(orgId, kids);
      }
    }
    if (anyKids) {
      log.info('OrgRoles', 'students loaded via Nest parents/me/children', {
        parentUserId,
        schools: [...map.keys()].length,
      });
      return map;
    }

    // Fallback: platform/db link tables (profiles are user-scoped — use admission labels).
    const { data: links, error } = await platformDbSelect<{
      organization_id?: string;
      student_user_id?: string;
      relationship?: string;
      is_active?: boolean;
    }>({
      table: 'org_parent_students',
      select: 'organization_id, student_user_id, relationship, is_active',
      filters: [
        { op: 'eq', column: 'parent_user_id', value: parentUserId },
        { op: 'in', column: 'organization_id', value: organizationIds },
      ],
    });

    if (error) {
      log.warn('OrgRoles', 'org_parent_students query failed', error);
      return map;
    }

    const active = (Array.isArray(links) ? links : []).filter((l) => l.is_active !== false);
    const studentIds = [...new Set(active.map((l) => String(l.student_user_id)).filter(Boolean))];
    if (!studentIds.length) return map;

    const { data: studentRows } = await platformDbSelect<{
      organization_id?: string;
      user_id?: string;
      admission_number?: string | null;
      current_class_id?: string | null;
    }>({
      table: 'org_students',
      select: 'organization_id, user_id, admission_number, current_class_id',
      filters: [
        { op: 'in', column: 'organization_id', value: organizationIds },
        { op: 'in', column: 'user_id', value: studentIds },
      ],
    });

    const classIds = [
      ...new Set(
        (Array.isArray(studentRows) ? studentRows : [])
          .map((s) => (s.current_class_id ? String(s.current_class_id) : ''))
          .filter(Boolean),
      ),
    ];
    let classById = new Map<string, { name?: string | null; code?: string | null; level?: string | null }>();
    if (classIds.length) {
      const { data: classes, error: classErr } = await platformDbSelect<{
        id?: string;
        name?: string | null;
        code?: string | null;
        level?: string | null;
      }>({
        table: 'org_classes',
        select: 'id, name, code, level',
        filters: [{ op: 'in', column: 'id', value: classIds }],
      });
      if (classErr) {
        log.warn('OrgRoles', 'org_classes query failed', classErr);
      } else {
        classById = new Map(
          (Array.isArray(classes) ? classes : []).map((c) => [String(c.id), c]),
        );
      }
    }

    const studentMetaByKey = new Map(
      (Array.isArray(studentRows) ? studentRows : []).map((s) => [
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
      const meta = studentMetaByKey.get(`${orgId}:${studentId}`);
      const classRow = meta?.classId ? classById.get(meta.classId) : undefined;
      const className =
        String(classRow?.name ?? '').trim() ||
        [classRow?.level, classRow?.code].filter(Boolean).join(' ').trim() ||
        null;
      const list = map.get(orgId) ?? [];
      list.push({
        id: studentId,
        name: meta?.admission ? `Student ${meta.admission}` : 'Student',
        admissionNumber: meta?.admission ?? null,
        relationship: link.relationship ? String(link.relationship) : null,
        className,
        avatarUrl: null,
      });
      map.set(orgId, list);
    }

    log.info('OrgRoles', 'students loaded via platform/db', {
      parentUserId,
      links: active.length,
    });
  } catch (e) {
    log.warn('OrgRoles', 'fetchStudentsBySchool failed', String(e));
  }

  return map;
}
