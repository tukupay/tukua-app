/**
 * Open external meeting hosts (Meet / Teams / Zoom / Facebook) preferring native apps.
 * Calendar: open Google Calendar template in the browser/app (do NOT Share.share ICS —
 * that opens the system share sheet).
 */
import { Linking, Platform } from 'react-native';

export function providerLabel(url?: string | null, provider?: string | null): string {
  const p = String(provider || '').toLowerCase();
  const u = String(url || '').toLowerCase();
  if (p.includes('team') || /teams\.(microsoft|live)\.com|msteams:/.test(u)) return 'Teams';
  if (p.includes('zoom') || /zoom\.(us|com)/.test(u)) return 'Zoom';
  if (p.includes('meet') || /meet\.google\.com/.test(u)) return 'Meet';
  if (p.includes('facebook') || /facebook\.com|fb\.me|fb:\/\//.test(u)) return 'Facebook';
  if (p.includes('jit') || /meet\.jit\.si/.test(u)) return 'Meet';
  return 'meeting';
}

export function joinButtonLabel(url?: string | null, provider?: string | null): string {
  const name = providerLabel(url, provider);
  if (name === 'meeting') return 'Join';
  return `Open in ${name}`;
}

/** Prefer app deep links when we can derive them; else HTTPS (OS routes to app). */
export function resolveOpenUrl(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host.includes('teams.microsoft.com') || host.includes('teams.live.com')) {
      return raw;
    }
    if (host.includes('zoom.us') || host.includes('zoom.com')) {
      const conf = u.pathname.match(/\/j\/(\d+)/)?.[1];
      if (conf && Platform.OS !== 'web') {
        const pwd = u.searchParams.get('pwd');
        return pwd ? `zoomus://zoom.us/join?confno=${conf}&pwd=${pwd}` : `zoomus://zoom.us/join?confno=${conf}`;
      }
    }
    if (host.includes('facebook.com') || host === 'fb.me') {
      return raw;
    }
  } catch {
    /* keep raw */
  }
  return raw;
}

export async function openExternalMeeting(url: string): Promise<void> {
  const target = resolveOpenUrl(url);
  const can = await Linking.canOpenURL(target).catch(() => false);
  if (can) {
    await Linking.openURL(target);
    return;
  }
  await Linking.openURL(url);
}

function toStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Open Google Calendar “add event” externally (browser / calendar app). */
export async function saveMeetingToCalendar(opts: {
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  description?: string | null;
}): Promise<'ics' | 'gcal'> {
  const start = opts.startsAt ? new Date(opts.startsAt) : new Date();
  const startSafe = Number.isNaN(start.getTime()) ? new Date() : start;
  const end = opts.endsAt
    ? new Date(opts.endsAt)
    : new Date(startSafe.getTime() + 60 * 60 * 1000);
  const endSafe = Number.isNaN(end.getTime())
    ? new Date(startSafe.getTime() + 60 * 60 * 1000)
    : end;
  const loc = opts.location || '';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title || 'Meeting',
    dates: `${toStamp(startSafe)}/${toStamp(endSafe)}`,
    details: [
      opts.description || '',
      loc ? `Join: ${loc}` : '',
      'Reminder: set a notification for 1 day before.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  });
  if (loc) params.set('location', loc);
  const gcal = `https://calendar.google.com/calendar/render?${params.toString()}`;
  await Linking.openURL(gcal);
  return 'gcal';
}
