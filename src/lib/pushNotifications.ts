/**
 * Expo push + Nest token registration.
 *
 * Expo SDK 53+: remote push is NOT available in Expo Go on Android — use a
 * development / production build. Local notifications still work in Expo Go.
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deskFetch } from './deskApi';
import { log } from './logger';
import { Colors } from '../theme/yana';

const isExpoGo = Constants.appOwnership === 'expo';

let handlerConfigured = false;

async function getNotifications() {
  return import('expo-notifications');
}

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return (
    extra?.eas?.projectId ||
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId ||
    undefined
  );
}

/** Whether notifications are allowed, asking (system dialog) only when `ask` is true. Never throws. */
export async function ensurePushPermissions(opts: { ask?: boolean } = { ask: true }): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await getNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!opts.ask) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return Boolean(asked.granted);
  } catch (e) {
    log.info('Push', 'permission check unavailable', e instanceof Error ? e.message : String(e));
    return false;
  }
}

/**
 * Register this phone's push token with Nest. Runs in the background after sign-in, so by default it does NOT
 * ask for permission — the first-run wizard (or a notifications setting) asks; this only registers once allowed.
 */
export async function registerMobilePushToken(opts: { ask?: boolean } = {}): Promise<string | null> {
  try {
    if (isExpoGo && Platform.OS === 'android') {
      log.info('Push', 'Expo Go Android: remote notifications removed — use eas build / expo run:android');
      return null;
    }

    const Notifications = await getNotifications();
    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      handlerConfigured = true;
    }

    if (isExpoGo && Platform.OS === 'android') return null;
    const ok = await ensurePushPermissions({ ask: Boolean(opts.ask) });
    if (!ok) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tukua',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 220, 120, 220],
        lightColor: Colors.primary,
      });
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      log.warn('Push', 'missing EAS projectId — add extra.eas.projectId in app.json');
      return null;
    }

    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenRes.data;
    if (!token) return null;

    await deskFetch('/platform/notifications/push-token', {
      method: 'POST',
      body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
    });
    log.info('Push', 'registered', { platform: Platform.OS });
    return token;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Common Expo Go / simulator noise — don't treat as fatal.
    if (/Expo Go|projectId|simulator|emulator|not available/i.test(msg)) {
      log.info('Push', 'unavailable in this runtime', msg.slice(0, 160));
      return null;
    }
    log.warn('Push', 'register failed', msg);
    return null;
  }
}

export function getNotificationHref(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const href = data.href ?? data.url ?? data.path;
  return typeof href === 'string' && href.trim() ? href.trim() : null;
}
