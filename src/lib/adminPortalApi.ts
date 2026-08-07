/** School admin join-request approvals (Nest `/parents/join-requests`). */

import { deskFetch } from './deskApi';

export type JoinRequestRow = {
  id: string;
  status?: string;
  role_slug?: string;
  requester_name?: string;
  requester_email?: string;
  target_student_name?: string;
  target_class_name?: string;
  note?: string;
  created_at?: string;
};

function unwrapRequests(data: unknown): JoinRequestRow[] {
  if (Array.isArray(data)) return data as JoinRequestRow[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.requests)) return obj.requests as JoinRequestRow[];
  }
  return [];
}

export async function fetchPendingJoinRequests(status = 'pending') {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const data = await deskFetch<{ requests?: JoinRequestRow[]; pending_count?: number }>(
    `/parents/join-requests${q}`,
  );
  return {
    requests: unwrapRequests(data),
    pendingCount: Number((data as { pending_count?: number })?.pending_count ?? 0),
  };
}

export async function approveJoinRequest(id: string) {
  return deskFetch(`/parents/join-requests/${encodeURIComponent(id)}/approve`, { method: 'POST' });
}

export async function rejectJoinRequest(id: string) {
  return deskFetch(`/parents/join-requests/${encodeURIComponent(id)}/reject`, { method: 'POST' });
}

export async function approveAllJoinRequests() {
  return deskFetch('/parents/join-requests/approve-all', { method: 'POST' });
}
