/**
 * The one place that loads `expo-notifications`.
 *
 * Inside Expo Go the module must not even be evaluated: since SDK 53 loading it there prints
 * "Push notifications (remote notifications) are unavailable in Expo Go on Android…" and
 * "`expo-notifications` functionality is not fully supported in Expo Go". So it is required lazily, only in
 * real builds (development / preview / production); in Expo Go every caller gets `null` and quietly does
 * nothing (no push token, no tap routing, no local event reminders, no notifications step in the wizard).
 * Release builds behave exactly as before — the module loads on first use.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

export type NotificationsModule = typeof import('expo-notifications');

/** True inside the Expo Go app (store client), where expo-notifications is not supported. */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

let cached: NotificationsModule | null | undefined;

/** expo-notifications in real builds; null in Expo Go (never loaded there) or if it cannot load. */
export function loadNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (isExpoGo) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** Async form for call sites that used `await import('expo-notifications')`. */
export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  return loadNotifications();
}
