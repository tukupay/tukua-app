/**
 * Join-request helpers for “Add your student” (SchoolPicker).
 * Nest: GET /parents/join/schools|students, POST /parents/join/requests
 */

import { deskFetch } from './deskApi';

export type JoinSchoolHit = {
  id: string;
  name: string;
  code?: string | null;
  logo_url?: string | null;
  county?: string | null;
};

export type JoinStudentHit = {
  id: string;
  name: string;
  admission_masked?: string | null;
  class_name?: string | null;
  person_type?: 'student';
};

export async function searchJoinSchools(q: string) {
  const term = q.trim();
  if (term.length < 2) return { schools: [] as JoinSchoolHit[], count: 0 };
  return deskFetch<{ schools?: JoinSchoolHit[]; count?: number }>(
    `/parents/join/schools?q=${encodeURIComponent(term)}`,
  );
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
