import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { TukuaWeb } from '../theme/yana';
import { log } from './logger';

const PROJECT_ID = 'twnzlkcdhiotdgoclsib';
const SUPABASE_STORAGE_KEY = `sb-${PROJECT_ID}-auth-token`;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const TUKUA_SESSION_KEY = 'tukua_session';
const COMPAT_SESSION_KEY = process.env.EXPO_PUBLIC_COMPAT_WEB_SESSION_KEY;
const TUKUA_APP_SOURCE_MOBILE = 'mobile_app';
const TUKUA_APP_SOURCE_WEB = 'web';
const TUKUA_APP_SOURCE_KEY = 'tukua_app_source';
const CHAT_BOOT_KEY = 'tukua_mobile_chat_boot';

const SPA_CLIENT_ROUTES = [
  '/chat',
  '/sign-in',
  '/register',
  '/courses',
  '/profile',
  '/support',
  '/partners',
  '/certifying-agencies',
  '/verify',
  '/pricing',
  '/opportunities',
  '/privacy-policy',
  '/terms',
  '/refund-policy',
  '/cookie-policy',
  '/acceptable-use',
  '/delete-account',
  '/data-deletion',
];

function buildWebSessionPayload(session: Session) {
  const meta = session.user.user_metadata ?? {};
  const fullName = (meta.full_name as string) ?? session.user.email ?? '';
  const [firstName, ...rest] = fullName.split(' ');
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      first_name: firstName ?? '',
      last_name: rest.join(' '),
      username: fullName || session.user.email,
      profile_image_url: (meta.avatar_url as string) ?? '',
      kyc_status: 'completed',
      status: 'active',
    },
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: 'bearer',
  };
}

function supabaseStoragePayload(session: Session) {
  const expiresAt =
    session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600);
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: expiresAt,
    expires_in: session.expires_in ?? 3600,
    token_type: 'bearer',
    user: session.user,
  });
}

/** tukua.ai S3 returns 404 for /chat/ — always boot the SPA from /. */
export function tukuaSpaShellUrl() {
  const base = TukuaWeb.base.replace(/\/$/, '');
  return `${base}/`;
}

export function tukuaWebUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${TukuaWeb.base.replace(/\/$/, '')}${normalized}`;
}

function isSpaClientRoute(pathname: string) {
  return SPA_CLIENT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function notifyAppSourceEvent() {
  return `
    try {
      localStorage.setItem('${TUKUA_APP_SOURCE_KEY}', '${TUKUA_APP_SOURCE_MOBILE}');
      window.__TUKUA_APP_SOURCE__ = '${TUKUA_APP_SOURCE_MOBILE}';
      document.documentElement.dataset.tukuaSource = '${TUKUA_APP_SOURCE_MOBILE}';
      document.documentElement.classList.add('tukua-mobile-app');
      window.dispatchEvent(new CustomEvent('TUKUA_APP_SOURCE'));
      (function injectMobileChatStyles() {
        var id = 'tukua-mobile-chat-fix';
        if (document.getElementById(id)) return;
        var s = document.createElement('style');
        s.id = id;
        s.textContent =
          'html.tukua-mobile-app body{padding-bottom:0!important}' +
          'html.tukua-mobile-app [data-input-area]{padding-bottom:2px!important}';
        (document.head || document.documentElement).appendChild(s);
      })();
    } catch (e) {}
  `;
}

function notifyMobileSessionEvent() {
  return `
    try {
      window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_SESSION'));
    } catch (e) {}
  `;
}

function dispatchStorageSync(key: string) {
  return `
    try {
      var val = localStorage.getItem('${key}');
      if (val) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: '${key}',
          newValue: val,
          storageArea: localStorage,
          url: window.location.href
        }));
      }
    } catch (e) {}
  `;
}

function buildSetSessionViaFetchScript() {
  return `
    try {
      var raw = localStorage.getItem('${SUPABASE_STORAGE_KEY}');
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!parsed.access_token || !parsed.refresh_token) return;
      fetch('${SUPABASE_URL}/auth/v1/user', {
        headers: {
          'apikey': ${JSON.stringify(SUPABASE_ANON_KEY)},
          'Authorization': 'Bearer ' + parsed.access_token,
        },
      }).then(function(res) {
        if (res.ok) {
          window.__TUKUA_SB_READY__ = true;
        }
      }).catch(function() {});
    } catch (e) {}
  `;
}

/** Inject Supabase + web session into localStorage and notify listeners. */
export function buildSessionStorageScript(session: Session) {
  const supabasePayload = supabaseStoragePayload(session);
  const webSession = JSON.stringify(buildWebSessionPayload(session));

  const compatLine = COMPAT_SESSION_KEY
    ? `localStorage.setItem('${COMPAT_SESSION_KEY}', ${JSON.stringify(webSession)});`
    : '';

  return `
    (function() {
      try {
        var uid = ${JSON.stringify(session.user.id)};
        if (sessionStorage.getItem('tukua_mobile_uid') !== uid) {
          sessionStorage.removeItem('${CHAT_BOOT_KEY}');
          sessionStorage.setItem('tukua_mobile_uid', uid);
        }
        localStorage.setItem('${SUPABASE_STORAGE_KEY}', ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        ${compatLine}
        ${notifyAppSourceEvent()}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
        ${notifyMobileSessionEvent()}
        ${buildSetSessionViaFetchScript()}
      } catch (e) {}
      true;
    })();
  `;
}

/** Client-side navigate (avoids S3 404 on trailing-slash routes). */
export function buildClientNavigateScript(path: string, force = false) {
  const target = path.startsWith('/') ? path : `/${path}`;
  return `
    (function() {
      try {
        var target = ${JSON.stringify(target)};
        var force = ${force ? 'true' : 'false'};
        if (!force && window.location.pathname === target) return;
        window.history.replaceState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
        window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
      } catch (e) {}
      true;
    })();
  `;
}

/** Fast re-navigation for an already-bootstrapped tab WebView (no token refresh). */
export function buildFastTabNavigateScript(session: Session, targetPath: string) {
  const supabasePayload = supabaseStoragePayload(session);
  const webSession = JSON.stringify(buildWebSessionPayload(session));
  const target = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const compatLine = COMPAT_SESSION_KEY
    ? `localStorage.setItem('${COMPAT_SESSION_KEY}', ${JSON.stringify(webSession)});`
    : '';

  return `
    (function() {
      try {
        localStorage.setItem('${SUPABASE_STORAGE_KEY}', ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        ${compatLine}
        ${notifyAppSourceEvent()}
        ${notifyMobileSessionEvent()}
        var target = ${JSON.stringify(target)};
        window.history.replaceState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
        window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'TUKUA_BOOTSTRAP_OK', path: target })
          );
        } catch (e) {}
      } catch (e) {}
      true;
    })();
  `;
}

export function buildWebViewBootstrapScript(session: Session, targetPath = '/chat') {
  return buildSupabaseRefreshAndNavigateScript(session, targetPath);
}

/** Preload for About → public pages. Uses web mode so yana route guard does not redirect to /chat. */
export function buildPublicPagePreloadScript(session: Session) {
  const supabasePayload = supabaseStoragePayload(session);
  const webSession = JSON.stringify(buildWebSessionPayload(session));
  const compatLine = COMPAT_SESSION_KEY
    ? `localStorage.setItem('${COMPAT_SESSION_KEY}', ${JSON.stringify(webSession)});`
    : '';

  return `
    (function() {
      try {
        localStorage.setItem('${TUKUA_APP_SOURCE_KEY}', '${TUKUA_APP_SOURCE_WEB}');
        window.__TUKUA_APP_SOURCE__ = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.dataset.tukuaSource = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.classList.remove('tukua-mobile-app');
        localStorage.setItem('${SUPABASE_STORAGE_KEY}', ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        ${compatLine}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
      } catch (e) {}
      true;
    })();
  `;
}

export function buildPublicPageNavigateScript(path: string) {
  return buildClientNavigateScript(path);
}

/** Sync write — must run before page scripts in beforeContentLoaded. */
export function buildPreloadSessionScript(session: Session) {
  return buildSessionStorageScript(session);
}

/**
 * Refresh Supabase tokens, persist to localStorage, then navigate.
 * Chat requires a one-time shell reload so the web Supabase client hydrates
 * from storage before ChatPage checks supabase.auth.getSession().
 */
export function buildSupabaseRefreshAndNavigateScript(session: Session, targetPath = '/chat') {
  const supabasePayload = supabaseStoragePayload(session);
  const webSession = JSON.stringify(buildWebSessionPayload(session));
  const target = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const isChat = target === '/chat';

  const compatLine = COMPAT_SESSION_KEY
    ? `localStorage.setItem('${COMPAT_SESSION_KEY}', ${JSON.stringify(webSession)});`
    : '';

  log.info('WebSession', `building bootstrap for ${target}`, {
    userId: session.user.id,
    isChat,
    keys: COMPAT_SESSION_KEY ? [TUKUA_SESSION_KEY, COMPAT_SESSION_KEY] : [TUKUA_SESSION_KEY],
  });

  return `
    (async function() {
      var storageKey = '${SUPABASE_STORAGE_KEY}';
      var target = ${JSON.stringify(target)};
      var isChat = ${isChat ? 'true' : 'false'};
      var bootKey = '${CHAT_BOOT_KEY}';
      var notify = function(type, detail) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify(Object.assign({ type: type }, detail || {}))
          );
        } catch (e) {}
      };

      try {
        localStorage.setItem(storageKey, ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        ${compatLine}
        ${notifyAppSourceEvent()}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
        ${notifyMobileSessionEvent()}

        var refreshAt = parseInt(sessionStorage.getItem('tukua_token_refresh_at') || '0', 10);
        var skipRefresh = refreshAt && (Date.now() - refreshAt) < 120000;

        if (!skipRefresh) {
        var refreshRes = await fetch('${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': ${JSON.stringify(SUPABASE_ANON_KEY)},
            'Authorization': 'Bearer ' + ${JSON.stringify(SUPABASE_ANON_KEY)},
          },
          body: JSON.stringify({ refresh_token: ${JSON.stringify(session.refresh_token)} }),
        });

        if (refreshRes.ok) {
          var data = await refreshRes.json();
          if (data.access_token) {
            var stored = JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
              expires_in: data.expires_in || 3600,
              token_type: 'bearer',
              user: data.user,
            });
            localStorage.setItem(storageKey, stored);
            localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
            ${compatLine}
            ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
            ${notifyMobileSessionEvent()}
            notify('TUKUA_SESSION_SYNCED', { ok: true });
          }
        } else {
          notify('TUKUA_SESSION_SYNC_WARN', { status: refreshRes.status });
        }
        sessionStorage.setItem('tukua_token_refresh_at', String(Date.now()));
        } else {
          notify('TUKUA_SESSION_SYNCED', { ok: true, cached: true });
        }

        if (window.location.pathname === target) {
          notify('TUKUA_BOOTSTRAP_OK', { path: target });
          return;
        }

        if (isChat && !sessionStorage.getItem(bootKey)) {
          sessionStorage.setItem(bootKey, '1');
          notify('TUKUA_CHAT_RELOAD', {});
          window.location.replace(window.location.origin + '/');
          return;
        }

        var waitMs = isChat ? 2400 : 80;
        await new Promise(function(r) { setTimeout(r, waitMs); });

        if (window.location.pathname !== target) {
          window.history.replaceState({}, '', target);
          window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
          window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
        }

        notify('TUKUA_BOOTSTRAP_OK', { path: target });
      } catch (e) {
        notify('TUKUA_BOOTSTRAP_ERR', { error: String(e && e.message ? e.message : e) });
        if (!isChat) {
          try {
            window.history.replaceState({}, '', target);
            window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
            window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
          } catch (_) {}
        }
      }
      true;
    })();
    true;
  `;
}

export function buildWebViewSessionScript(session: Session, targetPath = '/chat') {
  return buildWebViewBootstrapScript(session, targetPath);
}

export async function getActiveSessionScript(targetPath?: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    log.warn('WebSession', 'no active supabase session for inject');
    return null;
  }
  return buildWebViewSessionScript(data.session, targetPath ?? '/chat');
}

/** Block server loads that 404 on tukua.ai (SPA paths must use client routing). */
export function shouldAllowWebViewRequest(url: string) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('tukua.ai')) return true;
    if (u.pathname === '/' || u.pathname === '/index.html') return true;
    if (isSpaClientRoute(u.pathname)) return false;
    if (u.pathname.endsWith('/') && u.pathname.length > 1) return false;
    return true;
  } catch {
    return true;
  }
}

export function buildClearChatBootScript() {
  return `
    (function() {
      try { sessionStorage.removeItem('${CHAT_BOOT_KEY}'); } catch (e) {}
      true;
    })();
  `;
}
