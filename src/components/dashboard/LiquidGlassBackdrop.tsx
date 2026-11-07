import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/yana';

/**
 * Owner, 2026-11-07: no colour glows or gradients. The page is one flat warm-neutral colour.
 */
export function LiquidGlassBackdrop() {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />;
}
