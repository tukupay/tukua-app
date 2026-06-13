import React from 'react';
import { Image, StyleSheet, Text, View, ViewProps } from 'react-native';
import { Colors } from '../../theme/yana';

const logo = require('../../../assets/images/icons/tukua-icon.png');

type Props = ViewProps & {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
};

export function GlassAuthCard({ title, subtitle, showLogo = true, children, style, ...rest }: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {showLogo && (
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  logo: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
