/**
 * School meetings — Nest `/meetings/*` (same contract as Desk JoinMeetingsView).
 * Create is admin-only; parents/teachers/students use joinable + public /m links.
 */

import { deskFetch } from './deskApi';

export type JoinWindow = {
  can_join?: boolean;
  reason?: string | null;
  opens_at?: string | null;
  closes_at?: string | null;
};

export type SchoolMeeting = {
  id: string;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string;
  short_code?: string;
  short_url?: string;
  join_url?: string;
  is_public?: boolean;
  join_window?: JoinWindow;
};

type JoinableResponse = {
  items?: SchoolMeeting[];
  total?: number;
};

export async function fetchJoinableMeetings() {
  return deskFetch<JoinableResponse>('/meetings/joinable');
}

export async function createSchoolMeeting(body: {
  title: string;
  description?: string;
  starts_at?: string;
  duration_minutes?: number;
  join_opens_minutes_before?: number;
  is_public?: boolean;
  school_id?: string;
}) {
  return deskFetch<SchoolMeeting>('/meetings', { method: 'POST', body });
}

export async function hostEnterMeeting(meetingId: string, displayName?: string) {
  return deskFetch<SchoolMeeting & { host_room_path?: string }>(
    `/meetings/${encodeURIComponent(meetingId)}/host-enter`,
    { method: 'POST', body: { display_name: displayName } },
  );
}

/** Logged-in parent/teacher/student — Nest fills name+phone from profile; returns room_url. */
export async function memberEnterMeeting(meetingId: string) {
  return deskFetch<SchoolMeeting & { room_url?: string; room_path?: string }>(
    `/meetings/${encodeURIComponent(meetingId)}/member-enter`,
    { method: 'POST', body: {} },
  );
}
