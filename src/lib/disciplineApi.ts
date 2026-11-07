/**
 * Discipline module — school API calls and shared helpers for the phone screens.
 *
 * Server rules (desktop/packages/api/src/modules/discipline):
 * - GET /discipline/incidents: office roles (principal, deputy, discipline master, school admin) see the
 *   whole school (or `scope=mine`); teachers/staff see only cases they recorded; parents see their
 *   children's cases (the X-Desk-Student-Id header narrows to one child); students see their own.
 *   Staff lists are paged (page/limit, total); family lists carry the students on each case.
 * - GET /discipline/incidents/:id: office roles, the teacher who recorded it, or a parent of a learner on it.
 * - PATCH / DELETE /discipline/incidents/:id: office roles only.
 * - POST /discipline/cases/analyze: record a case (admission numbers + narrative; the server sets
 *   category / severity from the narrative, then office roles may correct them with PATCH).
 * - GET /discipline/students/search, /discipline/students/:adm: staff (the profile also for that
 *   learner's parent and the learner).
 * There is no acknowledge / comment route for families.
 */
import { deskFetch } from './deskApi';
import { holdsAnyRole } from './deskRoles';

export type DisciplineStudentLink = {
  student_id?: string;
  full_name?: string;
  student_name?: string;
  admission_number?: string;
  class_label?: string;
  points_delta?: number | string | null;
  rating_before?: number | string | null;
  rating_after?: number | string | null;
};

export type DisciplineIncident = {
  id?: string;
  case_number?: string;
  title?: string;
  description?: string;
  case_narrative?: string;
  case_summary?: string;
  status?: string;
  severity?: string;
  sentiment?: string;
  incident_date?: string;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  category_label?: string;
  steps_taken?: string | string[] | null;
  recommendations?: string | string[] | null;
  analysis_report_md?: string | null;
  notify_parent?: boolean | number | null;
  parent_notified_at?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  students?: DisciplineStudentLink[];
  attachments?: Array<{ id?: string; file_url?: string; file_name?: string | null; attachment_type?: string | null }>;
};

export type StudentHit = { id: string; admission_number: string; name: string; class_label?: string };

export type StudentProfile = {
  student: { id?: string; admission_number?: string; name?: string; class_label?: string } | null;
  rating_pct: number | null;
  base_rating: number | null;
  incidents: Array<{
    incident_id?: string;
    category_label?: string;
    case_summary?: string;
    severity?: string;
    sentiment?: string;
    created_at?: string;
    points_delta?: number | string | null;
  }>;
};

/** Same set the server checks for list-all / edit / delete (DISCIPLINE_FULL_ROLES). */
export const DISCIPLINE_OFFICE_ROLES = [
  'school_admin',
  'principal',
  'discipline_master',
  'deputy_principal',
  'super_admin',
  'admin',
];

/** Status values used on mobile (the server keeps free text; new cases start as "recorded"). */
export const DISCIPLINE_STATUSES = ['recorded', 'under_review', 'action_taken', 'resolved', 'closed'] as const;
export const DISCIPLINE_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export function isDisciplineOffice(activeRoles: string[], persona?: string): boolean {
  if (persona === 'super_admin') return true;
  return holdsAnyRole(activeRoles, DISCIPLINE_OFFICE_ROLES);
}

function unwrapData(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    const d = (raw as Record<string, unknown>).data;
    if (d !== undefined && d !== null) return d;
  }
  return raw;
}

export function unwrapIncidents(raw: unknown): { items: DisciplineIncident[]; total: number | null } {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return { items: data as DisciplineIncident[], total: null };
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const k of ['incidents', 'items', 'data']) {
      if (Array.isArray(obj[k])) {
        const items = (obj[k] as unknown[]).filter((x) => x && typeof x === 'object') as DisciplineIncident[];
        const t = Number(obj.total ?? obj.total_count);
        return { items, total: Number.isFinite(t) && obj.total != null ? t : null };
      }
    }
  }
  return { items: [], total: null };
}

/**
 * List cases. `studentId: null` drops the active-child header so a parent gets every child's cases
 * (undefined keeps the active context).
 */
export async function listDisciplineIncidents(opts: {
  page?: number;
  limit?: number;
  mine?: boolean;
  studentId?: string | null;
} = {}) {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.mine) params.set('scope', 'mine');
  const qs = params.toString();
  const raw = await deskFetch<unknown>(`/discipline/incidents${qs ? `?${qs}` : ''}`, {
    context: opts.studentId !== undefined ? { studentId: opts.studentId } : undefined,
  });
  return unwrapIncidents(raw);
}

export async function getDisciplineIncident(id: string): Promise<DisciplineIncident> {
  const raw = await deskFetch<unknown>(`/discipline/incidents/${encodeURIComponent(id)}`);
  return (unwrapData(raw) ?? {}) as DisciplineIncident;
}

export type DisciplineIncidentPatch = Partial<{
  case_narrative: string;
  case_summary: string;
  severity: string;
  sentiment: string;
  category_label: string;
  status: string;
  steps_taken: string;
  recommendations: string;
  notify_parent: boolean;
}>;

export async function updateDisciplineIncident(id: string, patch: DisciplineIncidentPatch) {
  const raw = await deskFetch<unknown>(`/discipline/incidents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: patch,
  });
  return (unwrapData(raw) ?? {}) as DisciplineIncident;
}

export async function deleteDisciplineIncident(id: string) {
  return deskFetch<unknown>(`/discipline/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function searchDisciplineStudentsList(q: string, limit = 15): Promise<StudentHit[]> {
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  const raw = await deskFetch<unknown>(`/discipline/students/search?${params}`);
  const data = unwrapData(raw) as { students?: Array<Record<string, unknown>> } | null;
  const list = Array.isArray(data?.students) ? data!.students : [];
  return list
    .map((s) => ({
      id: String(s.id ?? s.student_id ?? ''),
      admission_number: String(s.admission_number ?? s.student_number ?? ''),
      name: String(s.name ?? s.full_name ?? s.admission_number ?? 'Student'),
      class_label: s.class_label || s.class_name ? String(s.class_label ?? s.class_name) : undefined,
    }))
    .filter((s) => s.id && s.admission_number);
}

export async function fetchDisciplineCategoryNames(): Promise<string[]> {
  try {
    const raw = await deskFetch<unknown>('/discipline/categories');
    const data = unwrapData(raw) as { categories?: Array<Record<string, unknown>> } | null;
    const list = Array.isArray(data?.categories) ? data!.categories : [];
    return list.map((c) => String(c.name ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** Common offence groups offered next to the school's own categories. */
export const COMMON_DISCIPLINE_CATEGORIES = [
  'General conduct',
  'Lateness / punctuality',
  'Uniform',
  'Absenteeism / truancy',
  'Mobile phone violation',
  'Disrespect',
  'Bullying',
  'Fighting',
  'Cheating',
  'Property damage',
  'Substance abuse',
  'Commendation',
];

export type RecordCaseInput = {
  admission_numbers: string[];
  case_narrative: string;
  notify_parent: boolean;
  use_ai: boolean;
};

export type RecordCaseResult = {
  incident_id: string | null;
  case_number: string | null;
  report_md: string | null;
  severity: string | null;
  category: string | null;
};

export async function recordDisciplineCase(input: RecordCaseInput): Promise<RecordCaseResult> {
  const raw = await deskFetch<unknown>('/discipline/cases/analyze', {
    method: 'POST',
    body: { ...input, save: true },
    // The AI write-up can take a while.
    timeoutMs: input.use_ai ? 90_000 : 30_000,
  });
  const d = (unwrapData(raw) ?? {}) as Record<string, unknown>;
  const analysis = (d.analysis ?? {}) as Record<string, unknown>;
  return {
    incident_id: d.incident_id ? String(d.incident_id) : null,
    case_number: d.case_number ? String(d.case_number) : null,
    report_md: typeof d.report_md === 'string' ? d.report_md : null,
    severity: analysis.severity ? String(analysis.severity) : null,
    category: analysis.category ? String(analysis.category) : null,
  };
}

export async function fetchDisciplineStudentProfile(admissionNumber: string): Promise<StudentProfile> {
  const raw = await deskFetch<unknown>(`/discipline/students/${encodeURIComponent(admissionNumber)}`);
  const d = (unwrapData(raw) ?? {}) as Record<string, unknown>;
  const rating = Number(d.rating_pct);
  const base = Number(d.base_rating);
  return {
    student: (d.student as StudentProfile['student']) ?? null,
    rating_pct: Number.isFinite(rating) ? rating : null,
    base_rating: Number.isFinite(base) ? base : null,
    incidents: Array.isArray(d.incidents) ? (d.incidents as StudentProfile['incidents']) : [],
  };
}

export function extractAnalysisText(res: unknown): string {
  if (!res || typeof res !== 'object') return 'Analysis complete.';
  const obj = res as Record<string, unknown>;
  // deskFetch already unwraps `{ data }`; older shapes keep it nested.
  for (const d of [obj, obj.data]) {
    if (!d || typeof d !== 'object') continue;
    const r = d as Record<string, unknown>;
    const md = r.analysis_report_md ?? r.report_md ?? r.narrative;
    if (typeof md === 'string' && md.trim()) return md.trim();
  }
  const msg = obj.message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return 'Analysis complete — pull to refresh for updated case details.';
}

export async function analyzeDisciplineCase(caseNumber: string): Promise<string> {
  const res = await deskFetch<unknown>(`/discipline/cases/${encodeURIComponent(caseNumber)}/analyze?use_ai=true`, {
    method: 'POST',
    timeoutMs: 90_000,
  });
  return extractAnalysisText(res);
}

export async function analyzeDisciplineStudent(admissionNumber: string): Promise<string> {
  const res = await deskFetch<unknown>(
    `/discipline/students/${encodeURIComponent(admissionNumber)}/analyze?use_ai=true`,
    { method: 'POST', timeoutMs: 90_000 },
  );
  return extractAnalysisText(res);
}

// ─── Display helpers ────────────────────────────────────────────────────────────────────────────

export function asTextList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x ?? '')).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? '')).filter(Boolean);
  } catch {
    /* plain text */
  }
  return s
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export function isCommendation(i: DisciplineIncident): boolean {
  const s = `${i.sentiment ?? ''} ${i.category_label ?? i.category_name ?? ''} ${i.case_number ?? ''}`.toLowerCase();
  return /positive|commend|merit|award|praise/.test(s) || /-c-\d/.test(s);
}

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent';

export function severityTone(sev?: string | null): Tone {
  const s = String(sev ?? '').toLowerCase();
  if (s === 'high' || s === 'critical' || s === 'severe') return 'danger';
  if (s === 'medium' || s === 'moderate') return 'warning';
  return 'neutral';
}

export function statusTone(status?: string | null): Tone {
  const s = String(status ?? '').toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'success';
  if (s === 'under_review' || s === 'action_taken' || s === 'open' || s === 'pending') return 'warning';
  return 'primary';
}

export function cap(s?: string | null): string {
  const v = String(s ?? '').trim().replace(/_/g, ' ');
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
}

export function incidentWhen(i: DisciplineIncident): string | undefined {
  return i.incident_date || i.created_at || undefined;
}

export function incidentTitle(i: DisciplineIncident): string {
  return String(i.title || i.case_summary || i.category_label || i.case_number || 'Incident');
}

export function studentName(s: DisciplineStudentLink): string {
  return String(s.full_name || s.student_name || s.admission_number || 'Student');
}

export function isClosedStatus(status?: string | null): boolean {
  const s = String(status ?? '').toLowerCase();
  return s === 'resolved' || s === 'closed';
}

/** Kenyan school terms by month: Term 1 Jan–Apr, Term 2 May–Aug, Term 3 Sep–Dec. */
export function termKey(v: string | Date | undefined | null): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const term = d.getMonth() <= 3 ? 1 : d.getMonth() <= 7 ? 2 : 3;
  return `${d.getFullYear()}-T${term}`;
}

export function previousTermKey(key: string): string {
  const [y, t] = key.split('-T').map(Number);
  return t === 1 ? `${y - 1}-T3` : `${y}-T${t - 1}`;
}

export function termLabel(key: string): string {
  const [y, t] = key.split('-T');
  return `Term ${t} ${y}`;
}

export function todayIso(offsetDays = 0): string {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
