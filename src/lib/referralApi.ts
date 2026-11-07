/**
 * Refer and earn — hosted Nest `/platform/referrals/*` (same contract as web /refer).
 * Each person has a short link (tukua.ai/r/<code>); they earn a share of the registration fee for everyone
 * who registers and pays with it, and a share of courses bought through their course links.
 */
import { deskFetch } from './deskApi';

export type ReferralPerson = {
  id: string;
  name: string;
  email: string;
  phone: string;
  for: 'registration' | 'course';
  course_title: string | null;
  kind: string;
  status: 'registered' | 'earned' | 'paid_out' | 'void' | string;
  amount_earned: number;
  joined_at: string;
};

export type MyReferrals = {
  enabled: boolean;
  code: string;
  link: string;
  shares: Record<'student' | 'teacher' | 'parent' | 'individual' | 'school' | 'organization', number>;
  target: { count: number; reward: number; reached: number };
  registered: number;
  paid: number;
  course_commission_pct: number;
  people: ReferralPerson[];
};

export type ReferralCourse = { id: string; title: string; price: number; commission: number; link: string };

export async function fetchMyReferrals(): Promise<MyReferrals> {
  const data = await deskFetch<Partial<MyReferrals> | null>('/platform/referrals/me');
  const d = data ?? {};
  // The screen reads `people.length` / `people.map` directly: always an array.
  return {
    ...d,
    enabled: Boolean(d.enabled),
    code: String(d.code ?? ''),
    link: String(d.link ?? ''),
    shares: (d.shares ?? {}) as MyReferrals['shares'],
    target: { count: 0, reward: 0, reached: 0, ...(d.target ?? {}) },
    registered: Number(d.registered ?? 0) || 0,
    paid: Number(d.paid ?? 0) || 0,
    course_commission_pct: Number(d.course_commission_pct ?? 0) || 0,
    people: Array.isArray(d.people) ? d.people : [],
  } as MyReferrals;
}

export async function fetchReferralCourses(): Promise<{ commission_pct: number; items: ReferralCourse[] }> {
  const data = await deskFetch<{ commission_pct?: number; items?: ReferralCourse[] } | null>(
    '/platform/referrals/me/courses',
  );
  return {
    commission_pct: Number(data?.commission_pct ?? 0) || 0,
    items: Array.isArray(data?.items) ? data!.items! : [],
  };
}

export const kes = (n: number) => `KES ${Math.round(Number(n) || 0).toLocaleString('en-KE')}`;

export const REFERRAL_STATUS_LABEL: Record<string, string> = {
  registered: 'Waiting for payment',
  earned: 'Earned',
  paid_out: 'Paid to you',
  void: 'Cancelled',
};

export const referralShareText = (link: string) =>
  `Join me on Tukua: AI tutoring, courses and exams for students, teachers and schools. Register here: ${link}`;
