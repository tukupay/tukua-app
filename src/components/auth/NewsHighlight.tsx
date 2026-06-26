import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/yana';

/** Compact TV47 partner strip — sits in login footer without shifting the logo/form. */
export function NewsHighlight() {
  return (
    <View style={styles.wrap}>
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Live news on Tukua
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          TV & radio, trending videos and headlines — just ask Tukua.
        </Text>
      </View>
      <Image
        source={require('../../../assets/images/partners/tv47-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  liveText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.foreground,
    lineHeight: 14,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.mutedForeground,
    lineHeight: 12,
  },
  logo: { width: 28, height: 20 },
});
