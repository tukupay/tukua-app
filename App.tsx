import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Polyfill crypto.randomUUID — never throw at module load (host crypto can be read-only).
try {
  const g = globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } };
  if (!g.crypto) {
    g.crypto = {} as Crypto;
  }
  if (typeof g.crypto.randomUUID !== 'function') {
    g.crypto.randomUUID = (() =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })) as () => `${string}-${string}-${string}-${string}-${string}`;
  }
} catch {
  /* ignore — some hosts expose a read-only crypto object */
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
import { PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_400Regular, Raleway_700Bold } from '@expo-google-fonts/raleway';
import { OpenSans_400Regular, OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { AlexBrush_400Regular } from '@expo-google-fonts/alex-brush';
import { Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import { WorkSans_400Regular, WorkSans_700Bold } from '@expo-google-fonts/work-sans';
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Ubuntu_400Regular, Ubuntu_700Bold } from '@expo-google-fonts/ubuntu';
import * as SplashScreen from 'expo-splash-screen';
import { ImmersiveSystemBars } from './src/components/ImmersiveSystemBars';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { DeskAuthProvider } from './src/context/DeskAuthContext';
import { DialogProvider } from './src/context/DialogContext';
import { AppThemeProvider } from './src/context/AppThemeContext';
import { FontPreferenceProvider } from './src/context/FontPreferenceContext';
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
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
    Lato_400Regular,
    Lato_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Raleway_400Regular,
    Raleway_700Bold,
    OpenSans_400Regular,
    OpenSans_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    AlexBrush_400Regular,
    Merriweather_400Regular,
    Merriweather_700Bold,
    WorkSans_400Regular,
    WorkSans_700Bold,
    DMSans_400Regular,
    DMSans_700Bold,
    Ubuntu_400Regular,
    Ubuntu_700Bold,
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ImmersiveSystemBars />
        <SplashLoadingScreen />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <FontPreferenceProvider>
          <DialogProvider>
            <AuthProvider>
              <DeskAuthProvider>
                <ImmersiveSystemBars />
                <AppNavigator />
              </DeskAuthProvider>
            </AuthProvider>
          </DialogProvider>
        </FontPreferenceProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
