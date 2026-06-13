import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Flutter YellowOne / YellowTwo OR dividers */
export function OrDividerLabel({ label = 'OR' }: { label?: string }) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={['#F79515', 'rgba(255, 197, 42, 0.12)']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={styles.line}
      />
      <Text style={styles.label}>{label}</Text>
      <LinearGradient
        colors={['rgba(255, 197, 42, 0.12)', '#F79515']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  line: { width: 76, height: 1 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#141414',
    fontFamily: 'Poppins_600SemiBold',
  },
});
