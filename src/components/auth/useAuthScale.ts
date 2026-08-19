import { useMemo } from 'react';
import { PixelRatio, Platform, useWindowDimensions } from 'react-native';

/** Login / register were tuned on a ~390-wide phone. */
export const AUTH_BASE_SHORT = 390;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function px(n: number) {
  return PixelRatio.roundToNearestPixel(n);
}

export type AuthScale = {
  width: number;
  height: number;
  scale: number;
  isTablet: boolean;
  isLandscape: boolean;
  /** Short height with full-width scale (landscape phones) — shrink logo, not fields. */
  compact: boolean;
  s: (n: number) => number;
  font: (n: number) => number;
  formWidth: number;
  padH: number;
  spacer: number;
  formGap: number;
  bottomPad: number;
  curveH: number;
  scrollMinH: number;
};

export function computeAuthScale(
  width: number,
  height: number,
  formPct = 0.88,
): AuthScale {
  const shortest = Math.min(width, height);
  const isTablet = shortest >= 600;
  const isLandscape = width > height * 1.08;
  const scale = clamp(shortest / AUTH_BASE_SHORT, 0.82, isTablet ? 1.28 : 1.12);
  const compact = height < 700 && scale > 0.95;

  const s = (n: number) => px(n * scale);
  const font = (n: number) => px(n * scale);

  const padH = isTablet ? Math.max(s(24), Math.round(width * 0.06)) : Math.max(12, s(20));
  const phoneForm = Math.round(width * formPct);
  const wideCap = Math.min(s(480), width * (isLandscape ? 0.56 : 0.62));
  const formWidth = Math.min(
    width - padH * 2,
    isTablet || isLandscape ? Math.max(s(400), wideCap) : phoneForm,
  );

  return {
    width,
    height,
    scale,
    isTablet,
    isLandscape,
    compact,
    s,
    font,
    formWidth,
    padH,
    spacer: s(14),
    formGap: s(12),
    bottomPad: s(16),
    curveH: Math.round(height * 0.72),
    scrollMinH: height - (Platform.OS === 'ios' ? 48 : 32),
  };
}

export function useAuthScale(formPct = 0.88): AuthScale {
  const { width, height } = useWindowDimensions();
  return useMemo(() => computeAuthScale(width, height, formPct), [width, height, formPct]);
}
