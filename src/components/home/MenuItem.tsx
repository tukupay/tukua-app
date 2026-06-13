import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor?: string;
  iconColor?: string;
  onPress?: () => void;
};

export function MenuItem({
  label,
  icon,
  bgColor = Colors.white,
  iconColor = Colors.primaryGreen,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor, borderColor: '#EDF1FD' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 76,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 47,
    height: 47,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    color: '#111',
  },
});
