import { useCallback, useEffect, useState } from 'react';
import {
  GateDirection,
  GateDayRecord,
  suggestGateDirection,
  timeOfDayGateDefault,
} from '../lib/gateScanDirection';

type StatusFetcher = () => Promise<GateDayRecord | null | undefined>;

/** Load today's gate/register history and suggest IN/OUT (user can override). */
export function useGateScanDirection(fetchStatus: StatusFetcher) {
  const [direction, setDirection] = useState<GateDirection>(() => timeOfDayGateDefault());
  const [loading, setLoading] = useState(true);
  const [hasScannedToday, setHasScannedToday] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchStatus();
      const record: GateDayRecord = {
        check_in_at: status?.check_in_at ?? null,
        check_out_at: status?.check_out_at ?? null,
        last_direction:
          status?.last_direction === 'in' || status?.last_direction === 'out'
            ? status.last_direction
            : null,
      };
      const scanned = Boolean(
        record.check_in_at || record.check_out_at || record.last_direction,
      );
      setHasScannedToday(scanned);
      setDirection(suggestGateDirection(record));
    } catch {
      setDirection(timeOfDayGateDefault());
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hint = hasScannedToday
    ? direction === 'in'
      ? 'Next scan records arrival (check-in).'
      : 'Next scan records departure (check-out).'
    : 'First scan today is always check-in.';

  return { direction, setDirection, loading, hasScannedToday, hint, refresh };
}
