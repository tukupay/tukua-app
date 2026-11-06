/**
 * Clubs for families (Nest): `/parents/me/clubs` (a parent's child: list, register, leave) and
 * `/students/me/clubs` (a learner's own). Each child is read at their own school.
 */
import { deskFetch } from './deskApi';

export type ClubNote = {
  id: string;
  title: string;
  body?: string | null;
  audience: 'members' | 'school';
  author_name?: string | null;
  pinned: boolean;
  created_at: string;
};

export type FamilyClub = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  patron_name?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  venue?: string | null;
  capacity: number | null;
  fee: number;
  requires_approval: boolean;
  member_count: number;
  spots_left: number | null;
  membership: { id: string; status: 'pending' | 'active' | 'declined' | 'left'; position: string } | null;
  can_register: boolean;
  notes: ClubNote[];
};

export type FamilyClubsView = {
  student: { id: string; name: string; school_id: string };
  clubs: FamilyClub[];
  my_clubs: number;
};

export const CLUB_KIND: Record<string, string> = {
  sports: 'Sports',
  arts: 'Arts & music',
  academic: 'Academic',
  service: 'Service',
  faith: 'Faith',
  other: 'Other',
};

export function fetchParentClubs(studentId?: string | null) {
  const q = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
  return deskFetch<FamilyClubsView>(`/parents/me/clubs${q}`);
}

export function fetchStudentClubs() {
  return deskFetch<FamilyClubsView>('/students/me/clubs');
}

export function registerForClub(clubId: string, studentId: string, note?: string) {
  return deskFetch<{ status: 'pending' | 'active' }>(`/parents/me/clubs/${encodeURIComponent(clubId)}/register`, {
    method: 'POST',
    body: { student_id: studentId, ...(note ? { note } : {}) },
  });
}

export function leaveClub(clubId: string, studentId: string) {
  return deskFetch(`/parents/me/clubs/${encodeURIComponent(clubId)}/leave`, {
    method: 'POST',
    body: { student_id: studentId },
  });
}

/** "Wednesday · 16:00 · Hall" */
export function clubMeets(c: Pick<FamilyClub, 'meeting_day' | 'meeting_time' | 'venue'>): string {
  return [c.meeting_day, c.meeting_time, c.venue].filter(Boolean).join(' · ');
}
