import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandSteps } from './BrandSteps';
import { ColorChangingText } from './ColorChangingText';
import { GlowingBirdLogo } from './GlowingBirdLogo';

export function LogoPartners({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.wrapper}>
      <GlowingBirdLogo size={compact ? 44 : 52} />
      <ColorChangingText text="Tukua" compact={compact} showStar={false} login />
      <BrandSteps compact={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
});
