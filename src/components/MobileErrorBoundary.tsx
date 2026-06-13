import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/yana';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';

type Banner = { id: number; message: string };

type Props = {
  children: React.ReactNode;
};

class ErrorBoundaryInner extends React.Component<
  { children: React.ReactNode; onError: (message: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message || 'Something went wrong');
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>This screen hit a problem</Text>
          <Text style={styles.fallbackBody}>Switch tabs or try again. The app is still running.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export function MobileErrorBoundary({ children }: Props) {
  const [banners, setBanners] = useState<Banner[]>([]);

  const push = useCallback((message: string) => {
    setBanners((prev) => [...prev.slice(-2), { id: Date.now(), message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason ?? 'Unexpected error');
      if (message.includes('was not handled by any navigator')) {
        push('Navigation is not ready yet. Try again in a moment.');
        return;
      }
      push(message);
    };

    const errorUtils = (
      globalThis as {
        ErrorUtils?: {
          getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
          setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
        };
      }
    ).ErrorUtils;
    const prevHandler = errorUtils?.getGlobalHandler?.();
    errorUtils?.setGlobalHandler?.((error, isFatal) => {
      const message = error?.message ?? String(error);
      if (message.includes('was not handled by any navigator')) {
        push('Navigation is not ready yet. Try again in a moment.');
        return;
      }
      prevHandler?.(error, isFatal);
    });

    if (Platform.OS === 'web') {
      globalThis.addEventListener?.('unhandledrejection', onUnhandled as EventListener);
    }

    return () => {
      if (prevHandler) {
        errorUtils?.setGlobalHandler?.(prevHandler);
      }
      if (Platform.OS === 'web') {
        globalThis.removeEventListener?.('unhandledrejection', onUnhandled as EventListener);
      }
    };
  }, [push]);

  return (
    <>
      <ErrorBoundaryInner onError={push}>{children}</ErrorBoundaryInner>
      {banners.map((item) => (
        <View key={item.id} style={styles.banner} pointerEvents="box-none">
          <View style={styles.bannerInner}>
            <Ionicons name="warning-outline" size={18} color={Colors.white} />
            <Text style={styles.bannerText} numberOfLines={3}>
              {item.message}
            </Text>
            <Pressable onPress={() => dismiss(item.id)} hitSlop={8} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={18} color={Colors.white} />
            </Pressable>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.white,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackBody: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: TAB_BAR_BODY_HEIGHT + 12,
    zIndex: 100,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.destructive,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerText: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
