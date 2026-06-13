---
name: tukua-yana-api
description: Yana/Tukua API reference for mobile auth, wallets, location, and WebView routes. Use when implementing login, registration, savings, or web app integration.
---

# Tukua ↔ Yana API

Full reference: [docs/YANA_API.md](../../docs/YANA_API.md)

## Quick reference

- **Login:** `supabase.auth.signInWithPassword({ email, password })`
- **Register:** `supabase.auth.signUp` with metadata (`full_name`, `county`, `account_type`)
- **Reset password:** `POST /functions/v1/send-password-reset`
- **Wallets:** `POST /functions/v1/tukupay-proxy` with `endpoint_name: list_wallets`
- **Location sync:** `POST /functions/v1/sync-tukupay-user` with GPS object
- **Web app base:** `https://tukua.ai` (Chat `/chat`, Profile `/profile`)

Source project: `D:\GithubDesktop\yana`
