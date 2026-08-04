import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { hideSystemStatusBar } from '../components/ImmersiveSystemBars';
import { Colors, TukuaWeb } from '../theme/yana';
import { TAB_BAR_BODY_HEIGHT, floatingHeaderInset } from '../constants/layout';
import {
  buildFastTabNavigateScript,
  buildMobileChatTabBarStylesScript,
  buildMobileInPageBackScript,
  buildPreloadSessionScript,
  buildSessionResyncScript,
  buildSpaNavigateScript,
  buildSupabaseRefreshAndNavigateScript,
  buildThemeChromeInjectScript,
  buildFontChromeInjectScript,
  applyWebSessionTokens,
  getActiveSessionScript,
  isMainFrameWebViewRequest,
  shouldAllowWebViewNavigation,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
import { useRegisterTabJumper } from '../hooks/useRegisterTabJumper';
import { historyKeyFromUrl, TabHistoryStack } from '../lib/webviewHistory';
import { isAppWebHost } from '../lib/localHost';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/AppThemeContext';
import { useFontPreference } from '../context/FontPreferenceContext';
import { useWebViewControl } from '../context/WebViewControlContext';
import { log } from '../lib/logger';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../lib/webViewMedia';
import { resolveNestAccessTokenForWebView } from '../lib/platformNestAuth';
import { ensureWebViewUploadPermissions, getWebViewUploadProps } from '../lib/webViewUploads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hslToCssVar, SCHOOL_THEME_HSL } from '../theme/schoolThemes';

const TAB_FOCUS_AUTH_CHECK_MS = 60_000;
let lastTabFocusAuthCheckAt = 0;

type Props = {
  path: string;
  label?: string;
};

const isChatPath = (path: string) => path === '/chat';

function isAtTabRoot(pathname: string, tabPath: string) {
  if (pathname === tabPath) return true;
  if (tabPath === '/chat' && (pathname === '/' || pathname === '/chat')) return true;
  if (tabPath === '/courses' && pathname === '/courses') return true;
  if (tabPath === '/profile' && pathname === '/profile') return true;
  return false;
}

function matchesTabPath(pathname: string, tabPath: string) {
  if (tabPath === '/chat') {
    // Chat shell also hosts platform superadmin (same SPA, Overview-style nav from Dashboard).
    return (
      pathname === '/' ||
      pathname === '/chat' ||
      pathname.startsWith('/chat/') ||
      pathname === '/superadmin' ||
      pathname.startsWith('/superadmin/')
    );
  }
  // Course detail opens as CourseWeb with path `/courses/:id` — treat the whole
  // courses tree as in-tab so SPA sub-nav does not thrash bootstrap.
  if (tabPath === '/courses' || tabPath.startsWith('/courses/')) {
    return pathname === '/courses' || pathname.startsWith('/courses/');
  }
  if (tabPath === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/');
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

export function WebAppScreen({ path, label }: Props) {
  const webRef = useRef<WebView>(null);
  const nestTokRef = useRef<string | null>(null);
  const isFocused = useIsFocused();
  useRegisterTabJumper();
  const { register, registerTabFocusHandler, consumePendingRoute, navigate: navigateWeb } =
    useWebViewControl();
  const { session, ensureFreshSession, logout } = useAuth();
  const { themeId, chatBgPattern } = useAppTheme();
  const { webFamily, webWeight, webStyle, fontSize } = useFontPreference();

  useEffect(() => {
    let cancelled = false;
    nestTokRef.current = null;
    if (!session) return;
    void resolveNestAccessTokenForWebView().then((tok) => {
      if (!cancelled) nestTokRef.current = tok;
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.access_token]);

  const [booting, setBooting] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentPathname, setCurrentPathnameState] = useState(path);
  const currentPathnameRef = useRef(path);
  const setCurrentPathname = useCallback((next: string) => {
    currentPathnameRef.current = next;
    setCurrentPathnameState(next);
  }, []);
  const bootstrapPendingRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const shellReadyRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const recoverCountRef = useRef(0);
  const lastRecoverRef = useRef(0);
  const historyRef = useRef(new TabHistoryStack(path));
  const pendingWebBackRef = useRef(false);
  const insets = useSafeAreaInsets();
  const shellUrl = tukuaSpaShellUrl();
  const chatMode = isChatPath(path);
  const webOnlyTab = path === '/courses' || path === '/profile';
  const loadingLabel = (label ?? path.replace('/', '')) || 'page';
  const tabBarInsetPx = TAB_BAR_BODY_HEIGHT + insets.bottom;
  /** Native top pad clears floating header; keep it light so the fade stays transparent. */
  const webTopClearance = floatingHeaderInset(insets.top);

  const injectChatComposerInsets = useCallback(() => {
    if (!webRef.current) return;
    // top=0: WebView is already padded below the floating nav
    webRef.current.injectJavaScript(
      `${buildMobileChatTabBarStylesScript(tabBarInsetPx, 0)}\ntrue;`,
    );
  }, [tabBarInsetPx]);

  const sessionInjectKey = session ? `${session.user.id}:${session.access_token}` : null;
  const preInject = useMemo(() => {
    if (!session) return null;
    return buildPreloadSessionScript(session, nestTokRef.current);
  }, [sessionInjectKey, session]);

  useEffect(() => {
    return register(path, webRef);
  }, [path, register]);

  useEffect(() => {
    historyRef.current.reset(path);
  }, [path]);

  const recordHistory = useCallback((url: string, replace = false) => {
    const entry = historyKeyFromUrl(url);
    historyRef.current.push(entry.key, entry.spa, replace);
  }, []);

  const navigateToHistoryEntry = useCallback(
    (key: string, spa: boolean) => {
      if (!webRef.current) return;
      if (spa) {
        webRef.current.injectJavaScript(`${buildSpaNavigateScript(key, { force: true })}\ntrue;`);
        setCurrentPathname(key);
        return;
      }
      webRef.current.injectJavaScript(`window.location.href=${JSON.stringify(key)};true;`);
    },
    [setCurrentPathname],
  );

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      recoverCountRef.current = 0;
      bootstrapPendingRef.current = false;
      bootstrappedRef.current = false;
      shellReadyRef.current = false;
    }

    if (session) {
      setBooting(false);
      log.info('WebApp', `ready ${path}`, { email: session.user.email, shellUrl, chatMode });
      return;
    }

    getActiveSessionScript(path).then((script) => {
      setBooting(!script);
      if (!script) log.warn('WebApp', `no session script for ${path}`);
    });
  }, [session?.user?.id, session, path, shellUrl, chatMode]);

  const injectBootstrap = useCallback(
    (reason: string) => {
      if (!session || !webRef.current || bootstrapPendingRef.current) return;
      bootstrapPendingRef.current = true;
      log.info('WebApp', reason, { path, chatMode });
      void (async () => {
        try {
          const nestTok =
            nestTokRef.current ?? (await resolveNestAccessTokenForWebView());
          nestTokRef.current = nestTok;
          if (!webRef.current) return;
          const script = chatMode
            ? buildSupabaseRefreshAndNavigateScript(session, path, nestTok)
            : buildFastTabNavigateScript(session, path, nestTok);
          webRef.current.injectJavaScript(`${script}\ntrue;`);
        } finally {
          setTimeout(() => {
            bootstrapPendingRef.current = false;
          }, chatMode ? 4000 : 400);
        }
      })();
    },
    [session, path, chatMode],
  );

  const scheduleBootstrap = useCallback(
    (reason: string) => {
      if (!session || bootstrappedRef.current || bootstrapPendingRef.current) return;
      injectBootstrap(reason);
    },
    [injectBootstrap, session],
  );

  const syncTabRoute = useCallback(
    (reason: string) => {
      if (!session) return;

      const run = () => {
        if (!webRef.current) return false;

        if (!bootstrappedRef.current) {
          if (shellReadyRef.current) {
            scheduleBootstrap(reason);
          }
          return shellReadyRef.current;
        }

        if (!shellReadyRef.current) return false;

        const spaPath = currentPathnameRef.current;
        const pending = consumePendingRoute(path);
        if (!pending && matchesTabPath(spaPath, path)) {
          setPageLoading(false);
          injectChatComposerInsets();
          return true;
        }

        const target = pending ?? path;

        log.info('WebApp', 'sync tab route', { path, target, currentPathname: spaPath, reason });
        webRef.current.injectJavaScript(`${buildFastTabNavigateScript(session, target, nestTokRef.current)}\ntrue;`);
        injectChatComposerInsets();
        setCurrentPathname(target);
        setPageLoading(false);
        return true;
      };

      if (run()) return;

      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (run() || attempts >= 20) clearInterval(timer);
      }, 100);
    },
    [consumePendingRoute, injectChatComposerInsets, path, scheduleBootstrap, session],
  );

  useEffect(() => {
    return registerTabFocusHandler(path, () => syncTabRoute('bottom tab'));
  }, [path, registerTabFocusHandler, syncTabRoute]);

  useFocusEffect(
    useCallback(() => {
      hideSystemStatusBar();
      if (!session) return;
      syncTabRoute('screen focus');

      if (path === '/profile' || path === '/activate') {
        void ensureWebViewUploadPermissions();
      }

      const now = Date.now();
      if (now - lastTabFocusAuthCheckAt < TAB_FOCUS_AUTH_CHECK_MS) return;
      lastTabFocusAuthCheckAt = now;

      void (async () => {
        const fresh = await ensureFreshSession();
        if (!fresh && !session) {
          log.warn('WebApp', 'session expired on tab focus — logging out', { path });
          await logout();
        }
      })();
    }, [ensureFreshSession, logout, path, session, syncTabRoute]),
  );

  useEffect(() => {
    if (!session || !isFocused || !bootstrappedRef.current || !webRef.current) return;
    webRef.current.injectJavaScript(buildSessionResyncScript(session, nestTokRef.current));
  }, [session?.access_token, isFocused, session]);

  useEffect(() => {
    // Re-inject whenever theme/chat-bg changes — even if this tab is not focused
    // (Chat stays mounted; ThemesScreen updates must reach the WebView immediately).
    if (!webRef.current) return;
    const hsl = SCHOOL_THEME_HSL[themeId];
    const vars = hsl
      ? {
          primary: hslToCssVar(hsl.primary),
          secondary: hslToCssVar(hsl.secondary),
          tertiary: hslToCssVar(hsl.tertiary),
          muted: hslToCssVar(hsl.muted),
          primaryForeground: hslToCssVar(hsl.primaryForeground),
          secondaryForeground: hslToCssVar(hsl.secondaryForeground),
          tertiaryForeground: hslToCssVar(hsl.tertiaryForeground),
        }
      : undefined;
    webRef.current.injectJavaScript(buildThemeChromeInjectScript(themeId, chatBgPattern, vars));
  }, [themeId, chatBgPattern, path]);

  useEffect(() => {
    if (!webRef.current || !isFocused) return;
    webRef.current.injectJavaScript(buildFontChromeInjectScript(webFamily, fontSize, webWeight, webStyle));
  }, [webFamily, webWeight, webStyle, fontSize, isFocused, path]);

  useEffect(() => {
    if (!pageLoading || !isFocused) return;
    const timer = setTimeout(() => {
      log.warn('WebApp', 'loading timeout — recovering', { path });
      setPageLoading(false);
      if (!bootstrappedRef.current && session && shellReadyRef.current) {
        scheduleBootstrap('loading timeout recovery');
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [pageLoading, isFocused, path, scheduleBootstrap, session]);

  const goToTabRoot = useCallback(() => {
    if (!session || !webRef.current) return;
    webRef.current.injectJavaScript(`${buildSpaNavigateScript(path, { force: true })}\ntrue;`);
    setCurrentPathname(path);
    historyRef.current.reset(path);
  }, [path, session]);

  const handleHardwareBack = useCallback(() => {
    if (!isFocused) return false;

    // Close artifact / live-stream overlays — not iframe history inside embeds.
    webRef.current?.injectJavaScript(`${buildMobileInPageBackScript()}\ntrue;`);

    if (historyRef.current.canPop()) {
      const prev = historyRef.current.pop();
      if (prev) {
        log.info('WebApp', 'history back', { path, to: prev.key });
        navigateToHistoryEntry(prev.key, prev.spa);
        return true;
      }
    }

    if (!isAtTabRoot(currentPathname, path)) {
      goToTabRoot();
      return true;
    }

    // Native WebView back only for external full-page history (e.g. Jitsi), not iframe embeds on /chat.
    const top = historyRef.current.peek();
    if (canGoBack && !top.spa && isAtTabRoot(currentPathname, path)) {
      pendingWebBackRef.current = true;
      webRef.current?.goBack();
      return true;
    }

    return true;
  }, [canGoBack, currentPathname, goToTabRoot, isFocused, navigateToHistoryEntry, path]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [handleHardwareBack]);

  const recoverFromSignIn = useCallback(() => {
    const now = Date.now();
    if (now - lastRecoverRef.current < 3000) return;
    if (recoverCountRef.current >= 3) {
      log.warn('WebApp', 'sign-in bounce limit reached', { path });
      return;
    }
    lastRecoverRef.current = now;
    recoverCountRef.current += 1;

    void (async () => {
      const fresh = await ensureFreshSession();
      if (!fresh && !session) {
        log.warn('WebApp', 'session expired on web bounce — logging out');
        await logout();
        return;
      }
      const active = fresh ?? session;
      if (!active) return;

      if (chatMode) {
        log.warn('WebApp', 'chat sign-in bounce — re-inject session (no full reload)', {
          attempt: recoverCountRef.current,
        });
        webRef.current?.injectJavaScript(buildPreloadSessionScript(active, nestTokRef.current));
        webRef.current?.injectJavaScript(
          `${buildSpaNavigateScript(path, { force: true })}\ntrue;`,
        );
        setCurrentPathname(path);
        bootstrappedRef.current = true;
        bootstrapPendingRef.current = false;
        setPageLoading(false);
        return;
      }

      bootstrappedRef.current = false;
      const target = currentPathnameRef.current || path;
      webRef.current?.injectJavaScript(
        `${buildFastTabNavigateScript(active, target, nestTokRef.current)}\ntrue;`,
      );
    })();
  }, [chatMode, ensureFreshSession, logout, path, session]);

  const handleNav = (nav: WebViewNavigation) => {
    if (!nav.url) return;
    setCanGoBack(nav.canGoBack);
    log.info('WebApp', 'nav', { path, url: nav.url, loading: nav.loading, canGoBack: nav.canGoBack });

    if (!session) return;

    try {
      const entry = historyKeyFromUrl(nav.url);

      if (pendingWebBackRef.current && !nav.loading) {
        pendingWebBackRef.current = false;
        historyRef.current.syncToKey(entry.key);
      } else if (!nav.loading) {
        recordHistory(nav.url, false);
      }

      const pathname = new URL(nav.url).pathname;

      if (matchesTabPath(pathname, path)) {
        setCurrentPathname(pathname);
        if (!nav.loading) {
          setPageLoading(false);
          // Content is live — don't keep the opaque chat overlay waiting for a late bootstrap ping
          if (chatMode) {
            bootstrappedRef.current = true;
            bootstrapPendingRef.current = false;
          }
        }
        if (!nav.loading) {
          shellReadyRef.current = true;
        }
        return;
      }

      if (
        pathname === '/' &&
        path !== '/chat' &&
        matchesTabPath(currentPathnameRef.current, path) &&
        !isAtTabRoot(currentPathnameRef.current, path)
      ) {
        // Blocked SPA server loads bounce the shell to `/` — keep the in-app route.
        if (!nav.loading && webRef.current && session) {
          webRef.current.injectJavaScript(
            `${buildFastTabNavigateScript(session, currentPathnameRef.current, nestTokRef.current)}\ntrue;`,
          );
        }
        return;
      }

      setCurrentPathname(pathname);
      try {
        if (isAppWebHost(new URL(nav.url).hostname) && !nav.loading) {
          shellReadyRef.current = true;
        }
      } catch {
        // ignore
      }
      if (pathname.includes('/sign-in') && path !== '/sign-in') {
        log.warn('WebApp', 'web sign-in bounce', { pathname, attempt: recoverCountRef.current + 1 });
        recoverFromSignIn();
      }
    } catch {
      // ignore malformed urls
    }
  };

  const handleBlockedRequest = useCallback(
    (url: string) => {
      log.info('WebApp', 'blocked server route', { url, path });

      if (!session || !webRef.current) return;

      try {
        const pathname = new URL(url).pathname;
        if (!matchesTabPath(pathname, path)) return;

        log.info('WebApp', 'client navigate blocked route', { pathname, path });
        const script = bootstrappedRef.current
          ? buildSpaNavigateScript(pathname, { force: true, push: true })
          : buildFastTabNavigateScript(session, pathname, nestTokRef.current);
        webRef.current.injectJavaScript(`${script}\ntrue;`);
        setCurrentPathname(pathname);
        recordHistory(url, false);
        setPageLoading(false);

        setTimeout(() => {
          webRef.current?.injectJavaScript(`
            (function() {
              var root = document.getElementById('root');
              if (root && root.childElementCount > 0) return;
              try {
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'TUKUA_SHELL_BLANK', path: ${JSON.stringify(pathname)} })
                );
              } catch (e) {}
              true;
            })();
          `);
        }, 500);
      } catch {
        // ignore malformed urls
      }
    },
    [path, recordHistory, session],
  );

  const handleWebMessage = (raw: string) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'TUKUA_BOOTSTRAP_OK') {
        log.info('WebApp', 'bootstrap ok', { path: msg.path });
        bootstrappedRef.current = true;
        bootstrapPendingRef.current = false;
        setPageLoading(false);
        injectChatComposerInsets();
        const pending = consumePendingRoute(path);
        if (pending && pending !== msg.path && session && webRef.current) {
          log.info('WebApp', 'pending route inject', { path, pending });
          webRef.current.injectJavaScript(
            `${buildFastTabNavigateScript(session, pending, nestTokRef.current)}\ntrue;`,
          );
          setCurrentPathname(pending);
        }
      } else if (msg.type === 'TUKUA_CHAT_RELOAD') {
        log.info('WebApp', 'chat shell reload for supabase hydrate');
        // Soft re-hydrate — keep chat visible; avoid a long opaque loader
        bootstrapPendingRef.current = false;
        if (session && webRef.current) {
          webRef.current.injectJavaScript(buildPreloadSessionScript(session, nestTokRef.current));
        }
      } else if (msg.type === 'TUKUA_SHELL_BLANK') {
        const target = typeof msg.path === 'string' ? msg.path : path;
        log.warn('WebApp', 'shell blank after blocked nav — recovering', { path, target });
        bootstrappedRef.current = false;
        webRef.current?.injectJavaScript(buildPreloadSessionScript(session!, nestTokRef.current));
        setTimeout(() => {
          webRef.current?.reload();
          setTimeout(() => {
            if (session && webRef.current) {
              webRef.current.injectJavaScript(
                `${buildSupabaseRefreshAndNavigateScript(session, target, nestTokRef.current)}\ntrue;`,
              );
              setCurrentPathname(target);
            }
          }, 600);
        }, 150);
      } else if (msg.type === 'TUKUA_NAVIGATE') {
        const target = typeof msg.path === 'string' ? msg.path : '';
        if (target) {
          log.info('WebApp', 'cross-tab navigate', { from: path, target });
          try {
            const targetPath = new URL(target, TukuaWeb.base).pathname;
            if (matchesTabPath(targetPath, path) && webRef.current) {
              webRef.current.injectJavaScript(
                `${buildSpaNavigateScript(targetPath, { force: true, push: true })}\ntrue;`,
              );
              setCurrentPathname(targetPath);
              recordHistory(`${TukuaWeb.base.replace(/\/$/, '')}${targetPath}`, false);
              setPageLoading(false);
            } else {
              navigateWeb(targetPath);
            }
          } catch {
            navigateWeb(target);
          }
        }
      } else if (msg.type === 'TUKUA_ROUTE') {
        const routePath = typeof msg.path === 'string' ? msg.path : '';
        const replace = msg.kind === 'replace' || msg.kind === 'init';
        const href =
          typeof msg.href === 'string'
            ? msg.href
            : `${TukuaWeb.base.replace(/\/$/, '')}${routePath}`;
        if (routePath && matchesTabPath(routePath, path)) {
          setCurrentPathname(routePath);
          if (!replace) {
            recordHistory(href, false);
          } else {
            recordHistory(href, true);
          }
          setPageLoading(false);
        }
      } else if (msg.type === 'TUKUA_SESSION_SYNCED') {
        log.info('WebApp', 'supabase session synced');
        if (chatMode) {
          bootstrappedRef.current = true;
          bootstrapPendingRef.current = false;
          // Keep pageLoading until TUKUA_CHAT_READY so user sees a loader, not a blank pane.
        }
      } else if (msg.type === 'TUKUA_CHAT_READY') {
        log.info('WebApp', 'chat ready');
        bootstrappedRef.current = true;
        bootstrapPendingRef.current = false;
        setPageLoading(false);
      } else if (msg.type === 'TUKUA_SESSION_UPDATED') {
        if (typeof msg.access_token === 'string' && typeof msg.refresh_token === 'string') {
          void applyWebSessionTokens(msg.access_token, msg.refresh_token);
        }
      } else if (msg.type === 'TUKUA_SESSION_SYNC_WARN') {
        log.warn('WebApp', 'supabase refresh warn', { status: msg.status });
      } else if (msg.type === 'TUKUA_BOOTSTRAP_ERR') {
        log.error('WebApp', 'bootstrap err', { error: msg.error });
        setPageLoading(false);
      }
    } catch {
      // ignore non-json messages
    }
  };

  if (booting || !preInject) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Starting {loadingLabel}…</Text>
      </View>
    );
  }

  const showOverlay =
    pageLoading &&
    isFocused &&
    isAtTabRoot(currentPathname, path) &&
    !bootstrappedRef.current &&
    !webOnlyTab;

  // Show until SPA posts TUKUA_CHAT_READY (or bootstrap timeout clears pageLoading).
  const showChatLoader = chatMode && isFocused && (booting || pageLoading);

  return (
    <View style={[styles.container, { paddingTop: webTopClearance }]}>
      {showOverlay && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading {loadingLabel}…</Text>
        </View>
      )}

      {showChatLoader && (
        <View style={styles.chatLoaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading chat…</Text>
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ uri: shellUrl }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*']}
        onLoadEnd={() => {
          hideSystemStatusBar();
          bootstrapPendingRef.current = false;
          shellReadyRef.current = true;
          log.info('WebApp', 'shell loaded', { shellUrl, target: path, focused: isFocused });
          if (!bootstrappedRef.current && session) {
            scheduleBootstrap('bootstrap shell');
          } else if (bootstrappedRef.current) {
            injectChatComposerInsets();
            setPageLoading(false);
            if (isFocused) syncTabRoute('shell reload');
          }
          // Chat: wait for TUKUA_CHAT_READY. Fallback so loader never sticks forever.
          if (chatMode) {
            setTimeout(() => {
              if (shellReadyRef.current && bootstrappedRef.current) {
                setPageLoading(false);
              }
            }, 12_000);
          }
        }}
        onError={(e) => {
          log.error('WebApp', 'webview error', e.nativeEvent);
          setPageLoading(false);
        }}
        onHttpError={(e) => {
          const { statusCode, url } = e.nativeEvent;
          log.error('WebApp', 'http error', { statusCode, url });
          if (statusCode === 404 && (() => { try { return isAppWebHost(new URL(url).hostname); } catch { return false; } })()) {
            handleBlockedRequest(url);
          } else {
            setPageLoading(false);
          }
        }}
        onNavigationStateChange={handleNav}
        onShouldStartLoadWithRequest={(req) => {
          const allowed = shouldAllowWebViewNavigation(req.url, req);
          if (!allowed) {
            try {
              const pathname = new URL(req.url).pathname;
              if (matchesTabPath(pathname, path) && isMainFrameWebViewRequest(req)) {
                handleBlockedRequest(req.url);
              }
            } catch {
              // ignore malformed urls
            }
          }
          return allowed;
        }}
        nestedScrollEnabled={Platform.OS === 'android'}
        onMessage={(e) => handleWebMessage(e.nativeEvent.data)}
        injectedJavaScriptBeforeContentLoaded={preInject}
        cacheEnabled
        cacheMode={Platform.OS === 'android' ? 'LOAD_CACHE_ELSE_NETWORK' : undefined}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
        {...getWebViewMediaProps()}
        {...getWebViewUploadProps()}
        injectedJavaScript={WEBVIEW_MEDIA_INJECT_JS}
        geolocationEnabled
        setSupportMultipleWindows={false}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode={Platform.OS === 'android' ? 'always' : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  web: { flex: 1, backgroundColor: Colors.white },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    gap: 12,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    zIndex: 10,
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedForeground,
    fontFamily: 'Inter_500Medium',
    textTransform: 'capitalize',
  },
  chatLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    zIndex: 20,
    gap: 12,
  },
});
