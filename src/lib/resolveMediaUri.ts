/**
 * Normalize logo/avatar URLs for React Native Image.
 * Accepts https, data:, file:, content:, and relative paths.
 * Encodes spaces/special chars; returns null for unusable values.
 */

import { getWebBaseUrl } from './localHost';

function encodePathname(pathname: string): string {
  return pathname
    .split('/')
    .map((seg) => {
      if (!seg) return seg;
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join('/');
}

/** Encode an absolute http(s) URL without breaking query/hash. */
function encodeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    u.pathname = encodePathname(u.pathname);
    return u.toString();
  } catch {
    try {
      return encodeURI(raw.replace(/ /g, '%20'));
    } catch {
      return null;
    }
  }
}

/**
 * Turn a stored logo/photo value into a displayable Image URI, or null.
 */
export function resolveDisplayImageUri(
  raw: string | null | undefined,
  baseUrl?: string | null,
): string | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  if (/^(data:|file:|content:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return encodeHttpUrl(trimmed);
  }

  if (trimmed.startsWith('//')) {
    return encodeHttpUrl(`https:${trimmed}`);
  }

  const base = String(baseUrl || getWebBaseUrl()).replace(/\/$/, '');
  if (!base) return null;

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return encodeHttpUrl(`${base}${path}`);
}
