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

export async function registerForPushNotifications(): Promise<string | null> {
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

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Tukua',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1F8B4C',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      log.info('Notifications', 'permission denied');
      return null;
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
