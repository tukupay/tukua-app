/**
 * Desk LAN proxy — Electron embeds Nest on 127.0.0.1:3251 (phone can't reach it).
 * This forwards 0.0.0.0:3255 → 127.0.0.1:3251 so Expo Go on a device can call Desk.
 *
 *   node scripts/desk-lan-proxy.mjs
 *   (also auto-started by npm start via scripts/start-dev.mjs)
 *
 * Then EXPO_PUBLIC_DESK_API_URL=http://localhost:3255/api
 */
import http from 'http';

const TARGET_HOST = process.env.DESK_PROXY_TARGET_HOST || '127.0.0.1';
const TARGET_PORT = Number(process.env.DESK_PROXY_TARGET_PORT || 3251);
const LISTEN_PORT = Number(process.env.DESK_PROXY_PORT || 3255);

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const headers = { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` };
    delete headers['content-length'];
    if (body.length) headers['content-length'] = String(body.length);

    const preq = http.request(
      {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers,
      },
      (pres) => {
        res.writeHead(pres.statusCode || 502, pres.headers);
        pres.pipe(res);
      },
    );
    preq.on('error', (err) => {
      console.error('[desk-lan-proxy]', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: `Desk proxy cannot reach ${TARGET_HOST}:${TARGET_PORT} — is Desk Electron running? ${err.message}`,
        }),
      );
    });
    if (body.length) preq.write(body);
    preq.end();
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[desk-lan-proxy] http://0.0.0.0:${LISTEN_PORT} → ${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`[desk-lan-proxy] Mobile: EXPO_PUBLIC_DESK_API_URL=http://localhost:${LISTEN_PORT}/api`);
});

server.on('error', (err) => {
  console.error('[desk-lan-proxy]', err.message);
  process.exit(1);
});
