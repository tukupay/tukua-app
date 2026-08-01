import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { TukuaWeb } from '../theme/yana';
import { getNestApiBaseUrl, isAppWebHost } from './localHost';
import { log } from './logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
/** Must match EXPO_PUBLIC_SUPABASE_URL project (prod twnzlk… vs staging jltzze…). */
function supabaseProjectRef(): string {
  try {
    const host = new URL(SUPABASE_URL).hostname; // {ref}.supabase.co
    return host.split('.')[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}
const SUPABASE_STORAGE_KEY = `sb-${supabaseProjectRef()}-auth-token`;
const TUKUA_SESSION_KEY = 'tukua_session';
const COMPAT_SESSION_KEY = process.env.EXPO_PUBLIC_COMPAT_WEB_SESSION_KEY;
const TUKUA_APP_SOURCE_MOBILE = 'mobile_app';
const TUKUA_APP_SOURCE_WEB = 'web';
const TUKUA_APP_SOURCE_KEY = 'tukua_app_source';
const CHAT_BOOT_KEY = 'tukua_mobile_chat_boot';
/**
 * Nest REST base for SPA inside WebView (chat/courses/register → Nest, not PostgREST).
 * Uses getNestApiBaseUrl (api-host / Railway) — not Electron Desk ERP.
 */
const NEST_API_BASE = getNestApiBaseUrl().replace(/\/$/, '');

const SPA_CLIENT_ROUTES = [
  '/chat',
  '/sign-in',
  '/register',
  '/courses',
  '/profile',
  '/superadmin',
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

/** SPA shell — production S3 used to 404 on /chat/; local Vite is fine either way. Always boot from /. */
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
          'html.tukua-mobile-app [data-tukua-top-nav],html.tukua-mobile-app .glass-nav{display:none!important}' +
          'html.tukua-mobile-app .tukua-mobile-scroll{-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior:contain!important}' +
          'html.tukua-mobile-app [data-input-area]{' +
          'padding-bottom:calc(58px + env(safe-area-inset-bottom,0px) + 2px)!important;' +
          'margin-bottom:0!important}' +
          'html.tukua-mobile-app [data-input-area].absolute,' +
          'html.tukua-mobile-app .absolute.bottom-0[data-input-area]{' +
          'bottom:calc(58px + env(safe-area-inset-bottom,0px))!important;' +
          'padding-bottom:2px!important}';
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

/** Close in-page overlays (artifact panel, sidebar) — never iframe / browser history. */
export function buildMobileInPageBackScript() {
  return `
(function() {
  try {
    window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_BACK'));
    window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_CLOSE_SIDEBAR'));
    var backs = document.querySelectorAll('[aria-label="Back"]');
    for (var i = backs.length - 1; i >= 0; i--) {
      var btn = backs[i];
      if (btn.offsetParent === null) continue;
      var panel = btn.closest('[class*="max-md:fixed"]');
      if (panel) { btn.click(); return true; }
    }
    var overlays = document.querySelectorAll('div.fixed.inset-0');
    for (var j = 0; j < overlays.length; j++) {
      var el = overlays[j];
      if (el.className && el.className.indexOf('bg-black') !== -1 && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
  } catch (e) {}
  return false;
})();
`;
}

function notifyMobileBackBridgeScript() {
  return `
    (function() {
      if (window.__TUKUA_MOBILE_BACK_BRIDGE__) return;
      window.__TUKUA_MOBILE_BACK_BRIDGE__ = true;
      window.__TUKUA_CLOSE_IN_PAGE_OVERLAYS__ = function() {
        ${buildMobileInPageBackScript().trim()}
      };
    })();
  `;
}

function notifySpaRouteSyncScript() {
  return `
    (function() {
      if (window.__TUKUA_ROUTE_SYNC__) return;
      window.__TUKUA_ROUTE_SYNC__ = true;
      var post = function(kind) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'TUKUA_ROUTE',
              path: window.location.pathname,
              kind: kind || 'nav',
              href: window.location.href
            })
          );
        } catch (e) {}
      };
      var wrap = function(original, kind) {
        return function() {
          var result = original.apply(this, arguments);
          post(kind);
          return result;
        };
      };
      history.pushState = wrap(history.pushState.bind(history), 'push');
      history.replaceState = wrap(history.replaceState.bind(history), 'replace');
      window.addEventListener('popstate', function() { post('pop'); });
      window.addEventListener('tukua-navigate', function() { post('spa'); });
      window.addEventListener('hashchange', function() { post('hash'); });
      post('init');
    })();
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
        localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
        localStorage.setItem('tukua_nest_access_token', ${JSON.stringify(session.access_token)});
        ${compatLine}
        ${notifyAppSourceEvent()}
        ${notifySpaRouteSyncScript()}
        ${notifyMobileBackBridgeScript()}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
        ${notifyMobileSessionEvent()}
        ${buildSetSessionViaFetchScript()}
      } catch (e) {}
      true;
    })();
  `;
}

/** Client-side navigate (avoids S3 404 on trailing-slash routes). */
export function buildClientNavigateScript(path: string, force = false, push = false) {
  return buildSpaNavigateScript(path, { force, push });
}

/** SPA navigate with optional history.pushState (records back stack in WebView). */
export function buildSpaNavigateScript(
  path: string,
  opts: { force?: boolean; push?: boolean } = {},
) {
  const target = path.startsWith('/') ? path : `/${path}`;
  const force = opts.force ?? false;
  const push = opts.push ?? false;
  const historyFn = push ? 'pushState' : 'replaceState';
  return `
    (function() {
      try {
        var target = ${JSON.stringify(target)};
        var force = ${force ? 'true' : 'false'};
        if (!force && window.location.pathname === target) return;
        window.history.${historyFn}({}, '', target);
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
        if (!window.location.hostname) return;
        localStorage.setItem('${SUPABASE_STORAGE_KEY}', ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
        localStorage.setItem('tukua_nest_access_token', ${JSON.stringify(session.access_token)});
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

/** New chat from native menu — close mobile sidebar overlay, then create chat. */
export function buildMobileNewChatScript() {
  return `
    (function() {
      try {
        var overlays = document.querySelectorAll('div.fixed.inset-0');
        for (var i = 0; i < overlays.length; i++) {
          var el = overlays[i];
          if (el.className && el.className.indexOf('bg-black') !== -1) el.click();
        }
        window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_CLOSE_SIDEBAR'));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_NEW_CHAT'));
      true;
    })();
  `;
}

export function buildMobileChatTabBarStylesScript(tabBarPx: number, topInsetPx = 0) {
  const px = Math.max(48, Math.round(tabBarPx));
  const top = Math.max(0, Math.round(topInsetPx));
  return `
    (function() {
      try {
        var id = 'tukua-mobile-tab-bar-fix';
        var pad = '${px}px';
        var topPad = '${top}px';
        var el = document.getElementById(id);
        if (!el) {
          el = document.createElement('style');
          el.id = id;
          (document.head || document.documentElement).appendChild(el);
        }
        el.textContent =
          'html.tukua-mobile-app [data-input-area]{' +
          'padding-bottom:calc(' + pad + ' + 2px)!important;' +
          'margin-bottom:0!important}' +
          'html.tukua-mobile-app [data-input-area].absolute,' +
          'html.tukua-mobile-app .absolute.bottom-0[data-input-area]{' +
          'bottom:' + pad + '!important;padding-bottom:2px!important}' +
          'html.tukua-mobile-app [data-mobile-chat-shell]{' +
          'padding-bottom:' + pad + '!important}' +
          (top > 0
            ? /* Chat hamburger is fixed top-2 in mobileApp — push below native header */
              'html.tukua-mobile-app button.fixed.left-2,' +
              'html.tukua-mobile-app button.fixed.z-50,' +
              'html.tukua-mobile-app .fixed.left-2.z-50{' +
              'top:' + topPad + '!important;' +
              'margin-top:0!important}' +
              'html.tukua-mobile-app [data-sidebar="trigger"],' +
              'html.tukua-mobile-app button[data-sidebar="trigger"]{' +
              'top:' + topPad + '!important;' +
              'margin-top:0!important}' +
              'html.tukua-mobile-app header,' +
              'html.tukua-mobile-app [data-chat-header],' +
              'html.tukua-mobile-app [data-mobile-chat-header]{' +
              'padding-top:' + topPad + '!important}'
            : '');
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
        localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
        localStorage.setItem('tukua_nest_access_token', ${JSON.stringify(session.access_token)});
        ${compatLine}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
        window.dispatchEvent(new CustomEvent('TUKUA_APP_SOURCE'));
      } catch (e) {}
      true;
    })();
  `;
}

export function buildPublicPageNavigateScript(path: string) {
  // Must use client routing — server loads to SPA paths are blocked (404 on S3).
  return buildClientNavigateScript(path, true);
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

      function navigateToTarget() {
        if (window.location.pathname === target) return;
        window.history.replaceState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
        window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
      }

      try {
        if (!window.location.hostname) return;
        localStorage.setItem(storageKey, ${JSON.stringify(supabasePayload)});
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
        localStorage.setItem('tukua_nest_access_token', ${JSON.stringify(session.access_token)});
        ${compatLine}
        ${notifyAppSourceEvent()}
        ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
        ${notifyMobileSessionEvent()}

        if (!isChat) {
          navigateToTarget();
          notify('TUKUA_BOOTSTRAP_OK', { path: target });
        }

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
            localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
            localStorage.setItem('tukua_nest_access_token', data.access_token);
            ${compatLine}
            ${dispatchStorageSync(SUPABASE_STORAGE_KEY)}
            ${notifyMobileSessionEvent()}
            notify('TUKUA_SESSION_SYNCED', { ok: true });
            notify('TUKUA_SESSION_UPDATED', {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
          }
        } else {
          notify('TUKUA_SESSION_SYNC_WARN', { status: refreshRes.status });
        }
        sessionStorage.setItem('tukua_token_refresh_at', String(Date.now()));
        } else {
          notify('TUKUA_SESSION_SYNCED', { ok: true, cached: true });
        }

        // One-shot hydrate reload for production chat. Prefer soft navigate after
        // tokens are in localStorage — full replace races native remounts.
        var host = window.location.hostname || '';
        var isLocalDev =
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '10.0.2.2' ||
          /^192\.168\./.test(host) ||
          /^10\.\d+\./.test(host);

        if (isChat && !sessionStorage.getItem(bootKey)) {
          sessionStorage.setItem(bootKey, '1');
          if (!isLocalDev) {
            notify('TUKUA_CHAT_RELOAD', {});
          }
        }

        if (isChat) {
          await new Promise(function(r) { setTimeout(r, isLocalDev ? 400 : 700); });
          navigateToTarget();
          notify('TUKUA_BOOTSTRAP_OK', { path: target });
        }
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

/** Push the latest native session into an already-loaded WebView (no navigation). */
export function buildSessionResyncScript(session: Session) {
  return `${buildPreloadSessionScript(session)}\ntrue;`;
}

export async function applyWebSessionTokens(accessToken: string, refreshToken: string) {
  const { data: existing } = await supabase.auth.getSession();
  if (
    existing.session?.access_token === accessToken &&
    existing.session?.refresh_token === refreshToken
  ) {
    return existing.session;
  }
  // Same user + unexpired access token — adopt refresh quietly without firing SIGNED_IN churn.
  if (
    existing.session?.user &&
    existing.session.access_token &&
    existing.session.expires_at &&
    existing.session.expires_at * 1000 > Date.now() + 60_000
  ) {
    // Still update if refresh token rotated, but avoid full setSession when access unchanged.
    if (existing.session.access_token === accessToken) {
      return existing.session;
    }
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    log.warn('WebSession', 'apply web tokens failed', error.message);
    return null;
  }
  if (data.session) {
    const { persistSession } = await import('./auth');
    await persistSession(data.session);
    log.info('WebSession', 'desk supabase tokens adopted', {
      project: supabaseProjectRef(),
      userId: data.session.user.id,
    });
  }
  return data.session;
}

export async function getActiveSessionScript(targetPath?: string) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    log.warn('WebSession', 'no active supabase session for inject');
    return null;
  }
  return buildWebViewSessionScript(data.session, targetPath ?? '/chat');
}

function isTukuaStaticAsset(pathname: string) {
  return (
    pathname.startsWith('/certificates/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    /\.(html?|css|js|png|jpe?g|gif|svg|webp|woff2?|ico|pdf|mp4|webm|txt|xml|json)(\?|$)/i.test(
      pathname,
    )
  );
}

export type WebViewLoadRequest = {
  url: string;
  isTopFrame?: boolean;
  canGoBack?: boolean;
};

/** Block server loads of SPA paths (must use client routing). */
export function shouldAllowWebViewRequest(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol === 'about:' || u.protocol === 'blob:' || u.protocol === 'data:') return true;
    if (!isAppWebHost(u.hostname)) return true;
    if (u.pathname === '/' || u.pathname === '/index.html') return true;
    if (isTukuaStaticAsset(u.pathname)) return true;
    // Allow initial load of web-only tabs (courses, profile) - they need server bootstrap
    if (u.pathname === '/courses' || u.pathname === '/profile' || u.pathname.startsWith('/profile/')) return true;
    if (isSpaClientRoute(u.pathname)) return false;
    if (u.pathname.endsWith('/') && u.pathname.length > 1) return false;
    return true;
  } catch {
    return true;
  }
}

/** Apply SPA blocking only to the main frame — never to iframe/subframe loads. */
export function shouldAllowWebViewNavigation(
  url: string,
  req: Pick<WebViewLoadRequest, 'isTopFrame'>,
) {
  if (req.isTopFrame === false) return true;
  return shouldAllowWebViewRequest(url);
}

export function isMainFrameWebViewRequest(req: Pick<WebViewLoadRequest, 'isTopFrame'>) {
  return req.isTopFrame !== false;
}

export function buildClearChatBootScript() {
  return `
    (function() {
      try { sessionStorage.removeItem('${CHAT_BOOT_KEY}'); } catch (e) {}
      true;
    })();
  `;
}

/**
 * Cosmetics for the registration WebView: hide the web top nav + footer (the
 * native screen already has its own header), pull the card up, elevate it and
 * make it look like a native mobile sheet, and enlarge tap targets so every
 * button is comfortably tappable. Injected once — the <style> lives in <head>
 * and survives SPA route changes.
 */
export function buildRegisterCosmeticsScript() {
  return `
    (function() {
      try {
        var id = 'tukua-reg-cosmetics';
        if (document.getElementById(id)) return;
        var s = document.createElement('style');
        s.id = id;
        s.textContent = [
          // Hide web chrome — native header/back button replaces it.
          '[data-tukua-top-nav],.glass-nav{display:none!important}',
          'footer{display:none!important}',
          // Hide the floating mobile bottom nav pill if it ever renders here.
          'nav[class~="bottom-2"],[data-mobile-bottom-nav]{display:none!important}',
          '.events-ticker,[data-events-ticker]{display:none!important}',
          // Remove the big top gap that cleared the (now hidden) fixed nav.
          '[class~="pt-20"]{padding-top:14px!important}',
          '[class~="py-6"]{padding-top:14px!important;padding-bottom:20px!important}',
          // Elevated, rounded, mobile-sheet card.
          '.glass-panel{background:#fff!important;border-radius:22px!important;',
          'box-shadow:0 14px 38px rgba(16,24,40,0.16),0 2px 8px rgba(16,24,40,0.08)!important;',
          'border:1px solid rgba(16,24,40,0.06)!important;padding-left:16px!important;padding-right:16px!important}',
          // Comfortable, full-width primary actions + tap targets on phones.
          'button{min-height:46px}',
          '@media (max-width:640px){',
          '  .glass-panel{max-width:100%!important;width:100%!important}',
          '  input,select,textarea{font-size:16px!important;min-height:46px!important}',
          '  .glass-panel button[type="submit"],',
          '  .glass-panel button.w-full{width:100%!important;min-height:50px!important;',
          '  font-size:16px!important;border-radius:14px!important}',
          '}'
        ].join('');
        (document.head || document.documentElement).appendChild(s);
      } catch (e) {}
      true;
    })();
  `;
}

/**
 * Runs before content loads on the registration WebView. Clears any stale
 * web session ONCE (so the register form shows instead of bouncing a
 * previously cached user to /chat) and forces WEB source so the web
 * MobileAppRouteGuard does NOT redirect /register -> /chat (that redirect was
 * the cause of the register screen "flickering" into chat). The native app
 * only tags itself as the mobile app once it owns real tabs after sign-up.
 * The one-time clear guard protects the fresh session created after sign-up
 * from being wiped on any post-signup full reload.
 */
export function buildRegisterPreloadScript() {
  const compatClear = COMPAT_SESSION_KEY
    ? `localStorage.removeItem('${COMPAT_SESSION_KEY}');`
    : '';
  return `
    (function() {
      try {
        if (!sessionStorage.getItem('tukua_reg_init')) {
          localStorage.removeItem('${SUPABASE_STORAGE_KEY}');
          localStorage.removeItem('${TUKUA_SESSION_KEY}');
          ${compatClear}
          sessionStorage.setItem('tukua_reg_init', '1');
        }
        localStorage.setItem('${TUKUA_APP_SOURCE_KEY}', '${TUKUA_APP_SOURCE_WEB}');
        window.__TUKUA_APP_SOURCE__ = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.dataset.tukuaSource = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.classList.remove('tukua-mobile-app');
      } catch (e) {}
      true;
    })();
  `;
}

/**
 * Client-navigate the shell to a target auth route (default /register) and
 * install a one-shot watcher that reports the Supabase session back to native
 * the moment web registration/sign-in establishes one. This makes the whole
 * registration flow the canonical web flow while the native app simply adopts
 * the resulting session.
 */
export function buildRegisterWatchScript(targetPath = '/register') {
  const target = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  return `
    (function() {
      try {
        var target = ${JSON.stringify(target)};
        if (window.location.pathname !== target) {
          window.history.replaceState({}, '', target);
          window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
          window.dispatchEvent(new CustomEvent('tukua-navigate', { detail: { path: target } }));
        }
        if (window.__TUKUA_REG_WATCH__) return;
        window.__TUKUA_REG_WATCH__ = true;
        var key = '${SUPABASE_STORAGE_KEY}';
        var seen = null;
        setInterval(function() {
          try {
            var raw = localStorage.getItem(key);
            if (!raw) return;
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.access_token || !parsed.refresh_token) return;
            var uid = parsed.user && parsed.user.id;
            if (!uid) return;
            if (seen === parsed.access_token) return;
            seen = parsed.access_token;
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'TUKUA_SESSION_UPDATED',
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token
              })
            );
          } catch (e) {}
        }, 1000);
      } catch (e) {}
      true;
    })();
  `;
}
