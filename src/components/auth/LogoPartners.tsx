import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorChangingText } from './ColorChangingText';
import { BrandSteps } from './BrandSteps';

export function LogoPartners({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <ColorChangingText text="Tukua" compact={compact} />
        <BrandSteps compact={compact} />
        <LinearGradient
          colors={['#036930', 'rgba(255, 197, 42, 0.25)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.dividerH}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    maxWidth: 300,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardCompact: {
    maxWidth: 270,
    paddingVertical: 8,
  },
  dividerH: { width: '70%', height: 1.5, marginTop: 8, borderRadius: 1 },
});
