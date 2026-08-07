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
  const data = await deskFetch<{ classes?: Array<Record<string, unknown>> }>('/classes?limit=120&page=1');
  const classes = unwrapList<Record<string, unknown>>(data, ['classes']);
  return classes.filter(
    (c) =>
      String(c.class_teacher_user_id ?? c.class_teacher_id ?? '') === teacherUserId,
  );
}

export async function fetchTeacherDisciplineIncidents() {
  return deskFetch<unknown>('/discipline/incidents?scope=mine');
}

export async function fetchMarksEntryStatus(examId?: string) {
  const params = examId ? `?exam_id=${encodeURIComponent(examId)}` : '';
  return deskFetch<{ rows?: Array<Record<string, unknown>>; items?: Array<Record<string, unknown>> }>(
    `/assessments/marks/entry-status${params}`,
  );
}

export async function searchDisciplineStudents(q: string) {
  const params = new URLSearchParams({ q: q.trim() });
  const data = await deskFetch<{ students?: Array<Record<string, unknown>> }>(
    `/discipline/students/search?${params}`,
  );
  return unwrapList<Record<string, unknown>>(data, ['students']);
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

