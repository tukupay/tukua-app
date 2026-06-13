import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type Props = {
  title: string;
  children: React.ReactNode;
  hasAction?: boolean;
  onActionPress?: () => void;
  list?: boolean;
};

export function MenuCard({ title, children, hasAction, onActionPress, list }: Props) {
  return (
    <View style={[styles.card, list && styles.listCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {hasAction ? (
          <TouchableOpacity style={styles.action} onPress={onActionPress}>
            <Text style={styles.actionText}>View All</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.greenLine} />
      <View style={[styles.body, list && styles.listBody]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.white,
    backgroundColor: 'rgba(229, 221, 221, 0.03)',
    shadowColor: '#26273A',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minHeight: 132,
  },
  listCard: {
    minHeight: undefined,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Roboto_700Bold',
    color: '#111',
  },
  action: {
    width: 75,
    height: 25,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E8F2',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 11,
    color: '#333',
  },
  greenLine: {
    height: 2,
    backgroundColor: Colors.primaryGreen,
    marginHorizontal: 8,
  },
  body: {
    minHeight: 85,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  listBody: {
    minHeight: undefined,
    paddingBottom: 0,
  },
});
