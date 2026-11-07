/**
 * Small footer credits on the sign-in page: "Made in JKUAT" (crest) · "Powered by TukuPay" (logo, opens tuku.money).
 */
import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

const JKUAT_CREST = require('../../../assets/images/brand/jkuat-crest.png');
const TUKUPAY_LOGO = require('../../../assets/images/brand/tukupay-logo.png');
/** tukupay-logo.png is 360 x 81. */
const TUKUPAY_RATIO = 360 / 81;

export function MadeInBadges({ style }: { style?: StyleProp<ViewStyle> }) {
  const { s, font } = useAuthScale();
  const crest = s(18);
  const logoH = s(13);
  return (
    <View style={[styles.row, { gap: s(10) }, style]}>
      <View style={[styles.badge, { gap: s(5) }]} accessible accessibilityLabel="Made in JKUAT">
        <Image source={JKUAT_CREST} style={{ width: crest, height: crest }} resizeMode="contain" />
        <Text style={[styles.text, { fontSize: font(10) }]}>
          Made in <Text style={styles.strong}>JKUAT</Text>
        </Text>
      </View>
      <View style={[styles.dot, { width: s(3), height: s(3), borderRadius: s(1.5) }]} />
      <Pressable
        onPress={() => void Linking.openURL('https://tuku.money').catch(() => {})}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Powered by TukuPay"
        style={({ pressed }) => [styles.badge, { gap: s(5), opacity: pressed ? 0.6 : 1 }]}>
        <Text style={[styles.text, { fontSize: font(10) }]}>Powered by</Text>
        <Image source={TUKUPAY_LOGO} style={{ width: logoH * TUKUPAY_RATIO, height: logoH }} resizeMode="contain" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center' },
  text: { color: Colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  strong: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  dot: { backgroundColor: Colors.border },
});
