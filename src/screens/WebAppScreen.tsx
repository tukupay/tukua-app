import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Colors } from '../theme/yana';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import {
  buildClientNavigateScript,
  buildFastTabNavigateScript,
  buildMobileChatTabBarStylesScript,
  buildPreloadSessionScript,
  buildSessionResyncScript,
  buildSpaNavigateScript,
  buildSupabaseRefreshAndNavigateScript,
  applyWebSessionTokens,
  getActiveSessionScript,
  isMainFrameWebViewRequest,
  shouldAllowWebViewNavigation,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
import { useRegisterTabJumper } from '../hooks/useRegisterTabJumper';
import { historyKeyFromUrl, TabHistoryStack } from '../lib/webviewHistory';
import { useAuth } from '../context/AuthContext';
import { useWebViewControl } from '../context/WebViewControlContext';
import { log } from '../lib/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  path: string;
  label?: string;
};

const isChatPath = (path: string) => path === '/chat';

function isAtTabRoot(pathname: string, tabPath: string) {
  if (pathname === tabPath) return true;
  if (tabPath === '/chat' && (pathname === '/' || pathname === '/chat')) return true;
  return false;
}

function matchesTabPath(pathname: string, tabPath: string) {
  if (tabPath === '/chat') {
    return pathname === '/' || pathname === '/chat' || pathname.startsWith('/chat/');
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

export function WebAppScreen({ path, label }: Props) {
  const webRef = useRef<WebView>(null);
  const isFocused = useIsFocused();
  useRegisterTabJumper();
  const { register, registerTabFocusHandler, consumePendingRoute, navigate: navigateWeb } = useWebViewControl();
  const { session, ensureFreshSession, logout } = useAuth();
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
  const loadingLabel = (label ?? path.replace('/', '')) || 'page';
  const tabBarInsetPx = TAB_BAR_BODY_HEIGHT + insets.bottom;

  const injectChatComposerInsets = useCallback(() => {
    if (!chatMode || !webRef.current) return;
    webRef.current.injectJavaScript(`${buildMobileChatTabBarStylesScript(tabBarInsetPx)}\ntrue;`);
  }, [chatMode, tabBarInsetPx]);

  const sessionInjectKey = session ? `${session.user.id}:${session.access_token}` : null;
  const preInject = useMemo(() => {
    if (!session) return null;
    return buildPreloadSessionScript(session);
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
      const script = chatMode
        ? buildSupabaseRefreshAndNavigateScript(session, path)
        : buildFastTabNavigateScript(session, path);
      webRef.current.injectJavaScript(`${script}\ntrue;`);
      setTimeout(() => {
        bootstrapPendingRef.current = false;
      }, chatMode ? 4000 : 400);
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
        webRef.current.injectJavaScript(`${buildFastTabNavigateScript(session, target)}\ntrue;`);
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
      if (!session) return;
      syncTabRoute('screen focus');
      void (async () => {
        const fresh = await ensureFreshSession();
        if (!fresh) {
          log.warn('WebApp', 'session expired on focus — logging out', { path });
          await logout();
          return;
        }
        if (webRef.current && bootstrappedRef.current) {
          webRef.current.injectJavaScript(buildSessionResyncScript(fresh));
        }
      })();
    }, [ensureFreshSession, logout, session, syncTabRoute]),
  );

  useEffect(() => {
    if (!session || !isFocused || !bootstrappedRef.current || !webRef.current) return;
    webRef.current.injectJavaScript(buildSessionResyncScript(session));
  }, [session?.access_token, isFocused, session]);

  useEffect(() => {
    if (!pageLoading || !isFocused) return;
    const timer = setTimeout(() => {
      log.warn('WebApp', 'loading timeout — recovering', { path });
      setPageLoading(false);
      if (!bootstrappedRef.current && session && shellReadyRef.current) {
        scheduleBootstrap('loading timeout recovery');
      }
    }, 15000);
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

    if (canGoBack) {
      pendingWebBackRef.current = true;
      webRef.current?.goBack();
      return true;
    }

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
      if (!fresh) {
        log.warn('WebApp', 'session expired on web bounce — logging out');
        await logout();
        return;
      }

      if (chatMode) {
        log.warn('WebApp', 'chat sign-in bounce — reloading webview', {
          attempt: recoverCountRef.current,
        });
        webRef.current?.injectJavaScript(buildPreloadSessionScript(fresh));
        setTimeout(() => webRef.current?.reload(), 200);
        return;
      }

      bootstrappedRef.current = false;
      webRef.current?.injectJavaScript(
        `${buildSupabaseRefreshAndNavigateScript(fresh, path)}\ntrue;`,
      );
    })();
  }, [chatMode, ensureFreshSession, logout, path]);

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
        if (!isAtTabRoot(pathname, path) || !nav.loading) {
          setPageLoading(false);
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
            `${buildFastTabNavigateScript(session, currentPathnameRef.current)}\ntrue;`,
          );
        }
        return;
      }

      setCurrentPathname(pathname);
      if (nav.url.includes('tukua.ai') && !nav.loading) {
        shellReadyRef.current = true;
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
          : buildFastTabNavigateScript(session, pathname);
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
            `${buildFastTabNavigateScript(session, pending)}\ntrue;`,
          );
          setCurrentPathname(pending);
        }
      } else if (msg.type === 'TUKUA_CHAT_RELOAD') {
        log.info('WebApp', 'chat shell reload for supabase hydrate');
        bootstrapPendingRef.current = false;
        bootstrappedRef.current = false;
        shellReadyRef.current = false;
        setPageLoading(true);
      } else if (msg.type === 'TUKUA_SHELL_BLANK') {
        const target = typeof msg.path === 'string' ? msg.path : path;
        log.warn('WebApp', 'shell blank after blocked nav — recovering', { path, target });
        bootstrappedRef.current = false;
        webRef.current?.injectJavaScript(buildPreloadSessionScript(session!));
        setTimeout(() => {
          webRef.current?.reload();
          setTimeout(() => {
            if (session && webRef.current) {
              webRef.current.injectJavaScript(
                `${buildSupabaseRefreshAndNavigateScript(session, target)}\ntrue;`,
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
            const targetPath = new URL(target, 'https://tukua.ai').pathname;
            if (matchesTabPath(targetPath, path) && webRef.current) {
              webRef.current.injectJavaScript(
                `${buildSpaNavigateScript(targetPath, { force: true, push: true })}\ntrue;`,
              );
              setCurrentPathname(targetPath);
              recordHistory(`https://tukua.ai${targetPath}`, false);
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
        const href = typeof msg.href === 'string' ? msg.href : `https://tukua.ai${routePath}`;
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
    pageLoading && isFocused && isAtTabRoot(currentPathname, path);

  return (
    <View style={styles.container}>
      {showOverlay && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading {loadingLabel}…</Text>
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ uri: shellUrl }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*']}
        onLoadEnd={() => {
          bootstrapPendingRef.current = false;
          shellReadyRef.current = true;
          log.info('WebApp', 'shell loaded', { shellUrl, target: path, focused: isFocused });
          if (isFocused && !bootstrappedRef.current && session) {
            scheduleBootstrap('bootstrap shell');
          } else if (isFocused && bootstrappedRef.current) {
            injectChatComposerInsets();
            setPageLoading(false);
          }
        }}
        onError={(e) => {
          log.error('WebApp', 'webview error', e.nativeEvent);
          setPageLoading(false);
        }}
        onHttpError={(e) => {
          const { statusCode, url } = e.nativeEvent;
          log.error('WebApp', 'http error', { statusCode, url });
          if (statusCode === 404 && url.includes('tukua.ai')) {
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
        allowsFullscreenVideo
        onMessage={(e) => handleWebMessage(e.nativeEvent.data)}
        injectedJavaScriptBeforeContentLoaded={preInject}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        geolocationEnabled
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  web: { flex: 1 },
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
});
