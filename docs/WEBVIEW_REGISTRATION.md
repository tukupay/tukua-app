# WebView (iframe) Registration

Registration in the app is now the **canonical web `/register` flow rendered inside a WebView**, not a native form. The native form is retired because it ran a second, parallel sign-up + M‑Pesa PEA implementation that drifted from the web and caused real production bugs.

## Why we changed it

The old native flow (`screens/RegisterScreen.tsx` + `lib/peaRegistrationFlow.ts`) had two serious problems:

1. **It let people in without paying.** The "Remind me later — save without paying now" button called `supabase.auth.signUp(...)`, which auto-creates a **logged-in session**. So users could enter the app without completing the one-time Phone Activation (PEA) fee.
2. **Identity mix-ups.** The screen kept name/email/phone in React state that only reset on a fresh mount. On a shared device (or after an abandoned attempt), leftover name/email could be paired with a *different* person's phone at payment time, producing accounts where the phone owner is not the named person. It also failed to reliably log `ai_registration_attempts` (silent RLS failure under the anon key), so there was no audit trail.

Routing the whole flow through the web `/register` page makes the **web the single source of truth**: proper attempt logging, correct payment→identity binding, and one PEA implementation to maintain.

## How it works

`screens/WebRegisterScreen.tsx` renders a `WebView` that loads the Tukua SPA shell and drives it to `/register`. When the web flow finishes and establishes a Supabase session, the app **adopts that session** and the root navigator automatically switches to the authenticated tabs.

Flow:

1. WebView loads `tukuaSpaShellUrl()` (`https://tukua.ai/`).
2. `injectedJavaScriptBeforeContentLoaded` runs `buildRegisterPreloadScript()`:
   - Clears any stale web session **once** (so a previously cached user is not bounced straight to `/chat`).
   - Forces **web** app-source (see the flicker note below).
3. On load, `buildRegisterWatchScript('/register')`:
   - Client-navigates the SPA to `/register`.
   - Installs a 1s poller that watches `localStorage['sb-<project>-auth-token']` and posts `TUKUA_SESSION_UPDATED` back to native the moment a valid session appears (after sign-up / sign-in).
4. `WebRegisterScreen` receives `TUKUA_SESSION_UPDATED` and calls `applyWebSessionTokens(access, refresh)` → `supabase.auth.setSession(...)`.
5. `AuthContext.onAuthStateChange` fires `SIGNED_IN` → `isAuthenticated` becomes true → `AppNavigator` unmounts the WebView and shows `MainTabs`.

Because the "sign in" link on the web `/register` page also lives in the same WebView, web-side login works too and is adopted the same way.

## The `/chat` "flickering" fix

The web app has a `MobileAppRouteGuard` that redirects any non‑app route (including `/register`) to `/chat` **whenever the page is tagged as `mobile_app`**. The first version of the registration preload tagged the page as `mobile_app`, so `/register` was bounced to `/chat` and back — the flicker.

Fix: `buildRegisterPreloadScript()` now sets app-source to **`web`** (`TUKUA_APP_SOURCE_WEB`). The registration WebView therefore behaves like a normal browser and stays on `/register`. The app only re-tags itself as `mobile_app` later, inside `WebAppScreen` (the real authenticated tabs), which is where mobile-specific chrome is wanted.

## Files

- `src/screens/WebRegisterScreen.tsx` — **new**. The WebView registration screen (loads web `/register`, adopts the resulting session, has a back button to Login).
- `src/lib/webviewAuth.ts` — **added** `buildRegisterPreloadScript()` and `buildRegisterWatchScript()`.
- `src/navigation/AppNavigator.tsx` — the `Register` route now renders `WebRegisterScreen`.

Retired (kept in the repo but no longer routed to):

- `src/screens/RegisterScreen.tsx`
- `src/lib/peaRegistrationFlow.ts`

These can be deleted once we're confident nothing else imports them.

## Activation steps covered by the iframe

Because the WebView renders the real web `/register` route, **every step of activation happens inside the iframe** — nothing is reimplemented natively:

1. **Choose account type** — Individual or Organisation Partner.
2. **Enter details** — full name, country, phone (+ dial code), National ID (optional), county, email, password (org fields when applicable).
3. **Phone Activation (PEA) payment (Kenya)** — tapping *Complete registration — KES 950* calls the `gw-init` edge function, which sends a BankGPT/M‑Pesa **STK push** to the phone.
4. **Confirm on phone** — the user enters their M‑Pesa PIN. BankGPT processes it and calls back `gw-result`, which marks the transaction `completed` and grants the PEA starter tokens.
5. **Account creation** — the web polls `mpesa-check-status`; on success `pea-complete-signup` creates the account and signs the user in.
6. **Session hand‑off** — the new Supabase session lands in the WebView `localStorage`; the native watcher captures it and the app switches to the authenticated tabs.

There is also a *Remind me later* path that saves the account unpaid (activation completed later on sign‑in).

> Note: confirmation currently depends on the BankGPT **webhook** to `gw-result`. If that callback never arrives, the transaction stays `pending` even though the money was taken. A reconciliation query against BankGPT (not just waiting for the callback) is tracked separately.

## Web-side responsive fixes (in the `yana` repo)

Some responsiveness lives in the web `/register` page itself (rendered in the iframe), so it was fixed in `yana`, not here:

- **Phone + country code on one line on mobile** — `src/components/ui/PhoneInput.tsx` now uses `flex-row` at all widths with a compact dial-code chip (was stacking on mobile).
- **`Complete registration` / `Remind me later` buttons responsive** — `src/pages/Register.tsx` buttons now wrap/scale (`h-auto`, `whitespace-normal`, smaller mobile font) instead of a fixed single-line height.

## Mobile styling

`buildRegisterCosmeticsScript()` is injected into the register WebView (once; the `<style>` persists in `<head>` across SPA route changes) to make the page feel native:

- Hides the web top nav (`[data-tukua-top-nav]` / `.glass-nav`), the events ticker, `<footer>`, and the floating mobile bottom-nav pill (the native screen has its own header/back button).
- Removes the large top gap that used to clear the fixed web nav.
- Elevates the form card (`.glass-panel`) into a rounded, shadowed mobile sheet.
- Enlarges tap targets: inputs/buttons ≥46px, primary/full-width buttons ≥50px and full width, 16px input font to stop iOS zoom-on-focus.

## Requirements / assumptions

- Web routes `/register` and `/sign-in` exist and are SPA client routes.
- The app and web point at the same Supabase project (`twnzlkcdhiotdgoclsib`), so the session token key matches.
- The web `/register` PEA flow signs the user in on success (no mandatory email confirmation), so a session appears for the watcher to capture.
