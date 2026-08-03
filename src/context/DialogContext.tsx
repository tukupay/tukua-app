import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/yana';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogOptions = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'danger' | 'success' | 'info' | 'warning';
  buttons?: DialogButton[];
};

type DialogState = DialogOptions & { visible: boolean };

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  default: { icon: 'information-circle-outline', color: Colors.primary, bg: Colors.primaryLight },
  danger: { icon: 'log-out-outline', color: Colors.destructive, bg: 'rgba(239,68,68,0.08)' },
  success: { icon: 'checkmark-circle-outline', color: Colors.primary, bg: Colors.primaryLight },
  info: { icon: 'mail-outline', color: Colors.primaryDark, bg: Colors.primaryLight },
  warning: { icon: 'alert-circle-outline', color: Colors.orange, bg: 'rgba(249,115,22,0.1)' },
};

type DialogContextType = {
  showDialog: (options: DialogOptions) => void;
  alert: (title: string, message?: string, buttons?: DialogButton[]) => void;
};

const DialogContext = createContext<DialogContextType>({
  showDialog: () => {},
  alert: () => {},
});

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ visible: false, title: '' });
  const queueRef = useRef<DialogOptions[]>([]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) {
      setDialog({ ...next, visible: true });
    } else {
      setDialog((d) => ({ ...d, visible: false }));
    }
  }, []);

  const showDialog = useCallback(
    (options: DialogOptions) => {
      if (dialog.visible) {
        queueRef.current.push(options);
        return;
      }
      setDialog({ ...options, visible: true });
    },
    [dialog.visible],
  );

  const alert = useCallback(
    (title: string, message?: string, buttons?: DialogButton[]) => {
      showDialog({
        title,
        message,
        buttons: buttons ?? [{ text: 'OK', style: 'default' }],
        variant: 'default',
      });
    },
    [showDialog],
  );

  const close = () => showNext();

  const variantKey = dialog.variant ?? 'default';
  const meta = ICONS[variantKey] ?? ICONS.default;
  const iconName = dialog.icon ?? meta.icon;
  const buttons =
    dialog.buttons && dialog.buttons.length > 0
      ? dialog.buttons
      : [{ text: 'OK', style: 'default' as const }];

  return (
    <DialogContext.Provider value={{ showDialog, alert }}>
      {children}
      <Modal visible={dialog.visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
              <Ionicons name={iconName} size={24} color={meta.color} />
            </View>

            <Text style={styles.title}>{dialog.title}</Text>
            {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}

            <View style={styles.actions}>
              {buttons.map((btn, i) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={`${btn.text}-${i}`}
                    style={[
                      styles.btn,
                      isCancel && styles.btnCancel,
                      isDestructive && styles.btnDestructive,
                      !isCancel && !isDestructive && styles.btnPrimary,
                      buttons.length === 1 && styles.btnFull,
                    ]}
                    onPress={() => {
                      close();
                      btn.onPress?.();
                    }}>
                    <Text
                      style={[
                        styles.btnText,
                        isCancel && styles.btnTextCancel,
                        isDestructive && styles.btnTextLight,
                        !isCancel && !isDestructive && styles.btnTextLight,
                      ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,31,24,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,61,46,0.12)',
    alignItems: 'center',
    shadowColor: '#041F18',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  btn: {
    flex: 1,
    minWidth: '45%',
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  btnFull: { minWidth: '100%' },
  btnPrimary: { backgroundColor: Colors.primary },
  btnCancel: {
    backgroundColor: Colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  btnDestructive: { backgroundColor: Colors.destructive },
  btnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_600SemiBold' },
  btnTextCancel: { color: Colors.foreground },
  btnTextLight: { color: Colors.white },
});
