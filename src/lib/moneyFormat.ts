/**
 * Formatting and list helpers for the money screens (kept out of MoneyKit.tsx so that file only exports
 * components and keeps fast refresh).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

/** "KES 12,500" (no decimals unless the amount has cents). */
export function kes(n: number | string | undefined | null): string {
  const v = Number(n ?? 0) || 0;
  const cents = Math.round(v * 100) % 100 !== 0;
  return `KES ${v.toLocaleString('en-KE', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** "2026-10-04T14:37:59Z" → "4 Oct 2026" (falls back to the raw date part). */
export function shortDate(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * A phone for display with two digits hidden: "0712345678" → "07123••678". Takes a raw number or the
 * API's masked form ("07123**678" → "07123••678"). Empty when nothing usable.
 */
export function maskPhoneDisplay(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  // Already masked by the API ("07123**678"): show it as is, with dots.
  if (/[*•]/.test(s)) return s.replace(/\*/g, '•');
  if (digits.length < 7) return '';
  // Two digits hidden (owner, 2026-11-08): "0712345678" -> "07123••678".
  const local = digits.startsWith('254') ? `0${digits.slice(3)}` : digits;
  const cut = local.length - 5;
  return `${local.slice(0, cut)}••${local.slice(cut + 2)}`;
}

/** Two-letter initials for an avatar. */
export function initialsOf(name: string | null | undefined): string {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

/**
 * Client-side windowing for a list the API returns whole: shows `pageSize` rows, then the next batch
 * each time the list reaches its end (FlatList onEndReached). Resets when the list itself changes.
 */
export function useWindowedList<T>(items: T[], pageSize = 12) {
  const [count, setCount] = useState(pageSize);
  useEffect(() => setCount(pageSize), [items, pageSize]);
  const visible = useMemo(() => items.slice(0, count), [items, count]);
  const hasMore = count < items.length;
  const loadMore = useCallback(() => {
    setCount((c) => (c < items.length ? c + pageSize : c));
  }, [items.length, pageSize]);
  return { visible, hasMore, loadMore, total: items.length };
}
