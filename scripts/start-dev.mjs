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

  console.log('[start-dev] Starting Expo…');
  const expo = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['expo', 'start', ...expoArgs],
    {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
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
