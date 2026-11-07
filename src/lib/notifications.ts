import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { log } from './logger';

const isExpoGo = Constants.appOwnership === 'expo';

let handlerConfigured = false;

async function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }
  return import('expo-notifications');
}

async function ensureNotificationHandler(
  Notifications: Awaited<ReturnType<typeof getNotificationsModule>>,
) {
  if (!Notifications || handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

/**
 * Push token for this phone. By default it never pops the system dialog (it runs in the background after
 * sign-in): without permission it returns null. Pass { ask: true } only from a user action.
 */
export async function registerForPushNotifications(opts: { ask?: boolean } = {}): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (isExpoGo) {
    log.info('Notifications', 'skipped in Expo Go — use a development build for push');
    return null;
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    await ensureNotificationHandler(Notifications);

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted' && opts.ask) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log.info('Notifications', opts.ask ? 'permission denied' : 'not allowed yet — not asking in the background');
      return null;
    }

    // Channel after permission: on some Android versions creating the first channel shows the dialog.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tukua',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1F8B4C',
      });
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      log.warn('Notifications', 'no EAS projectId — run eas init and add extra.eas.projectId');
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    log.info('Notifications', 'registered', { token: token.slice(0, 12) + '…' });
    return token;
  } catch (err) {
    log.warn('Notifications', 'register failed', err);
    return null;
  }
}
