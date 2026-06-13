import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandSteps } from './auth/BrandSteps';
import { SPLASH_BACKGROUND } from '../theme/splash';

export function SplashLoadingScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.mark}>
        <View style={styles.bird}>
          <View style={[styles.wing, styles.wingRed]} />
          <View style={[styles.wing, styles.wingGreen]} />
          <View style={[styles.wing, styles.wingDark]} />
        </View>
        <MaskedView
          maskElement={
            <Text style={[styles.title, styles.titleMask]}>Tukua</Text>
          }>
          <LinearGradient
            colors={['#1F8B4C', '#7C3AED']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.titleGradient}>
            <Text style={[styles.title, styles.titleHidden]}>Tukua</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.tagline}>INNOVATE · ELEVATE</Text>
      </View>
      <BrandSteps compact />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
    paddingHorizontal: 24,
    gap: 20,
  },
  mark: {
    alignItems: 'center',
    gap: 10,
  },
  bird: {
    width: 56,
    height: 36,
    position: 'relative',
    marginBottom: 4,
  },
  wing: {
    position: 'absolute',
    borderRadius: 999,
  },
  wingRed: {
    top: 0,
    left: 8,
    width: 28,
    height: 14,
    backgroundColor: '#E31E24',
    transform: [{ rotate: '-12deg' }],
  },
  wingGreen: {
    top: 10,
    left: 14,
    width: 30,
    height: 14,
    backgroundColor: '#1F8B4C',
    transform: [{ rotate: '8deg' }],
  },
  wingDark: {
    top: 20,
    left: 10,
    width: 26,
    height: 12,
    backgroundColor: '#141414',
    transform: [{ rotate: '-4deg' }],
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  titleMask: {
    color: '#000',
    backgroundColor: 'transparent',
  },
  titleHidden: {
    opacity: 0,
  },
  titleGradient: {
    paddingHorizontal: 4,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2.4,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Inter_600SemiBold',
  },
});
