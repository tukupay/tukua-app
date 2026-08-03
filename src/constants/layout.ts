/** Visible tab bar body height (excluding safe-area inset). */
export const TAB_BAR_BODY_HEIGHT = 54;

/** Floating transparent header body (excluding safe-area). Keep in sync with NativeAppHeader. */
export const FLOATING_HEADER_BODY = 36;

/** Extra gap below floating header before page content. */
export const FLOATING_HEADER_GAP = 10;

/** Extra space above the tab bar so ScrollView content isn't clipped. */
export const MODULE_SCROLL_BOTTOM_EXTRA = 48;

/** Total top inset for page content under the floating nav (safe area + bar + gap). */
export function floatingHeaderInset(safeTop: number): number {
  return safeTop + FLOATING_HEADER_BODY + FLOATING_HEADER_GAP;
}

/** Bottom padding for module ScrollViews (safe area + tab bar + scroll clearance). */
export function moduleScrollBottomPad(safeBottom: number): number {
  return safeBottom + TAB_BAR_BODY_HEIGHT + MODULE_SCROLL_BOTTOM_EXTRA;
}
