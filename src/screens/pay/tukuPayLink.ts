/**
 * TukuPay onboarding + account linking (owner, 2026-11-07: identity checks belong in the TukuPay app,
 * not in Tukua). People register and verify their ID in TukuPay, then link that profile to Tukua.
 *
 * Facts from the TukuPay repo (read only): Android package / iOS bundle `com.app.tuku`, URL scheme
 * `tukupay://`, Play listing below, no App Store listing yet. TukuPay has a partner gateway
 * (`/dev/v1`, HMAC-signed, consent code → customer id, `kyc_verified` on `GET /dev/v1/customers/:id`),
 * but no "link code" a person can type into a partner app. The proposal for the TukuPay team is in
 * docs/tukupay-linking-proposal.md.
 */
import { Linking, Platform } from 'react-native';

export const TUKUPAY_ANDROID_PACKAGE = 'com.app.tuku';
export const TUKUPAY_PLAY_URL = `https://play.google.com/store/apps/details?id=${TUKUPAY_ANDROID_PACKAGE}`;
const TUKUPAY_PLAY_MARKET = `market://details?id=${TUKUPAY_ANDROID_PACKAGE}`;
/** No App Store listing yet (TukuPay web falls back to a store search too). */
export const TUKUPAY_APP_STORE_URL = 'https://apps.apple.com/ke/search?term=TukuPay';
/** TukuPay's expo-router screen for sign-up; the app opens its welcome screen if the path is unknown. */
const TUKUPAY_REGISTER_DEEP_LINK = 'tukupay://register';

/** Open the TukuPay listing in the store (Play app first on Android, then the web page). */
export async function openTukuPayStore(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(TUKUPAY_PLAY_MARKET);
      return;
    } catch {
      /* no Play Store app: web listing below */
    }
  }
  await Linking.openURL(Platform.OS === 'ios' ? TUKUPAY_APP_STORE_URL : TUKUPAY_PLAY_URL);
}

/**
 * Open TukuPay at sign-up when it is installed; otherwise the store. Returns false when it fell back
 * to the store. (canOpenURL needs a manifest query on Android 11+, so we just try to open it.)
 */
export async function openTukuPayOnboarding(): Promise<boolean> {
  try {
    await Linking.openURL(TUKUPAY_REGISTER_DEEP_LINK);
    return true;
  } catch {
    await openTukuPayStore();
    return false;
  }
}

/** Codes are shown in TukuPay as e.g. "TK-4F7Q-92": letters and digits, dashes and spaces ignored. */
export function normalizeLinkCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isPlausibleLinkCode(raw: string): boolean {
  const c = normalizeLinkCode(raw);
  return c.length >= 6 && c.length <= 12;
}

export type TukuPayLinkResult =
  | { status: 'linked'; customerId: string; kycVerified: boolean }
  | { status: 'invalid'; message: string }
  | { status: 'coming_soon' };

/** True once Tukua's API has the link route below. Flip this (no other change) when it ships. */
export const TUKUPAY_LINKING_LIVE = false;

/**
 * Link the signed-in Tukua user to their TukuPay profile with the one-time code TukuPay shows them.
 *
 * TODO(tukupay-linking): no server route exists yet, on either side. Planned shape (see
 * docs/tukupay-linking-proposal.md): Tukua mobile → `POST /tukupay/link { code }` on Tukua's Nest API,
 * which redeems the code with TukuPay's gateway server-to-server (signed, never from the phone) and
 * stores the customer id + kyc_verified. Until then this resolves to `coming_soon` and sends nothing.
 */
export async function linkTukuPayProfile(code: string): Promise<TukuPayLinkResult> {
  const normalized = normalizeLinkCode(code);
  if (!isPlausibleLinkCode(normalized)) {
    return { status: 'invalid', message: 'Enter the 6 to 12 character code shown in TukuPay.' };
  }
  if (!TUKUPAY_LINKING_LIVE) return { status: 'coming_soon' };
  // When live:
  // const res = await deskFetch<{ customer_id: string; kyc_verified: boolean }>('/tukupay/link', {
  //   method: 'POST', body: JSON.stringify({ code: normalized }) });
  // return { status: 'linked', customerId: res.customer_id, kycVerified: Boolean(res.kyc_verified) };
  return { status: 'coming_soon' };
}
