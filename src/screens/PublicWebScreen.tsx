import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import {
  buildPublicPageNavigateScript,
  buildPublicPagePreloadScript,
  isMainFrameWebViewRequest,
  shouldAllowWebViewNavigation,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
import { log } from '../lib/logger';
import { AboutStackParamList } from '../navigation/types';
import { Colors } from '../theme/yana';

type Props = NativeStackScreenProps<AboutStackParamList, 'PublicWeb'>;

function matchesPublicPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function PublicWebScreen({ navigation, route }: Props) {
  const { path, title } = route.params;
  const webRef = useRef<WebView>(null);
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const shellReadyRef = useRef(false);
  const navigatedRef = useRef(false);
  const shellUrl = tukuaSpaShellUrl();

  const preInject = useMemo(() => {
    if (!session) return null;
    return buildPublicPagePreloadScript(session);
  }, [session]);

  const navigateToPage = useCallback(
    (reason: string) => {
      if (!session || !webRef.current || !shellReadyRef.current) return;
      log.info('PublicWeb', reason, { path });
      webRef.current.injectJavaScript(`${buildPublicPageNavigateScript(path)}\ntrue;`);
      navigatedRef.current = true;
    },
    [path, session],
  );

  useEffect(() => {
    shellReadyRef.current = false;
    navigatedRef.current = false;
    setLoading(true);
  }, [path]);

  if (!session || !preInject) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleNav = (nav: WebViewNavigation) => {
    if (!nav.url) return;
    try {
      const pathname = new URL(nav.url).pathname;
      if (nav.url.includes('tukua.ai') && !nav.loading) {
        shellReadyRef.current = true;
      }
      if (matchesPublicPath(pathname, path)) {
        setLoading(false);
        return;
      }
      if (shellReadyRef.current && !navigatedRef.current) {
        navigateToPage('navigate after shell ready');
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading && (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      <WebView
        key={`public-${path}`}
        ref={webRef}
        source={{ uri: shellUrl }}
        style={styles.web}
        originWhitelist={['https://*', 'http://*']}
        nestedScrollEnabled={Platform.OS === 'android'}
        cacheEnabled={false}
        injectedJavaScriptBeforeContentLoaded={preInject}
        onLoadEnd={() => {
          shellReadyRef.current = true;
          if (!navigatedRef.current) {
            navigateToPage('bootstrap shell');
          }
        }}
        onNavigationStateChange={handleNav}
        onShouldStartLoadWithRequest={(req) => {
          const allowed = shouldAllowWebViewNavigation(req.url, req);
          if (!allowed && isMainFrameWebViewRequest(req)) {
            try {
              const pathname = new URL(req.url).pathname;
              if (matchesPublicPath(pathname, path)) {
                navigateToPage('blocked server route');
              }
            } catch {
              // ignore malformed urls
            }
          }
          return allowed;
        }}
        allowsFullscreenVideo
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
  container: { flex: 1, backgroundColor: Colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Inter_600SemiBold',
  },
  web: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 5,
  },
});
