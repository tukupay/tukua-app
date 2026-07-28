/** Gate / daily register scan direction — IN when arriving, OUT when leaving. */
export type GateDirection = 'in' | 'out';

export type GateDayRecord = {
  check_in_at?: string | null;
  check_out_at?: string | null;
  last_direction?: GateDirection | null;
};

/** Morning → IN, afternoon → OUT (fallback before history is loaded). */
export function timeOfDayGateDefault(now = new Date()): GateDirection {
  return now.getHours() < 12 ? 'in' : 'out';
}

/**
 * Suggest scan direction for today.
 * - No scans today → always IN (even in the afternoon).
 * - Has check-in but no check-out → OUT.
 * - Has both → alternate from the most recent timestamp.
 */
export function suggestGateDirection(record?: GateDayRecord | null, now = new Date()): GateDirection {
  if (!record) return 'in';

  const inAt = record.check_in_at ? Date.parse(record.check_in_at) : NaN;
  const outAt = record.check_out_at ? Date.parse(record.check_out_at) : NaN;
  const hasIn = Number.isFinite(inAt);
  const hasOut = Number.isFinite(outAt);

  if (record.last_direction === 'in' && !hasOut) return 'out';
  if (record.last_direction === 'out' && !hasIn) return 'in';

  if (!hasIn && !hasOut) return 'in';
  if (hasIn && !hasOut) return 'out';
  if (!hasIn && hasOut) return 'in';
  if (hasIn && hasOut) {
    return outAt >= inAt ? 'in' : 'out';
  }
  return timeOfDayGateDefault(now);
}

export function gateDirectionLabel(direction: GateDirection): string {
  return direction === 'in' ? 'Check IN' : 'Check OUT';
}
