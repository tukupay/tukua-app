/**
 * Unified AI token balance — same sources as TokenBalancePill and BalancesScreen.
 * Returns null when balance is unknown (network/API error) — never treat as zero.
 */
import { deskFetch } from './deskApi';
import { fetchBalances } from './profileApi';

export async function fetchTokenBalance(deskToken?: string | null): Promise<number | null> {
  if (deskToken) {
    try {
      const data = await deskFetch<{ balance?: number; tokens?: number }>('/comms/tokens/balance');
      const next =
        typeof data?.balance === 'number'
          ? data.balance
          : typeof data?.tokens === 'number'
            ? data.tokens
            : null;
      if (next != null && Number.isFinite(next)) return next;
    } catch {
      /* fall through to Nest */
    }
  }

  try {
    const data = await fetchBalances({ limit: 1, offset: 0 });
    const next = Number(data?.balance?.balance ?? NaN);
    return Number.isFinite(next) ? next : null;
  } catch {
    return null;
  }
}
