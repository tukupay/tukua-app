import React, { useCallback, useEffect } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Imperative hide — call after WebView load / tab focus / biometric prompts.
 * Android WebView and LocalAuthentication often restore the system status bar.
 */
export function hideSystemStatusBar() {
  RNStatusBar.setHidden(true, 'fade');
  if (Platform.OS === 'android') {
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBackgroundColor('transparent');
  }
}

/**
 * Keep the system status bar (clock / battery / signal) hidden for the whole app.
 *
 * What remounts / re-shows it:
 * - Android WebView onLoad / focus
 * - LocalAuthentication biometric sheet dismiss
 * - AppState resume from background
 * - Accidental StatusBar.setHidden(false) (never do this in feature code)
 *
 * Do NOT un-hide on cleanup — Strict Mode remounts would flash the bar back.
 */
export function ImmersiveSystemBars() {
  const hide = useCallback(() => {
    hideSystemStatusBar();
  }, []);

  useEffect(() => {
    hide();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hide();
    });

    // WebView / OEM chrome often restores the bar after paint — keep re-applying.
    const poll = Platform.OS === 'android' ? setInterval(hide, 800) : setInterval(hide, 2500);

    return () => {
      sub.remove();
      clearInterval(poll);
      // Intentionally leave hidden — unmount during remount must not reveal the bar.
    };
  }, [hide]);

  return <StatusBar hidden style="light" animated />;
}
