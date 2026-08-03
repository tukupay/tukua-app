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
  | 'bursary';

export async function quoteSchoolCollection(body: {
  purpose: SchoolCollectionPurpose;
  amount: number;
}) {
  return deskFetch<{
    amount_kes?: number;
    bank_app_charge_pct?: number;
    bank_app_charge_kes?: number;
    total_kes?: number;
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

export async function fetchParentBursary() {
  return deskFetch<{
    programs?: ParentBursaryProgram[];
    contributions?: ParentBursaryContribution[];
    kitty_total?: number;
  }>('/parents/me/bursary');
}

export async function contributeParentBursary(body: {
  amount: number | string;
  program_id?: string;
  note?: string;
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
