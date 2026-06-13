# Tukua Mobile

React Native (Expo SDK 54) companion app for **[Tukua](https://tukua.ai)** — Kenya's AI-powered financial literacy platform. After sign-in, native tabs load the Tukua web experience (Chat, Courses, Opportunities, Profile) with Supabase session injection. Navigation and sign-out are handled natively.

## Getting Started

```bash
npm install
npm start -- --clear
```

Press `a` for Android emulator or scan the QR code with **Expo Go (SDK 54)**.

Copy `.env.example` to `.env` and set Supabase + Yana URLs (see `docs/YANA_API.md`).

## Features

- **Yana-branded auth** — glass sign-in / register screens with green SVG mesh background and orange corner wave (matches `yana` web)
- **Email/password login** — Supabase Auth (same as Yana web)
- **Biometric quick login** — fingerprint prompt after first login + orange fingerprint button on login (pattern from TukuPay Flutter app)
- **Post-login WebView tabs** — Chat (default), Courses, Opportunities, Profile
- **Location sync** — GPS captured on login for `sync-tukupay-user` edge function

## Tech Stack

- Expo SDK 54 / React Native 0.81 / React 19
- React Navigation (stack + bottom tabs)
- Supabase JS + `expo-secure-store`
- `react-native-webview` for Yana web routes
- TypeScript

## Reference Projects

| Project | Path | Role |
|---------|------|------|
| Yana (product) | `D:\GithubDesktop\yana` | Web app, API, branding |
| TukuPay Flutter | `D:\GithubDesktop\tukupay-mobile` | Biometrics UX reference |

## Documentation

- [Yana API & mobile architecture](./docs/YANA_API.md)
