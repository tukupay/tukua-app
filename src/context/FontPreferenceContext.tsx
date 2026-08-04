import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_FONT_VALUE,
  findFontOption,
  resolveNativeFontFamily,
} from '../lib/mobileFonts';
import { fetchPreferences } from '../lib/profileApi';

const FONT_STORAGE_KEY = 'tukua_preferred_font';
const FONT_SIZE_STORAGE_KEY = 'tukua_preferred_font_size';

const DEFAULT_FONT_SIZE = 16;

type FontPreferenceContextValue = {
  fontValue: string;
  fontSize: number;
  /** Regular-weight native font family — apply to body text. */
  fontFamily: string | undefined;
  /** Bold-weight native font family — apply to titles / emphasis. */
  fontFamilyBold: string | undefined;
  /** Web CSS family string + weight/style — for WebView chrome inject. */
  webFamily: string;
  webWeight?: string;
  webStyle?: string;
  ready: boolean;
  setFontPreference: (fontValue: string, fontSize: number) => void;
};

const FontPreferenceContext = createContext<FontPreferenceContextValue | null>(null);

export function FontPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [fontValue, setFontValueState] = useState(DEFAULT_FONT_VALUE);
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedFont, storedSize] = await Promise.all([
          AsyncStorage.getItem(FONT_STORAGE_KEY),
          AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY),
        ]);
        if (!cancelled) {
          if (storedFont) setFontValueState(storedFont);
          if (storedSize && Number(storedSize) > 0) setFontSizeState(Number(storedSize));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
      // Best-effort refresh from Nest (covers changes made on web/another device).
      try {
        const prefs = await fetchPreferences();
        const userPrefs = prefs.user_preferences || {};
        const remoteFont = userPrefs.preferred_font ? String(userPrefs.preferred_font) : null;
        const remoteSize = Number(userPrefs.font_size) || 0;
        if (!cancelled && remoteFont) {
          setFontValueState(remoteFont);
          void AsyncStorage.setItem(FONT_STORAGE_KEY, remoteFont);
        }
        if (!cancelled && remoteSize > 0) {
          setFontSizeState(remoteSize);
          void AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, String(remoteSize));
        }
      } catch {
        // Not signed in yet, or offline — cached/default values already applied.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setFontPreference = useCallback((nextFont: string, nextSize: number) => {
    setFontValueState(nextFont);
    setFontSizeState(nextSize);
    void AsyncStorage.setItem(FONT_STORAGE_KEY, nextFont);
    void AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, String(nextSize));
  }, []);

  const value = useMemo<FontPreferenceContextValue>(() => {
    const opt = findFontOption(fontValue);
    return {
      fontValue,
      fontSize,
      fontFamily: resolveNativeFontFamily(fontValue, false),
      fontFamilyBold: resolveNativeFontFamily(fontValue, true),
      webFamily: opt.family,
      webWeight: opt.weight,
      webStyle: opt.style,
      ready,
      setFontPreference,
    };
  }, [fontValue, fontSize, ready, setFontPreference]);

  return <FontPreferenceContext.Provider value={value}>{children}</FontPreferenceContext.Provider>;
}

export function useFontPreference() {
  const ctx = useContext(FontPreferenceContext);
  if (!ctx) {
    return {
      fontValue: DEFAULT_FONT_VALUE,
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: resolveNativeFontFamily(DEFAULT_FONT_VALUE, false),
      fontFamilyBold: resolveNativeFontFamily(DEFAULT_FONT_VALUE, true),
      webFamily: 'Inter, sans-serif',
      webWeight: undefined,
      webStyle: undefined,
      ready: true,
      setFontPreference: () => {},
    };
  }
  return ctx;
}
