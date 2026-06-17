const WEB_BASE = process.env.EXPO_PUBLIC_TUKUA_WEB_URL ?? 'https://tukua.ai';

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

/** Turn relative /certifying-agencies/... paths into absolute tukua.ai URLs. */
export function resolveAgencyLogoUrl(
  logoUrl: string | null | undefined,
  slug?: string | null,
): string | null {
  const trimmed = logoUrl?.trim();
  if (trimmed) {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${WEB_BASE}${trimmed}`;
    return `${WEB_BASE}/${trimmed}`;
  }
  if (slug?.trim()) return `${WEB_BASE}/certifying-agencies/${slug.trim()}.png`;
  return null;
}

/** Ordered candidates: primary URL then common extensions on tukua.ai for the slug. */
export function getAgencyLogoCandidates(
  logoUrl: string | null | undefined,
  slug?: string | null,
): string[] {
  const primary = resolveAgencyLogoUrl(logoUrl, null);
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
    const base = `${WEB_BASE}/certifying-agencies/${slugKey}`;
    for (const ext of [...RASTER_IMAGE_EXTENSIONS, 'svg'] as const) {
      add(`${base}.${ext}`);
    }
  }

  if (!urls.length && slugKey) {
    add(`${WEB_BASE}/certifying-agencies/${slugKey}.png`);
  }

  return urls;
}
