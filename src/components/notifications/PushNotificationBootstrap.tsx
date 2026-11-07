import { useEffect, useRef } from 'react';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { getNotificationHref, registerMobilePushToken } from '../../lib/pushNotifications';
import { resolveNotificationHref } from '../../lib/notificationDeepLink';
import { useWebViewControl } from '../../context/WebViewControlContext';
import { navigateDashboard } from '../../navigation/rootNavigation';
import { log } from '../../lib/logger';
import { isExpoGo, loadNotifications } from '../../lib/expoNotifications';

/** Expo SDK 53+: expo-notifications is not loaded in Expo Go at all (it warns there); real builds only. */
const pushRuntimeUnsupported = isExpoGo;

/**
 * Registers Expo push token after Desk login and routes notification taps
 * to the exact screen / WebView path.
 */
export function PushNotificationBootstrap() {
  const { deskToken } = useDeskAuth();
  const { navigate: webNavigate, jumpToTab } = useWebViewControl();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!deskToken || pushRuntimeUnsupported) return;
    void registerMobilePushToken();
  }, [deskToken]);

  useEffect(() => {
    if (pushRuntimeUnsupported) {
      log.info('Push', 'tap listeners skipped in Expo Go');
      return;
    }

    let sub: { remove: () => void } | undefined;
    let cancelled = false;

    const go = (href: string | null) => {
      const target = resolveNotificationHref(href);
      if (!target) {
        navigateDashboard('Notifications');
        return;
      }
      if (target.kind === 'dashboard') {
        navigateDashboard(String(target.screen), target.params);
        return;
      }
      if (target.kind === 'tab') {
        jumpToTab(target.tab);
        return;
      }
      webNavigate(target.path, '/profile');
    };

    void Promise.resolve()
      .then(() => {
        const Notifications = loadNotifications();
        if (!Notifications || cancelled) return;
        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          const id = response.notification.request.identifier;
          if (handledRef.current === id) return;
          handledRef.current = id;
          const data = response.notification.request.content.data as Record<string, unknown>;
          go(getNotificationHref(data));
        });

        return Notifications.getLastNotificationResponseAsync().then((response) => {
          if (!response || cancelled) return;
          const id = response.notification.request.identifier;
          if (handledRef.current === id) return;
          handledRef.current = id;
          const data = response.notification.request.content.data as Record<string, unknown>;
          go(getNotificationHref(data));
        });
      })
      .catch((e) => {
        log.info('Push', 'listeners unavailable', e instanceof Error ? e.message : String(e));
      });

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [jumpToTab, webNavigate]);

  return null;
}
