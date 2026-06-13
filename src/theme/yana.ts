/** Yana / Tukua design tokens — from yana/src/index.css */
export const Colors = {
  primary: '#1F8B4C',
  primaryDark: '#064E3B',
  primaryLight: '#EBFFEF',
  secondary: '#DC2626',
  background: '#FCFCFC',
  foreground: '#141414',
  muted: '#F5F5F5',
  mutedForeground: '#737373',
  border: '#E5E5E5',
  destructive: '#EF4444',
  white: '#FFFFFF',
  orange: '#F97316',
  orangeAccent: '#FF8300',
  telegram: '#0088cc',
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.35)',
};

export const TukuaWeb = {
  base: process.env.EXPO_PUBLIC_TUKUA_WEB_URL ?? 'https://tukua.ai',
  chat: '/chat',
  register: '/register',
  courses: '/courses',
  profile: '/profile',
};
