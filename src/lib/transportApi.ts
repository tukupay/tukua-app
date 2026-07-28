/**
 * Security staff transport API — Nest /transport/me/* and trip controls.
 */
import { deskFetch } from './deskApi';

/** Boarding / gate face match default — lockstep with Nest FACE_MATCH_THRESHOLD (0.82). */
export const FACE_MATCH_THRESHOLD = 0.82;

export type SecurityAssignment = {
  vehicle_name?: string | null;
  vehicle_plate?: string | null;
  vehicle_photo_url?: string | null;
  route_name?: string | null;
  vehicle_id?: string | null;
  route_id?: string | null;
};

export type SecurityTripRun = {
  id: string;
  status?: string;
  trip_kind?: string;
  started_at?: string;
  vehicle_id?: string;
  vehicle_name?: string | null;
  vehicle_plate?: string | null;
  vehicle_photo_url?: string | null;
};

export type BoardedStudent = {
  boarding_id: string;
  student_id: string;
  name: string;
  student_number?: string | null;
  class_name?: string | null;
  boarded_at?: string | null;
  method?: string | null;
};

export async function fetchSecurityAssignment() {
  return deskFetch<{ assignment?: SecurityAssignment | null }>('/transport/me/assigned');
}

export async function fetchSecurityActiveTrip() {
  return deskFetch<{
    trip?: SecurityTripRun | null;
    boarded_students?: BoardedStudent[];
    boarded_total?: number;
  }>('/transport/me/active-trip');
}

export async function startSecurityTrip(body: {
  vehicle_id: string;
  route_id?: string;
  trip_kind?: string;
  teacher_id?: string;
  notes?: string;
}) {
  return deskFetch<SecurityTripRun>('/transport/trip-runs/start', { method: 'POST', body });
}

export async function endSecurityTrip(tripRunId: string) {
  return deskFetch<{ id?: string }>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/end`, {
    method: 'POST',
  });
}

export async function postSecurityTripGps(
  tripRunId: string,
  body: { latitude: number; longitude: number; speed_kmh?: number; recorded_at?: string },
) {
  return deskFetch<unknown>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/gps`, {
    method: 'POST',
    body,
  });
}

export async function postSecurityTripGpsBatch(
  tripRunId: string,
  pins: Array<{ latitude: number; longitude: number; speed_kmh?: number; recorded_at?: string }>,
) {
  return deskFetch<unknown>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/gps/batch`, {
    method: 'POST',
    body: { pins },
  });
}

export type TransportStudentMatch = {
  id: string;
  name: string;
  student_number?: string;
  admission_number?: string;
  class_label?: string;
  person_type?: string;
  employee_number?: string | null;
  staff_number?: string | null;
  parent_number?: string | null;
  email?: string | null;
  phone?: string | null;
};

export async function searchTransportStudents(q: string, limit = 15) {
  const params = new URLSearchParams();
  const term = q.trim();
  if (term) params.set('q', term);
  params.set('limit', String(limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return deskFetch<{ students?: TransportStudentMatch[]; count?: number }>(
    `/transport/students/search${suffix}`,
  );
}

export async function searchTransportPeople(
  personType: 'teacher' | 'staff' | 'parent',
  q: string,
  limit = 15,
) {
  const params = new URLSearchParams();
  params.set('person_type', personType);
  const term = q.trim();
  if (term) params.set('q', term);
  params.set('limit', String(limit));
  return deskFetch<{ people?: TransportStudentMatch[]; count?: number }>(
    `/transport/people/search?${params.toString()}`,
  );
}

export async function boardSecurityStudent(
  tripRunId: string,
  body: {
    student_id?: string;
    admission_number?: string;
    notify_parent?: boolean;
    method?: string;
  },
) {
  return deskFetch<{
    boarding?: unknown;
    notification?: { notified?: boolean; detail?: string };
    boarded_students?: BoardedStudent[];
    boarded_total?: number;
    trip_kind_label?: string;
  }>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/board`, {
    method: 'POST',
    body,
  });
}

export async function fetchBoardedStudents(tripRunId: string, page = 1, limit = 40) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return deskFetch<{
    students?: BoardedStudent[];
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  }>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/boarded?${params.toString()}`);
}

export async function identifyTransportFace(body: {
  embedding: number[];
  model_version?: string;
  threshold?: number;
  person_type?: 'student' | 'teacher' | 'staff';
}) {
  return deskFetch<{
    match?: boolean;
    score?: number;
    student_id?: string;
    student_number?: string | null;
    name?: string;
    message?: string;
    reason?: string;
  }>('/transport/face/identify', {
    method: 'POST',
    body: { person_type: 'student', threshold: FACE_MATCH_THRESHOLD, ...body },
  });
}

/** Nest analyzes image (school-scoped). Prefer this over client-side embedding. */
export async function analyzeTransportFace(body: {
  image_base64: string;
  person_type?: 'student' | 'teacher' | 'staff';
  model_version?: string;
  threshold?: number;
}) {
  return deskFetch<{
    match?: boolean;
    score?: number;
    student_id?: string;
    person_id?: string;
    student_number?: string | null;
    name?: string;
    message?: string;
    reason?: string;
    enrolled_count?: number;
    face_detected?: boolean;
  }>('/transport/face/analyze', {
    method: 'POST',
    body: { person_type: 'student', threshold: FACE_MATCH_THRESHOLD, ...body },
  });
}

/** Check if person already has a face enrolled (enroll still overwrites). */
export async function getTransportFaceStatus(opts: {
  person_id: string;
  person_type?: 'student' | 'teacher' | 'staff' | 'parent';
}) {
  const params = new URLSearchParams({
    person_id: opts.person_id,
    person_type: opts.person_type ?? 'student',
  });
  return deskFetch<{
    enrolled?: boolean;
    person_id?: string;
    person_type?: string;
    embedding_status?: 'ready' | 'pending' | 'invalid' | null;
    image_url?: string | null;
    updated_at?: string | null;
    model_version?: string | null;
  }>(`/transport/face/status?${params.toString()}`);
}

/** Fast enroll — Nest saves image immediately; embedding runs in background. */
export async function enrollTransportFaceImage(body: {
  student_id?: string;
  person_id?: string;
  person_type?: 'student' | 'teacher' | 'staff';
  image_base64: string;
  model_version?: string;
}) {
  return deskFetch<{
    person_id?: string;
    student_id?: string;
    name?: string;
    student_number?: string | null;
    image_url?: string;
    embedding_status?: string;
    face_detected?: boolean;
  }>('/transport/face/enroll-image', { method: 'POST', body });
}

export async function enrollTransportFace(body: {
  student_id?: string;
  person_id?: string;
  person_type?: 'student' | 'teacher' | 'staff';
  embedding: number[];
  model_version?: string;
  image_url?: string;
}) {
  return deskFetch<unknown>('/transport/face/enroll', { method: 'POST', body });
}

export async function teacherGateScan(body: {
  qr_token: string;
  latitude: number;
  longitude: number;
  action?: 'in' | 'out';
}) {
  return deskFetch<{ record?: unknown; geofence?: { within_range?: boolean; distance_m?: number }; action?: string }>(
    '/attendance/gate/teacher-scan',
    { method: 'POST', body },
  );
}

export async function fetchGateTodayStatus() {
  return deskFetch<{
    check_in_at?: string | null;
    check_out_at?: string | null;
    suggested_action?: 'in' | 'out';
    has_scanned_today?: boolean;
  }>('/attendance/gate/my-today');
}

/** Security: mark student/teacher/staff/parent at gate (face/QR/search). */
export async function securityGateCheck(body: {
  student_id?: string;
  admission_number?: string;
  teacher_id?: string;
  person_id?: string;
  person_type?: 'student' | 'teacher' | 'staff' | 'parent';
  full_name?: string;
  qr_token?: string;
  action: 'in' | 'out';
  method?: string;
}) {
  return deskFetch<{ record?: unknown; person_type?: string }>('/attendance/gate/check', {
    method: 'POST',
    body,
  });
}

/** Paginated daily (gate) student attendance for a date. */
export async function fetchDailyStudentAttendance(opts: {
  date: string;
  page?: number;
  limit?: number;
  q?: string;
  class_id?: string;
}) {
  const params = new URLSearchParams({ date: opts.date });
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.q) params.set('q', opts.q);
  if (opts.class_id) params.set('class_id', opts.class_id);
  return deskFetch<{
    rows?: Array<{
      student_id: string;
      name: string;
      admission_number?: string | null;
      class_name?: string | null;
      status?: string;
      check_in_at?: string | null;
      check_out_at?: string | null;
      method?: string | null;
    }>;
    total?: number;
    page?: number;
    limit?: number;
    date?: string;
  }>(`/attendance/daily/students?${params.toString()}`);
}

/** Ensure today's daily register session. */
export async function ensureDailyRegister(sessionDate?: string) {
  return deskFetch<{ session?: { id: string; session_date?: string } }>('/registers/daily/ensure', {
    method: 'POST',
    body: { session_date: sessionDate || new Date().toISOString().slice(0, 10) },
  });
}

export async function fetchRegisterEntries(
  sessionId: string,
  opts?: { q?: string; person_type?: string; page?: number; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.q) params.set('q', opts.q);
  if (opts?.person_type) params.set('person_type', opts.person_type);
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return deskFetch<{
    entries?: Array<{
      id: string;
      full_name?: string | null;
      person_type?: string | null;
      person_id?: string | null;
      direction?: string | null;
      marked_at?: string | null;
      method?: string | null;
      purpose?: string | null;
      id_number?: string | null;
      phone?: string | null;
      status?: string | null;
    }>;
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  }>(`/registers/sessions/${encodeURIComponent(sessionId)}/entries${suffix}`);
}

export async function listLiveTrips() {
  return deskFetch<{
    trips?: Array<SecurityTripRun & { boarded_count?: number; vehicle_photo_url?: string | null }>;
    count?: number;
  }>('/transport/live');
}
