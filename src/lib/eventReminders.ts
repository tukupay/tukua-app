/**
 * "Remind me before events": local notifications scheduled on this phone with expo-notifications.
 *
 * The server keeps the opt-in (PUT /events/reminder-settings/me) and the lead time
 * (GET /events/reminder-settings → reminder_lead_hours); the phone schedules one reminder per upcoming
 * event it lists (the list is already filtered to what this person may see). Every call replaces the
 * reminders scheduled before, so a moved or cancelled event never fires a stale reminder.
 * In Expo Go expo-notifications is not loaded at all (it prints warnings there since SDK 53), so reminders
 * quietly do nothing there; real builds schedule them as before.
 */
import { Platform } from 'react-native';
import { log } from './logger';
import { getNotificationsModule, isExpoGo } from './expoNotifications';

export type ReminderEvent = {
  id?: string;
  title?: string;
  start_at?: string;
  all_day?: boolean | number;
  location?: string | null;
};

const KIND = 'event_reminder';
const CHANNEL = 'event-reminders';
/** iOS keeps at most 64 scheduled notifications for an app; leave room for others. */
const MAX_SCHEDULED = 40;

async function getNotifications() {
  const N = await getNotificationsModule();
  if (!N) throw new Error(isExpoGo ? 'not available in Expo Go' : 'expo-notifications unavailable');
  return N;
}

/** False in Expo Go (and on web): reminders cannot be scheduled on this runtime. */
export function eventRemindersSupported(): boolean {
  return Platform.OS !== 'web' && !isExpoGo;
}

/** Ask (or just check) permission to show notifications. Never throws. */
export async function ensureEventReminderPermission(ask: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await getNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!ask) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return Boolean(asked.granted);
  } catch (e) {
    log.info('EventReminders', 'permission unavailable', e instanceof Error ? e.message : String(e));
    return false;
  }
}

/** Remove every event reminder this app scheduled. Never throws. */
export async function cancelEventReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await getNotifications();
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      const data = (n.content?.data || {}) as Record<string, unknown>;
      if (data.kind === KIND) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined);
      }
    }
  } catch (e) {
    log.info('EventReminders', 'cancel failed', e instanceof Error ? e.message : String(e));
  }
}

function fireTime(ev: ReminderEvent, leadHours: number): Date | null {
  if (!ev.start_at) return null;
  const start = new Date(ev.start_at);
  if (Number.isNaN(start.getTime())) return null;
  if (Number(ev.all_day) || ev.all_day === true) {
    // All-day: the evening before (18:00 local), or `leadHours` before midnight when that is earlier.
    const eve = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1, 18, 0, 0);
    const lead = new Date(start.getTime() - leadHours * 3_600_000);
    return lead < eve ? lead : eve;
  }
  return new Date(start.getTime() - leadHours * 3_600_000);
}

function whenLabel(ev: ReminderEvent): string {
  try {
    const start = new Date(String(ev.start_at));
    if (Number(ev.all_day) || ev.all_day === true) {
      return start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Replace this phone's event reminders with one per upcoming event, `leadHours` before it starts.
 * Returns how many were scheduled (0 without permission). Never throws.
 */
export async function scheduleEventReminders(
  events: ReminderEvent[],
  leadHours: number,
  opts: { ask?: boolean } = {},
): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const lead = Math.min(168, Math.max(1, Number(leadHours) || 24));
  try {
    const allowed = await ensureEventReminderPermission(Boolean(opts.ask));
    await cancelEventReminders();
    if (!allowed) return 0;
    const Notifications = await getNotifications();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Event reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1F8B4C',
      }).catch(() => undefined);
    }
    const now = Date.now() + 60_000;
    const upcoming = events
      .map((ev) => ({ ev, at: fireTime(ev, lead) }))
      .filter((x): x is { ev: ReminderEvent; at: Date } => !!x.at && x.at.getTime() > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, MAX_SCHEDULED);
    let count = 0;
    for (const { ev, at } of upcoming) {
      try {
        const where = ev.location ? ` · ${ev.location}` : '';
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Coming up: ${ev.title || 'School event'}`,
            body: `${whenLabel(ev)}${where}`,
            sound: 'default',
            data: { kind: KIND, eventId: ev.id ?? null, href: '/events', app: 'tukua' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL } : {}),
          },
        });
        count += 1;
      } catch (e) {
        log.info('EventReminders', 'schedule one failed', e instanceof Error ? e.message : String(e));
      }
    }
    return count;
  } catch (e) {
    log.warn('EventReminders', 'schedule failed', e instanceof Error ? e.message : String(e));
    return 0;
  }
}
