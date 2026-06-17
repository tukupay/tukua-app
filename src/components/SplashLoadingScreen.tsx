import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Images, LOGO_SQUARE_ASPECT } from '../constants/images';
import { SPLASH_BACKGROUND, SPLASH_LOGO_WIDTH_RATIO } from '../theme/splash';

export function SplashLoadingScreen() {
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width, height) * SPLASH_LOGO_WIDTH_RATIO;
  const logoHeight = logoWidth / LOGO_SQUARE_ASPECT;

  return (
    <View style={styles.root}>
      <Image
        source={Images.logoSplash}
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
