/** Unified AI token balance — same sources as TokenBalancePill and BalancesScreen. */
import { deskFetch } from './deskApi';
import { fetchBalances } from './profileApi';

function pickBalance(data: unknown): number | null {
  if (data == null || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.balance === 'number' && Number.isFinite(o.balance)) return o.balance;
  if (typeof o.tokens === 'number' && Number.isFinite(o.tokens)) return o.tokens;
  const inner = o.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    if (typeof d.balance === 'number' && Number.isFinite(d.balance)) return d.balance;
    if (typeof d.tokens === 'number' && Number.isFinite(d.tokens)) return d.tokens;
  }
  return null;
}

/** Returns null when balance is unknown — never treat as zero. */
export async function fetchTokenBalance(deskToken?: string | null): Promise<number | null> {
  if (deskToken) {
    try {
      const data = await deskFetch<unknown>('/comms/tokens/balance');
      const next = pickBalance(data);
      if (next != null) return next;
    } catch {
      /* fall through to platform balances */
    }
  }

  try {
    const data = await fetchBalances({ limit: 1, offset: 0 });
    const next = pickBalance(data?.balance ?? data);
    if (next != null) return next;
    const nested = Number((data as { balance?: { balance?: number } })?.balance?.balance ?? NaN);
    return Number.isFinite(nested) ? nested : null;
  } catch {
    return null;
  }
}
