/** Nest Desk API helpers for student persona native modules. */

import { deskFetch } from './deskApi';
import type { DeskExam } from './teacherPortalApi';

export type StudentExamSummary = {
  student_id?: string;
  student_name?: string;
  admission_number?: string;
  class_name?: string;
  total_marks?: number | string | null;
  mean_mark?: number | string | null;
  mean_grade?: string | null;
  rank_in_class?: number | string | null;
  rank_out_of_class?: number | string | null;
  rank_in_level?: number | string | null;
  rank_out_of_level?: number | string | null;
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

export async function fetchStudentExams(limit = 30) {
  const data = await deskFetch<{ exams?: DeskExam[] }>(`/assessments/exams?limit=${limit}&page=1`);
  return unwrapList<DeskExam>(data, ['exams', 'items']);
}

export async function fetchStudentExamSummary(examId: string, studentId: string) {
  const params = new URLSearchParams({ student_id: studentId, limit: '5', page: '1' });
  const data = await deskFetch<{
    summaries?: StudentExamSummary[];
    rows?: StudentExamSummary[];
    exam?: DeskExam;
  }>(`/assessments/reports/exams/${encodeURIComponent(examId)}/student-summaries?${params}`);
  const list = unwrapList<StudentExamSummary>(data, ['summaries', 'rows']);
  return { summary: list[0] ?? null, exam: (data as { exam?: DeskExam })?.exam ?? null };
}

export type StudentDayMark = {
  person_type?: string;
  person_id?: string | null;
  full_name?: string;
  direction?: string;
  marked_at?: string;
  method?: string | null;
  source?: string;
};

/** Gate/register marks for one student on a given date (works when day-marks is allowed). */
export async function fetchStudentDayMarks(studentId: string, date: string) {
  const params = new URLSearchParams({
    date,
    person_type: 'student',
    person_id: studentId,
    limit: '50',
  });
  return deskFetch<{ marks?: StudentDayMark[]; count?: number }>(
    `/attendance/day-marks?${params}`,
  );
}

/** Best-effort recent attendance — last N calendar days with any mark. */
export async function fetchStudentRecentAttendance(studentId: string, days = 14) {
  const marks: StudentDayMark[] = [];
  const today = new Date();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    try {
      const res = await fetchStudentDayMarks(studentId, date);
      const batch = unwrapList<StudentDayMark>(res, ['marks']);
      for (const m of batch) marks.push({ ...m, marked_at: m.marked_at ?? date });
    } catch {
      // skip day
    }
  }
  return marks;
}

/** Assignments — no dedicated student API yet; returns empty until Nest adds one. */
export async function fetchStudentAssignments(_studentId: string) {
  return { assignments: [] as Array<Record<string, unknown>> };
}
