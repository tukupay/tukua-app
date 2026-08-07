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



export type StudentProfile = {
  id?: string;
  student_number?: string | null;
  admission_number?: string | null;
  full_name?: string | null;
  class_name?: string | null;
  current_class?: string | null;
  school_name?: string | null;
};

export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  if (!studentId) return null;
  try {
    const data = await deskFetch<{ student?: StudentProfile } & StudentProfile>(
      `/students/${encodeURIComponent(studentId)}`,
    );
    const row = (data as { student?: StudentProfile })?.student ?? data;
    return row && typeof row === 'object' ? (row as StudentProfile) : null;
  } catch {
    return null;
  }
}

export async function fetchStudentExams(limit = 30) {

  const data = await deskFetch<{ exams?: DeskExam[] }>(`/assessments/exams?limit=${limit}&page=1`);

  return unwrapList<DeskExam>(data, ['exams', 'items']);

}

/** Class timetable for the logged-in student (via class_id on profile). */
export async function fetchStudentTimetable(classId: string) {
  if (!classId) return { entries: [] as Record<string, unknown>[] };
  const params = new URLSearchParams({ class_id: classId, limit: '80' });
  const data = await deskFetch<{ entries?: Record<string, unknown>[] }>(
    `/timetable/entries?${params}`,
  );
  return { entries: unwrapList<Record<string, unknown>>(data, ['entries', 'items']) };
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



/** Assignments — Nest student self-service (S11); honest empty until homework module. */
export async function fetchStudentAssignments(_studentId: string) {
  try {
    const data = await deskFetch<{ assignments?: Array<Record<string, unknown>>; total?: number }>(
      '/students/me/assignments',
    );
    const assignments = unwrapList<Record<string, unknown>>(data, ['assignments', 'items']);
    return { assignments };
  } catch {
    return { assignments: [] as Array<Record<string, unknown>> };
  }
}

export type StudentExamMarksheetRow = {
  student_id?: string;
  total_marks?: number | null;
  mean?: number | null;
  overall_grade?: string | null;
  rank_in_class?: number | null;
  rank_out_of_class?: number | null;
  rank_in_level?: number | null;
  rank_out_of_level?: number | null;
  subjects?: Array<Record<string, unknown>>;
};

/** Per-subject marks + rank for one exam (S09). */
export async function fetchStudentExamMarksheet(examId: string): Promise<{
  row: StudentExamMarksheetRow | null;
  subjectColumns: Array<{ id?: string; name?: string; code?: string }>;
  exam: Record<string, unknown> | null;
}> {
  const data = await deskFetch<{
    data?: {
      row?: StudentExamMarksheetRow;
      subject_columns?: Array<{ id?: string; name?: string; code?: string }>;
      exam?: Record<string, unknown>;
    };
    row?: StudentExamMarksheetRow;
    subject_columns?: Array<{ id?: string; name?: string; code?: string }>;
    exam?: Record<string, unknown>;
  }>(`/students/me/exams/${encodeURIComponent(examId)}/marksheet`);
  const payload = (data as { data?: Record<string, unknown> })?.data ?? data;
  return {
    row: (payload as { row?: StudentExamMarksheetRow })?.row ?? null,
    subjectColumns:
      (payload as { subject_columns?: Array<{ id?: string; name?: string; code?: string }> })
        ?.subject_columns ?? [],
    exam: (payload as { exam?: Record<string, unknown> })?.exam ?? null,
  };
}

/** Student pocket wallet — manager-only on Nest; returns null on 403 (honest hide in hero). */
export async function tryFetchStudentPocketBalance(studentId: string): Promise<number | null> {
  if (!studentId) return null;
  try {
    const data = await deskFetch<{ wallet?: { balance?: number }; balance?: number }>(
      `/pocket-money/wallets/${encodeURIComponent(studentId)}`,
    );
    const raw =
      (data as { wallet?: { balance?: number } })?.wallet?.balance ??
      (data as { balance?: number })?.balance;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Read-only pocket screen — surfaces 403 without throwing. */
export async function fetchStudentPocketMoneyReadOnly(studentId: string): Promise<{
  forbidden: boolean;
  balance: number | null;
  transactions: Array<Record<string, unknown>>;
}> {
  if (!studentId) {
    return { forbidden: false, balance: null, transactions: [] };
  }
  try {
    const data = await deskFetch<{
      wallet?: { balance?: number };
      balance?: number;
      transactions?: Array<Record<string, unknown>>;
    }>(`/pocket-money/wallets/${encodeURIComponent(studentId)}`);
    const raw =
      (data as { wallet?: { balance?: number } })?.wallet?.balance ??
      (data as { balance?: number })?.balance;
    const n = Number(raw);
    const txns = unwrapList<Record<string, unknown>>(data, ['transactions', 'items']);
    return {
      forbidden: false,
      balance: Number.isFinite(n) ? n : null,
      transactions: txns,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/403|forbidden|permission/i.test(msg)) {
      return { forbidden: true, balance: null, transactions: [] };
    }
    throw e;
  }
}

/** Resolve admin_students id for the signed-in student JWT. */
export function resolveStudentRecordId(
  deskUser: { id?: string; user_id?: string } | null | undefined,
): string {
  return String(deskUser?.id ?? deskUser?.user_id ?? '').trim();
}

export type StudentFeeBalance = {
  student_id?: string;
  student_name?: string | null;
  student_number?: string | null;
  financial_year?: string | null;
  balance?: number;
  total_invoiced?: number;
  total_receipts?: number;
  recent_receipts?: Array<Record<string, unknown>>;
  pay_via?: string;
};

/** Read-only fee balance for student persona (S17). */
export async function fetchStudentFees(): Promise<StudentFeeBalance | null> {
  try {
    const data = await deskFetch<{ data?: StudentFeeBalance } & StudentFeeBalance>('/students/me/fees');
    const row = (data as { data?: StudentFeeBalance })?.data ?? data;
    return row && typeof row === 'object' ? (row as StudentFeeBalance) : null;
  } catch {
    return null;
  }
}
