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
  buildSupabaseRefreshAndNavigateScript,
  getActiveSessionScript,
  shouldAllowWebViewRequest,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
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
  const { register, registerTabFocusHandler, consumePendingRoute } = useWebViewControl();
  const { session } = useAuth();
  const [booting, setBooting] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(path);
  const bootstrapPendingRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const shellReadyRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const recoverCountRef = useRef(0);
  const lastRecoverRef = useRef(0);
  const insets = useSafeAreaInsets();
  const shellUrl = tukuaSpaShellUrl();
  const chatMode = isChatPath(path);
  const loadingLabel = (label ?? path.replace('/', '')) || 'page';
  const tabBarInsetPx = TAB_BAR_BODY_HEIGHT + insets.bottom;

  const injectChatComposerInsets = useCallback(() => {
    if (!chatMode || !webRef.current) return;
    webRef.current.injectJavaScript(`${buildMobileChatTabBarStylesScript(tabBarInsetPx)}\ntrue;`);
  }, [chatMode, tabBarInsetPx]);

  const preInject = useMemo(() => {
    if (!session) return null;
    const sessionScript = buildPreloadSessionScript(session);
    if (chatMode) return sessionScript;
    return `${sessionScript}\n${buildClientNavigateScript(path, true)}`;
  }, [session, path, chatMode]);

  useEffect(() => {
    return register(path, webRef);
  }, [path, register]);

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
      log.info('WebApp', reason, { path });
      webRef.current.injectJavaScript(
        `${buildSupabaseRefreshAndNavigateScript(session, path)}\ntrue;`,
      );
      setTimeout(() => {
        bootstrapPendingRef.current = false;
      }, chatMode ? 4000 : 900);
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

        const pending = consumePendingRoute(path);
        const target = pending ?? path;

        log.info('WebApp', 'sync tab route', { path, target, currentPathname, reason });
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
    [
      consumePendingRoute,
      currentPathname,
      injectChatComposerInsets,
      path,
      scheduleBootstrap,
      session,
    ],
  );

  useEffect(() => {
    return registerTabFocusHandler(path, () => syncTabRoute('bottom tab'));
  }, [path, registerTabFocusHandler, syncTabRoute]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      syncTabRoute('screen focus');
    }, [session, syncTabRoute]),
  );

  const goToTabRoot = useCallback(() => {
    if (!session || !webRef.current) return;
    webRef.current.injectJavaScript(`${buildClientNavigateScript(path)}\ntrue;`);
    setCurrentPathname(path);
  }, [path, session]);

  const handleHardwareBack = useCallback(() => {
    if (!isFocused) return false;

    if (canGoBack) {
      webRef.current?.goBack();
      return true;
    }

    if (!isAtTabRoot(currentPathname, path)) {
      goToTabRoot();
      return true;
    }

    return true;
  }, [canGoBack, currentPathname, goToTabRoot, isFocused, path]);

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

    if (chatMode) {
      log.warn('WebApp', 'chat sign-in bounce — reloading webview', {
        attempt: recoverCountRef.current,
      });
      webRef.current?.injectJavaScript(buildPreloadSessionScript(session!));
      setTimeout(() => webRef.current?.reload(), 200);
      return;
    }

    bootstrappedRef.current = false;
    injectBootstrap('recover from sign-in bounce');
  }, [injectBootstrap, chatMode, session]);

  const handleNav = (nav: WebViewNavigation) => {
    if (!nav.url) return;
    setCanGoBack(nav.canGoBack);
    log.info('WebApp', 'nav', { path, url: nav.url, loading: nav.loading, canGoBack: nav.canGoBack });

    if (!session) return;

    try {
      const pathname = new URL(nav.url).pathname;
      setCurrentPathname(pathname);
      if (nav.url.includes('tukua.ai') && !nav.loading) {
        shellReadyRef.current = true;
      }
      if (pathname.includes('/sign-in') && path !== '/sign-in') {
        log.warn('WebApp', 'web sign-in bounce', { pathname, attempt: recoverCountRef.current + 1 });
        recoverFromSignIn();
      } else if (matchesTabPath(pathname, path)) {
        setPageLoading(false);
      }
    } catch {
      // ignore malformed urls
    }
  };

  const handleBlockedRequest = (url: string) => {
    log.info('WebApp', 'blocked server route', { url, path });
    webRef.current?.stopLoading();
    bootstrappedRef.current = false;
    injectBootstrap('blocked server route');
  };

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
      } else if (msg.type === 'TUKUA_SESSION_SYNCED') {
        log.info('WebApp', 'supabase session synced');
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

  const showOverlay = pageLoading && isFocused;

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
          const allowed = shouldAllowWebViewRequest(req.url);
          if (!allowed) {
            handleBlockedRequest(req.url);
          }
          return allowed;
        }}
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
