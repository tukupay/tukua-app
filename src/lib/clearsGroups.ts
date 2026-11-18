// Copy of desktop/packages/shared/src/utils/clearsGroups.ts (the app cannot import the Desk packages). Keep the two the same.
/**
 * "This payment clears" on the pay pages (owner, 18 Nov 2026): a long list is grouped for the screen only. All the
 * "Arrears b/f — …" lines become one row ("Arrears brought forward · N vote heads · KES total"), the rest one row per
 * invoice ("This term's fees · N vote heads · KES total"), each collapsed with a small chevron to open it. Six lines or
 * fewer show flat, as before. The RECEIPT (document, SMS, download, Desk print) always keeps every line: this is
 * display only and never changes what is posted.
 *
 * Pure and shared: the API works the groups out for the school websites (their script cannot import this), and the
 * web in-page checkout calls it directly. Totals are added in cents, so a group's total is exactly its lines' sum.
 */

/** One line of what a payment clears. `code` is the account code, `group` the invoice it is on (when known). */
export type ClearsLine = {
  name: string;
  amount: number;
  code?: string | null;
  /** The vote head's name when `name` is a description (the internal M-Pesa path's quote). */
  vote_head?: string | null;
  /** The invoice the line is on: lines with the same group are one invoice (one term). */
  group?: string | null;
  /** How that invoice is called on screen ("Term 3 2026 fees"), when known. */
  group_label?: string | null;
};

export type ClearsRow =
  | { kind: 'line'; line: ClearsLine }
  | { kind: 'group'; id: string; label: string; arrears: boolean; count: number; amount: number; lines: ClearsLine[] };

export type ClearsView = { grouped: boolean; total: number; rows: ClearsRow[] };

/** More lines than this are grouped; this many or fewer show flat. */
export const CLEARS_GROUP_THRESHOLD = 6;

const cents = (n: unknown): number => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 100) : 0;
};

/** The sum of the amounts, added in cents (0.1 + 0.2 is 0.3 here). */
export function sumCents(lines: { amount: number }[]): number {
  return lines.reduce((t, l) => t + cents(l.amount), 0) / 100;
}

/** An arrears line: its name (or vote head) starts "Arrears b/f", or its account is a 1200.x sub-account of Fee debtors. */
export function isArrearsLine(l: Pick<ClearsLine, 'name' | 'code' | 'vote_head'>): boolean {
  const starts = (v: unknown) => /^\s*arrears\s*b\s*\/\s*f/i.test(String(v ?? ''));
  return starts(l.name) || starts(l.vote_head) || /^1200\.\S/.test(String(l.code ?? '').trim());
}

/** Money paid over what is owed: always its own row, never inside a group. */
const isPrepayment = (l: ClearsLine) => /^\s*(paid in advance|overpayment|prepay)/i.test(String(l.name ?? ''));

/**
 * The rows to show for `lines`, in their order (arrears first, as the split is oldest first). Flat when there are
 * `threshold` lines or fewer; otherwise arrears in one group and the rest one group per invoice (a group of one line
 * shows as that line). Every line is in exactly one row, and the rows' amounts add up to the lines' sum to the cent.
 */
export function groupClearsLines(lines: ClearsLine[], threshold = CLEARS_GROUP_THRESHOLD): ClearsView {
  const list = (Array.isArray(lines) ? lines : []).filter((l) => l && typeof l === 'object');
  const total = sumCents(list);
  if (list.length <= threshold) return { grouped: false, total, rows: list.map((line) => ({ kind: 'line' as const, line })) };

  type Bucket = { id: string; label: string; arrears: boolean; lines: ClearsLine[] };
  const order: (Bucket | ClearsLine)[] = [];
  const buckets = new Map<string, Bucket>();
  const termGroups = new Set<string>();
  for (const l of list) if (!isArrearsLine(l) && !isPrepayment(l)) termGroups.add(String(l.group ?? ''));
  const single = termGroups.size <= 1;
  for (const l of list) {
    if (isPrepayment(l)) {
      order.push(l);
      continue;
    }
    const arrears = isArrearsLine(l);
    const key = arrears ? 'arrears' : `inv:${String(l.group ?? '')}`;
    let b = buckets.get(key);
    if (!b) {
      const named = String(l.group_label ?? '').trim();
      const label = arrears ? 'Arrears brought forward' : single ? "This term's fees" : named || (l.group ? `Invoice ${String(l.group)}` : 'Other fees');
      b = { id: key, label, arrears, lines: [] };
      buckets.set(key, b);
      order.push(b);
    }
    b.lines.push(l);
  }
  const rows: ClearsRow[] = [];
  for (const item of order) {
    if (!('lines' in item)) {
      rows.push({ kind: 'line', line: item });
      continue;
    }
    if (item.lines.length === 1) rows.push({ kind: 'line', line: item.lines[0] });
    else rows.push({ kind: 'group', id: item.id, label: item.label, arrears: item.arrears, count: item.lines.length, amount: sumCents(item.lines), lines: item.lines });
  }
  // Arrears first, whatever order the lines came in (the oldest money is cleared first).
  rows.sort((a, b) => Number(b.kind === 'group' && b.arrears) - Number(a.kind === 'group' && a.arrears));
  return { grouped: rows.some((r) => r.kind === 'group'), total, rows };
}

/** "Arrears brought forward · 5 vote heads": the words on a group's row (the amount is shown beside it). */
export function clearsGroupTitle(g: { label: string; count: number }): string {
  return `${g.label} · ${g.count} vote head${g.count === 1 ? '' : 's'}`;
}
