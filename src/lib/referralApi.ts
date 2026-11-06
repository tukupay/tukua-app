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

export function fetchMyReferrals(): Promise<MyReferrals> {
  return deskFetch<MyReferrals>('/platform/referrals/me');
}

export function fetchReferralCourses(): Promise<{ commission_pct: number; items: ReferralCourse[] }> {
  return deskFetch<{ commission_pct: number; items: ReferralCourse[] }>('/platform/referrals/me/courses');
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
