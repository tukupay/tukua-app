---
name: tukua-yana-api
description: Yana/Tukua API reference for mobile auth, wallets, location, WebView routes, desk NestJS school roles, and role-based dashboards. Use when implementing login, registration, savings, school dashboards (parent/student/teacher/admin), or web app integration.
---

# Tukua ↔ Yana API

Full reference: [docs/YANA_API.md](../../docs/YANA_API.md)

Source project: `D:\GithubDesktop\yana`  
Desk (school ERP) source: `D:\GithubDesktop\yana\desktop`

## Quick reference — Tukua web (Supabase)

- **Login:** `supabase.auth.signInWithPassword({ email, password })`
- **Register:** `supabase.auth.signUp` with metadata (`full_name`, `county`, `account_type`)
- **Reset password:** `POST /functions/v1/send-password-reset`
- **Wallets:** `POST /functions/v1/tukupay-proxy` with `endpoint_name: list_wallets`
- **Location sync:** `POST /functions/v1/sync-tukupay-user` with GPS object
- **Login + Chat / Courses / Profile:** Direct Supabase (same as yana web). WebViews → `EXPO_PUBLIC_WEB_URL` (`:8080` local).
- **Dashboard only:** Nest desk API via `EXPO_PUBLIC_DESK_API_URL` (soft-connect after login). Token balance: `GET /comms/tokens/balance`.
- **Desk module UI:** WebViews of desk SPA `EXPO_PUBLIC_DESK_WEB_URL` (`:3250` local) with `auth_token` inject.
- **Supabase (cbe):** tukua-staging `jltzze…`. Inject key derived from URL (`sb-{ref}-auth-token`).

## Quick reference — Tukua web (Supabase)

School product lives under `yana/desktop`. Mobile dashboards call Nest (not Supabase) for school data.

### Base URL (Expo / localhost)

| Client | Base URL |
|--------|----------|
| Default / hosted | `EXPO_PUBLIC_DESK_API_URL` (env — any host) |
| Expo Go on phone | Auto: `localhost` → Metro LAN IP (see `src/lib/deskApi.ts`) |
| Android emulator | `10.0.2.2` if no Expo host |
| Production | Set real HTTPS URL later |

**Login (dev):** Nest `POST /auth/login` is the primary gate. Supabase chat tokens are optional when Nest returns them.

Auth header: `Authorization: Bearer <desk_jwt>`  
Me: `GET /auth/me`

### Parent-usable desk APIs (today)

**Live / parent-scoped (`/parents/me/*` — Desk Nest + mobile):**
- `GET /parents/me/children` — children + co-parents (phones masked)
- `GET /parents/me/school`
- `GET /parents/me/children/:studentId/teachers` — workload; phones masked
- `GET /parents/me/exams?academic_year=`
- `GET /parents/me/assessment-reports?exam_id=` — defaults to latest **Closed** exam
- `GET /parents/me/library-statement?student_id=`
- `GET /parents/me/accounts-statement?student_id=`
- `GET /parents/me/pocket-money?student_id=`
- `POST /parents/me/seed-demo` — wallets, library loans/fines, discipline cases, sample events
- `GET /discipline/incidents?student_id=` — children only (enriched with students)
- `GET /events?audience=parents&student_id=&payable_only=` — + RSVP/payment status
- `POST /events/:id/rsvp` — I will attend
- `POST /events/:id/pay` — payable trips (local desk payment record)
- `GET /schools/:id`

**UI-only / later:** transport (Desk + mobile dummy map + trip history until Nest transport module).

**Local testing:** `EXPO_PUBLIC_DESK_API_URL=http://localhost:3253/api` (default). Start yana desktop api-host yourself. Railway later via yana deploy skill.

Canonical doc (yana): `desktop/docs/PARENT_MOBILE_PORTAL.md`  
CBE: `.claude/skills/cbe/modules/parent-mobile-portal.md`

### Roles (`yana/desktop/packages/types/src/roles.ts`)

| Role | Dashboard |
|------|-----------|
| `super_admin` | Superadmin (company) |
| `school_admin`, `finance_officer`, `staff`, `user`, BOM aliases | School admin hub |
| `teacher` | Teacher |
| `parent` | Parent |
| `student` | Student |
| anything else / empty | **Treat as `student`** unless school-linked → school admin hub |

Multi-role hierarchy (same as desk `getRedirectPathByRoles`):  
`super_admin` → school_admin family → `teacher` → `parent` → `student` → school hub.

### Bottom nav (mobile)

Tabs: **Chat | Courses | Dashboard | Profile**  
`Dashboard` replaces the old About/info tab. Content switches by primary desk role.

### Dashboard feature maps (desktop → mobile)

**Parent** (`pages/parent/`, `parentNavActions.tsx`):
School Info · Teachers · School Fees/Accounts · Pocket Money · Deposit · Withdraw · Assessments · Library · Discipline · Attendance · Events · Transport (UI) · Statements  

Removed from mobile tiles: E-Learning (use Courses tab), Bulk Pay.

Live Nest: see Parent-usable desk APIs above. Mobile helpers: `src/lib/parentPortalApi.ts`.

**Student** (`studentNavActions.tsx`):
Dashboard · Grades · Assignments · Timetable · E-Learning · Progress · Attendance · Discipline · Pocket Money · School Fees · Events · AI Assistant

**Teacher** (inline in `TeacherDashboard.tsx`):
Enter Marks · Attendance · Syllabus · Timetable · E-Learning · Library · Discipline · Progress · Reports · Events · Communicate · Tukua AI  
Live: Enter Marks → assessment Nest APIs.

**School admin** (`/dashboard` + `adminActions.tsx`):
Admin (Users, Classes, Students, Parents, Subjects, Teachers, Staff, School, Settings) · Communication · Accounts · Assessment · E-Learning · Discipline · Library · Calendar · etc.  
`GET /schools/:id/dashboard` for stats.

`/parents`, `/students`, `/teachers` Nest modules = **admin CRUD**, not parent/student self-service feeds.

### Mobile code

- `src/lib/deskApi.ts` — Nest client + localhost rewrite
- `src/lib/deskRoles.ts` — role resolve / primary persona
- `src/context/DeskAuthContext.tsx` — desk token + roles after login
- `src/screens/dashboard/*` — role dashboards
- `src/navigation/MainTabs.tsx` — Dashboard tab

When adding a desk feature, mirror the desktop nav action path and call the matching Nest module under `yana/desktop/packages/api/src/modules/`.
