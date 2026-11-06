/**
 * Per-school portal module gate. Matches Desk `@cbe/shared` schoolHasModule:
 * null / missing / ["*"] = all enabled. Admin + core tiles always show.
 */

export type SchoolModuleKey =
  | 'admin'
  | 'accounts'
  | 'assessment'
  | 'discipline'
  | 'calendar'
  | 'library'
  | 'hostel'
  | 'transport'
  | 'canteen'
  | 'elearning'
  | 'meetings'
  | 'bulksms'
  | 'store'
  | 'security'
  | 'core';

export function parseEnabledModules(raw: unknown): string[] | null {
  if (raw == null || raw === '') return null;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '*' || trimmed === '["*"]') return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return trimmed.split(/[,\s]+/).filter(Boolean);
    }
  }
  return null;
}

/** True when this school may show the module. */
export function schoolHasModule(
  enabledModules: unknown,
  moduleKey: SchoolModuleKey | string,
): boolean {
  if (moduleKey === 'core' || moduleKey === 'admin') return true;
  const list = parseEnabledModules(enabledModules);
  if (list == null || list.length === 0) return true;
  if (list.includes('*')) return true;
  return list.includes(String(moduleKey));
}

/** Dashboard action `id` → school module. Unlisted ids stay core (always shown). */
export const DASHBOARD_ACTION_MODULE: Record<string, SchoolModuleKey> = {
  'school-fees': 'accounts',
  'admin-accounts': 'accounts',
  bursary: 'accounts',
  assessments: 'assessment',
  'my-grades': 'assessment',
  'my-assignments': 'assessment',
  'my-progress': 'assessment',
  'enter-marks': 'assessment',
  'scan-marks': 'assessment',
  reports: 'assessment',
  progress: 'assessment',
  library: 'library',
  discipline: 'discipline',
  'my-discipline': 'discipline',
  events: 'calendar',
  'school-events': 'calendar',
  attendance: 'calendar',
  'my-attendance': 'calendar',
  'my-timetable': 'calendar',
  transport: 'transport',
  trips: 'transport',
  'pocket-money': 'canteen',
  elearning: 'elearning',
  courses: 'elearning',
  meetings: 'meetings',
  'daily-attendance': 'security',
  'attendance-scanner': 'security',
  'gate-qr': 'security',
  'face-enroll': 'security',
  'class-lists': 'admin',
  approvals: 'admin',
  'school-overview': 'admin',
  'admin-students': 'admin',
  'admin-teachers': 'admin',
  'admin-parents': 'admin',
  'admit-student': 'admin',
  teachers: 'admin',
};
