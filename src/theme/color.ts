/** Colour helpers shared by every screen. */

/** '#15411D' → 'rgba(21,65,29,a)' (3-, 6- or 8-digit hex). Leaves non-hex colours as they are. */
export function rgba(hex: string, alpha: number): string {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(h)) return hex;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
