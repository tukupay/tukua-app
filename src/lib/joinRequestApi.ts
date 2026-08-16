/**
 * Join-request helpers for “Add your student” (SchoolPicker).
 * Nest: GET /parents/join/schools|students, POST /parents/join/requests
 * Uses getNestApiBaseUrl (staging Railway) — never local Desk :3251 for these.
 */

import { getNestApiBaseUrl } from './localHost';
import { searchRegistrationSchools } from './platformAuthApi';
import { resolveNestAccessTokenForWebView } from './platformNestAuth';

export type JoinSchoolHit = {
  id: string;
  name: string;
  code?: string | null;
  logo_url?: string | null;
  county?: string | null;
  location?: string | null;
  description?: string | null;
  principal_name?: string | null;
};

export type JoinStudentHit = {
  id: string;
  /** Display name with second name partially masked. */
  name: string;
  /** Full admission / student number (not masked). */
  admission_number?: string | null;
  /** @deprecated Prefer admission_number */
  admission_masked?: string | null;
  class_name?: string | null;
  photo_url?: string | null;
  person_type?: 'student';
};

export type MembershipHit = {
  school_id: string;
  school_name: string;
  roles: string[];
  detail?: string;
  code?: string | null;
  county?: string | null;
  logo_url?: string | null;
};

type PlatformDbFilter = {
  op: 'eq' | 'in';
  column: string;
  value: unknown;
};

async function nestJoinFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await resolveNestAccessTokenForWebView();
  if (!token) throw new Error('Sign in required');
  const base = getNestApiBaseUrl().replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      `Nest ${res.status}`;
    throw new Error(msg);
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function platformDbSelect<T = Record<string, unknown>>(opts: {
  table: string;
  select?: string;
  filters?: PlatformDbFilter[];
}): Promise<T[]> {
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (!token) return [];
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
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return [];
    const payload = json?.data?.data ?? json?.data ?? [];
    return (Array.isArray(payload) ? payload : []) as T[];
  } catch {
    return [];
  }
}

/**
 * Belt-and-suspenders: even if Nest is stale and returns companies,
 * keep only org_type=school and/or rows that exist in admin_schools.
 */
async function keepSchoolsOnly(hits: JoinSchoolHit[]): Promise<JoinSchoolHit[]> {
  if (!hits.length) return hits;
  const ids = hits.map((h) => h.id).filter(Boolean);
  if (!ids.length) return [];

  const schoolIds = new Set<string>();
  try {
    const [orgs, schools] = await Promise.all([
      platformDbSelect<{ id?: string }>({
        table: 'organizations',
        select: 'id',
        filters: [
          { op: 'in', column: 'id', value: ids },
          { op: 'eq', column: 'org_type', value: 'school' },
        ],
      }),
      platformDbSelect<{ id?: string }>({
        table: 'admin_schools',
        select: 'id',
        filters: [{ op: 'in', column: 'id', value: ids }],
      }),
    ]);
    for (const r of orgs) {
      if (r.id) schoolIds.add(String(r.id));
    }
    for (const r of schools) {
      if (r.id) schoolIds.add(String(r.id));
    }
  } catch {
    // If filter fails, fall back to Nest list (better than empty).
    return hits;
  }

  // Nest already restricts to schools; if gateway can't verify ids, keep Nest hits
  // rather than blanking Find school.
  const filtered = hits.filter((h) => schoolIds.has(h.id));
  if (!filtered.length && hits.length) return hits;
  return filtered;
}

export async function searchJoinSchools(
  q: string,
  opts?: { limit?: number; offset?: number; signal?: AbortSignal },
) {
  const term = q.trim();
  if (term.length < 2) return { schools: [] as JoinSchoolHit[], count: 0, has_more: false };
  const limit = opts?.limit ?? 25;
  const offset = opts?.offset ?? 0;
  const qs = new URLSearchParams({
    q: term,
    limit: String(limit),
    offset: String(offset),
  });
  try {
    const token = await resolveNestAccessTokenForWebView();
    if (!token) throw new Error('Sign in required');
    const base = getNestApiBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/parents/join/schools?${qs}`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: opts?.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg =
        (typeof json?.message === 'string' && json.message) ||
        (typeof json?.error === 'string' && json.error) ||
        `Nest ${res.status}`;
      throw new Error(msg);
    }
    const data =
      json && typeof json === 'object' && 'data' in json
        ? (json as { data: { schools?: JoinSchoolHit[]; count?: number; has_more?: boolean } }).data
        : (json as { schools?: JoinSchoolHit[]; count?: number; has_more?: boolean });
    const raw = Array.isArray(data?.schools) ? data.schools : [];
    const schools = await keepSchoolsOnly(raw);
    return {
      schools,
      count: schools.length,
      has_more: Boolean(data?.has_more),
    };
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    // Nest parents join unavailable — fall back to public registration school search.
    const schools = await searchSchoolsViaNestRegistration(term);
    if (schools.length) return { schools, count: schools.length, has_more: false };
    throw e;
  }
}

async function searchSchoolsViaNestRegistration(term: string): Promise<JoinSchoolHit[]> {
  try {
    const res = await searchRegistrationSchools(term);
    if (!res.ok) return [];
    return (res.data || []).map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code ?? null,
      logo_url: s.logo_url ?? null,
      county: s.county ?? null,
    }));
  } catch {
    return [];
  }
}

export async function searchJoinStudents(schoolId: string, q: string, limit = 20) {
  const term = q.trim();
  if (!schoolId || term.length < 2) return { students: [] as JoinStudentHit[], count: 0 };
  const params = new URLSearchParams({
    school_id: schoolId,
    q: term,
    limit: String(limit),
  });
  return nestJoinFetch<{ students?: JoinStudentHit[]; count?: number }>(
    `/parents/join/students?${params.toString()}`,
  );
}

export async function createJoinRequest(body: {
  school_id: string;
  role_slug?: 'parent' | 'teacher' | 'student' | 'staff';
  target_student_id?: string;
  target_class_id?: string;
  staff_role_slug?: string;
  staff_role_slugs?: string[];
  teacher_roles?: string[];
  is_class_teacher?: boolean;
  workloads?: Array<{
    subject_id: string;
    class_id?: string;
    lessons_per_week?: number;
  }>;
  lessons_per_week?: number;
  relationship?: string;
  note?: string;
}) {
  return nestJoinFetch<{
    request?: { id: string; status: string };
    already_pending?: boolean;
  }>('/parents/join/requests', {
    method: 'POST',
    body,
  });
}

export async function listMyMemberships() {
  return nestJoinFetch<{ memberships?: MembershipHit[]; count?: number }>(
    '/parents/me/memberships',
  );
}

export type MyJoinRequestHit = {
  id: string;
  school_id: string;
  school_name?: string | null;
  role_slug: string;
  status: string;
  created_at?: string | null;
  target_student_id?: string | null;
  source?: 'join_requests' | 'school_membership_requests';
};

export async function listMyJoinRequests() {
  return nestJoinFetch<{ requests?: MyJoinRequestHit[]; count?: number }>(
    '/parents/me/join-requests',
  );
}

export async function leaveMyMembership(schoolId: string) {
  return nestJoinFetch<{ school_id?: string }>('/parents/me/memberships/leave', {
    method: 'POST',
    body: { school_id: schoolId },
  });
}

export type JoinClassHit = {
  id: string;
  name: string;
  level?: string | null;
  stream?: string | null;
};

export type JoinSubjectHit = {
  id: string;
  name: string;
  code?: string | null;
};

export async function listJoinClasses(schoolId: string) {
  if (!schoolId) return { classes: [] as JoinClassHit[] };
  return nestJoinFetch<{ classes?: JoinClassHit[] }>(
    `/parents/join/classes?school_id=${encodeURIComponent(schoolId)}`,
  );
}

export async function listJoinSubjects(schoolId: string) {
  if (!schoolId) return { subjects: [] as JoinSubjectHit[] };
  return nestJoinFetch<{ subjects?: JoinSubjectHit[] }>(
    `/parents/join/subjects?school_id=${encodeURIComponent(schoolId)}`,
  );
}
