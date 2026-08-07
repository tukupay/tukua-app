/** Nest Desk API helpers for teacher persona native modules. */

import { deskFetch } from './deskApi';

export type DeskExam = {
  id: string;
  name?: string;
  term?: string;
  academic_year?: string;
  academicyear?: string;
  year?: string;
  marking_status?: string;
  exam_type?: string;
  class_name?: string;
};

export type TeacherWorkload = {
  id?: string;
  teacher_id?: string;
  subject_id?: string;
  class_id?: string;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  class_level?: string;
  lessons_per_week?: number;
};

export type MarksheetRow = {
  student_id?: string;
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  total_marks?: number | string | null;
  mean_mark?: number | string | null;
  mean_grade?: string | null;
  rank_in_class?: number | string | null;
  rank_out_of_class?: number | string | null;
};

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

export async function fetchTeacherExams(limit = 40) {
  const data = await deskFetch<{ exams?: DeskExam[]; items?: DeskExam[] }>(
    `/assessments/exams?limit=${limit}&page=1`,
  );
  return unwrapList<DeskExam>(data, ['exams', 'items']);
}

export async function fetchMyTeacherWorkloads(teacherId: string, limit = 100) {
  const params = new URLSearchParams({ limit: String(limit), page: '1', teacher_id: teacherId });
  const data = await deskFetch<{ workloads?: TeacherWorkload[] }>(
    `/teachers/workloads?${params}`,
  );
  return unwrapList<TeacherWorkload>(data, ['workloads']);
}

export async function fetchExamMarksheet(examId: string, classId?: string, limit = 80) {
  const params = new URLSearchParams({ limit: String(limit), page: '1' });
  if (classId) params.set('class_id', classId);
  return deskFetch<{
    rows?: MarksheetRow[];
    students?: MarksheetRow[];
    subjects?: Array<{ id?: string; name?: string; code?: string }>;
    exam?: DeskExam;
  }>(`/assessments/reports/exams/${encodeURIComponent(examId)}/marksheet?${params}`);
}

export async function fetchExamAggregates(examId: string, classId?: string) {
  const params = new URLSearchParams();
  if (classId) params.set('class_id', classId);
  const q = params.toString() ? `?${params}` : '';
  return deskFetch<{ aggregates?: Array<Record<string, unknown>>; count?: number }>(
    `/assessments/reports/exams/${encodeURIComponent(examId)}/aggregates${q}`,
  );
}

export async function fetchTeacherStats() {
  return deskFetch<{ stats?: Record<string, unknown> }>('/teachers/stats/overview');
}

export async function fetchClasses(limit = 60) {
  const data = await deskFetch<{ classes?: Array<Record<string, unknown>> }>(
    `/classes?limit=${limit}&page=1`,
  );
  return unwrapList<Record<string, unknown>>(data, ['classes']);
}

export async function fetchClassEnrollments(classId: string, limit = 100) {
  const params = new URLSearchParams({ class_id: classId, limit: String(limit), page: '1' });
  const data = await deskFetch<{ enrollments?: Array<Record<string, unknown>> }>(
    `/classes/enrollments?${params}`,
  );
  return unwrapList<Record<string, unknown>>(data, ['enrollments']);
}
