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
  const data = await deskFetch<{
    aggregates?: Array<Record<string, unknown>>;
    class_subjects?: Array<Record<string, unknown>>;
    count?: number;
  } | null>(`/assessments/reports/exams/${encodeURIComponent(examId)}/aggregates${q}`);
  // The API answers { exam, class_subjects, level_subjects, scope_overall, narratives }: the per class ×
  // subject rows are what the Reports hub counts as "aggregate rows".
  const aggregates = unwrapList<Record<string, unknown>>(data, ['aggregates', 'class_subjects']);
  return { ...(data ?? {}), aggregates, count: aggregates.length };
}



export async function fetchTeacherStats() {

  return deskFetch<{ stats?: Record<string, unknown> }>('/teachers/stats/overview');

}



export async function fetchClasses(limit = 60) {

  const data = await deskFetch<{ classes?: Array<Record<string, unknown>> }>(

    `/classes?limit=${Math.min(Math.max(limit, 1), 100)}&page=1`,

  );

  return unwrapList<Record<string, unknown>>(data, ['classes']);

}



export async function fetchClassEnrollments(classId: string, limit = 100) {
  const capped = Math.min(Math.max(limit, 1), 100);
  const params = new URLSearchParams({ class_id: classId, limit: String(capped), page: '1' });
  const data = await deskFetch<{ enrollments?: Array<Record<string, unknown>> }>(
    `/classes/enrollments?${params}`,
  );
  const rows = unwrapList<Record<string, unknown>>(data, ['enrollments']);
  if (rows.length) return rows;
  // Many schools never fill academic_enrollments: each learner's class is on the student record.
  try {
    const students = await deskFetch<{ students?: Array<Record<string, unknown>> }>(
      `/students?${new URLSearchParams({ class_id: classId, limit: String(capped), page: '1' })}`,
    );
    return unwrapList<Record<string, unknown>>(students, ['students', 'items']).map((s) => ({
      ...s,
      student_id: s.student_id ?? s.id,
      admission_number: s.admission_number ?? s.student_number,
    }));
  } catch {
    return rows;
  }
}


export type AssessmentMarkRow = {
  id: string;
  exam_id?: string;
  student_id?: string;
  student_name?: string | null;
  admission_number?: string | null;
  class_id?: string | null;
  subject_id?: string | null;
  marks?: number | string | null;
  grade?: string | null;
  max_marks?: number | string | null;
};

export async function listAssessmentMarks(examId: string, classId?: string, subjectId?: string) {
  const params = new URLSearchParams();
  if (examId) params.set('exam_id', examId);
  if (classId) params.set('class_id', classId);
  if (subjectId) params.set('subject_id', subjectId);
  const data = await deskFetch<{ marks?: AssessmentMarkRow[] }>(
    `/assessments/marks?${params}`,
  );
  return unwrapList<AssessmentMarkRow>(data, ['marks']);
}

export type ScannedMarkRow = {
  admission_number?: string;
  student_name?: string;
  marks?: number | null;
  student_user_id?: string;
  mark_id?: string | null;
};

export async function analyzeMarksheetScan(body: {
  exam_id: string;
  class_id: string;
  subject_id: string;
  image_base64: string;
  max_marks?: number;
}) {
  return deskFetch<{
    exam_id: string;
    class_id: string;
    subject_id: string;
    subject_name?: string;
    max_marks: number;
    parsed_count: number;
    matched_count: number;
    rows: ScannedMarkRow[];
  }>('/assessments/marks/scan-analyze', { method: 'POST', body });
}

export async function saveMarksheetScan(body: {
  exam_id: string;
  subject_id: string;
  max_marks: number;
  rows: ScannedMarkRow[];
}) {
  return deskFetch<{ added: number; updated: number; failed: number; errors?: string[] }>(
    '/assessments/marks/scan-save',
    { method: 'POST', body },
  );
}

export async function generateExamMarks(examId: string) {
  return deskFetch<Record<string, unknown>>(
    `/assessments/marks/generate/${encodeURIComponent(examId)}`,
    { method: 'POST', body: {} },
  );
}

export async function patchAssessmentMark(
  markId: string,
  body: { marks?: number | null; grade?: string | null },
) {
  return deskFetch<{ mark?: AssessmentMarkRow }>(
    `/assessments/marks/${encodeURIComponent(markId)}`,
    { method: 'PATCH', body },
  );
}

export async function fetchTeacherTimetable(teacherId: string) {
  return deskFetch<{ entries?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(
    `/timetable/teacher/${encodeURIComponent(teacherId)}`,
  );
}

export async function fetchClassTimetable(classId: string) {
  return deskFetch<{ entries?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(
    `/timetable/class/${encodeURIComponent(classId)}`,
  );
}

export async function fetchClassTeacherClasses(teacherUserId: string) {
  // The API caps `limit` at 100 (120 answered 400).
  const data = await deskFetch<{ classes?: Array<Record<string, unknown>> }>('/classes?limit=100&page=1');
  const classes = unwrapList<Record<string, unknown>>(data, ['classes']);
  return classes.filter(
    (c) =>
      String(c.class_teacher_user_id ?? c.class_teacher_id ?? '') === teacherUserId,
  );
}

export async function fetchTeacherDisciplineIncidents() {
  return deskFetch<unknown>('/discipline/incidents?scope=mine');
}

export type MarksEntryStatusRow = {
  exam_id?: string;
  class_id?: string;
  class_name?: string;
  subject_id?: string;
  subject_name?: string;
  teacher_name?: string;
  pending_count?: number;
  total_count?: number;
  entered_count?: number;
};

/**
 * Outstanding mark entry (class × subject rows with marks still to enter) for one exam — the latest
 * exam when none is given (the API requires `exam_id`; calling without it answered 400).
 */
export async function fetchMarksEntryStatus(examId?: string): Promise<{
  exam_id: string | null;
  rows: MarksEntryStatusRow[];
  items: MarksEntryStatusRow[];
}> {
  let id = (examId ?? '').trim();
  if (!id) {
    const exams = await fetchTeacherExams(5);
    id = String(exams[0]?.id ?? '').trim();
    if (!id) return { exam_id: null, rows: [], items: [] };
  }
  const data = await deskFetch<{ exam_id?: string; classes?: Array<Record<string, unknown>> } | null>(
    `/assessments/marks/entry-status?exam_id=${encodeURIComponent(id)}`,
  );
  const rows = unwrapList<Record<string, unknown>>(data, ['classes', 'rows', 'items'])
    .map((c) => ({
      exam_id: String(c.exam_id ?? id),
      class_id: c.class_id != null ? String(c.class_id) : undefined,
      class_name: c.class_name != null ? String(c.class_name) : undefined,
      subject_id: c.subject_id != null ? String(c.subject_id) : undefined,
      subject_name: c.subject_name != null ? String(c.subject_name) : undefined,
      teacher_name: c.teacher_name != null ? String(c.teacher_name) : undefined,
      pending_count: Number(c.pending_students ?? c.pending_count ?? 0) || 0,
      total_count: Number(c.total_students ?? c.total_count ?? 0) || 0,
      entered_count: Number(c.entered_students ?? c.entered_count ?? 0) || 0,
    }))
    .filter((r) => r.pending_count > 0);
  return { exam_id: id, rows, items: rows };
}

export async function searchDisciplineStudents(q: string) {
  const params = new URLSearchParams({ q: q.trim() });
  const data = await deskFetch<{ students?: Array<Record<string, unknown>> }>(
    `/discipline/students/search?${params}`,
  );
  return unwrapList<Record<string, unknown>>(data, ['students']);
}

export async function fetchDisciplineCategories() {
  const data = await deskFetch<{ categories?: Array<Record<string, unknown>>; count?: number }>(
    '/discipline/categories',
  );
  const list = unwrapList<Record<string, unknown>>(data, ['categories']);
  return list
    .map((c) => ({
      id: String(c.id ?? c.name ?? ''),
      name: String(c.name ?? c.title ?? c.id ?? 'Category'),
    }))
    .filter((c) => c.id && c.name);
}

export async function createDisciplineCase(body: Record<string, unknown>) {
  return deskFetch<Record<string, unknown>>('/discipline/cases/analyze', {
    method: 'POST',
    body,
  });
}

export type ScanMarkRow = {
  admission_number?: string;
  student_name?: string;
  marks?: number | null;
  student_user_id?: string;
  mark_id?: string | null;
};

export async function scanMarksheetAnalyze(body: {
  exam_id: string;
  class_id: string;
  subject_id: string;
  image_base64: string;
  max_marks?: number;
}) {
  return deskFetch<{
    exam_id?: string;
    class_id?: string;
    subject_id?: string;
    subject_name?: string;
    max_marks?: number;
    parsed_count?: number;
    matched_count?: number;
    rows?: ScanMarkRow[];
  }>('/assessments/marks/scan-analyze', { method: 'POST', body });
}

export async function scanMarksheetSave(body: {
  exam_id: string;
  subject_id: string;
  max_marks?: number;
  rows: ScanMarkRow[];
}) {
  return deskFetch<{
    added?: number;
    updated?: number;
    failed?: number;
    errors?: string[];
  }>('/assessments/marks/scan-save', { method: 'POST', body });
}


// ─── Library (staff / librarian) ──────────────────────────────────────────────────────────────

export type LibraryLoanRow = {
  id?: string;
  book_title?: string | null;
  book_number?: string | null;
  book_cover_url?: string | null;
  status?: string | null;
  issued_at?: string | null;
  due_at?: string | null;
  returned_at?: string | null;
  borrower_name?: string | null;
  student_name?: string | null;
  student_number?: string | null;
  admission_number?: string | null;
  class_name?: string | null;
  days_late?: number | null;
};

/**
 * Library loans, one page at a time. A librarian or school leader gets the school's loans; anyone else
 * (a teacher, a learner) only their own. `status`: active (open + overdue) | overdue | returned.
 */
export async function fetchLibraryLoansPage(opts: { status?: string; page?: number; limit?: number; q?: string }) {
  const params = new URLSearchParams({ page: String(opts.page ?? 1), limit: String(opts.limit ?? 20) });
  if (opts.status) params.set('status', opts.status);
  if (opts.q?.trim()) params.set('q', opts.q.trim());
  const data = await deskFetch<{ loans?: LibraryLoanRow[]; total?: number; page?: number; limit?: number } | null>(
    `/library/loans?${params}`,
  );
  const loans = unwrapList<LibraryLoanRow>(data, ['loans', 'items']);
  const total = Number((data as { total?: number } | null)?.total);
  return { loans, total: Number.isFinite(total) ? total : loans.length };
}

/** Librarian dashboard counters (GET /library/dashboard); null when the account cannot see it. */
export async function fetchLibraryDashboard(): Promise<Record<string, unknown> | null> {
  try {
    const data = await deskFetch<Record<string, unknown> | null>('/library/dashboard');
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

/** The exam a teacher most likely means: the current one, else the newest still open for marking, else the first. */
export function pickDefaultExam<T extends { id: string; marking_status?: string; is_current?: unknown }>(exams: T[]): T | null {
  return (
    exams.find((e) => e.is_current === true || e.is_current === 1) ??
    exams.find((e) => String(e.marking_status ?? '').toLowerCase() === 'open') ??
    exams[0] ??
    null
  );
}

/** Mark entry status for one exam: every class × subject row (done ones too), for progress bars. */
export async function fetchMarksEntryStatusAll(examId: string): Promise<MarksEntryStatusRow[]> {
  const data = await deskFetch<{ exam_id?: string; classes?: Array<Record<string, unknown>> } | null>(
    `/assessments/marks/entry-status?exam_id=${encodeURIComponent(examId)}`,
  );
  return unwrapList<Record<string, unknown>>(data, ['classes', 'rows', 'items']).map((c) => {
    const total = Number(c.total_students ?? c.total_count ?? 0) || 0;
    const entered = Number(c.entered_students ?? c.entered_count ?? 0) || 0;
    const pending = Number(c.pending_students ?? c.pending_count ?? Math.max(0, total - entered)) || 0;
    return {
      exam_id: String(c.exam_id ?? examId),
      class_id: c.class_id != null ? String(c.class_id) : undefined,
      class_name: c.class_name != null ? String(c.class_name) : undefined,
      subject_id: c.subject_id != null ? String(c.subject_id) : undefined,
      subject_name: c.subject_name != null ? String(c.subject_name) : undefined,
      teacher_name: c.teacher_name != null && c.teacher_name !== '—' ? String(c.teacher_name) : undefined,
      pending_count: pending,
      total_count: total,
      entered_count: entered,
    };
  });
}
