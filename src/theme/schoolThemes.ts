/** Minimal school theme palettes (ported from shared/desk-theme) — hex for RN. */

export type SchoolThemeId =
  | 'royalNavy'
  | 'emeraldGold'
  | 'burgundyRose'
  | 'midnightViolet'
  | 'forestSage'
  | 'sunsetCoral'
  | 'oceanTeal'
  | 'slateSteel'
  | 'maroonBronze'
  | 'indigoAmber'
  | 'crimsonGold'
  | 'sapphireIvory'
  | 'plumPeach'
  | 'hunterOlive'
  | 'charcoalCopper'
  | 'monochromePearl'
  | 'gildedOnyx'
  | 'citronMoss'
  | 'emberPine';

export type ThemePalette = {
  primary: string;
  secondary: string;
  tertiary: string;
  primaryForeground: string;
  secondaryForeground: string;
  tertiaryForeground: string;
  muted: string;
};

/** hsl(h, s%, l%) → #rrggbb */
function hslToHex(hsl: string): string {
  const m = hsl.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  if (!m) return '#0A3D2E';
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const to = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

const HSL_CONFIGS: Record<SchoolThemeId, Record<keyof ThemePalette, string>> = {
  royalNavy: {
    primary: 'hsl(220, 60%, 25%)',
    secondary: 'hsl(45, 85%, 55%)',
    tertiary: 'hsl(195, 70%, 45%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(220, 60%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(220, 25%, 95%)',
  },
  emeraldGold: {
    primary: 'hsl(155, 55%, 28%)',
    secondary: 'hsl(42, 85%, 52%)',
    tertiary: 'hsl(175, 60%, 40%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(155, 55%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(155, 20%, 95%)',
  },
  burgundyRose: {
    primary: 'hsl(345, 55%, 28%)',
    secondary: 'hsl(340, 70%, 65%)',
    tertiary: 'hsl(25, 80%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(345, 55%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(345, 20%, 95%)',
  },
  midnightViolet: {
    primary: 'hsl(235, 50%, 25%)',
    secondary: 'hsl(280, 65%, 60%)',
    tertiary: 'hsl(45, 85%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(235, 50%, 15%)',
    tertiaryForeground: 'hsl(235, 50%, 15%)',
    muted: 'hsl(235, 20%, 95%)',
  },
  forestSage: {
    primary: 'hsl(145, 40%, 25%)',
    secondary: 'hsl(85, 50%, 55%)',
    tertiary: 'hsl(35, 75%, 50%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(145, 40%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(145, 18%, 95%)',
  },
  sunsetCoral: {
    primary: 'hsl(15, 65%, 35%)',
    secondary: 'hsl(35, 90%, 55%)',
    tertiary: 'hsl(195, 70%, 45%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(15, 65%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(20, 25%, 95%)',
  },
  oceanTeal: {
    primary: 'hsl(195, 55%, 30%)',
    secondary: 'hsl(165, 60%, 50%)',
    tertiary: 'hsl(45, 85%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(195, 55%, 15%)',
    tertiaryForeground: 'hsl(195, 55%, 15%)',
    muted: 'hsl(195, 20%, 95%)',
  },
  slateSteel: {
    primary: 'hsl(215, 25%, 28%)',
    secondary: 'hsl(210, 40%, 58%)',
    tertiary: 'hsl(45, 70%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    tertiaryForeground: 'hsl(215, 25%, 15%)',
    muted: 'hsl(215, 15%, 95%)',
  },
  maroonBronze: {
    primary: 'hsl(0, 50%, 28%)',
    secondary: 'hsl(32, 60%, 52%)',
    tertiary: 'hsl(45, 80%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    tertiaryForeground: 'hsl(0, 50%, 15%)',
    muted: 'hsl(0, 18%, 95%)',
  },
  indigoAmber: {
    primary: 'hsl(245, 45%, 32%)',
    secondary: 'hsl(40, 85%, 55%)',
    tertiary: 'hsl(350, 70%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(245, 45%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(245, 18%, 95%)',
  },
  crimsonGold: {
    primary: 'hsl(355, 60%, 35%)',
    secondary: 'hsl(48, 85%, 52%)',
    tertiary: 'hsl(220, 60%, 45%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(355, 60%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(355, 18%, 95%)',
  },
  sapphireIvory: {
    primary: 'hsl(215, 65%, 35%)',
    secondary: 'hsl(45, 35%, 85%)',
    tertiary: 'hsl(35, 80%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(215, 65%, 20%)',
    tertiaryForeground: 'hsl(215, 65%, 15%)',
    muted: 'hsl(45, 25%, 95%)',
  },
  plumPeach: {
    primary: 'hsl(290, 40%, 32%)',
    secondary: 'hsl(20, 75%, 72%)',
    tertiary: 'hsl(45, 85%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(290, 40%, 15%)',
    tertiaryForeground: 'hsl(290, 40%, 15%)',
    muted: 'hsl(290, 15%, 95%)',
  },
  hunterOlive: {
    primary: 'hsl(135, 35%, 25%)',
    secondary: 'hsl(75, 45%, 55%)',
    tertiary: 'hsl(35, 75%, 50%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(135, 35%, 15%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(135, 15%, 95%)',
  },
  charcoalCopper: {
    primary: 'hsl(220, 15%, 22%)',
    secondary: 'hsl(22, 70%, 55%)',
    tertiary: 'hsl(45, 80%, 55%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(0, 0%, 100%)',
    tertiaryForeground: 'hsl(220, 15%, 15%)',
    muted: 'hsl(220, 10%, 95%)',
  },
  monochromePearl: {
    primary: 'hsl(0, 0%, 11%)',
    secondary: 'hsl(0, 0%, 96%)',
    tertiary: 'hsl(0, 0%, 42%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(0, 0%, 12%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(0, 0%, 94%)',
  },
  gildedOnyx: {
    primary: 'hsl(38, 8%, 10%)',
    secondary: 'hsl(43, 78%, 52%)',
    tertiary: 'hsl(48, 28%, 82%)',
    primaryForeground: 'hsl(0, 0%, 98%)',
    secondaryForeground: 'hsl(38, 25%, 10%)',
    tertiaryForeground: 'hsl(38, 25%, 12%)',
    muted: 'hsl(40, 6%, 94%)',
  },
  citronMoss: {
    primary: 'hsl(142, 42%, 22%)',
    secondary: 'hsl(78, 72%, 48%)',
    tertiary: 'hsl(95, 55%, 38%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(142, 45%, 12%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(88, 22%, 94%)',
  },
  emberPine: {
    primary: 'hsl(158, 48%, 18%)',
    secondary: 'hsl(24, 92%, 52%)',
    tertiary: 'hsl(168, 40%, 32%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    secondaryForeground: 'hsl(24, 80%, 12%)',
    tertiaryForeground: 'hsl(0, 0%, 100%)',
    muted: 'hsl(45, 18%, 94%)',
  },
};

function toHexPalette(hsl: Record<keyof ThemePalette, string>): ThemePalette {
  return {
    primary: hslToHex(hsl.primary),
    secondary: hslToHex(hsl.secondary),
    tertiary: hslToHex(hsl.tertiary),
    primaryForeground: hslToHex(hsl.primaryForeground),
    secondaryForeground: hslToHex(hsl.secondaryForeground),
    tertiaryForeground: hslToHex(hsl.tertiaryForeground),
    muted: hslToHex(hsl.muted),
  };
}

export const SCHOOL_THEME_CONFIGS: Record<SchoolThemeId, ThemePalette> = Object.fromEntries(
  (Object.keys(HSL_CONFIGS) as SchoolThemeId[]).map((id) => [id, toHexPalette(HSL_CONFIGS[id])]),
) as Record<SchoolThemeId, ThemePalette>;

/** Raw HSL strings for WebView CSS variable inject (matches desk theme). */
export const SCHOOL_THEME_HSL: Record<SchoolThemeId, Record<keyof ThemePalette, string>> = HSL_CONFIGS;

export const SCHOOL_THEME_LABELS: Record<SchoolThemeId, string> = {
  royalNavy: 'Royal Navy',
  emeraldGold: 'Emerald Gold',
  burgundyRose: 'Burgundy Rose',
  midnightViolet: 'Midnight Violet',
  forestSage: 'Forest Sage',
  sunsetCoral: 'Sunset Coral',
  oceanTeal: 'Ocean Teal',
  slateSteel: 'Slate Steel',
  maroonBronze: 'Maroon Bronze',
  indigoAmber: 'Indigo Amber',
  crimsonGold: 'Crimson Gold',
  sapphireIvory: 'Sapphire Ivory',
  plumPeach: 'Plum Peach',
  hunterOlive: 'Hunter Olive',
  charcoalCopper: 'Charcoal Copper',
  monochromePearl: 'Monochrome Pearl',
  gildedOnyx: 'Gilded Onyx',
  citronMoss: 'Citron Moss',
  emberPine: 'Ember & Pine',
};

export const SCHOOL_THEME_IDS = Object.keys(SCHOOL_THEME_CONFIGS) as SchoolThemeId[];

export const DEFAULT_SCHOOL_THEME: SchoolThemeId = 'forestSage';

export const APP_THEME_STORAGE_KEY = 'tukua_app_theme';
export const CHAT_BG_PATTERN_STORAGE_KEY = 'tukua_chat_bg_pattern';

export type ChatBgPatternId = 'none' | 'dots' | 'grid' | 'waves';

export const CHAT_BG_PATTERN_LABELS: Record<ChatBgPatternId, string> = {
  none: 'Solid',
  dots: 'Dots',
  grid: 'Grid',
  waves: 'Waves',
};

export const CHAT_BG_PATTERN_IDS = Object.keys(CHAT_BG_PATTERN_LABELS) as ChatBgPatternId[];

export function isSchoolThemeId(value: string | null | undefined): value is SchoolThemeId {
  return Boolean(value && value in SCHOOL_THEME_CONFIGS);
}

export function isChatBgPatternId(value: string | null | undefined): value is ChatBgPatternId {
  return Boolean(value && value in CHAT_BG_PATTERN_LABELS);
}

/** Strip hsl() wrapper for CSS custom properties (desk web convention). */
export function hslToCssVar(hsl: string): string {
  return hsl.replace(/^hsl\(|\)$/g, '').replace(/,/g, '').trim();
}
