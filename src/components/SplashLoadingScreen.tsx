import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  SPLASH_BACKGROUND,
  SPLASH_LOGO_ASPECT,
  SPLASH_LOGO_WIDTH_RATIO,
} from '../theme/splash';

const splashLogo = require('../../assets/images/splash-logo.png');

export function SplashLoadingScreen() {
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width, height) * SPLASH_LOGO_WIDTH_RATIO;
  const logoHeight = logoWidth / SPLASH_LOGO_ASPECT;

  return (
    <View style={styles.root}>
      <Image
        source={splashLogo}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode="contain"
        accessibilityLabel="Tukua"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
  },
});
