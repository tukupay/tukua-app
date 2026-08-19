import type { Session } from './auth';
import { TukuaWeb } from '../theme/yana';
import { getNestApiBaseUrl, isAppWebHost } from './localHost';
import { log } from './logger';

const TUKUA_SESSION_KEY = 'tukua_session';
const NEST_ACCESS_KEY = 'tukua_nest_access_token';
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
  '/connect',
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

function decodeJwtUserId(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded));
    const id = String(json.sub || json.user_id || '').trim();
    return id || null;
  } catch {
    return null;
  }
}

function nestTokenForInject(session: Session, nestAccessToken?: string | null) {
  return (nestAccessToken && nestAccessToken.trim()) || session.access_token;
}

function sessionUserIdForInject(session: Session, nestAccessToken?: string | null) {
  const fromSession = String(session.user?.id || '').trim();
  if (fromSession) return fromSession;
  return decodeJwtUserId(nestTokenForInject(session, nestAccessToken)) || '';
}

function buildWebSessionPayload(session: Session, nestAccessToken?: string | null) {
  const meta = session.user.user_metadata ?? {};
  const fullName = (meta.full_name as string) ?? session.user.email ?? '';
  const [firstName, ...rest] = fullName.split(' ');
  const access = nestTokenForInject(session, nestAccessToken);
  const userId = sessionUserIdForInject(session, nestAccessToken);
  return {
    user: {
      id: userId,
      email: session.user.email ?? '',
      first_name: firstName ?? '',
      last_name: rest.join(' '),
      username: fullName || session.user.email,
      profile_image_url: (meta.avatar_url as string) ?? '',
      kyc_status: 'completed',
      status: 'active',
    },
    access_token: access,
    refresh_token: session.refresh_token,
    token_type: 'bearer',
    token_source: 'nest_identity',
  };
}

/** Inject Nest REST auth into localStorage for the SPA WebView. */
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
          'padding-bottom:2px!important}' +
          // Composer: grow with content; border lives only on [data-composer-shell].
          'html.tukua-mobile-app [data-input-area] textarea{' +
          'white-space:pre-wrap!important;word-break:break-word!important;' +
          'border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;' +
          'background:transparent!important}' +
          'html.tukua-mobile-app [data-input-area] > div{' +
          'border:0!important;box-shadow:none!important;background:transparent!important}' +
          'html.tukua-mobile-app [data-composer-shell]{' +
          'border:1px solid hsl(var(--primary) / 0.35)!important;' +
          'border-radius:16px!important}' +
          'html.tukua-mobile-app [data-composer-shell]:focus-within{' +
          'border-color:hsl(var(--primary))!important;' +
          'box-shadow:0 0 0 2px hsl(var(--primary) / 0.22)!important}';
        (document.head || document.documentElement).appendChild(s);
      })();
      ${buildMobileKeyboardBridgeScript().trim()}
    } catch (e) {}
  `;
}

/**
 * Bridges the on-screen keyboard height into a `--tukua-kb-pad` CSS var so the
 * chat composer can pad itself above the keyboard even when the native WebView
 * frame does not resize (iOS). Installed once per page load.
 */
function buildMobileKeyboardBridgeScript() {
  return `
    (function() {
      try {
        if (window.__TUKUA_KB_BRIDGE__) return;
        window.__TUKUA_KB_BRIDGE__ = true;
        var vv = window.visualViewport;
        if (!vv) return;
        var root = document.documentElement;
        var update = function() {
          try {
            var kb = Math.round(window.innerHeight - vv.height - vv.offsetTop);
            var open = kb > 40;
            root.style.setProperty('--tukua-kb-pad', (open ? kb : 0) + 'px');
            if (open) root.classList.add('tukua-kb-open');
            else root.classList.remove('tukua-kb-open');
          } catch (e) {}
        };
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        update();
      } catch (e) {}
    })();
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

function nestStorageJs(session: Session, nestAccessToken?: string | null) {
  const nestTok = nestTokenForInject(session, nestAccessToken);
  const webSession = JSON.stringify(buildWebSessionPayload(session, nestAccessToken));
  const compatLine = COMPAT_SESSION_KEY
    ? `localStorage.setItem('${COMPAT_SESSION_KEY}', ${JSON.stringify(webSession)});`
    : '';
  return {
    nestTok,
    webSession,
    writes: `
        localStorage.setItem('${TUKUA_SESSION_KEY}', ${JSON.stringify(webSession)});
        localStorage.setItem('tukua_nest_api_base', ${JSON.stringify(NEST_API_BASE)});
        localStorage.setItem('${NEST_ACCESS_KEY}', ${JSON.stringify(nestTok)});
        ${compatLine}
        ${dispatchStorageSync(TUKUA_SESSION_KEY)}
        ${dispatchStorageSync(NEST_ACCESS_KEY)}
    `,
  };
}

/** Inject Nest REST auth into localStorage. */
export function buildSessionStorageScript(session: Session, nestAccessToken?: string | null) {
  const { writes } = nestStorageJs(session, nestAccessToken);

  return `
    (function() {
      try {
        var uid = ${JSON.stringify(sessionUserIdForInject(session, nestAccessToken))};
        if (sessionStorage.getItem('tukua_mobile_uid') !== uid) {
          sessionStorage.removeItem('${CHAT_BOOT_KEY}');
          sessionStorage.setItem('tukua_mobile_uid', uid);
        }
        ${writes}
        ${notifyAppSourceEvent()}
        ${notifySpaRouteSyncScript()}
        ${notifyMobileBackBridgeScript()}
        ${notifyMobileSessionEvent()}
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
export function buildFastTabNavigateScript(
  session: Session,
  targetPath: string,
  nestAccessToken?: string | null,
) {
  const { writes } = nestStorageJs(session, nestAccessToken);
  const target = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;

  return `
    (function() {
      try {
        if (!window.location.hostname) return;
        ${writes}
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
          'bottom:calc(' + pad + ')!important;padding-bottom:2px!important}' +
          /* Keyboard open: sit flush above keyboard — do NOT stack tab-bar height. */
          'html.tukua-mobile-app.tukua-kb-open [data-input-area],' +
          'html.tukua-mobile-app.tukua-kb-open [data-input-area].absolute,' +
          'html.tukua-mobile-app.tukua-kb-open .absolute.bottom-0[data-input-area]{' +
          'bottom:var(--tukua-kb-pad,0px)!important;' +
          'padding-bottom:max(2px,env(safe-area-inset-bottom,0px))!important}' +
          'html.tukua-mobile-app [data-mobile-chat-shell]{' +
          'padding-bottom:calc(' + pad + ')!important}' +
          'html.tukua-mobile-app.tukua-kb-open [data-mobile-chat-shell]{' +
          'padding-bottom:var(--tukua-kb-pad,0px)!important}' +
          /* Single rounded shell only — do NOT border the outer wrapper (caused double border). */
          'html.tukua-mobile-app [data-composer-shell]{' +
          'border:1px solid hsl(var(--primary) / 0.35)!important;' +
          'border-radius:16px!important;' +
          'background:hsl(var(--background) / 0.96)!important;' +
          'box-shadow:0 8px 28px rgba(0,0,0,0.1)!important}' +
          'html.tukua-mobile-app [data-composer-shell]:focus-within{' +
          'border-color:hsl(var(--primary))!important;' +
          'box-shadow:0 0 0 2px hsl(var(--primary) / 0.22),0 8px 28px rgba(0,0,0,0.12)!important}' +
          'html.tukua-mobile-app [data-composer-shell] textarea,' +
          'html.tukua-mobile-app [data-input-area] textarea{' +
          'border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;' +
          'background:transparent!important}' +
          'html.tukua-mobile-app [data-input-area] > div{' +
          'border:0!important;box-shadow:none!important;background:transparent!important}' +
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

/** Preload for About → public pages. Uses web mode so yana route guard does not redirect to /chat. */
export function buildPublicPagePreloadScript(session: Session, nestAccessToken?: string | null) {
  const { writes } = nestStorageJs(session, nestAccessToken);

  return `
    (function() {
      try {
        localStorage.setItem('${TUKUA_APP_SOURCE_KEY}', '${TUKUA_APP_SOURCE_WEB}');
        window.__TUKUA_APP_SOURCE__ = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.dataset.tukuaSource = '${TUKUA_APP_SOURCE_WEB}';
        document.documentElement.classList.remove('tukua-mobile-app');
        ${writes}
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
export function buildPreloadSessionScript(session: Session, nestAccessToken?: string | null) {
  return buildSessionStorageScript(session, nestAccessToken);
}

/**
 * Inject Nest REST auth, then navigate. Chat/courses use tukua_nest_access_token only.
 */
export function buildNestRefreshAndNavigateScript(
  session: Session,
  targetPath = '/chat',
  nestAccessToken?: string | null,
) {
  const { writes, nestTok } = nestStorageJs(session, nestAccessToken);
  const target = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const isChat = target === '/chat';

  log.info('WebSession', `building bootstrap for ${target}`, {
    userId: session.user.id,
    isChat,
    nestBase: NEST_API_BASE,
    keys: COMPAT_SESSION_KEY ? [TUKUA_SESSION_KEY, COMPAT_SESSION_KEY] : [TUKUA_SESSION_KEY],
  });

  return `
    (async function() {
      var target = ${JSON.stringify(target)};
      var isChat = ${isChat ? 'true' : 'false'};
      var nestTok = ${JSON.stringify(nestTok)};
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
        ${writes}
        ${notifyAppSourceEvent()}
        ${notifyMobileSessionEvent()}

        if (!isChat) {
          navigateToTarget();
          notify('TUKUA_BOOTSTRAP_OK', { path: target });
        }

        notify('TUKUA_SESSION_SYNCED', { ok: true, nest: true });

        var host = window.location.hostname || '';
        var isLocalDev =
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '10.0.2.2' ||
          /^192\\.168\\./.test(host) ||
          /^10\\.\\d+\\./.test(host);

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

export function buildWebViewBootstrapScript(
  session: Session,
  targetPath = '/chat',
  nestAccessToken?: string | null,
) {
  return buildNestRefreshAndNavigateScript(session, targetPath, nestAccessToken);
}

export function buildWebViewSessionScript(
  session: Session,
  targetPath = '/chat',
  nestAccessToken?: string | null,
) {
  return buildWebViewBootstrapScript(session, targetPath, nestAccessToken);
}

/** Push theme + chat background prefs into the SPA (CSS vars + localStorage). */
export function buildThemeChromeInjectScript(
  themeId: string,
  chatBgPattern: string,
  hslVars?: Partial<Record<string, string>>,
) {
  const primary = hslVars?.primary ?? '';
  const secondary = hslVars?.secondary ?? '';
  const tertiary = hslVars?.tertiary ?? '';
  const muted = hslVars?.muted ?? '';
  const primaryFg = hslVars?.primaryForeground ?? '';
  const secondaryFg = hslVars?.secondaryForeground ?? '';
  const tertiaryFg = hslVars?.tertiaryForeground ?? '';
  return `
    (function() {
      try {
        localStorage.setItem('tukua_app_theme', ${JSON.stringify(themeId)});
        localStorage.setItem('tukua_chat_bg_pattern', ${JSON.stringify(chatBgPattern)});
        document.documentElement.dataset.tukuaTheme = ${JSON.stringify(themeId)};
        document.documentElement.dataset.tukuaChatBg = ${JSON.stringify(chatBgPattern)};
        var root = document.documentElement;
        ${primary ? `root.style.setProperty('--primary', ${JSON.stringify(primary)});` : ''}
        ${primaryFg ? `root.style.setProperty('--primary-foreground', ${JSON.stringify(primaryFg)});` : ''}
        ${secondary ? `root.style.setProperty('--secondary', ${JSON.stringify(secondary)});` : ''}
        ${secondaryFg ? `root.style.setProperty('--secondary-foreground', ${JSON.stringify(secondaryFg)});` : ''}
        ${tertiary ? `root.style.setProperty('--tertiary', ${JSON.stringify(tertiary)});` : ''}
        ${tertiaryFg ? `root.style.setProperty('--tertiary-foreground', ${JSON.stringify(tertiaryFg)});` : ''}
        ${muted ? `root.style.setProperty('--muted', ${JSON.stringify(muted)});` : ''}
        ${muted ? `root.style.setProperty('--background', ${JSON.stringify(muted)});` : ''}
        ${muted ? `root.style.setProperty('--card', ${JSON.stringify(muted)});` : ''}
        ${primary ? `root.style.setProperty('--chat-bubble-user', ${JSON.stringify(primary)});` : ''}
        ${
          muted
            ? `var appBg = 'hsl(' + ${JSON.stringify(muted)} + ')';
        root.style.backgroundColor = appBg;
        if (document.body) document.body.style.backgroundColor = appBg;`
            : ''
        }
        window.dispatchEvent(new CustomEvent('TUKUA_APP_THEME', {
          detail: { theme: ${JSON.stringify(themeId)}, chatBg: ${JSON.stringify(chatBgPattern)} }
        }));
      } catch (e) {}
      true;
    })();
  `;
}

/**
 * Push the preferred font + size into the SPA (mirrors web
 * `src/lib/fontUtils.ts` `applyFontPreference` / `applyFontSize` — same
 * `--chat-font-*` CSS vars the chat/profile pages already read).
 */
export function buildFontChromeInjectScript(
  fontFamily: string,
  fontSize: number,
  fontWeight?: string,
  fontStyle?: string,
) {
  return `
    (function() {
      try {
        var root = document.documentElement;
        root.style.setProperty('--chat-font-family', ${JSON.stringify(fontFamily)});
        ${fontWeight ? `root.style.setProperty('--chat-font-weight', ${JSON.stringify(fontWeight)});` : "root.style.removeProperty('--chat-font-weight');"}
        ${fontStyle ? `root.style.setProperty('--chat-font-style', ${JSON.stringify(fontStyle)});` : "root.style.removeProperty('--chat-font-style');"}
        root.style.setProperty('--chat-font-size', ${JSON.stringify(`${fontSize}px`)});
      } catch (e) {}
      true;
    })();
  `;
}

/** Push the latest native session into an already-loaded WebView (no navigation). */
export function buildSessionResyncScript(session: Session, nestAccessToken?: string | null) {
  return `${buildPreloadSessionScript(session, nestAccessToken)}\ntrue;`;
}

export async function applyWebSessionTokens(accessToken: string, refreshToken: string) {
  const { persistPlatformNestSession } = await import('./platformNestAuth');
  const { persistSession, fetchProfileFromNest, nestSessionFromProfile } = await import('./auth');
  await persistPlatformNestSession(accessToken, refreshToken);
  const profile = await fetchProfileFromNest(accessToken);
  if (!profile) {
    log.warn('WebSession', 'apply nest tokens failed — no profile');
    return null;
  }
  const session = nestSessionFromProfile(accessToken, refreshToken || accessToken, profile);
  await persistSession(session);
  log.info('WebSession', 'nest tokens adopted', { userId: session.user.id });
  return session;
}

export async function getActiveSessionScript(targetPath?: string) {
  const { restoreSession } = await import('./auth');
  const session = await restoreSession();
  if (!session) {
    log.warn('WebSession', 'no nest session for inject');
    return null;
  }
  const { resolveNestAccessTokenForWebView } = await import('./platformNestAuth');
  const nestTok = await resolveNestAccessTokenForWebView();
  return buildWebViewSessionScript(session, targetPath ?? '/chat', nestTok);
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
    // Allow initial load of web-only tabs (courses list/detail, profile).
    // Course detail paths must not 404-block when the WebView cold-loads them.
    if (
      u.pathname === '/courses' ||
      u.pathname.startsWith('/courses/') ||
      u.pathname === '/profile' ||
      u.pathname.startsWith('/profile/')
    ) {
      return true;
    }
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
          localStorage.removeItem('${TUKUA_SESSION_KEY}');
          localStorage.removeItem('${NEST_ACCESS_KEY}');
          localStorage.removeItem('tukua_nest_api_base');
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
 * install a watcher that reports the Nest session back to native the moment
 * web registration/sign-in establishes one.
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
        var nestKey = '${NEST_ACCESS_KEY}';
        var sessionKey = '${TUKUA_SESSION_KEY}';
        var seen = null;
        setInterval(function() {
          try {
            var nestTok = localStorage.getItem(nestKey);
            var raw = localStorage.getItem(sessionKey);
            var access = nestTok;
            var refresh = nestTok;
            if (raw) {
              var parsed = JSON.parse(raw);
              if (parsed && parsed.access_token) {
                access = parsed.access_token;
                refresh = parsed.refresh_token || parsed.access_token;
              }
            }
            if (!access) return;
            if (seen === access) return;
            seen = access;
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'TUKUA_SESSION_UPDATED',
                access_token: access,
                refresh_token: refresh || access
              })
            );
          } catch (e) {}
        }, 1000);
      } catch (e) {}
      true;
    })();
  `;
}
