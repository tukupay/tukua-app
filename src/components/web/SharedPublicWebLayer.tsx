import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { useAboutWeb } from '../../context/AboutWebContext';
import {
  buildPublicPageNavigateScript,
  buildPublicPagePreloadScript,
  buildSessionResyncScript,
  isMainFrameWebViewRequest,
  shouldAllowWebViewNavigation,
  tukuaSpaShellUrl,
} from '../../lib/webviewAuth';
import { log } from '../../lib/logger';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../../lib/webViewMedia';
import { Colors } from '../../theme/yana';

const TOP_BAR_HEIGHT = 56;

function matchesPublicPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** One warm WebView for all About → public pages (pricing, opportunities, …). */
export function SharedPublicWebLayer() {
  const webRef = useRef<WebView>(null);
  const { session } = useAuth();
  const { publicPath } = useAboutWeb();
  const [loading, setLoading] = useState(false);
  const shellReadyRef = useRef(false);
  const warmedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);
  const shellUrl = tukuaSpaShellUrl();

  const preInject = useMemo(() => {
    if (!session) return null;
    return buildPublicPagePreloadScript(session);
  }, [session?.user?.id, session?.access_token]);

  const navigateToPage = useCallback(
    (targetPath: string, reason: string) => {
      if (!session || !webRef.current || !shellReadyRef.current) return;
      if (lastPathRef.current === targetPath) {
        setLoading(false);
        return;
      }
      log.info('PublicWeb', reason, { path: targetPath });
      webRef.current.injectJavaScript(`${buildPublicPageNavigateScript(targetPath)}\ntrue;`);
      lastPathRef.current = targetPath;
      setLoading(false);
    },
    [session],
  );

  useEffect(() => {
    if (!publicPath) {
      setLoading(false);
      return;
    }
    if (warmedRef.current && shellReadyRef.current) {
      navigateToPage(publicPath, 'reuse warm shell');
      return;
    }
    setLoading(true);
  }, [publicPath, navigateToPage]);

  useEffect(() => {
    if (!loading || !publicPath) return;
    const timer = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timer);
  }, [loading, publicPath]);

  useEffect(() => {
    if (!session || !shellReadyRef.current || !webRef.current) return;
    webRef.current.injectJavaScript(buildSessionResyncScript(session));
  }, [session?.access_token, session]);

  if (!session || !preInject) return null;

  const visible = !!publicPath;

  const handleNav = (nav: WebViewNavigation) => {
    if (!nav.url || !publicPath) return;
    try {
      const pathname = new URL(nav.url).pathname;
      if (nav.url.includes('tukua.ai') && !nav.loading) {
        shellReadyRef.current = true;
      }
      if (matchesPublicPath(pathname, publicPath)) {
        setLoading(false);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View
      style={[styles.host, !visible && styles.hidden]}
      pointerEvents={visible ? 'auto' : 'none'}
      collapsable={false}>
      {loading && visible && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      <WebView
        ref={webRef}
        source={{ uri: shellUrl }}
        style={[styles.web, visible && { marginTop: TOP_BAR_HEIGHT }]}
        originWhitelist={['https://*', 'http://*']}
        nestedScrollEnabled={Platform.OS === 'android'}
        cacheEnabled
        cacheMode={Platform.OS === 'android' ? 'LOAD_CACHE_ELSE_NETWORK' : undefined}
        injectedJavaScriptBeforeContentLoaded={preInject}
        onLoadEnd={() => {
          shellReadyRef.current = true;
          warmedRef.current = true;
          if (publicPath) {
            navigateToPage(publicPath, 'bootstrap shell');
          } else {
            setLoading(false);
          }
        }}
        onNavigationStateChange={handleNav}
        onShouldStartLoadWithRequest={(req) => {
          const allowed = shouldAllowWebViewNavigation(req.url, req);
          if (!allowed && isMainFrameWebViewRequest(req) && publicPath) {
            try {
              const pathname = new URL(req.url).pathname;
              if (matchesPublicPath(pathname, publicPath)) {
                navigateToPage(publicPath, 'blocked server route');
              }
            } catch {
              // ignore
            }
          }
          return allowed;
        }}
        {...getWebViewMediaProps()}
        injectedJavaScript={WEBVIEW_MEDIA_INJECT_JS}
        onError={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: Colors.white,
  },
  hidden: {
    opacity: 0,
  },
  web: { flex: 1 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: TOP_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 5,
  },
});
