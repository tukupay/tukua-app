import React, { useCallback, useEffect } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Imperative hide — call after WebView load / tab focus / biometric prompts / camera dismiss.
 * Hides the **top** system status bar only (clock / battery / signal / date).
 * Do **not** hide the Android soft navigation bar (back / home / recent) — that is the bottom chrome.
 */
export function hideSystemStatusBar() {
  try {
    RNStatusBar.setHidden(true, 'fade');
  } catch {
    /* noop */
  }
  if (Platform.OS === 'android') {
    try {
      RNStatusBar.setTranslucent(true);
      RNStatusBar.setBackgroundColor('transparent');
    } catch {
      /* noop */
    }
  }
}

/**
 * Keep the top system status bar hidden for the whole app.
 *
 * What remounts / re-shows it:
 * - Android WebView onLoad / focus
 * - LocalAuthentication biometric sheet dismiss
 * - AppState resume from background
 * - Camera / barcode scanner dismiss
 *
 * Do NOT un-hide on cleanup — Strict Mode remounts would flash the bar back.
 * Do NOT hide the bottom navigation / gesture bar.
 */
export function ImmersiveSystemBars() {
  const hide = useCallback(() => {
    hideSystemStatusBar();
  }, []);

  useEffect(() => {
    hide();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hide();
        setTimeout(hide, 120);
        setTimeout(hide, 400);
        setTimeout(hide, 1000);
      }
    });

    const poll = Platform.OS === 'android' ? setInterval(hide, 500) : setInterval(hide, 1500);

    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, [hide]);

  return <StatusBar hidden style="light" animated />;
}
