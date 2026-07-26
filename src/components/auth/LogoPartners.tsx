import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandSteps } from './BrandSteps';
import { ColorChangingText } from './ColorChangingText';

export function LogoPartners({
  compact,
  onGreen = false,
}: {
  compact?: boolean;
  onGreen?: boolean;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.brandCenter}>
        {/* Wordmark sits on the green curve — light outline */}
        <ColorChangingText text="Tukua Ai" compact={compact} showStar={false} login onGreen={onGreen} />
      </View>
      {/* Steps sit on the light page below the curve — dark green */}
      <BrandSteps compact={compact} onGreen={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  brandCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
