import { getWebBaseUrl } from './localHost';

const WEB_BASE = () => getWebBaseUrl();

export const RASTER_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'] as const;
export type RasterImageExtension = (typeof RASTER_IMAGE_EXTENSIONS)[number];
export type AgencyImageFormat = 'svg' | RasterImageExtension | 'unknown';

export function getImageFormatFromUrl(url: string): AgencyImageFormat {
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  if (path.endsWith('.svg')) return 'svg';
  for (const ext of RASTER_IMAGE_EXTENSIONS) {
    if (path.endsWith(`.${ext}`)) return ext;
  }
  return 'unknown';
}

/** Turn relative /certifying-agencies/... paths into absolute web SPA URLs. */
export function resolveAgencyLogoUrl(
  logoUrl: string | null | undefined,
  slug?: string | null,
): string | null {
  const base = WEB_BASE();
  const trimmed = logoUrl?.trim();
  if (trimmed) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${base}${trimmed}`;
    return `${base}/${trimmed}`;
  }
  if (slug?.trim()) return `${base}/certifying-agencies/${slug.trim()}.png`;
  return null;
}

/** Ordered candidates: primary URL then common extensions for the slug. */
export function getAgencyLogoCandidates(
  logoUrl: string | null | undefined,
  slug?: string | null,
): string[] {
  const primary = resolveAgencyLogoUrl(logoUrl, null);
  const base = WEB_BASE();
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  add(primary);

  const slugKey = slug?.trim();
  if (slugKey) {
    const agencyBase = `${base}/certifying-agencies/${slugKey}`;
    for (const ext of [...RASTER_IMAGE_EXTENSIONS, 'svg'] as const) {
      add(`${agencyBase}.${ext}`);
    }
  }

  if (!urls.length && slugKey) {
    add(`${base}/certifying-agencies/${slugKey}.png`);
  }

  return urls;
}
