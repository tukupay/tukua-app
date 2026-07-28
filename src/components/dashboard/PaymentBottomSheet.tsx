import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/yana';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** Bottom sheet modal (slide from flex-end) for M-Pesa / bursary pay flows. */
export function PaymentBottomSheet({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    maxHeight: '92%',
  },
});
