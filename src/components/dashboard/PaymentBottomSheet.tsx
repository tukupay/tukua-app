import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';
import { useKeyboardState } from '../auth/KeyboardAwareScroll';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * The child lays out its own scroll body and pinned footer (PaymentProcessCard layout="sheet"), so the
   * sheet does not wrap it in a ScrollView. Default false (children scroll inside the sheet).
   */
  bare?: boolean;
};

const SCREEN_H = Dimensions.get('window').height;
const SHEET_MAX = Math.round(SCREEN_H * 0.92);

/**
 * Bottom sheet for M-Pesa / bursary pay flows. The sheet sits right on top of the keyboard: it measures
 * how much of the screen the keyboard covers (0 when Android already resized the window) and lifts by
 * that, and shrinks to the room left, so the field being typed in and the Pay button stay visible.
 */
export function PaymentBottomSheet({ visible, onClose, children, bare = false }: Props) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardState();
  const rootRef = useRef<View>(null);
  const [lift, setLift] = useState(0);
  const [rootH, setRootH] = useState(SCREEN_H);

  const measure = useCallback(() => {
    const node = rootRef.current;
    if (!node) return;
    node.measureInWindow((_x, y, _w, h) => {
      if (h > 0) setRootH(h);
      setLift(kb.visible && kb.top ? Math.max(0, Math.round(y + h - kb.top)) : 0);
    });
  }, [kb.visible, kb.top]);

  useEffect(() => {
    measure();
    // Android resizes the window after the keyboard event: measure again once it settles.
    const t = setTimeout(measure, 250);
    return () => clearTimeout(t);
  }, [measure]);

  const keyboardUp = kb.visible;
  const bottomPad = keyboardUp ? 10 : Math.max(20, insets.bottom + 10);
  // Room for the sheet: the screen above the keyboard, less a little air under the status bar.
  const maxH = Math.max(260, Math.min(SHEET_MAX, rootH - lift - insets.top - 12));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View ref={rootRef} style={[styles.root, { paddingBottom: lift }]} onLayout={measure}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss payment" />
        <View style={[styles.sheet, { maxHeight: maxH, paddingBottom: bottomPad }]}>
          <View style={styles.handle} />
          {bare ? (
            <View style={styles.bareBody}>{children}</View>
          ) : (
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              contentContainerStyle={styles.scrollContent}
              bounces={false}
              nestedScrollEnabled>
              {children}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    paddingHorizontal: 16,
    width: '100%',
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: 8,
  },
  bareBody: { flexShrink: 1 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },
});
