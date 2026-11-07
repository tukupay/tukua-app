/** Yana / Tukua design tokens */
import { getWebBaseUrl } from '../lib/localHost';

export const Colors = {
  /** Dark brand green (app chrome / headers) */
  primary: '#15411D',
  primaryDark: '#0E2E14',
  primaryLight: '#FAF8F3',
  secondary: '#DC2626',
  background: '#FAF8F3',
  foreground: '#161A15',
  muted: '#FAF8F3',
  mutedForeground: '#5E625B',
  border: '#E6E1D3',
  destructive: '#EF4444',
  white: '#FFFFFF',
  /** Accent — Tukua yellow (default theme 'tukuaGold', 2026-11-07) */
  orange: '#F5B800',
  orangeAccent: '#F5B800',
  telegram: '#0088cc',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.35)',
  /** Dashboard / brand surfaces */
  brandGreen: '#15411D',
  brandGreenDark: '#0E2E14',
  brandGreenMid: '#A9700E',
  ink: '#04140F',
  labelGray: '#4A5A52',
  balanceTeal: '#A9700E',
  /** Soft card wash (warm neutral) */
  cardCream: '#FAF8F3',
  cardSky: '#F6F1E3',
  accentCoral: '#F5B800',
  pageDotIdle: '#E6E1D3',
  navbarFg: '#FFFFFF',
  navbarMuted: 'rgba(255,255,255,0.78)',
};

/** Web SPA (Yana Vite) — Chat / Courses / Profile may still use WebViews until those tabs are native. Register is native Nest REST only. */
export const TukuaWeb = {
  get base() {
    return getWebBaseUrl();
  },
  chat: '/chat',
  register: '/register',
  courses: '/courses',
  profile: '/profile',
};
