import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';
import { Colors } from '../theme/yana';
import {
  APP_THEME_STORAGE_KEY,
  CHAT_BG_PATTERN_STORAGE_KEY,
  DEFAULT_SCHOOL_THEME,
  SCHOOL_THEME_CONFIGS,
  type ChatBgPatternId,
  type SchoolThemeId,
  type ThemePalette,
  isChatBgPatternId,
  isSchoolThemeId,
} from '../theme/schoolThemes';

type AppThemeContextValue = {
  themeId: SchoolThemeId;
  palette: ThemePalette;
  setThemeId: (id: SchoolThemeId) => void;
  chatBgPattern: ChatBgPatternId;
  setChatBgPattern: (id: ChatBgPatternId) => void;
  navigationTheme: NavigationTheme;
  ready: boolean;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

/** Mutate shared Colors tokens so runtime style reads pick up the palette. */
function applyColorsOverrides(palette: ThemePalette) {
  Colors.primary = palette.primary;
  Colors.primaryDark = palette.primary;
  Colors.primaryLight = palette.muted;
  Colors.brandGreen = palette.primary;
  Colors.brandGreenDark = palette.primary;
  Colors.brandGreenMid = palette.tertiary;
  Colors.balanceTeal = palette.tertiary;
  Colors.muted = palette.muted;
  Colors.orange = palette.secondary;
  Colors.orangeAccent = palette.secondary;
  Colors.accentCoral = palette.secondary;
  Colors.background = palette.muted;
  Colors.cardCream = palette.muted;
  Colors.cardSky = palette.muted;
}

function buildNavigationTheme(palette: ThemePalette): NavigationTheme {
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: palette.primary,
      background: palette.muted,
      card: '#FFFFFF',
      text: Colors.foreground,
      border: Colors.border,
      notification: palette.secondary,
    },
  };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<SchoolThemeId>(DEFAULT_SCHOOL_THEME);
  const [chatBgPattern, setChatBgPatternState] = useState<ChatBgPatternId>('none');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedTheme, storedPattern] = await Promise.all([
          AsyncStorage.getItem(APP_THEME_STORAGE_KEY),
          AsyncStorage.getItem(CHAT_BG_PATTERN_STORAGE_KEY),
        ]);
        if (cancelled) return;
        if (isSchoolThemeId(storedTheme)) setThemeIdState(storedTheme);
        if (isChatBgPatternId(storedPattern)) setChatBgPatternState(storedPattern);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = SCHOOL_THEME_CONFIGS[themeId];

  useEffect(() => {
    applyColorsOverrides(palette);
  }, [palette]);

  const setThemeId = useCallback((id: SchoolThemeId) => {
    setThemeIdState(id);
    void AsyncStorage.setItem(APP_THEME_STORAGE_KEY, id);
  }, []);

  const setChatBgPattern = useCallback((id: ChatBgPatternId) => {
    setChatBgPatternState(id);
    void AsyncStorage.setItem(CHAT_BG_PATTERN_STORAGE_KEY, id);
  }, []);

  const navigationTheme = useMemo(() => buildNavigationTheme(palette), [palette]);

  const value = useMemo(
    () => ({
      themeId,
      palette,
      setThemeId,
      chatBgPattern,
      setChatBgPattern,
      navigationTheme,
      ready,
    }),
    [themeId, palette, setThemeId, chatBgPattern, setChatBgPattern, navigationTheme, ready],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    const palette = SCHOOL_THEME_CONFIGS[DEFAULT_SCHOOL_THEME];
    return {
      themeId: DEFAULT_SCHOOL_THEME,
      palette,
      setThemeId: () => {},
      chatBgPattern: 'none' as ChatBgPatternId,
      setChatBgPattern: () => {},
      navigationTheme: buildNavigationTheme(palette),
      ready: true,
    };
  }
  return ctx;
}
