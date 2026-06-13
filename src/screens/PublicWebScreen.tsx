import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import {
  buildPublicPageNavigateScript,
  buildPublicPagePreloadScript,
  shouldAllowWebViewRequest,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
import { AboutStackParamList } from '../navigation/types';
import { Colors } from '../theme/yana';

type Props = NativeStackScreenProps<AboutStackParamList, 'PublicWeb'>;

export function PublicWebScreen({ navigation, route }: Props) {
  const { path, title } = route.params;
  const webRef = useRef<WebView>(null);
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const shellUrl = tukuaSpaShellUrl();

  const preInject = useMemo(() => {
    if (!session) return null;
    return buildPublicPagePreloadScript(session);
  }, [session]);

  const bootstrap = useCallback(() => {
    if (!session || !webRef.current) return;
    webRef.current.injectJavaScript(`${buildPublicPageNavigateScript(path)}\ntrue;`);
  }, [path, session]);

  useEffect(() => {
    setLoading(true);
  }, [path]);

  if (!session || !preInject) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        cacheEnabled={false}
        incognito={Platform.OS === 'android'}
        injectedJavaScriptBeforeContentLoaded={preInject}
        onLoadEnd={() => bootstrap()}
        onNavigationStateChange={(nav) => {
          try {
            const pathname = new URL(nav.url).pathname;
            if (pathname === path || pathname.startsWith(`${path}/`)) {
              setLoading(false);
            }
          } catch {
            // ignore
          }
        }}
        onShouldStartLoadWithRequest={(req) => {
          const allowed = shouldAllowWebViewRequest(req.url);
          if (!allowed) {
            webRef.current?.stopLoading();
            bootstrap();
          }
          return allowed;
        }}
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
