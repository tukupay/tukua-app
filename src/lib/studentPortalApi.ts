/** Nest Desk API helpers for student persona native modules. */



import { deskFetch } from './deskApi';

import type { DeskExam } from './teacherPortalApi';
import { toAttendancePage } from './parentPortalApi';



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



/** A learner's own daily attendance rows (`GET /students/me/attendance`) as check-in / check-out marks. */
async function fetchOwnAttendanceMarks(studentId: string, days: number): Promise<StudentDayMark[] | null> {
  try {
    const data = await deskFetch<{ records?: Array<Record<string, unknown>> } | null>('/students/me/attendance');
    const records = unwrapList<Record<string, unknown>>(data, ['records']);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceDay = since.toISOString().slice(0, 10);
    const marks: StudentDayMark[] = [];
    for (const r of records) {
      if (studentId && r.student_id && String(r.student_id) !== studentId) continue;
      const day = String(r.attendance_date ?? '').slice(0, 10);
      if (!day || day < sinceDay) continue;
      const status = String(r.status ?? '').toLowerCase();
      if (status === 'absent') continue;
      const method = r.method != null ? String(r.method) : null;
      marks.push({
        person_type: 'student',
        person_id: studentId || (r.student_id != null ? String(r.student_id) : null),
        direction: 'in',
        marked_at: String(r.check_in_at ?? day),
        method,
        source: status || 'daily',
      });
      if (r.check_out_at) {
        marks.push({
          person_type: 'student',
          person_id: studentId || null,
          direction: 'out',
          marked_at: String(r.check_out_at),
          method,
          source: status || 'daily',
        });
      }
    }
    marks.sort((a, b) => String(b.marked_at ?? '').localeCompare(String(a.marked_at ?? '')));
    return marks;
  } catch {
    return null;
  }
}

/**
 * Recent attendance — last N days. The learner's own daily register (`/students/me/attendance`, one
 * call) first; per-day gate marks (`/attendance/day-marks`, N calls) only when that is not available.
 */
export async function fetchStudentRecentAttendance(studentId: string, days = 14) {
  const own = await fetchOwnAttendanceMarks(studentId, days);
  if (own && own.length) return own;

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

/** Student pocket balance: own wallet first, then the staff route; null when neither answers. */
/** The learner's own pocket-money wallet (`GET /students/me/pocket-money`); null when not available. */
async function fetchOwnPocketMoney(studentId: string): Promise<{
  balance: number | null;
  transactions: Array<Record<string, unknown>>;
} | null> {
  try {
    const data = await deskFetch<{
      wallets?: Array<{ student_id?: string; balance?: number | string }>;
      transactions?: Array<Record<string, unknown>>;
    } | null>('/students/me/pocket-money');
    const wallets = unwrapList<{ student_id?: string; balance?: number | string }>(data, ['wallets']);
    const wallet = wallets.find((w) => !studentId || String(w.student_id ?? '') === studentId) ?? wallets[0];
    const n = Number(wallet?.balance);
    return {
      balance: wallet && Number.isFinite(n) ? n : null,
      transactions: unwrapList<Record<string, unknown>>(data, ['transactions', 'items']),
    };
  } catch {
    return null;
  }
}

export async function tryFetchStudentPocketBalance(studentId: string): Promise<number | null> {
  if (!studentId) return null;
  const own = await fetchOwnPocketMoney(studentId);
  if (own && own.balance !== null) return own.balance;
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

/** Read-only pocket screen — own wallet first; surfaces 403 from the staff route without throwing. */
export async function fetchStudentPocketMoneyReadOnly(studentId: string): Promise<{
  forbidden: boolean;
  balance: number | null;
  transactions: Array<Record<string, unknown>>;
}> {
  if (!studentId) {
    return { forbidden: false, balance: null, transactions: [] };
  }
  // A learner reads their own wallet; /pocket-money/wallets/:id is for school staff (403 for learners).
  const own = await fetchOwnPocketMoney(studentId);
  if (own) return { forbidden: false, balance: own.balance, transactions: own.transactions };
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
    if ((e as { statusCode?: number })?.statusCode === 403 || /403|forbidden|permission|not have access/i.test(msg)) {
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
  financial_year_name?: string | null;
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

export type StudentBursaryApplication = {
  id?: string;
  student_id?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  provider_name?: string | null;
  requested_amount?: number | string | null;
  approved_amount?: number | string | null;
  disbursed_amount?: number | string | null;
  status?: string | null;
  applied_on?: string | null;
  notes?: string | null;
  decision_notes?: string | null;
};

/** The learner's own bursary applications (the list is filtered to them here as well as on the API). */
export async function fetchStudentBursaryApplications(studentId: string): Promise<StudentBursaryApplication[]> {
  const data = await deskFetch<{ applications?: StudentBursaryApplication[] }>('/bursaries/applications');
  const rows = Array.isArray(data?.applications) ? data.applications : [];
  return rows.filter((a) => String(a.student_id ?? '') === studentId);
}

/** A learner applies to one of the school's open bursary programs for themself. */
export async function applyStudentBursary(body: {
  student_id: string;
  program_id: string;
  requested_amount: number;
  notes?: string;
}) {
  return deskFetch<Record<string, unknown>>('/bursaries/applications', { method: 'POST', body });
}

/** The signed-in learner's own attendance, one page (newest first) with totals over every recorded day. */
export async function fetchStudentAttendancePage(opts: { limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 30), offset: String(opts.offset ?? 0) });
  const data = await deskFetch<unknown>(`/students/me/attendance?${params}`);
  return toAttendancePage(data);
}

export type StudentOwnExam = {
  id: string;
  name?: string | null;
  exam_type?: string | null;
  academic_year?: string | null;
  term?: string | null;
  marking_status?: string | null;
  is_current?: number | boolean | null;
  created_at?: string | null;
};

/** Exams in the learner's own class scope (`GET /students/me/exams`), newest first. */
export async function fetchStudentOwnExams(): Promise<{ exams: StudentOwnExam[]; currentExamId: string | null }> {
  const data = await deskFetch<{ exams?: StudentOwnExam[]; current_exam_id?: string | null } | null>('/students/me/exams');
  const exams = unwrapList<StudentOwnExam>(data, ['exams', 'items']).filter((e) => e && e.id);
  const cur = (data as { current_exam_id?: string | null } | null)?.current_exam_id;
  return { exams, currentExamId: cur ? String(cur) : null };
}

export type StudentTrend = {
  exams: Array<{
    exam_id?: string;
    exam_name?: string;
    overall_mean?: number | null;
    class_mean?: number | null;
  }>;
  analysis?: {
    trend_label?: string | null;
    sittings?: number | null;
    last_mean?: number | null;
    vs_class_mean?: number | null;
  } | null;
};

/** The learner's own mean per exam and a one-line trend (`GET /students/me/performance-trend`); null when unavailable. */
export async function fetchStudentPerformanceTrend(): Promise<StudentTrend | null> {
  try {
    const data = await deskFetch<StudentTrend | null>('/students/me/performance-trend');
    if (!data || typeof data !== 'object') return null;
    return { exams: Array.isArray(data.exams) ? data.exams : [], analysis: data.analysis ?? null };
  } catch {
    return null;
  }
}

/** The learner's own report form for one exam (no class rows: `?rows=none`, ignored by older APIs). */
export async function fetchStudentReportForm(examId: string) {
  const data = await deskFetch<Record<string, unknown> | null>(
    `/students/me/exams/${encodeURIComponent(examId)}/marksheet?rows=none`,
  );
  const payload = ((data as { data?: Record<string, unknown> } | null)?.data ?? data ?? {}) as Record<string, unknown>;
  const row = (payload.row && typeof payload.row === 'object' ? payload.row : null) as
    | (StudentExamMarksheetRow & Record<string, unknown>)
    | null;
  const cols = Array.isArray(payload.subject_columns)
    ? (payload.subject_columns as Array<{ id?: string; name?: string; code?: string; short_form?: string | null }>)
    : [];
  const agg = payload.aggregates && typeof payload.aggregates === 'object' ? payload.aggregates : null;
  return {
    row,
    subjectColumns: cols,
    exam: (payload.exam as Record<string, unknown> | null) ?? null,
    aggregates: agg as { class_subjects?: Array<Record<string, unknown>> } | null,
  };
}
