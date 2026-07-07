import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme/yana';
import { RootStackParamList } from '../navigation/types';
import {
  applyWebSessionTokens,
  buildRegisterCosmeticsScript,
  buildRegisterPreloadScript,
  buildRegisterWatchScript,
  buildSpaNavigateScript,
  isMainFrameWebViewRequest,
  shouldAllowWebViewNavigation,
  tukuaSpaShellUrl,
} from '../lib/webviewAuth';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../lib/webViewMedia';
import { log } from '../lib/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const REGISTER_PATH = '/register';

export function WebRegisterScreen({ navigation }: Props) {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const adoptingRef = useRef(false);

  const injectRegister = useCallback(() => {
    webRef.current?.injectJavaScript(`${buildRegisterCosmeticsScript()}\ntrue;`);
    webRef.current?.injectJavaScript(`${buildRegisterWatchScript(REGISTER_PATH)}\ntrue;`);
  }, []);

  const handleMessage = useCallback((raw: string) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type !== 'TUKUA_SESSION_UPDATED') return;
      if (adoptingRef.current) return;
      if (typeof msg.access_token !== 'string' || typeof msg.refresh_token !== 'string') return;
      adoptingRef.current = true;
      log.info('WebRegister', 'web session captured — adopting into native app');
      void (async () => {
        const adopted = await applyWebSessionTokens(msg.access_token, msg.refresh_token);
        if (!adopted) {
          adoptingRef.current = false;
          log.warn('WebRegister', 'failed to adopt web session');
        }
        // On success AuthContext flips isAuthenticated -> RootNavigator shows Main.
      })();
    } catch {
      // ignore non-json messages
    }
  }, []);

  const handleBlocked = useCallback((url: string) => {
    try {
      const pathname = new URL(url).pathname;
      webRef.current?.injectJavaScript(
        `${buildSpaNavigateScript(pathname, { force: true, push: true })}\ntrue;`,
      );
    } catch {
      // ignore malformed urls
    }
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create your account</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        {loading && (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading registration…</Text>
          </View>
        )}

        <WebView
          ref={webRef}
          source={{ uri: tukuaSpaShellUrl() }}
          style={styles.web}
          originWhitelist={['https://*', 'http://*']}
          injectedJavaScriptBeforeContentLoaded={buildRegisterPreloadScript()}
          injectedJavaScript={WEBVIEW_MEDIA_INJECT_JS}
          onLoadEnd={() => {
            injectRegister();
            setLoading(false);
          }}
          onError={(e) => {
            log.error('WebRegister', 'webview error', e.nativeEvent);
            setLoading(false);
          }}
          onHttpError={(e) => {
            const { statusCode, url } = e.nativeEvent;
            log.error('WebRegister', 'http error', { statusCode, url });
            if (statusCode === 404 && url.includes('tukua.ai')) {
              handleBlocked(url);
            }
            setLoading(false);
          }}
          onShouldStartLoadWithRequest={(req) => {
            const allowed = shouldAllowWebViewNavigation(req.url, req);
            if (!allowed && isMainFrameWebViewRequest(req)) {
              handleBlocked(req.url);
            }
            return allowed;
          }}
          onMessage={(e) => handleMessage(e.nativeEvent.data)}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          geolocationEnabled
          setSupportMultipleWindows={false}
          {...getWebViewMediaProps()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.foreground },
  body: { flex: 1 },
  web: { flex: 1, backgroundColor: Colors.white },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    zIndex: 10,
    gap: 12,
  },
  loaderText: { fontSize: 13, fontWeight: '600', color: Colors.mutedForeground },
});
