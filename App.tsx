import React, { useCallback, useEffect, useState } from 'react';

// Polyfill for crypto.randomUUID (React Native doesn't have it natively)
if (typeof crypto === 'undefined') {
  // @ts-expect-error - React Native global
  global.crypto = {};
}
if (typeof crypto.randomUUID !== 'function') {
  // @ts-expect-error - React Native global
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Cormorant_600SemiBold,
  Cormorant_700Bold,
} from '@expo-google-fonts/cormorant';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { ImmersiveSystemBars } from './src/components/ImmersiveSystemBars';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DeskAuthProvider } from './src/context/DeskAuthContext';
import { DialogProvider } from './src/context/DialogContext';
import { SplashLoadingScreen } from './src/components/SplashLoadingScreen';
import { configureWebViewAudioSession } from './src/lib/webViewMedia';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Cormorant_600SemiBold,
    Cormorant_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
    PlusJakartaSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      setAppReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
    void configureWebViewAudioSession();
  }, [onLayoutRootView]);

  if (!appReady) {
    return (
      <>
        <ImmersiveSystemBars />
        <SplashLoadingScreen />
      </>
    );
  }

  return (
    <DialogProvider>
      <AuthProvider>
        <DeskAuthProvider>
          <ImmersiveSystemBars />
          <AppNavigator />
        </DeskAuthProvider>
      </AuthProvider>
    </DialogProvider>
  );
}
