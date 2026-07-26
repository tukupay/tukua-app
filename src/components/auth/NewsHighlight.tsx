import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/yana';

const ROLE_TAGS = [
  { label: 'Parents', bg: '#E8F5EF', fg: '#0A3D2E', border: 'rgba(10,61,46,0.22)' },
  { label: 'Teachers', bg: '#FFF0E6', fg: '#C2410C', border: 'rgba(232,93,4,0.28)' },
  { label: 'Students', bg: '#E8F1FF', fg: '#1D4ED8', border: 'rgba(37,99,235,0.25)' },
  { label: 'Principals', bg: '#F3E8FF', fg: '#6B21A8', border: 'rgba(124,58,237,0.25)' },
] as const;

/** Compact school-roles strip — sits in login footer without shifting the logo/form. */
export function NewsHighlight() {
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          Now with school features
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Fees, grades, attendance & more on Tukua.
        </Text>
        <View style={styles.tags}>
          {ROLE_TAGS.map((tag) => (
            <View
              key={tag.label}
              style={[styles.tag, { backgroundColor: tag.bg, borderColor: tag.border }]}>
              <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  copy: {
    gap: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foreground,
    lineHeight: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.mutedForeground,
    lineHeight: 13,
    textAlign: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});
