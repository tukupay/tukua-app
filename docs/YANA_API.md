# Yana / Tukua API Reference

Source project: `D:\GithubDesktop\yana`  
Mobile app uses Supabase Auth (email/password) + edge functions for wallets and location sync.

## Environment

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://twnzlkcdhiotdgoclsib.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT |
| `EXPO_PUBLIC_WEB_URL` | Yana web SPA (`http://localhost:8080` in dev; Chat/Register WebViews) |
| `EXPO_PUBLIC_DESK_API_URL` | Nest desk API base (`…/api`). Host is env-only — not hardcoded to a cloud vendor. |
| `EXPO_PUBLIC_TUKUA_WEB_URL` | Alias of `EXPO_PUBLIC_WEB_URL` (legacy) |
| Supabase (cbe) | `https://jltzzevsnxxroylmwyna.supabase.co` (tukua-staging) — must match Nest |

## Authentication

### Email login (primary — mobile)

Uses Supabase Auth SDK:

```typescript
supabase.auth.signInWithPassword({ email, password })
```

**Response:** `{ data: { user, session }, error }`  
**Session fields:** `access_token`, `refresh_token`, `user.id`, `user.email`

**Yana reference:** `yana/src/pages/SignIn.tsx`

### Registration

```typescript
supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name,
      first_name,
      last_name,
      role: 'user',
      account_type: 'individual' | 'organization',
      phone,
      county,
    },
  },
})
```

**Yana reference:** `yana/src/pages/Register.tsx`

### Forgot password

```
POST {SUPABASE_URL}/functions/v1/send-password-reset
Body: { "email": "user@example.com" }
Response: { "success": true }
```

### Phone / TukuPay login (legacy)

```
POST https://test.api.tuku.money/api/v1/auth/login
Body: { phone_number, password }
Response: { access_token, refresh_token, token_type }
```

Then sync user:

```
POST {SUPABASE_URL}/functions/v1/sync-tukupay-user
Body: { access_token, location?: UserLocation }
```

**Yana reference:** `yana/src/lib/tukupay.ts`, `yana/supabase/functions/sync-tukupay-user/index.ts`

### Iframe / mobile session

```
POST {SUPABASE_URL}/functions/v1/iframe-login
Body: { phone_number, password }
```

## Location storage

### GPS (first TukuPay login)

Sent to `sync-tukupay-user` as:

```json
{
  "latitude": 0,
  "longitude": 0,
  "accuracy": 0,
  "city": "Nairobi",
  "country": "Kenya",
  "timestamp": "2026-06-13T12:00:00.000Z"
}
```

Stored on `users` table (first login only):

| Column | Type |
|--------|------|
| `first_login_latitude` | double precision |
| `first_login_longitude` | double precision |
| `first_login_city` | text |
| `first_login_country` | text |
| `first_login_at` | timestamptz |

### County (Supabase registration)

Stored on `profiles.county` (manual selection during register).

**Yana reference:** `yana/src/lib/geolocation.ts`, migration `20260521130000_full_reset_and_seed.sql`

## Wallets / Savings

No dedicated savings API. Wallets fetched via proxy:

```
POST {SUPABASE_URL}/functions/v1/tukupay-proxy
Body: {
  "endpoint_name": "list_wallets",
  "parameters": {},
  "access_token": "<tukupay_bearer_token>"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "wallets": [{
      "id", "name", "wallet_type", "balance", "currency",
      "is_active", "is_primary", "is_tukupay_wallet", "alias"
    }],
    "total", "size", "page", "has_more"
  }
}
```

**Yana reference:** `yana/src/lib/walletService.ts`

## Token storage (mobile)

| Key | Storage | Contents |
|-----|---------|----------|
| Supabase session | `expo-secure-store` | `{ access_token, refresh_token }` |
| User profile cache | `expo-secure-store` | JSON user + profile |
| Biometric opt-in | `expo-secure-store` | refresh token for fingerprint login |

## WebView routes (Yana web app)

| Screen | Path |
|--------|------|
| Chat | `/chat` |
| Opportunities | `/opportunities` |
| Profile | `/profile` |
| Courses | `/courses` |

Base URL: `EXPO_PUBLIC_TUKUA_WEB_URL` (default `https://tukua.ai`)

## Permissions required (mobile)

- **Location** — first-login GPS sync
- **Camera** — KYC / document capture
- **Files** — document picker, downloads
- **Audio** — voice features in web app
- **Biometrics** — fingerprint login

---

## Mobile app architecture (Tukua)

The mobile app is a **native shell** around the Tukua web product at `tukua.ai`. It does not replicate the old TukuPay wallet dashboard.

### Auth flow

```
LoginScreen / RegisterScreen (native, Yana-branded)
        ↓ Supabase signInWithPassword / signUp
MainTabs (native bottom nav)
        ↓ WebView + session injection
Yana routes: /chat | /courses | /profile
Dashboard tab: native role UI (parent / student / teacher / school_admin) via Nest desk API
```

## Desk NestJS (school ERP)

Source: `D:\GithubDesktop\yana\desktop`  
Default base: `EXPO_PUBLIC_DESK_API_URL` = `http://localhost:3253/api`

| Runtime | What to use |
|---------|-------------|
| Expo Go on phone | Auto-rewrites `localhost` → Metro LAN IP (same Wi‑Fi as Nest) |
| Android emulator | Falls back to `10.0.2.2` if no Expo host |
| iOS simulator | `localhost` OK |
| Production | Set `EXPO_PUBLIC_DESK_API_URL` to the hosted HTTPS API |

**Mobile login (dev):** `POST /auth/login` against Nest is primary. Nest may also return `supabase_access_token` / `supabase_refresh_token` for Chat WebView.

Auth header: `Authorization: Bearer <desk_jwt>` · `GET /auth/me`  
Roles: `parent`, `student`, `teacher`, `school_admin`, `super_admin`, …  
Unknown roles → **student**; school-linked unknowns → school admin hub.

**Parent portal Nest (`/parents/me/*`)** — shared Desk SPA + mobile. Doc: yana `desktop/docs/PARENT_MOBILE_PORTAL.md`.

| Path | Purpose |
|------|---------|
| `GET /parents/me/children` | Children + co-parents (masked phones) |
| `GET /parents/me/school` | School profile |
| `GET /parents/me/children/:id/teachers` | Class teachers from workload |
| `GET /parents/me/exams` | Exam list |
| `GET /parents/me/assessment-reports` | Report cards |
| `GET /parents/me/library-statement` | Loans / fines |
| `GET /parents/me/accounts-statement` | Fees / receipts |
| `GET /parents/me/pocket-money` | Wallet balances |
| `POST /parents/me/seed-demo` | Safe demo seed |

Local default: `http://localhost:3253/api`. Railway later via yana deploy skill.

Bottom tabs: Chat · Courses · **Dashboard** · Profile (Dashboard replaced About/info).

Mobile files: `src/lib/deskApi.ts`, `src/lib/parentPortalApi.ts`, `src/lib/deskRoles.ts`, `src/context/DeskAuthContext.tsx`, `src/screens/dashboard/*`

**Key files:**

| File | Purpose |
|------|---------|
| `src/screens/LoginScreen.tsx` | Email login, biometric button, Telegram link |
| `src/screens/WebRegisterScreen.tsx` | WebView registration |
| `src/screens/WebAppScreen.tsx` | WebView with Supabase session injection |
| `src/components/navigation/NativeAppHeader.tsx` | Native sign-out + user chip |
| `src/navigation/MainTabs.tsx` | Post-login tabs; Dashboard stack |
| `src/lib/webviewAuth.ts` | Injects tokens into WebView `localStorage` |
| `src/lib/biometrics.ts` | Quick login + post-login enable sheet |
| `src/components/landing/ModernBackground.tsx` | Green dot/hex SVG (from Yana) |
| `src/theme/yana.ts` | Brand tokens (`#1F8B4C` primary) |

### Landing UI (matches Yana web)

- **Green background** — `ModernBackground` SVG dot + hex pattern with soft gradient orbs
- **Orange wave** — `assets/images/curve2.png` anchored **bottom-left** on login/register
- **Glass card** — frosted auth card with Tukua logo (`GlassAuthCard`)
- **eCitizen** — shown as "Coming Soon" (same as Yana SignIn)

### Biometrics (TukuPay Flutter pattern)

After first successful login, `BiometricSetupModal` asks **"Enable Quick Login?"** (mirrors `biometrics_provider.dart` in tukupay-mobile). Credentials (email + password) are stored in `expo-secure-store` when the user opts in. Login screen shows an orange fingerprint button when biometrics are available.

### WebView session

On load, `WebAppScreen` runs injected JS to set the Supabase auth token in `localStorage`. Native tabs handle section navigation; the web toolbar was removed. Sign-out is native (`NativeAppHeader`) and intercepts web redirects to `/sign-in`, `/login`, or `/logout`.

### Registration gaps (mobile vs web)

Yana web registration includes a **KES 50 M-Pesa PEA payment** (`gw-init` / `mpesa-check-status`) before account creation. Mobile register currently skips this gate — users created on mobile go straight to Supabase sign-up. Implement PEA flow before production parity.
