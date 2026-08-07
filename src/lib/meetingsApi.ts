/**
 * School meetings — Nest `/meetings/*` (same contract as Desk JoinMeetingsView).
 * Create is admin-only; parents/teachers/students use joinable + public /m links.
 */

import { deskFetch } from './deskApi';
import { getDeskApiBaseUrl } from './localHost';

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

function absoluteMeetUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  const raw = String(pathOrUrl).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = getDeskApiBaseUrl().replace(/\/$/, '');
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

/**
 * Prefer Nest HMAC host_room_path / room_url for in-app join.
 * Never fall through to bare meet.jit.si `jitsi_join_url` (stale public lobby links).
 */
export function resolveHostRoomUrl(entered: {
  host_room_path?: string;
  room_url?: string;
  jitsi_join_url?: string;
  join_url?: string;
} | null | undefined): string | null {
  if (!entered) return null;
  const nest =
    absoluteMeetUrl(entered.host_room_path) || absoluteMeetUrl(entered.room_url);
  if (nest) return nest;
  // Guest join_url may still be Nest /m/... path — allow absoluteMeetUrl on Nest-shaped URLs only.
  const join = absoluteMeetUrl(entered.join_url);
  if (join && !/meet\.jit\.si/i.test(join)) return join;
  return null;
}

export function resolveMemberRoomUrl(entered: {
  room_url?: string;
  room_path?: string;
  join_url?: string;
} | null | undefined): string | null {
  if (!entered) return null;
  return (
    absoluteMeetUrl(entered.room_url) ||
    absoluteMeetUrl(entered.room_path) ||
    absoluteMeetUrl(entered.join_url)
  );
}

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
  return deskFetch<
    SchoolMeeting & {
      host_room_path?: string;
      room_url?: string;
      jitsi_join_url?: string;
      participant_session_id?: string;
    }
  >(`/meetings/${encodeURIComponent(meetingId)}/host-enter`, {
    method: 'POST',
    body: { display_name: displayName },
  });
}

/** Logged-in member — Nest fills name+phone from profile (or body overrides). */
export async function memberEnterMeeting(
  meetingId: string,
  body?: { display_name?: string; full_name?: string; phone?: string },
) {
  return deskFetch<
    SchoolMeeting & { room_url?: string; room_path?: string; participant_session_id?: string }
  >(`/meetings/${encodeURIComponent(meetingId)}/member-enter`, {
    method: 'POST',
    body: body || {},
  });
}

export async function leaveMeeting(meetingId: string, participantId?: string) {
  return deskFetch(`/meetings/${encodeURIComponent(meetingId)}/leave`, {
    method: 'POST',
    body: participantId ? { participant_id: participantId } : {},
  });
}

export async function heartbeatMeeting(meetingId: string, participantId?: string) {
  return deskFetch(`/meetings/${encodeURIComponent(meetingId)}/heartbeat`, {
    method: 'POST',
    body: participantId ? { participant_id: participantId } : {},
  });
}
