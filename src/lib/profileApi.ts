import { getNestApiBaseUrl } from './localHost';

import { resolveNestAccessTokenForWebView } from './platformNestAuth';



export type ProfileData = {

  id?: string;

  email?: string | null;

  full_name?: string | null;

  username?: string | null;

  bio?: string | null;

  phone?: string | null;

  phone_number?: string | null;

  whatsapp_phone?: string | null;

  secondary_phone?: string | null;

  location?: string | null;

  business_location?: string | null;

  county?: string | null;

  avatar_url?: string | null;

  cover_photo_url?: string | null;

  country_code?: string | null;

  country_name?: string | null;

  preferred_currency?: string | null;

  skills?: string[] | null;

  linkedin_url?: string | null;

  facebook_url?: string | null;

  x_url?: string | null;

  portfolio_url?: string | null;

  is_verified?: boolean | null;

  metadata?: Record<string, unknown> | null;

};



export type ProfileDocument = {

  id: string;

  title: string;

  description?: string | null;

  document_type?: string | null;

  file_url: string;

  file_name?: string | null;

  file_size?: number | null;

  mime_type?: string | null;

  status?: string | null;

  ai_analysis?: string | null;

  created_at?: string | null;

};



export type ProfileMemory = {

  id: string;

  key: string;

  value: unknown;

  display_name?: string | null;

  memory_type?: string | null;

  updated_at?: string | null;

};



export type PortfolioSettings = {

  template: string;

  show_email: boolean;

  show_phone: boolean;

  show_bio: boolean;

  show_skills: boolean;

  show_education: boolean;

  show_social: boolean;

  show_documents: boolean;

  custom_headline?: string;

};



export const DEFAULT_PORTFOLIO_SETTINGS: PortfolioSettings = {

  template: 'minimal',

  show_email: true,

  show_phone: false,

  show_bio: true,

  show_skills: true,

  show_education: true,

  show_social: true,

  show_documents: false,

  custom_headline: '',

};



/** Nest JWT platform fetch — `/platform/me/*` and preferences (same unwrap as other Nest helpers). */

async function nestPlatformFetch<T>(

  path: string,

  opts: { method?: string; body?: unknown } = {},

): Promise<T> {

  const token = await resolveNestAccessTokenForWebView();

  if (!token) throw new Error('Sign in required');

  const base = getNestApiBaseUrl().replace(/\/$/, '');

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {

    Accept: 'application/json',

    Authorization: `Bearer ${token}`,

  };

  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';



  const response = await fetch(url, {

    method: opts.method ?? 'GET',

    headers,

    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,

  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {

    const msg =

      (typeof json?.message === 'string' && json.message) ||

      (typeof json?.error === 'string' && json.error) ||

      `Request failed (${response.status})`;

    throw new Error(msg);

  }

  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {

    return (json as { data: T }).data;

  }

  if (json && typeof json === 'object' && 'data' in json) {

    return (json as { data: T }).data;

  }

  return json as T;

}



export async function fetchProfile(): Promise<ProfileData> {

  const result = await nestPlatformFetch<{ profile: ProfileData }>('/platform/me/profile');

  return result.profile || {};

}



export async function patchProfile(body: Partial<ProfileData>): Promise<ProfileData> {

  const result = await nestPlatformFetch<{ profile: ProfileData }>('/platform/me/profile', {

    method: 'PATCH',

    body,

  });

  return result.profile || {};

}



export async function fetchDocuments(): Promise<ProfileDocument[]> {

  const result = await nestPlatformFetch<{ items: ProfileDocument[] }>('/platform/me/documents');

  return result.items || [];

}



export async function createDocument(

  body: Omit<ProfileDocument, 'id' | 'created_at'>,

): Promise<ProfileDocument> {

  const result = await nestPlatformFetch<{ document: ProfileDocument }>('/platform/me/documents', {

    method: 'POST',

    body,

  });

  return result.document;

}



export function deleteDocument(id: string): Promise<unknown> {

  return nestPlatformFetch(`/platform/me/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });

}



export async function fetchMemories(): Promise<ProfileMemory[]> {

  const result = await nestPlatformFetch<{ items: ProfileMemory[] }>('/platform/me/memories');

  return result.items || [];

}



export async function createMemory(body: {

  key: string;

  value: unknown;

  display_name?: string;

}): Promise<ProfileMemory> {

  const result = await nestPlatformFetch<{ memory: ProfileMemory }>('/platform/me/memories', {

    method: 'POST',

    body,

  });

  return result.memory;

}



export async function patchMemory(

  id: string,

  body: Partial<Pick<ProfileMemory, 'key' | 'value' | 'display_name'>>,

): Promise<ProfileMemory> {

  const result = await nestPlatformFetch<{ memory: ProfileMemory }>(

    `/platform/me/memories/${encodeURIComponent(id)}`,

    { method: 'PATCH', body },

  );

  return result.memory;

}



export function deleteMemory(id: string): Promise<unknown> {

  return nestPlatformFetch(`/platform/me/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });

}



export async function fetchPortfolio(): Promise<{

  username?: string | null;

  settings: PortfolioSettings;

}> {

  const result = await nestPlatformFetch<{

    username?: string | null;

    settings?: Partial<PortfolioSettings>;

  }>('/platform/me/portfolio');

  return {

    username: result.username,

    settings: { ...DEFAULT_PORTFOLIO_SETTINGS, ...(result.settings || {}) },

  };

}



export function patchPortfolio(settings: PortfolioSettings): Promise<{

  settings: PortfolioSettings;

}> {

  return nestPlatformFetch('/platform/me/portfolio', { method: 'PATCH', body: settings });

}



export type BalancesData = {

  balance: { balance?: number; monthly_grant_amount?: number };

  transactions: Array<{

    id: string;

    amount: number;

    balance_after: number;

    transaction_type: string;

    description?: string | null;

    created_at?: string | null;

  }>;

  total_transactions?: number | null;

  has_more?: boolean;

};



export const BALANCES_PAGE_SIZE = 20;



export function fetchBalances(opts: { limit?: number; offset?: number } = {}): Promise<BalancesData> {

  const limit = opts.limit ?? BALANCES_PAGE_SIZE;

  const offset = opts.offset ?? 0;

  return nestPlatformFetch(`/platform/me/balances?limit=${limit}&offset=${offset}`);

}



export type PreferencesData = {

  sarcasm_mode?: boolean;

  preferred_model?: string | null;

  user_preferences?: Record<string, unknown>;

};



export function fetchPreferences(): Promise<PreferencesData> {

  return nestPlatformFetch('/platform/preferences');

}



export function patchPreferences(body: {

  sarcasm_mode?: boolean;

  preferred_model?: string | null;

  preferred_font?: string | null;

  font_size?: number | null;

}): Promise<PreferencesData> {

  return nestPlatformFetch('/platform/preferences', { method: 'PATCH', body });

}



/** Public — no Nest JWT required. */

export async function requestAccountDeletion(body: {

  email?: string;

  phone?: string;

  reason?: string;

}): Promise<{ ok: boolean; message?: string }> {

  const base = getNestApiBaseUrl().replace(/\/$/, '');

  const response = await fetch(`${base}/platform/account/deletion-request`, {

    method: 'POST',

    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },

    body: JSON.stringify(body),

  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {

    const msg =

      (typeof json?.message === 'string' && json.message) ||

      (typeof json?.error === 'string' && json.error) ||

      `Request failed (${response.status})`;

    throw new Error(msg);

  }

  return { ok: true, message: json?.data?.message || json?.message };

}



export type VerifyIdResult = {

  success?: boolean;

  is_valid?: boolean;

  verified?: boolean;

  message?: string;

  analysis_notes?: string;

  doc_name?: string;

  doc_number?: string;

};



/** Nest-native ID document check (OpenRouter vision) — `image_url` must already be reachable (signed URL). */

export function verifyIdDocument(body: {

  image_url: string;

  document_type: string;

}): Promise<VerifyIdResult> {

  return nestPlatformFetch('/platform/ai/verify-id', { method: 'POST', body });

}

export type DocumentAnalysisResult = {
  success?: boolean;
  doc_id?: string;
  status?: 'completed' | 'error' | string;
  error?: string;
};

/** Background AI analysis of one uploaded document — `/platform/ai/analyze-documents` (Nest-native). */
export function analyzeDocument(userId: string, docId: string): Promise<DocumentAnalysisResult> {
  return nestPlatformFetch('/platform/ai/analyze-documents', {
    method: 'POST',
    body: { mode: 'analyze_one', user_id: userId, doc_id: docId },
  });
}

export type TokenShareLookup = {
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name_masked?: string | null;
  phone_masked?: string | null;
  account_type?: string;
};

export function lookupTokenShareRecipient(email: string): Promise<TokenShareLookup> {
  return nestPlatformFetch('/platform/me/tokens/lookup', {
    method: 'POST',
    body: { email },
  });
}

export function transferTokens(body: {
  to_user_id: string;
  tokens: number;
  note?: string;
}): Promise<{ success?: boolean; from_balance?: number; amount?: number }> {
  return nestPlatformFetch('/platform/me/tokens/transfer', {
    method: 'POST',
    body,
  });
}



export async function createSignedDownload(path: string): Promise<string> {

  const result = await nestPlatformFetch<{ signedUrl?: string }>('/platform/storage/signed-download', {

    method: 'POST',

    body: { bucket: 'user-documents', path, expiresIn: 600 },

  });

  if (!result.signedUrl) throw new Error('Download link unavailable');

  return result.signedUrl;

}



export async function uploadProfileFile(input: {

  uri: string;

  name: string;

  mimeType?: string | null;

  bucket: 'avatars' | 'user-documents';

  path: string;

}): Promise<{ path: string; publicUrl?: string }> {

  const token = await resolveNestAccessTokenForWebView();

  if (!token) throw new Error('Sign in required');

  const base = getNestApiBaseUrl().replace(/\/$/, '');

  const form = new FormData();

  form.append(

    'file',

    {

      uri: input.uri,

      name: input.name,

      type: input.mimeType || 'application/octet-stream',

    } as unknown as Blob,

  );

  const url = `${base}/platform/storage/upload?bucket=${encodeURIComponent(input.bucket)}&path=${encodeURIComponent(input.path)}`;

  const response = await fetch(url, {

    method: 'POST',

    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },

    body: form,

  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {

    throw new Error(json?.message || json?.error || `Upload failed (${response.status})`);

  }

  const data = json?.data ?? json;

  return { path: String(data?.path || input.path), publicUrl: data?.publicUrl };

}


