---
name: design
description: >-
  Tukua mobile UI design system — liquid glass canvas, elevated cards, floating
  transparent header fade, hidden system status bar, dashboard icon grids, AI
  bottom-nav tab, and student picker patterns. Use when building or restyling
  native screens, GlassPanel cards, dashboards, WebView chrome, or when the user
  mentions design, glass, liquid UI, or visual standards. Attach with /design.
---

# Tukua Mobile Design

**Skill id / attach name:** `design` → use **`/design`** in Cursor.  
Path: `.cursor/skills/design/SKILL.md`

Apply these standards for all native UI work in `tukua-mobile`. Prefer existing components over reinventing.

## Core surfaces

| Surface | Component / pattern |
|---------|---------------------|
| Light liquid page bg | `DashboardBackground` with `liquid` → `LiquidGlassBackdrop` |
| Dark green pattern (auth / buttons) | `GreenPattern` |
| Glass cards / sections | `GlassPanel` from `src/components/dashboard/Glass.tsx` |
| Module list cards | `ModuleGlassCard` / `ModuleEmpty` |
| AI bottom tab | `AiTabIcon` — purple→white→red gradient + grow pulse |

### Liquid canvas (required for glass)

- Glass morphism needs a **light** animated backdrop — never put glass on solid dark green.
- Use colorful soft blobs (pink / purple / orange / blue / cream / green) + orange→green ribbon washes.
- Page root bg: `#FFFFFF` or `Colors.background`.

### Brand / hero colors

- Ink text: `Colors.ink`
- Muted text: `Colors.mutedForeground`
- Hero gradient (balances card): `#15411D` → `#006D69`
- Accent orange: `#EE7D13` / `Colors.orange`
- Icon ring: `#EDF1FD`
- AI tab gradient: `#7C3AED` → `#FFFFFF` → `#EF4444`

## Cards (`GlassPanel`)

**Rules:**
- **One** soft border only — never double stroke (no outer + inner border).
- Elevated: white fill + shadow + **one** soft border + `radius={16}`.
- Do **not** use BlurView for list/icon cards (Android draws a second rim).
- Selected state: `accentBorder="rgba(238,125,19,0.7)"` (replaces border — does not stack).
- Balance / hero card: green `GreenPattern` under content + elevated radius 16.

```tsx
<GlassPanel tone="frost" radius={16} accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}>
  …
</GlassPanel>
```

Do **not** put title/intro copy inside a glass card when plain text is enough (e.g. “Select student”).

## Top navbar (`NativeAppHeader`)

- Soft **dark-green fade** upward → transparent downward (not a solid bar).
- Compact pills; white icons/text on the fade.
- Shared across AI / Courses / Dashboard / Profile.

### WebView clearance (AI Chat / Profile / Courses)

- `WebAppScreen` uses **light** `paddingTop: floatingHeaderInset(insets.top)` so content clears the header.
- Spacer behind fade must be **white / light** — never `primaryDark` (that looked like a solid green bar).
- Container: `backgroundColor: Colors.white`.

## System status bar (always hidden)

- **Always hidden** via `ImmersiveSystemBars` + `hideSystemStatusBar()` (`src/components/ImmersiveSystemBars.tsx`).
- Mount on **splash and** main tree so the bar never flashes during font load.
- Re-hide on: `AppState` active, Android poll (~800ms), tab focus, WebView `onLoadEnd`, after biometric sheets.
- **Never** call `StatusBar.setHidden(false)` in feature code or in effect cleanup — Strict Mode remounts used to un-hide the bar and make it “come back”.
- `app.json` Android/iOS `statusBar.hidden` / `UIStatusBarHidden` must stay `true`.
- Pulling down notifications still reveals it temporarily — that is OS behavior.

## Bottom nav — AI tab

- Route may remain `Chat` for WebView path `/chat`; **label is `AI`**.
- Icon: `AiTabIcon` — **sparkles cluster** (large 4-point star left + two small on the right), no circle; cyan→purple→magenta gradient; soft grow pulse. Same footprint as other tab icons.

## Biometrics (login)

- Fingerprint / Face ID on login when credentials were enabled (`BiometricGate` after login + login fingerprint button).
- Password login caches password for later enable; biometric login must run the same Nest-then-Supabase path as password login.
- After LocalAuthentication dismisses, call `hideSystemStatusBar()` — the OS often restores the status bar.

## Dashboard

- Greeting + student/school context (name, class, admission, school) + avatar on liquid canvas.
- Role chip + tokens chip (plain, elevated).
- Balances in **solid** elevated green→teal gradient card using persona `*_HERO` stats.
- Module actions: **all** actions for the persona (never drop items like Bulk Pay); chunk into rows of 4.
- Equal columns (`flex: 1`), same circle size (`52`), fixed-height label box.
- Section titles sit **outside** glass; glass wraps the icon grid only (`frost`, `radius={16}`).
- Mix filled green / white outlined circles ok; keep sizes even.

## Student / school picker

- Same liquid backdrop + elevated `GlassPanel` cards.
- Title plain text: “Select student” / “Select school”.
- Short description under title — no glass card around the title block.
- Persist selection; switch via dashboard header icons.

## Module screens (Events, Assessments, …)

- `DashboardBackground patternOnly liquid`
- Dark ink headings / back chevrons (not white-on-dark).
- Content in `ModuleGlassCard` radius 16.
- Bottom scroll pad: `moduleScrollBottomPad(insets.bottom)` so content clears the tab bar.

## Do / don’t

| Do | Don’t |
|----|-------|
| Light liquid under glass | Glass on solid dark green |
| One elevated border + shadow | Double borders / stacked strokes |
| `radius={16}` cards | Sharp or inconsistent radii |
| Transparent header fade | Solid opaque navbar strip |
| White WebView top pad | Dark green WebView top pad |
| Keep status bar hidden; use `hideSystemStatusBar()` | `setHidden(false)` or skip re-hide after WebView/bio |
| AI tab with `AiTabIcon` | Plain chat bubble for AI |
| Equal 4-up icon grids | Uneven tile widths / label heights |

## Key files

- `src/components/dashboard/Glass.tsx`
- `src/components/dashboard/LiquidGlassBackdrop.tsx`
- `src/components/dashboard/DashboardBackground.tsx`
- `src/components/navigation/NativeAppHeader.tsx`
- `src/components/navigation/AiTabIcon.tsx`
- `src/components/ImmersiveSystemBars.tsx`
- `src/screens/WebAppScreen.tsx`
- `src/theme/yana.ts`
