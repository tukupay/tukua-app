/**
 * Security staff transport API — Nest /transport/me/* and trip controls.
 */
import { deskFetch } from './deskApi';

export type SecurityAssignment = {
  vehicle_name?: string | null;
  vehicle_plate?: string | null;
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
};

export async function fetchSecurityAssignment() {
  return deskFetch<{ assignment?: SecurityAssignment | null }>('/transport/me/assigned');
}

export async function fetchSecurityActiveTrip() {
  return deskFetch<{ trip?: SecurityTripRun | null }>('/transport/me/active-trip');
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
  personType: 'teacher' | 'staff',
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
  return deskFetch<unknown>(`/transport/trip-runs/${encodeURIComponent(tripRunId)}/board`, {
    method: 'POST',
    body,
  });
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
  }>('/transport/face/identify', {
    method: 'POST',
    body: { person_type: 'student', ...body },
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
    enrolled_count?: number;
  }>('/transport/face/analyze', {
    method: 'POST',
    body: { person_type: 'student', threshold: 0.55, ...body },
  });
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
