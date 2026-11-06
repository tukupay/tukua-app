/**
 * Dev entry: start Desk LAN proxy (if needed) + Expo.
 *
 *   npm start
 *   npm start -- --clear
 *
 * Proxy: 0.0.0.0:3255 → 127.0.0.1:3251 (Electron Desk is localhost-only).
 * Skip proxy with DESK_PROXY=0
 */
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROXY_PORT = Number(process.env.DESK_PROXY_PORT || 3255);
const SKIP_PROXY = process.env.DESK_PROXY === '0' || process.env.DESK_PROXY === 'false';
const root = path.resolve(__dirname, '..');

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

function waitForProxy(ms = 4000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${PROXY_PORT}/api/health`, (res) => {
        res.resume();
        resolve(res.statusCode === 200 || res.statusCode === 502);
      });
      req.on('error', () => {
        if (Date.now() - started > ms) resolve(false);
        else setTimeout(tick, 200);
      });
    };
    tick();
  });
}

/**
 * In development the app shows this PC's current web code (Vite :8080, live reload, no build) and
 * talks to this PC's API (:3253, staging database), with the sign-in token injected into the web
 * page — never the online v2.tukua.ai build or the live API that .env names for store builds.
 * Variables set in the shell still win (Expo never lets .env override them).
 * MOBILE_ENV=staging npm start → keep .env's hosted addresses instead.
 */
function devHosts() {
  if (String(process.env.MOBILE_ENV || '').toLowerCase() === 'staging') return {};
  const web = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:8080';
  const api = process.env.EXPO_PUBLIC_NEST_API_URL || 'http://localhost:3253/api';
  return {
    EXPO_PUBLIC_TUKUA_ENV: process.env.EXPO_PUBLIC_TUKUA_ENV || 'local',
    // localhost is rewritten to this PC's network address on a phone (resolveLocalUrl).
    EXPO_PUBLIC_WEB_URL: web,
    EXPO_PUBLIC_TUKUA_WEB_URL: process.env.EXPO_PUBLIC_TUKUA_WEB_URL || web,
    EXPO_PUBLIC_NEST_API_URL: api,
    EXPO_PUBLIC_DESK_API_URL: process.env.EXPO_PUBLIC_DESK_API_URL || api,
  };
}

async function main() {
  const expoArgs = process.argv.slice(2);
  let proxyChild = null;

  if (!SKIP_PROXY) {
    const busy = await portInUse(PROXY_PORT);
    if (busy) {
      console.log(`[start-dev] Desk proxy already on :${PROXY_PORT}`);
    } else {
      console.log(`[start-dev] Starting Desk LAN proxy :${PROXY_PORT} → :3251`);
      proxyChild = spawn(process.execPath, [path.join(__dirname, 'desk-lan-proxy.mjs')], {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
      });
      proxyChild.on('error', (err) => {
        console.warn('[start-dev] proxy failed to start:', err.message);
      });
      await waitForProxy(1500);
    }
  } else {
    console.log('[start-dev] Desk proxy skipped (DESK_PROXY=0)');
  }

  console.log('[start-dev] Starting Expo (Metro native + Expo web on :8081)…');
  console.log('[start-dev]   phone  → Expo Go / Android / iOS (same Metro)');
  console.log('[start-dev]   browser → http://localhost:8081  (Expo web; Vite SPA stays on :8080)');
  // Expo CLI can crash on Windows with "Body is unusable: Body has already been read"
  // while fetching native-module versions for doctor checks — that kills Metro and
  // (via killOthersOn:failure) the whole npm run dev:all stack. Skip that network check.
  const expoEnv = {
    ...process.env,
    ...devHosts(),
    EXPO_NO_DEPENDENCY_VALIDATION:
      process.env.EXPO_NO_DEPENDENCY_VALIDATION ?? '1',
  };
  console.log(`[start-dev]   Tukua AI web → ${expoEnv.EXPO_PUBLIC_WEB_URL}`);
  console.log(`[start-dev]   API          → ${expoEnv.EXPO_PUBLIC_NEST_API_URL}`);
  const expo = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['expo', 'start', ...expoArgs],
    {
      cwd: root,
      stdio: 'inherit',
      env: expoEnv,
      shell: process.platform === 'win32',
    },
  );

  const shutdown = (code = 0) => {
    if (proxyChild && !proxyChild.killed) {
      try {
        proxyChild.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
    process.exit(code);
  };

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  expo.on('exit', (code, signal) => {
    if (signal) shutdown(0);
    else shutdown(code ?? 0);
  });
  expo.on('error', (err) => {
    console.error('[start-dev] Expo failed:', err.message);
    shutdown(1);
  });
}

main().catch((err) => {
  console.error('[start-dev]', err);
  process.exit(1);
});
