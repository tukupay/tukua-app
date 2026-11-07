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
  avatar_url?: string | null;
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

/**
 * The active school's details. `/parents/me/school` answers only for parents (403 for security and
 * other staff, who also show the school card); everyone else reads `/schools/:id`.
 */
export async function fetchParentSchool(): Promise<{ school?: Record<string, unknown> }> {
  try {
    const data = await deskFetch<{ school?: Record<string, unknown> } | null>('/parents/me/school');
    return data ?? {};
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    const schoolId = getDeskActiveContext().schoolId;
    if ((status !== 403 && status !== 404) || !schoolId) throw e;
    const row = await deskFetch<Record<string, unknown> | null>(`/schools/${encodeURIComponent(schoolId)}`);
    const school = (row && typeof row === 'object' && 'school' in row ? (row as { school?: Record<string, unknown> }).school : row) ?? undefined;
    if (!school) return {};
    const contact = (school.contact ?? {}) as Record<string, unknown>;
    const details = (school.details ?? {}) as Record<string, unknown>;
    // Same field names as /parents/me/school so the school card reads either.
    return {
      school: {
        ...school,
        address: school.address ?? contact.address ?? null,
        phone: school.phone ?? contact.phone ?? null,
        email: school.email ?? contact.email ?? null,
        principal_name: school.principal_name ?? details.principal ?? null,
      },
    };
  }
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

export type ParentReportFormSubject = {
  subject_id?: string;
  subject: string;
  code?: string | null;
  short_form?: string | null;
  marks?: number | null;
  max_marks?: number | null;
  percentage?: number | null;
  grade?: string | null;
  points?: number | null;
  rank_in_class?: number | null;
  remark?: string | null;
  status?: string;
};

export type ParentReportForm = {
  school?: {
    id?: string | null;
    name?: string | null;
    logo_url?: string | null;
    motto?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    principal_name?: string | null;
  } | null;
  student?: {
    id: string;
    full_name?: string | null;
    admission_number?: string | null;
    class_name?: string | null;
    class_level?: string | null;
    photo_url?: string | null;
  } | null;
  exam?: {
    id: string;
    name?: string | null;
    exam_type?: string | null;
    academic_year?: string | null;
    term?: string | null;
    marking_status?: string | null;
  } | null;
  summary?: {
    total_marks?: number | null;
    total_possible?: number | null;
    overall_mean?: number | null;
    overall_grade?: string | null;
    total_grade_points?: number | null;
    mean_grade_points?: number | null;
    subject_count?: number | null;
    rank_in_class?: number | null;
    rank_out_of_class?: number | null;
    rank_in_level?: number | null;
    rank_out_of_level?: number | null;
    class_mean_marks?: number | null;
    level_mean_marks?: number | null;
    class_teacher_comment?: string | null;
    principal_comment?: string | null;
    has_report?: boolean;
  } | null;
  subjects?: ParentReportFormSubject[];
};

/**
 * One child's report form for one exam (GET /parents/me/report-form). 404 until the API with this route is
 * deployed: callers fall back to the summary they already have.
 */
export async function fetchParentReportForm(studentId: string, examId: string) {
  const params = new URLSearchParams({ student_id: studentId, exam_id: examId });
  return deskFetch<ParentReportForm>(`/parents/me/report-form?${params}`, { expectStatus: [404], timeoutMs: 15000 });
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

export async function fetchCalendarReminderSettings() {
  return deskFetch<{
    school_reminders_enabled?: boolean;
    reminder_lead_hours?: number;
    my_reminders_enabled?: boolean;
    can_manage_school?: boolean;
  }>('/events/reminder-settings');
}

export async function updateMyCalendarReminders(enabled: boolean) {
  return deskFetch<{ my_reminders_enabled?: boolean }>('/events/reminder-settings/me', {
    method: 'PUT',
    body: { enabled },
  });
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

/** Parent scan for daily school visit or event attendance register. */
export async function scanParentRegister(body: {
  qr_payload: string;
  person_type?: string;
  person_id?: string;
  full_name?: string;
  phone?: string;
  direction?: 'in' | 'out';
}) {
  return deskFetch<{ entry?: unknown; session?: unknown; scan_type?: string; message?: string; direction?: string }>(
    '/registers/scan',
    { method: 'POST', body },
  );
}

export async function fetchRegisterScanTodayStatus() {
  return deskFetch<{
    last_direction?: 'in' | 'out' | null;
    last_marked_at?: string | null;
    suggested_action?: 'in' | 'out';
    has_scanned_today?: boolean;
  }>('/registers/scan/today-status');
}

export type SchoolCollectionPurpose =
  | 'school_fees'
  | 'school_pocket'
  | 'teacher_tip'
  | 'bursary'
  | 'school_event'
  | 'event_payment';

export async function quoteSchoolCollection(body: {
  purpose: SchoolCollectionPurpose;
  amount: number;
  /** School fees: the reply lists what the money clears (same rule as the school's receipting). */
  student_id?: string;
}) {
  return deskFetch<{
    amount_kes?: number;
    bank_app_charge_pct?: number;
    bank_app_charge_kes?: number;
    total_kes?: number;
    balance_kes?: number;
    breakdown?: Array<{ label: string; vote_head?: string; invoice_number?: string | null; amount: number }>;
  }>('/accounts/collections/quote', { method: 'POST', body });
}

export async function promptSchoolCollectionStk(body: {
  purpose: SchoolCollectionPurpose;
  amount: number;
  phone: string;
  student_id?: string;
  teacher_id?: string;
  description?: string;
}) {
  return deskFetch<{
    checkout_request_id?: string;
    customer_message?: string;
    quote?: {
      amount_kes?: number;
      bank_app_charge_pct?: number;
      bank_app_charge_kes?: number;
      total_kes?: number;
    };
  }>('/accounts/collections/stk-prompt', { method: 'POST', body });
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

export type ParentInvoice = {
  id?: string;
  student_id?: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  amount?: number | string | null;
  balance?: number | string | null;
  status?: string | null;
  description?: string | null;
};

export type ParentPaymentSlip = {
  id?: string;
  student_id?: string | null;
  amount?: number | string | null;
  bank_ref?: string | null;
  paid_on?: string | null;
  note?: string | null;
  status?: string | null;
  created_at?: string | null;
  currency?: string | null;
  file_url?: string | null;
  file_name?: string | null;
};

export type ParentBursaryProgram = {
  id?: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  deadline?: string | null;
};

export type ParentBursaryContribution = {
  id?: string;
  program_id?: string | null;
  amount?: number | string | null;
  note?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type ParentAttendanceRecord = {
  id?: string;
  student_id?: string;
  attendance_date?: string | null;
  status?: string | null;
  attendance_status?: string | null;
};

export type ParentAttendanceSummary = {
  student_id: string;
  full_name?: string | null;
  present: number;
  absent: number;
  late: number;
  total: number;
};

export type ParentTransportHome = {
  id?: string;
  student_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  address_text?: string | null;
  label?: string | null;
};

export type ParentTransportTrip = {
  id?: string;
  student_id?: string;
  trip_type?: string | null;
  direction?: string | null;
  status?: string | null;
  vehicle_label?: string | null;
  route_label?: string | null;
  boarded_at?: string | null;
  alighted_at?: string | null;
  live_lat?: number | null;
  live_lng?: number | null;
  face_boarded?: number | null;
  created_at?: string | null;
  latest_gps?: { lat?: number; lng?: number; speed_kmh?: number | null } | null;
  gps_path?: Array<{ lat?: number; lng?: number; label?: string }>;
};

export async function fetchParentInvoices(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{ invoices?: ParentInvoice[]; count?: number }>(`/parents/me/invoices${q}`);
}

export async function fetchParentPaymentSlips(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{ slips?: ParentPaymentSlip[]; count?: number }>(
    `/parents/me/payment-slips${q}`,
  );
}

export async function createParentPaymentSlip(body: {
  student_id?: string;
  /** Optional — AI/bursar may fill from the photo; photo-only submit allowed. */
  amount?: number | string;
  bank_ref?: string;
  paid_on?: string;
  note?: string;
  file_url?: string;
  file_name?: string;
}) {
  const sid = resolveStudentId(body.student_id);
  return deskFetch<{ slip?: ParentPaymentSlip }>('/parents/me/payment-slips', {
    method: 'POST',
    body: { ...body, student_id: sid ?? body.student_id },
  });
}

export type BursaryApplication = {
  id?: string;
  student_id?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  provider_name?: string | null;
  funder_name?: string | null;
  requested_amount?: number | string | null;
  approved_amount?: number | string | null;
  disbursed_amount?: number | string | null;
  status?: string | null;
  applied_on?: string | null;
  created_at?: string | null;
  notes?: string | null;
  decision_notes?: string | null;
};

export async function fetchParentBursary() {
  return deskFetch<{
    programs?: ParentBursaryProgram[];
    contributions?: ParentBursaryContribution[];
    kitty_total?: number;
    /** The parent's own children's applications (school programs). */
    applications?: BursaryApplication[];
    /** Their applications to outside funders. */
    funder_applications?: BursaryApplication[];
  }>('/parents/me/bursary');
}

/** A parent applies to one of the school's open bursary programs for one of their own children. */
export async function applyParentBursary(body: {
  student_id: string;
  program_id: string;
  requested_amount: number;
  notes?: string;
}) {
  return deskFetch<Record<string, unknown>>('/parents/me/bursary/apply', { method: 'POST', body });
}

export async function contributeParentBursary(body: {
  amount: number | string;
  program_id?: string;
}) {
  return deskFetch<{ contribution?: ParentBursaryContribution }>('/parents/me/bursary/contribute', {
    method: 'POST',
    body,
  });
}

export async function fetchParentAttendance(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{
    records?: ParentAttendanceRecord[];
    summary?: ParentAttendanceSummary[];
  }>(`/parents/me/attendance${q}`);
}

export async function fetchParentTransportTrips(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  const q = sid ? `?student_id=${encodeURIComponent(sid)}` : '';
  return deskFetch<{
    trips?: ParentTransportTrip[];
    live?: ParentTransportTrip | null;
    trip_runs?: ParentTransportTrip[];
    demo?: boolean;
    note?: string;
  }>(`/parents/me/transport/trips${q}`);
}

export async function fetchParentTransportHome(studentId?: string | null) {
  const sid = resolveStudentId(studentId);
  if (!sid) throw new Error('Select a student first');
  return deskFetch<{ home?: ParentTransportHome | null }>(
    `/parents/me/transport/home?student_id=${encodeURIComponent(sid)}`,
  );
}

export async function putParentTransportHome(body: {
  student_id?: string;
  latitude: number;
  longitude: number;
  address_text?: string;
  label?: string;
}) {
  const sid = resolveStudentId(body.student_id);
  if (!sid) throw new Error('Select a student first');
  return deskFetch<{ home?: ParentTransportHome | null }>('/parents/me/transport/home', {
    method: 'PUT',
    body: { ...body, student_id: sid },
  });
}

export async function faceBoardParentTransport(body: {
  student_id?: string;
  trip_id?: string;
  face_event_id?: string;
}) {
  const sid = resolveStudentId(body.student_id);
  if (!sid) throw new Error('Select a student first');
  return deskFetch<{ trip?: ParentTransportTrip; demo?: boolean }>(
    '/parents/me/transport/face-board',
    {
      method: 'POST',
      body: { ...body, student_id: sid },
    },
  );
}

/** One page of a parent's attendance records (newest first) plus per-child totals over every recorded day. */
export type AttendancePage = {
  records: Array<ParentAttendanceRecord & { check_in_at?: string | null; check_out_at?: string | null; method?: string | null; notes?: string | null }>;
  summary: ParentAttendanceSummary[];
  /** Total rows for the selection; null when the server does not report it (older API). */
  total: number | null;
  /** More rows after this page; null when the server does not say (older API, which ignores offset). */
  hasMore: boolean | null;
};

export function toAttendancePage(data: unknown): AttendancePage {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const records = Array.isArray(d.records) ? (d.records as AttendancePage['records']) : [];
  const summary = (Array.isArray(d.summary) ? d.summary : []).map((s) => {
    const row = (s ?? {}) as Record<string, unknown>;
    const n = (k: string) => (Number.isFinite(Number(row[k])) ? Number(row[k]) : 0);
    return {
      student_id: String(row.student_id ?? ''),
      full_name: row.full_name != null ? String(row.full_name) : null,
      present: n('present'),
      absent: n('absent'),
      late: n('late'),
      total: n('total'),
    };
  });
  const total = Number.isFinite(Number(d.total)) && d.total != null ? Number(d.total) : null;
  const hasMore = typeof d.has_more === 'boolean' ? d.has_more : null;
  return { records, summary, total, hasMore };
}

/** `GET /parents/me/attendance` with paging (limit/offset; the API caps limit at 200). */
export async function fetchParentAttendancePage(
  studentId: string | null | undefined,
  opts: { limit?: number; offset?: number } = {},
): Promise<AttendancePage> {
  const params = new URLSearchParams();
  const sid = resolveStudentId(studentId);
  if (sid) params.set('student_id', sid);
  params.set('limit', String(opts.limit ?? 30));
  params.set('offset', String(opts.offset ?? 0));
  const data = await deskFetch<unknown>(`/parents/me/attendance?${params}`);
  return toAttendancePage(data);
}
