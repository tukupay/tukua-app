/**
 * Join-request helpers for “Add your student” (SchoolPicker).
 * Nest: GET /parents/join/schools|students, POST /parents/join/requests
 */

import { deskFetch, ensureNestDeskSession } from './deskApi';
import { supabase } from './supabase';

export type JoinSchoolHit = {
  id: string;
  name: string;
  code?: string | null;
  logo_url?: string | null;
  county?: string | null;
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
  person_type?: 'student';
};

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
    const [{ data: orgs }, { data: schools }] = await Promise.all([
      supabase.from('organizations').select('id').in('id', ids).eq('org_type', 'school'),
      supabase.from('admin_schools').select('id').in('id', ids),
    ]);
    for (const r of orgs || []) {
      if ((r as { id?: string }).id) schoolIds.add(String((r as { id: string }).id));
    }
    for (const r of schools || []) {
      if ((r as { id?: string }).id) schoolIds.add(String((r as { id: string }).id));
    }
  } catch {
    // If filter fails, fall back to Nest list (better than empty).
    return hits;
  }

  // Nest already restricts to schools; if RLS can't verify ids, keep Nest hits
  // rather than blanking Find school.
  const filtered = hits.filter((h) => schoolIds.has(h.id));
  if (!filtered.length && hits.length) return hits;
  return filtered;
}

export async function searchJoinSchools(q: string) {
  const term = q.trim();
  if (term.length < 2) return { schools: [] as JoinSchoolHit[], count: 0 };
  try {
    await ensureNestDeskSession();
  } catch {
    // continue — Nest search may still work with current token
  }
  try {
    const res = await deskFetch<{ schools?: JoinSchoolHit[]; count?: number }>(
      `/parents/join/schools?q=${encodeURIComponent(term)}`,
    );
    const raw = Array.isArray(res?.schools) ? res.schools : [];
    const schools = await keepSchoolsOnly(raw);
    return { schools, count: schools.length };
  } catch (e) {
    // Desk down / 401 — search staging schools directly so Find school still works.
    const schools = await searchSchoolsViaSupabase(term);
    if (schools.length) return { schools, count: schools.length };
    throw e;
  }
}

async function searchSchoolsViaSupabase(term: string): Promise<JoinSchoolHit[]> {
  const like = `%${term}%`;
  const hits: JoinSchoolHit[] = [];
  const seen = new Set<string>();
  const push = (row: {
    id?: string;
    name?: string | null;
    code?: string | null;
    username?: string | null;
    slug?: string | null;
    logo_url?: string | null;
    county?: string | null;
  }) => {
    const id = String(row.id || '').trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    hits.push({
      id,
      name: String(row.name ?? 'School'),
      code: (row.code || row.username || row.slug || null) as string | null,
      logo_url: row.logo_url ?? null,
      county: row.county ?? null,
    });
  };
  try {
    const [byName, byCode, byUser, orgByName, orgBySlug, orgByUser] = await Promise.all([
      supabase.from('admin_schools').select('id, name, code, username, logo_url, county').eq('is_active', true).ilike('name', like).limit(15),
      supabase.from('admin_schools').select('id, name, code, username, logo_url, county').eq('is_active', true).ilike('code', like).limit(10),
      supabase.from('admin_schools').select('id, name, code, username, logo_url, county').eq('is_active', true).ilike('username', like).limit(10),
      supabase.from('organizations').select('id, name, slug, username, logo_url, county, org_type').eq('org_type', 'school').ilike('name', like).limit(15),
      supabase.from('organizations').select('id, name, slug, username, logo_url, county, org_type').eq('org_type', 'school').ilike('slug', like).limit(10),
      supabase.from('organizations').select('id, name, slug, username, logo_url, county, org_type').eq('org_type', 'school').ilike('username', like).limit(10),
    ]);
    for (const batch of [byName.data, byCode.data, byUser.data]) {
      for (const r of batch || []) push(r);
    }
    for (const batch of [orgByName.data, orgBySlug.data, orgByUser.data]) {
      for (const r of batch || []) {
        if (String((r as { org_type?: string }).org_type || '').toLowerCase() !== 'school') continue;
        push(r);
      }
    }
  } catch {
    return [];
  }
  return hits.slice(0, 25);
}

export async function searchJoinStudents(schoolId: string, q: string, limit = 20) {
  const term = q.trim();
  if (!schoolId || term.length < 2) return { students: [] as JoinStudentHit[], count: 0 };
  const params = new URLSearchParams({
    school_id: schoolId,
    q: term,
    limit: String(limit),
  });
  return deskFetch<{ students?: JoinStudentHit[]; count?: number }>(
    `/parents/join/students?${params.toString()}`,
  );
}

export async function createJoinRequest(body: {
  school_id: string;
  target_student_id: string;
  role_slug?: 'parent' | 'teacher' | 'student';
  relationship?: string;
  note?: string;
}) {
  return deskFetch<{
    request?: { id: string; status: string };
    already_pending?: boolean;
  }>('/parents/join/requests', {
    method: 'POST',
    body,
  });
}
