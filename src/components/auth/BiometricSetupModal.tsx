import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';

type Props = {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
};

export function BiometricSetupModal({ visible, onEnable, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.iconWrap}>
            <Ionicons name="finger-print" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Enable Quick Login?</Text>
          <Text style={styles.body}>
            Use biometrics next time for faster, secure sign-in.
          </Text>

          <TouchableOpacity style={styles.enableBtn} onPress={onEnable}>
            <Text style={styles.enableText}>Enable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
            <Text style={styles.laterText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.mutedForeground,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  enableBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  laterBtn: {
    marginTop: 10,
    paddingVertical: 10,
  },
  laterText: {
    color: Colors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
});
