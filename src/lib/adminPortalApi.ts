/** School admin + super-admin Nest helpers (deskFetch). */

import { deskFetch } from './deskApi';

export type JoinRequestRow = {
  id: string;
  status?: string;
  role_slug?: string;
  requester_name?: string;
  requester_email?: string;
  target_student_name?: string;
  target_class_name?: string;
  note?: string;
  created_at?: string;
};

export type AdminStudentRow = {
  id: string;
  student_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  school_name?: string;
  gender?: string;
  is_active?: number;
  class_name?: string;
  status?: string;
};

export type AdminTeacherRow = {
  id: string;
  employee_number?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  status?: string;
  school_name?: string;
  user_is_active?: number;
};

export type AdminParentRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  relationship?: string | null;
  students?: Array<{
    student_id?: string;
    full_name?: string;
    admission_number?: string | null;
  }>;
};

export type SchoolRegistryRow = {
  id: string;
  name: string;
  code?: string | null;
  type?: string | null;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  country?: string | null;
  is_active?: number;
  logo_url?: string | null;
};

export type SchoolDashboardTotals = {
  students?: number;
  students_active?: number;
  teachers?: number;
  parents?: number;
  staff?: number;
  users?: number;
  classes?: number;
  classrooms?: number;
  subjects?: number;
};

export type AccountsDashboardOverview = {
  invoiced?: number;
  collected?: number;
  outstanding?: number;
  receipt_count?: number;
  expense_total?: number;
  net_position?: number;
};

function unwrapRequests(data: unknown): JoinRequestRow[] {
  if (Array.isArray(data)) return data as JoinRequestRow[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.requests)) return obj.requests as JoinRequestRow[];
  }
  return [];
}

function unwrapList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of keys) {
      if (Array.isArray(obj[k])) return obj[k] as T[];
    }
  }
  return [];
}

function unwrapTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const n = Number((data as { total?: number }).total);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function fetchPendingJoinRequests(status = 'pending') {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await deskFetch<{ requests?: JoinRequestRow[]; pending_count?: number }>(
    `/parents/join-requests${q}`,
  );
  return {
    requests: unwrapRequests(data),
    pendingCount: Number((data as { pending_count?: number })?.pending_count ?? 0),
  };
}

export async function approveJoinRequest(id: string) {
  return deskFetch(`/parents/join-requests/${encodeURIComponent(id)}/approve`, { method: 'POST' });
}

export async function rejectJoinRequest(id: string) {
  return deskFetch(`/parents/join-requests/${encodeURIComponent(id)}/reject`, { method: 'POST' });
}

export async function approveAllJoinRequests() {
  return deskFetch('/parents/join-requests/approve-all', { method: 'POST' });
}

export async function fetchAdminStudents(q?: string, page = 1, limit = 30) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) params.set('q', q.trim());
  const data = await deskFetch<unknown>(`/students?${params}`);
  return {
    students: unwrapList<AdminStudentRow>(data, ['students', 'items', 'data']),
    total: unwrapTotal(data),
    page,
    limit,
  };
}

export async function fetchAdminTeachers(q?: string, page = 1, limit = 30) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) params.set('q', q.trim());
  const data = await deskFetch<unknown>(`/teachers?${params}`);
  return {
    teachers: unwrapList<AdminTeacherRow>(data, ['teachers', 'items', 'data']),
    total: unwrapTotal(data),
    page,
    limit,
  };
}

export async function fetchAdminParents(q?: string, page = 1, limit = 30) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    get_students: 'true',
  });
  if (q?.trim()) params.set('q', q.trim());
  const data = await deskFetch<unknown>(`/parents?${params}`);
  return {
    parents: unwrapList<AdminParentRow>(data, ['parents', 'items', 'data']),
    total: unwrapTotal(data),
    page,
    limit,
  };
}

export async function fetchSchoolDashboardAnalytics(schoolId: string) {
  const data = await deskFetch<{
    school?: Record<string, unknown>;
    totals?: SchoolDashboardTotals;
    modules?: Record<string, unknown>;
    charts?: Record<string, unknown>;
    generated_at?: string;
  }>(`/schools/${encodeURIComponent(schoolId)}/dashboard`);
  return data;
}

export async function fetchAccountsDashboard() {
  const data = await deskFetch<{ overview?: AccountsDashboardOverview; monthly?: unknown[] }>(
    '/accounts/dashboard',
  );
  return data;
}

export async function fetchSchoolsRegistry(q?: string, page = 1, limit = 25) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q?.trim()) params.set('q', q.trim());
  const data = await deskFetch<unknown>(`/schools?${params}`);
  return {
    schools: unwrapList<SchoolRegistryRow>(data, ['schools', 'items', 'data']),
    total: unwrapTotal(data),
    page,
    limit,
  };
}

export async function searchSchoolsDirectory(q: string, limit = 25, offset = 0) {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
    offset: String(offset),
  });
  const data = await deskFetch<{ schools?: SchoolRegistryRow[]; count?: number; has_more?: boolean }>(
    `/schools/search?${params}`,
  );
  return {
    schools: unwrapList<SchoolRegistryRow>(data, ['schools']),
    hasMore: Boolean((data as { has_more?: boolean })?.has_more),
  };
}
