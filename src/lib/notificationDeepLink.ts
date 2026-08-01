import type { DashboardStackParamList } from '../navigation/types';

export type NotificationNavTarget =
  | { kind: 'dashboard'; screen: keyof DashboardStackParamList; params?: Record<string, unknown> }
  | { kind: 'web'; path: string; title?: string }
  | { kind: 'tab'; tab: 'Chat' | 'Courses' | 'Dashboard' | 'Profile' };

/** Map notification.href → in-app navigation target. */
export function resolveNotificationHref(href: string | null | undefined): NotificationNavTarget | null {
  if (!href?.trim()) return null;
  let path = href.trim();
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const u = new URL(path);
      path = u.pathname + u.search;
    }
  } catch {
    /* keep raw */
  }
  path = path.replace(/^tukua:\/\//i, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  const lower = path.toLowerCase();

  const native: Array<[RegExp, keyof DashboardStackParamList]> = [
    [/^\/meetings(\/|$)/, 'Meetings'],
    [/^\/events(\/|$)/, 'Events'],
    [/^\/discipline(\/|$)/, 'Discipline'],
    [/^\/assessments(\/|$)|\/exams(\/|$)/, 'Assessments'],
    [/^\/library(\/|$)/, 'Library'],
    [/^\/accounts(\/|$)|\/fees(\/|$)|\/receipts(\/|$)/, 'Accounts'],
    [/^\/transport(\/|$)/, 'Transport'],
    [/^\/attendance(\/|$)/, 'Attendance'],
    [/^\/bursary(\/|$)/, 'Bursary'],
    [/^\/security(\/|$)/, 'SecurityHome'],
    [/^\/teachers(\/|$)/, 'Teachers'],
    [/^\/school(\/|$)/, 'SchoolInfo'],
  ];
  for (const [re, screen] of native) {
    if (re.test(lower)) return { kind: 'dashboard', screen };
  }
  if (/^\/(chat|ai)(\/|$)/.test(lower)) return { kind: 'tab', tab: 'Chat' };
  if (/^\/courses(\/|$)/.test(lower)) return { kind: 'tab', tab: 'Courses' };
  if (/^\/dashboard(\/|$)/.test(lower)) return { kind: 'tab', tab: 'Dashboard' };
  if (/^\/profile(\/|$)/.test(lower)) return { kind: 'tab', tab: 'Profile' };

  return { kind: 'web', path, title: 'Tukua' };
}
