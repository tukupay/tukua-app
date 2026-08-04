/**
 * Mirrors web `src/lib/fontUtils.ts` — same `value`/`label` catalogue so the
 * mobile Preferences dropdown lists every font the web app offers. Only a
 * curated subset is bundled as real native font files (via
 * `@expo-google-fonts/*`, loaded in `App.tsx`); the rest fall back to a
 * system font that matches the same category (sans-serif / serif /
 * monospace / cursive) so switching still visibly changes the look even
 * before that specific webfont ships natively.
 */

export type FontOption = {
  value: string;
  label: string;
  family: string;
  weight?: string;
  style?: string;
};

export const MOBILE_FONT_OPTIONS: FontOption[] = [
  { value: 'Inter', label: 'Inter (Default)', family: 'Inter, sans-serif' },
  { value: 'Roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'Roboto Bold', label: 'Roboto Bold', family: 'Roboto, sans-serif', weight: '700' },
  { value: 'Open Sans', label: 'Open Sans', family: "'Open Sans', sans-serif" },
  { value: 'Open Sans Bold', label: 'Open Sans Bold', family: "'Open Sans', sans-serif", weight: '700' },
  { value: 'Lato', label: 'Lato', family: 'Lato, sans-serif' },
  { value: 'Lato Bold', label: 'Lato Bold', family: 'Lato, sans-serif', weight: '700' },
  { value: 'Montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'Montserrat Bold', label: 'Montserrat Bold', family: 'Montserrat, sans-serif', weight: '700' },
  { value: 'Poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'Poppins Bold', label: 'Poppins Bold', family: 'Poppins, sans-serif', weight: '700' },
  { value: 'Nunito', label: 'Nunito', family: 'Nunito, sans-serif' },
  { value: 'Nunito Bold', label: 'Nunito Bold', family: 'Nunito, sans-serif', weight: '700' },
  { value: 'Raleway', label: 'Raleway', family: 'Raleway, sans-serif' },
  { value: 'Raleway Bold', label: 'Raleway Bold', family: 'Raleway, sans-serif', weight: '700' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
  { value: 'Ubuntu', label: 'Ubuntu', family: 'Ubuntu, sans-serif' },
  { value: 'Ubuntu Bold', label: 'Ubuntu Bold', family: 'Ubuntu, sans-serif', weight: '700' },
  { value: 'Work Sans', label: 'Work Sans', family: "'Work Sans', sans-serif" },
  { value: 'Work Sans Bold', label: 'Work Sans Bold', family: "'Work Sans', sans-serif", weight: '700' },
  { value: 'DM Sans', label: 'DM Sans', family: "'DM Sans', sans-serif" },
  { value: 'DM Sans Bold', label: 'DM Sans Bold', family: "'DM Sans', sans-serif", weight: '700' },
  { value: 'Manrope', label: 'Manrope', family: 'Manrope, sans-serif' },
  { value: 'Outfit', label: 'Outfit', family: 'Outfit, sans-serif' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { value: 'Space Grotesk', label: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { value: 'Quicksand', label: 'Quicksand', family: 'Quicksand, sans-serif' },
  { value: 'Lexend', label: 'Lexend', family: 'Lexend, sans-serif' },
  { value: 'Figtree', label: 'Figtree', family: 'Figtree, sans-serif' },
  { value: 'Barlow', label: 'Barlow', family: 'Barlow, sans-serif' },
  { value: 'Exo 2', label: 'Exo 2', family: "'Exo 2', sans-serif" },
  { value: 'Karla', label: 'Karla', family: 'Karla, sans-serif' },
  { value: 'Rubik', label: 'Rubik', family: 'Rubik, sans-serif' },
  { value: 'Mulish', label: 'Mulish', family: 'Mulish, sans-serif' },
  { value: 'Josefin Sans', label: 'Josefin Sans', family: "'Josefin Sans', sans-serif" },
  { value: 'Noto Sans', label: 'Noto Sans', family: "'Noto Sans', sans-serif" },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans', family: "'IBM Plex Sans', sans-serif" },
  { value: 'Cabin', label: 'Cabin', family: 'Cabin, sans-serif' },
  { value: 'Asap', label: 'Asap', family: 'Asap, sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', family: "'Playfair Display', serif" },
  { value: 'Playfair Display Bold', label: 'Playfair Display Bold', family: "'Playfair Display', serif", weight: '700' },
  { value: 'Merriweather', label: 'Merriweather', family: 'Merriweather, serif' },
  { value: 'Merriweather Bold', label: 'Merriweather Bold', family: 'Merriweather, serif', weight: '700' },
  { value: 'Lora', label: 'Lora', family: 'Lora, serif' },
  { value: 'Crimson Text', label: 'Crimson Text', family: "'Crimson Text', serif" },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
  { value: 'PT Serif', label: 'PT Serif', family: "'PT Serif', serif" },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', family: "'Source Serif Pro', serif" },
  { value: 'EB Garamond', label: 'EB Garamond', family: "'EB Garamond', serif" },
  { value: 'Bitter', label: 'Bitter', family: 'Bitter, serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
  { value: 'Cormorant Garamond Bold', label: 'Cormorant Garamond Bold', family: "'Cormorant Garamond', serif", weight: '700' },
  { value: 'Kalam', label: 'Kalam', family: 'Kalam, cursive' },
  { value: 'Caveat', label: 'Caveat', family: 'Caveat, cursive' },
  { value: 'Dancing Script', label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { value: 'Pacifico', label: 'Pacifico', family: 'Pacifico, cursive' },
  { value: 'Satisfy', label: 'Satisfy', family: 'Satisfy, cursive' },
  { value: 'Shadows Into Light', label: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { value: 'Permanent Marker', label: 'Permanent Marker', family: "'Permanent Marker', cursive" },
  { value: 'Indie Flower', label: 'Indie Flower', family: "'Indie Flower', cursive" },
  { value: 'Amatic SC', label: 'Amatic SC', family: "'Amatic SC', cursive" },
  { value: 'Comfortaa', label: 'Comfortaa', family: 'Comfortaa, cursive' },
  { value: 'Courgette', label: 'Courgette', family: 'Courgette, cursive' },
  { value: 'Sacramento', label: 'Sacramento', family: 'Sacramento, cursive' },
  { value: 'Yellowtail', label: 'Yellowtail', family: 'Yellowtail, cursive' },
  { value: 'Lobster', label: 'Lobster', family: 'Lobster, cursive' },
  { value: 'Fira Code', label: 'Fira Code', family: "'Fira Code', monospace" },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { value: 'Source Code Pro', label: 'Source Code Pro', family: "'Source Code Pro', monospace" },
  { value: 'Roboto Mono', label: 'Roboto Mono', family: "'Roboto Mono', monospace" },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace" },
];

export const DEFAULT_FONT_VALUE = 'Inter';

/**
 * Bundled RN font faces (via `@expo-google-fonts/*`, loaded in `App.tsx`).
 * Only these values render in their real typeface natively; everything
 * else in `MOBILE_FONT_OPTIONS` still lists correctly for parity with web
 * and falls back to a same-category system font (see `fallbackFamilyFor`).
 */
export const LOADED_FONT_FAMILIES: Record<string, { regular: string; bold?: string }> = {
  Inter: { regular: 'Inter_400Regular', bold: 'Inter_700Bold' },
  Roboto: { regular: 'Roboto_400Regular', bold: 'Roboto_700Bold' },
  'Roboto Bold': { regular: 'Roboto_700Bold' },
  'Open Sans': { regular: 'OpenSans_400Regular', bold: 'OpenSans_700Bold' },
  'Open Sans Bold': { regular: 'OpenSans_700Bold' },
  Lato: { regular: 'Lato_400Regular', bold: 'Lato_700Bold' },
  'Lato Bold': { regular: 'Lato_700Bold' },
  Montserrat: { regular: 'Montserrat_400Regular', bold: 'Montserrat_700Bold' },
  'Montserrat Bold': { regular: 'Montserrat_700Bold' },
  Poppins: { regular: 'Poppins_400Regular', bold: 'Poppins_700Bold' },
  'Poppins Bold': { regular: 'Poppins_700Bold' },
  Nunito: { regular: 'Nunito_400Regular', bold: 'Nunito_700Bold' },
  'Nunito Bold': { regular: 'Nunito_700Bold' },
  Raleway: { regular: 'Raleway_400Regular', bold: 'Raleway_700Bold' },
  'Raleway Bold': { regular: 'Raleway_700Bold' },
  Ubuntu: { regular: 'Ubuntu_400Regular', bold: 'Ubuntu_700Bold' },
  'Ubuntu Bold': { regular: 'Ubuntu_700Bold' },
  'Work Sans': { regular: 'WorkSans_400Regular', bold: 'WorkSans_700Bold' },
  'Work Sans Bold': { regular: 'WorkSans_700Bold' },
  'DM Sans': { regular: 'DMSans_400Regular', bold: 'DMSans_700Bold' },
  'DM Sans Bold': { regular: 'DMSans_700Bold' },
  'Plus Jakarta Sans': { regular: 'PlusJakartaSans_400Regular', bold: 'PlusJakartaSans_700Bold' },
  'Playfair Display': { regular: 'PlayfairDisplay_400Regular', bold: 'PlayfairDisplay_700Bold' },
  'Playfair Display Bold': { regular: 'PlayfairDisplay_700Bold' },
  Merriweather: { regular: 'Merriweather_400Regular', bold: 'Merriweather_700Bold' },
  'Merriweather Bold': { regular: 'Merriweather_700Bold' },
  'Cormorant Garamond': { regular: 'Cormorant_600SemiBold', bold: 'Cormorant_700Bold' },
  'Cormorant Garamond Bold': { regular: 'Cormorant_700Bold' },
};

function categoryFor(family: string): 'serif' | 'monospace' | 'cursive' | 'sans-serif' {
  const lower = family.toLowerCase();
  if (lower.includes('serif') && !lower.includes('sans-serif')) return 'serif';
  if (lower.includes('monospace')) return 'monospace';
  if (lower.includes('cursive')) return 'cursive';
  return 'sans-serif';
}

/** Native `fontFamily` to apply to RN `Text` for a given web font value + weight. */
export function resolveNativeFontFamily(value: string | null | undefined, bold = false): string | undefined {
  const opt = MOBILE_FONT_OPTIONS.find((f) => f.value === value) || MOBILE_FONT_OPTIONS[0];
  const loaded = LOADED_FONT_FAMILIES[opt.value];
  if (loaded) {
    if (bold && loaded.bold) return loaded.bold;
    return loaded.regular;
  }
  // Fall back to a bundled font in the same category so the change is still visible.
  const category = categoryFor(opt.family);
  if (category === 'serif') return bold ? 'PlayfairDisplay_700Bold' : 'PlayfairDisplay_400Regular';
  if (category === 'monospace') return undefined; // system monospace
  if (category === 'cursive') return bold ? 'Cormorant_700Bold' : 'Cormorant_600SemiBold';
  return bold ? 'Inter_700Bold' : 'Inter_400Regular';
}

export function findFontOption(value: string | null | undefined): FontOption {
  return MOBILE_FONT_OPTIONS.find((f) => f.value === value) || MOBILE_FONT_OPTIONS[0];
}
