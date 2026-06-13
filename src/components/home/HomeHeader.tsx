import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Images } from '../../constants/images';

type Props = {
  name: string;
  phone: string;
  onLogout: () => void;
};

export function HomeHeader({ name, phone, onLogout }: Props) {
  return (
    <View style={styles.row}>
      <Image source={Images.user} style={styles.avatar} />
      <View style={styles.meta}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>
      <TouchableOpacity style={styles.bell}>
        <Ionicons name="notifications-outline" size={22} color={Colors.darkerGray2} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.darkerGray2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(21, 65, 29, 0.16)',
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto_700Bold',
    color: '#111',
  },
  phone: {
    fontSize: 12,
    color: Colors.darkerGray2,
    fontFamily: 'Poppins_400Regular',
  },
  bell: {
    padding: 4,
  },
  logout: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
