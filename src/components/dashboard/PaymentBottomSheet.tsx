import React from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const SHEET_MAX = Math.round(Dimensions.get('window').height * 0.9);

/** Bottom sheet for M-Pesa / bursary pay flows — scrollable + keyboard-safe. */
export function PaymentBottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss payment" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
          <View style={[styles.sheet, { paddingBottom: Math.max(28, insets.bottom + 12) }]}>
            <View style={styles.handle} />
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.scrollContent}
              bounces={false}
              nestedScrollEnabled>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 0,
  },
  sheetWrap: {
    width: '100%',
    maxHeight: SHEET_MAX,
    zIndex: 2,
    elevation: 12,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    width: '100%',
    maxHeight: SHEET_MAX,
    minHeight: 280,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 8,
  },
  scroll: {
    maxHeight: SHEET_MAX - 48,
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
    flexGrow: 0,
    minHeight: 220,
  },
});
