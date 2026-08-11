/**
 * Canonical Content tab (reels) layout — locked after Shorts fit tuning.
 *
 * Shorts (portrait):
 * - Full width (no L/R margin)
 * - Width-first 9:16 height
 * - Raise player under floating header (~72% of header clearance) so height fits
 * - Bottom text band only (no Mute/Download/View unit row)
 * - 1pt corner radius
 *
 * 16:9 (landscape lessons):
 * - Keep full header clearance inside the page
 * - Video capped ~36% of page height or true 16:9 from width
 * - Notes + controls below (View unit + level chip)
 *
 * Call `resolveContentFeedChrome` once per screen, then `resolveContentItemLayout`
 * per page/item so any device ratio keeps this look.
 */
import { TAB_BAR_BODY_HEIGHT, floatingHeaderInset } from './layout';

export const CONTENT_PHONE_FRAME_MAX = 440;
export const CONTENT_YT_EMBED_ORIGIN = 'https://tukua.ai';
export const CONTENT_CONTROLS_BAR_H = 44;
export const CONTENT_NOTES_FONT = 16;
export const CONTENT_NOTES_LINE = 24;
export const CONTENT_SHORT_RADIUS_PT = 1;
export const CONTENT_SHORT_TEXT_H = 56;
export const CONTENT_TITLE_BAND_H = 56;
export const CONTENT_SHORT_UNDER_NAV_FRAC = 0.72;
/** Width : height for Shorts. */
export const CONTENT_SHORT_ASPECT = { w: 9, h: 16 } as const;
/** Width : height for long-form embeds. */
export const CONTENT_WIDE_ASPECT = { w: 16, h: 9 } as const;
export const CONTENT_WIDE_MAX_PAGE_FRAC = 0.36;

export type ContentFeedChrome = {
  frameW: number;
  headerClearance: number;
  shortUnderNav: number;
  topPad: number;
  bottomClear: number;
  isDesktopWeb: boolean;
};

export type ContentItemLayout = {
  isShort: boolean;
  videoW: number;
  videoH: number;
  longTopInset: number;
  stageMarginTop: number;
  phoneFrameH: number;
  titleBandH: number;
  shortTextH: number;
  captionPadTop: number;
  captionPadBottom: number;
  borderRadius: number;
  /** Remaining caption body height for 16:9 notes (no inner scroll). */
  captionBodyH: number;
};

export function resolveContentFeedChrome(input: {
  windowWidth: number;
  safeTop: number;
  safeBottom: number;
  isDesktopWeb?: boolean;
}): ContentFeedChrome {
  const isDesktopWeb = !!input.isDesktopWeb;
  const frameW = isDesktopWeb
    ? Math.min(CONTENT_PHONE_FRAME_MAX, input.windowWidth * 0.42)
    : input.windowWidth;
  const headerClearance = floatingHeaderInset(input.safeTop) + 18;
  const shortUnderNav = Math.round(headerClearance * CONTENT_SHORT_UNDER_NAV_FRAC);
  const topPad = Math.max(2, headerClearance - shortUnderNav);
  const bottomClear = TAB_BAR_BODY_HEIGHT + input.safeBottom + 8;
  return { frameW, headerClearance, shortUnderNav, topPad, bottomClear, isDesktopWeb };
}

/** Ideal Shorts height for full frame width (9:16). */
export function idealShortHeight(frameW: number): number {
  return Math.round((frameW * CONTENT_SHORT_ASPECT.h) / CONTENT_SHORT_ASPECT.w);
}

/** Ideal 16:9 height for full frame width. */
export function idealWideHeight(frameW: number): number {
  return Math.round((frameW * CONTENT_WIDE_ASPECT.h) / CONTENT_WIDE_ASPECT.w);
}

/**
 * Per-page layout from measured page height + chrome.
 * Pass the same `itemH` used for FlatList paging (`list layout height`).
 */
export function resolveContentItemLayout(input: {
  frameW: number;
  itemH: number;
  isShort: boolean;
  shortUnderNav: number;
}): ContentItemLayout {
  const { frameW, itemH, isShort, shortUnderNav } = input;
  const captionPadBottom = 4;
  const captionPadTop = isShort ? 6 : 10;
  const shortTextH = CONTENT_SHORT_TEXT_H;
  const titleBandH = isShort ? 0 : CONTENT_TITLE_BAND_H;
  const longTopInset = isShort ? 0 : shortUnderNav;

  let videoW = frameW;
  let videoH: number;
  if (isShort) {
    videoW = frameW;
    const idealH = idealShortHeight(videoW);
    const maxH = Math.max(240, itemH - shortTextH);
    // May extend into header zone; chrome.topPad already pulled list up.
    videoH = Math.min(idealH, maxH + shortUnderNav);
  } else {
    videoW = frameW;
    videoH = Math.min(Math.round(itemH * CONTENT_WIDE_MAX_PAGE_FRAC), idealWideHeight(frameW));
  }

  const stageMarginTop = isShort
    ? -Math.min(shortUnderNav, Math.max(0, videoH - (itemH - shortTextH)))
    : 0;

  const phoneFrameH = isShort ? itemH : Math.max(0, itemH - longTopInset);
  const captionBodyH = Math.max(
    0,
    itemH - titleBandH - videoH - CONTENT_CONTROLS_BAR_H - captionPadTop - captionPadBottom - longTopInset,
  );

  return {
    isShort,
    videoW,
    videoH,
    longTopInset,
    stageMarginTop,
    phoneFrameH,
    titleBandH,
    shortTextH,
    captionPadTop,
    captionPadBottom,
    borderRadius: isShort ? CONTENT_SHORT_RADIUS_PT : 0,
    captionBodyH,
  };
}

/** Notes lines that fit remaining 16:9 caption without scrolling. */
export function fitNotesLines(captionBodyH: number, opts?: { hasUnitLabel?: boolean; hasDesc?: boolean }): number {
  const headerBlock = opts?.hasUnitLabel ? 22 : 0;
  const metaBlock = 18;
  const descBlock = opts?.hasDesc ? 22 : 0;
  const budget = Math.max(0, captionBodyH - headerBlock - metaBlock - descBlock);
  return Math.max(1, Math.min(3, Math.floor(budget / CONTENT_NOTES_LINE) || 1));
}
