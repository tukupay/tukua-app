/** In-app notifications (`/platform/notifications`): pages newest first, mark one / all read. */
import { deskFetch } from './deskApi';

export type AppNotification = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationPage = {
  items: AppNotification[];
  /** null when the server does not say (older API). */
  hasMore: boolean | null;
  /** Unread over every notification; null when the server does not say. */
  unreadCount: number | null;
};

function clean(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? '').trim();
  if (!id) return null;
  return {
    id,
    event_type: String(r.event_type ?? ''),
    title: String(r.title ?? '').trim() || 'Notification',
    body: r.body != null && String(r.body).trim() ? String(r.body) : null,
    href: r.href != null && String(r.href).trim() ? String(r.href) : null,
    is_read: r.is_read === true || r.is_read === 1 || r.is_read === 'true',
    created_at: String(r.created_at ?? ''),
  };
}

/** One page; pass `before` = created_at of the last item shown for the next (older) page. */
export async function fetchNotificationsPage(opts: { limit?: number; before?: string | null; unreadOnly?: boolean } = {}) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 25) });
  if (opts.before) params.set('before', opts.before);
  if (opts.unreadOnly) params.set('unread', '1');
  const data = await deskFetch<{ items?: unknown[]; has_more?: boolean; unread_count?: number | null } | null>(
    `/platform/notifications?${params}`,
  );
  const items = (Array.isArray(data?.items) ? data!.items : []).map(clean).filter((x): x is AppNotification => !!x);
  return {
    items,
    hasMore: typeof data?.has_more === 'boolean' ? data.has_more : null,
    unreadCount: typeof data?.unread_count === 'number' ? data.unread_count : null,
  } satisfies NotificationPage;
}

export function markNotificationRead(id: string) {
  return deskFetch(`/platform/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return deskFetch('/platform/notifications/read-all', { method: 'POST' });
}
