# Tukua Mobile — project summary

Last updated: 2026-07-27

> **Monorepo hub skill:** `tukua-main-skill` (alias `/cbe`) → [`.cursor/skills/tukua-main-skill/modules/tukua-mobile.md`](../../.cursor/skills/tukua-main-skill/modules/tukua-mobile.md)  
> Run with Desk/web: repo root `npm run dev:all` (Expo + proxy included).

## What this app is

**tukua-mobile** is the Expo / React Native shell for Tukua (parents, students, teachers).  
Auth & Chat / Courses / Profile use **Supabase + WebViews** of the Yana web SPA.  
School ERP (fees, library, discipline, events, teachers, school info) uses the **Yana Desk Nest API** embedded in Electron (`desktop/packages/api`).

Sibling product: **yana** at `D:\GithubDesktop\yana` (Desk Electron + Nest + frontend).

---

## Moving this folder into yana — agent history?

| What | Survives a cut/copy into `yana/mobile`? |
|------|----------------------------------------|
| **Git commits** for tukua-mobile | Only if you keep the same git remote / subtree / submodule history. A plain folder copy starts fresh unless you preserve `.git` or use `git subtree`. |
| **Cursor chat / agent transcripts** | Bound to the **Cursor project / workspace path**, not the folder name alone. Moving the folder usually means a **new workspace** → prior chats stay under the old project id in Cursor’s data (you can still open old transcripts from the previous workspace). They do **not** auto-migrate into the new yana workspace. |
| **`.cursor/skills`, rules** | Yes — they travel with the files if you copy the folder. |
| **Local env (`.env`)** | Copy carefully; do not commit secrets. Prefer `.env.example`. |

**Recommended monorepo shape** (same idea as `yana/desktop`):

```
yana/
  desktop/          # Electron + Nest + desk SPA  → push to yana remote
  mobile/           # this Expo app               → push to tukua-mobile remote
                    # (submodule / subtree / sparse) OR gitignore mobile in yana
```

One agent can open the parent `yana` folder and edit both; push each app to its own remote. Cursor history is per workspace — open the old tukua-mobile workspace if you need prior threads.

---

## Design skill

| | |
|--|--|
| **Attach name** | `/design` |
| **Skill id** | `design` |
| **Path** | `.cursor/skills/design/SKILL.md` |

Covers: liquid glass canvas, `GlassPanel`, floating header fade, **always-hidden status bar** (`ImmersiveSystemBars` / `hideSystemStatusBar`), AI bottom tab (`AiTabIcon` — **star only**), biometrics notes, module scroll bottom pad.

API skill: `.cursor/skills/tukua-yana-api/SKILL.md` (Desk Nest parent routes).

---

## File structure (high level)

```
tukua-mobile/
├── App.tsx                         # Providers + ImmersiveSystemBars
├── app.json                        # statusBar.hidden, biometrics perms
├── .cursor/skills/
│   ├── design/SKILL.md             # /design
│   └── tukua-yana-api/SKILL.md
├── scripts/
│   ├── start-dev.mjs               # Desk LAN proxy :3255 + Expo
│   └── desk-lan-proxy.mjs
├── docs/                           # YANA_API.md etc.
└── src/
    ├── components/
    │   ├── ImmersiveSystemBars.tsx
    │   ├── dashboard/              # Glass, LiquidGlass, GreenPattern
    │   ├── navigation/             # NativeAppHeader, AiTabIcon, TokenBalancePill
    │   └── auth/
    ├── constants/layout.ts         # floatingHeaderInset, moduleScrollBottomPad
    ├── context/                    # Auth, DeskAuth, Dialog, WebViewControl
    ├── lib/
    │   ├── deskApi.ts              # Nest JWT + X-Desk-School/Student-Id
    │   ├── parentPortalApi.ts
    │   ├── biometrics.ts
    │   └── parentTransportDummy.ts
    ├── navigation/                 # AppNavigator, MainTabs (AI/Courses/Dashboard/Profile)
    ├── screens/
    │   ├── LoginScreen.tsx         # Password + biometric (auto-prompt)
    │   ├── WebAppScreen.tsx        # Chat/Courses/Profile WebViews
    │   └── dashboard/              # Home + module screens
    └── theme/yana.ts
```

Desk Nest changes live under **yana**, e.g.:

- `desktop/apps/electron/.../sqlite-local.service.ts` — event RSVP/payment tables  
- `desktop/packages/api/src/modules/events/` — RSVP + pay  
- `desktop/packages/api/src/modules/parents/` — assessments default Closed, seed-demo  
- `desktop/packages/api/src/modules/discipline/` — parent list + `X-Desk-Student-Id` filter  

---

## Auth & ports

| Layer | Role |
|-------|------|
| Supabase | Login, Chat, Courses, Profile WebViews |
| Nest Desk JWT | ERP parent portal (`/parents/me/*`, events, discipline) |

| Port | Service |
|------|---------|
| 3251 | Electron Nest (often localhost-only) |
| 3255 | LAN proxy → 3251 (`npm start` / `desk:proxy`) |
| 8081 | Expo Metro |
| 8080 | Web SPA (local) |

Env: `EXPO_PUBLIC_DESK_API_URL`, `EXPO_PUBLIC_WEB_URL`, Supabase keys.

---

## Bottom nav

| Tab label | Route name | Content |
|-----------|------------|---------|
| **AI** | `Chat` | WebView `/chat` — star icon, grow pulse, purple→white→red when focused |
| Courses | `Courses` | WebView `/courses` |
| Dashboard | `Dashboard` | Native stack (home + modules) |
| Profile | `Profile` | WebView `/profile` |

---

## Parent dashboard modules

| Screen | Notes |
|--------|--------|
| School Info | Parent-safe: phone, map/directions, site `username.tukua.ai` — no BOM / principal phone / username field |
| Assessments | Year + exam dropdowns; Nest defaults to latest **Closed** exam |
| Library | Tabs: Borrowed / Returned / Not returned / Fines |
| Discipline | Child-scoped via **`X-Desk-Student-Id`** (not `?student_id=` — ValidationPipe rejects unknown query keys) |
| Events | Calendar, RSVP, payable tab; Nest pay/rsvp + seed |
| Accounts | Dashboard-style green **balance card**; receipts with **View** + download/share |
| Teachers | Workload list + tip placeholder |
| Transport | UI-only: live map + trip history/route |

Seed empty demos: `POST /parents/me/seed-demo`.

---

## Status bar

Always hidden. Android WebView and biometric sheets re-show it — re-apply via poll, AppState, tab focus, WebView `onLoadEnd`.  
**Never** `StatusBar.setHidden(false)` in feature cleanup (that caused the “bar came back” bug).

---

## Biometrics

1. Password login caches password → optional enable modal (`BiometricGate`).  
2. Login screen fingerprint / auto-prompt → same Nest-then-Supabase path as password.  
3. After LocalAuthentication, call `hideSystemStatusBar()`.

---

## Dev tips

1. Start Desk Electron, then `npm start` in tukua-mobile (proxy + Expo).  
2. After Nest/schema changes, **restart Electron**.  
3. Soft Nest reconnect needs one password login to store credentials.  
4. Attach **`/design`** when changing native UI.
