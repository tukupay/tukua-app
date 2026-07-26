/** Yana / Tukua design tokens */
import { getWebBaseUrl } from '../lib/localHost';

export const Colors = {
  /** Very dark brand green (app chrome / headers) */
  primary: '#0A3D2E',
  primaryDark: '#062820',
  primaryLight: '#E8F5EF',
  secondary: '#DC2626',
  background: '#F7FAF8',
  foreground: '#0B1A14',
  muted: '#EEF3F0',
  mutedForeground: '#5C6B64',
  border: '#D5E0DA',
  destructive: '#EF4444',
  white: '#FFFFFF',
  /** Accent — touch of orange */
  orange: '#E85D04',
  orangeAccent: '#F48C06',
  telegram: '#0088cc',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.35)',
  /** Dashboard / brand surfaces */
  brandGreen: '#0A3D2E',
  brandGreenDark: '#041F18',
  brandGreenMid: '#0F5C42',
  ink: '#04140F',
  labelGray: '#4A5A52',
  balanceTeal: '#0F5C42',
  /** Soft card wash (no yellow) */
  cardCream: '#F4FBF7',
  cardSky: '#EAF6F0',
  accentCoral: '#E85D04',
  pageDotIdle: '#D5E0DA',
  navbarFg: '#FFFFFF',
  navbarMuted: 'rgba(255,255,255,0.78)',
};

/** Web SPA (Yana Vite) — Chat / Register / Courses / Profile are WebViews of this app. */
export const TukuaWeb = {
  get base() {
    return getWebBaseUrl();
  },
  chat: '/chat',
  register: '/register',
  courses: '/courses',
  profile: '/profile',
};
