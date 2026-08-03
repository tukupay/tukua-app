import { deskFetch } from './deskApi';
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
  country_code?: string | null;
  preferred_currency?: string | null;
  skills?: string[] | null;
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

export async function fetchProfile(): Promise<ProfileData> {
  const result = await deskFetch<{ profile: ProfileData }>('/platform/me/profile');
  return result.profile || {};
}

export async function patchProfile(body: Partial<ProfileData>): Promise<ProfileData> {
  const result = await deskFetch<{ profile: ProfileData }>('/platform/me/profile', {
    method: 'PATCH',
    body,
  });
  return result.profile || {};
}

export async function fetchDocuments(): Promise<ProfileDocument[]> {
  const result = await deskFetch<{ items: ProfileDocument[] }>('/platform/me/documents');
  return result.items || [];
}

export async function createDocument(
  body: Omit<ProfileDocument, 'id' | 'created_at'>,
): Promise<ProfileDocument> {
  const result = await deskFetch<{ document: ProfileDocument }>('/platform/me/documents', {
    method: 'POST',
    body,
  });
  return result.document;
}

export function deleteDocument(id: string): Promise<unknown> {
  return deskFetch(`/platform/me/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchMemories(): Promise<ProfileMemory[]> {
  const result = await deskFetch<{ items: ProfileMemory[] }>('/platform/me/memories');
  return result.items || [];
}

export async function createMemory(body: {
  key: string;
  value: unknown;
  display_name?: string;
}): Promise<ProfileMemory> {
  const result = await deskFetch<{ memory: ProfileMemory }>('/platform/me/memories', {
    method: 'POST',
    body,
  });
  return result.memory;
}

export async function patchMemory(
  id: string,
  body: Partial<Pick<ProfileMemory, 'key' | 'value' | 'display_name'>>,
): Promise<ProfileMemory> {
  const result = await deskFetch<{ memory: ProfileMemory }>(
    `/platform/me/memories/${encodeURIComponent(id)}`,
    { method: 'PATCH', body },
  );
  return result.memory;
}

export function deleteMemory(id: string): Promise<unknown> {
  return deskFetch(`/platform/me/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchPortfolio(): Promise<{
  username?: string | null;
  settings: PortfolioSettings;
}> {
  const result = await deskFetch<{
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
  return deskFetch('/platform/me/portfolio', { method: 'PATCH', body: settings });
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
};

export function fetchBalances(): Promise<BalancesData> {
  return deskFetch('/platform/me/balances?limit=40');
}

export type PreferencesData = {
  sarcasm_mode?: boolean;
  preferred_model?: string | null;
  user_preferences?: Record<string, unknown>;
};

export function fetchPreferences(): Promise<PreferencesData> {
  return deskFetch('/platform/preferences');
}

export function patchPreferences(body: {
  sarcasm_mode?: boolean;
  preferred_model?: string | null;
}): Promise<PreferencesData> {
  return deskFetch('/platform/preferences', { method: 'PATCH', body });
}

export async function createSignedDownload(path: string): Promise<string> {
  const result = await deskFetch<{ signedUrl?: string }>('/platform/storage/signed-download', {
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
