/**
 * Parent portal Nest client — shared helpers for Dashboard native modules.
 * All paths are under `/parents/me/*` (Desk Nest). Same contract as Desk SPA.
 *
 * Student/school context comes from DeskAuth → setDeskActiveContext.
 * Helpers default `student_id` to the active selected student.
 */

import { deskFetch, getDeskActiveContext } from './deskApi';

export type ParentCoParent = {
  parent_id: string;
  full_name: string;
  relationship?: string | null;
  is_primary?: boolean;
  phone_masked?: string | null;
};

export type ParentChild = {
  student_id: string;
  admission_number?: string | null;
  full_name?: string;
  class_id?: string | null;
  class_name?: string | null;
  relationship?: string | null;
  is_primary?: boolean;
  avatar_url?: string | null;
  photo_url?: string | null;
  linked_parents?: ParentCoParent[];
};

export type ParentTeacher = {
  teacher_id: string;
  full_name: string;
  subject_name?: string | null;
  subject_code?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  phone_masked?: string | null;
  email?: string | null;
  photo_url?: string | null;
  description?: string | null;
};

function resolveStudentId(explicit?: string | null): string | undefined {
  const id = (explicit ?? getDeskActiveContext().studentId ?? '').trim();
  return id || undefined;
}

export async function fetchParentChildren() {
  return deskFetch<{ parent_id?: string; count?: number; children?: ParentChild[] }>(
    '/parents/me/children',
  );
}

export async function fetchParentSchool() {
  return deskFetch<{ school?: Record<string, unknown> }>('/parents/me/school');
}

export async function fetchChildTeachers(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  if (!sid) throw new Error('Select a student first');
  return deskFetch<{
    student_id?: string;
    class_id?: string | null;
    teachers?: ParentTeacher[];
    count?: number;
  }>(`/parents/me/children/${encodeURIComponent(sid)}/teachers`);
}

export async function fetchParentExams(academicYear?: string) {
  const q = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : '';
  return deskFetch<{ exams?: Array<Record<string, unknown>>; years?: string[] }>(
    `/parents/me/exams${q}`,
  );
}

export async function fetchParentAssessmentReports(examId?: string, studentId?: string | null) {
  const params = new URLSearchParams();
  if (examId) params.set('exam_id', examId);
  const sid = resolveStudentId(studentId);
  if (sid) params.set('student_id', sid);
  const q = params.toString() ? `?${params}` : '';
  return deskFetch<Record<string, unknown>>(`/parents/me/assessment-reports${q}`);
}

export async function fetchParentLibraryStatement(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{ loans?: Array<Record<string, unknown>>; fines?: Array<Record<string, unknown>> }>(
    `/parents/me/library-statement${q}`,
  );
}

export async function fetchParentAccountsStatement(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{
    balances?: Array<{ student_id?: string; student_name?: string | null; balance?: number }>;
    ledgers?: Array<Record<string, unknown>>;
    receipts?: Array<Record<string, unknown>>;
  }>(`/parents/me/accounts-statement${q}`);
}

export async function fetchParentPocketMoney(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{
    wallets?: Array<{ student_id?: string; balance?: number; admission_number?: string }>;
    transactions?: Array<Record<string, unknown>>;
  }>(`/parents/me/pocket-money${q}`);
}

export async function seedParentDemoData() {
  return deskFetch<Record<string, unknown>>('/parents/me/seed-demo', { method: 'POST' });
}

export async function fetchParentEvents(opts?: {
  studentId?: string | null;
  payableOnly?: boolean;
  targetClassId?: string | null;
}) {
  const params = new URLSearchParams();
  params.set('audience', 'parents');
  const sid = resolveStudentId(opts?.studentId);
  if (sid) params.set('student_id', sid);
  if (opts?.payableOnly) params.set('payable_only', 'true');
  if (opts?.targetClassId) params.set('target_class_id', opts.targetClassId);
  return deskFetch<{ events?: Array<Record<string, unknown>>; count?: number }>(
    `/events?${params.toString()}`,
  );
}

export async function rsvpParentEvent(
  eventId: string,
  body: { status: 'attending' | 'declined' | 'maybe'; student_id?: string; note?: string },
) {
  return deskFetch(`/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: 'POST',
    body,
  });
}

export async function payParentEvent(
  eventId: string,
  body?: { student_id?: string; method?: string; reference?: string },
) {
  return deskFetch(`/events/${encodeURIComponent(eventId)}/pay`, {
    method: 'POST',
    body: body ?? {},
  });
}
