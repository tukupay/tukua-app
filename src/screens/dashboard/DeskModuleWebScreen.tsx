import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAuth } from '../../context/AuthContext';
import { getDeskWebBaseUrl } from '../../lib/localHost';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../../lib/webViewMedia';
import { buildPreloadSessionScript } from '../../lib/webviewAuth';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'DeskModule'>;

/** Inject desk JWT the same way desktop stores `auth_token` + session. */
function buildDeskSessionInject(token: string, userJson: string) {
  return `
    (function() {
      try {
        localStorage.setItem('auth_token', ${JSON.stringify(token)});
        var session = { token: ${JSON.stringify(token)}, user: ${userJson}, timestamp: Date.now() };
        localStorage.setItem('cbe_app_session', JSON.stringify(session));
        window.__CBE_AUTH_TOKEN__ = ${JSON.stringify(token)};
      } catch (e) {}
      true;
    })();
  `;
}

export function DeskModuleWebScreen({ route, navigation }: Props) {
  const { title, deskPath } = route.params;
  const { deskToken, deskUser, deskApiUrl, selectedStudentId, selectedSchoolId, selectedStudent } =
    useDeskAuth();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bearer = deskToken || session?.access_token || null;
  const base = getDeskWebBaseUrl();
  const path = deskPath.startsWith('/') ? deskPath : `/${deskPath}`;
  const uri = `${base.replace(/\/$/, '')}${path}`;

  const userJson = useMemo(() => {
    const user = {
      ...(deskUser ?? {}),
      school_id: selectedSchoolId ?? deskUser?.school_id ?? null,
      selected_student_id: selectedStudentId,
      selected_student_name: selectedStudent?.name ?? null,
    };
    return JSON.stringify(user);
  }, [deskUser, selectedSchoolId, selectedStudentId, selectedStudent?.name]);

  const preload = useMemo(() => {
    const parts: string[] = [];
    if (bearer) {
      parts.push(buildDeskSessionInject(bearer, userJson));
      parts.push(`
        (function() {
          try {
            if (${JSON.stringify(selectedSchoolId)}) {
              localStorage.setItem('cbe_selected_school_id', ${JSON.stringify(selectedSchoolId)});
            }
            if (${JSON.stringify(selectedStudentId)}) {
              localStorage.setItem('cbe_selected_student_id', ${JSON.stringify(selectedStudentId)});
            }
          } catch (e) {}
          true;
        })();
      `);
    }
    if (session) {
      parts.push(buildPreloadSessionScript(session));
    }
    return parts.length ? `${parts.join('\n')}\ntrue;` : 'true;';
  }, [bearer, userJson, session, path, selectedSchoolId, selectedStudentId]);

  const onError = useCallback(
    (e: { nativeEvent: { description?: string } }) => {
      log.warn('DeskModule', 'webview error', e.nativeEvent.description);
      setError(`Could not load ${uri}. API: ${deskApiUrl}`);
    },
    [deskApiUrl, uri],
  );

  if (!bearer && !session) {
    return (
      <View style={[styles.centered, { paddingTop: floatingHeaderInset(insets.top) }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          <Text style={styles.backText}>Dashboard</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.msg}>Sign in to open this module.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: floatingHeaderInset(insets.top) - 6 }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          <Text style={styles.backText} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.msg}>{error}</Text>
        </View>
      ) : null}
      <WebView
        ref={webRef}
        source={{ uri }}
        style={styles.web}
        onLoadStart={() => {
          setLoading(true);
          setError(null);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={onError}
        injectedJavaScriptBeforeContentLoaded={preload}
        injectedJavaScript={`${preload}\n${WEBVIEW_MEDIA_INJECT_JS}`}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        {...getWebViewMediaProps()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: Colors.foreground, fontWeight: '600', fontSize: 16, flexShrink: 1 },
  web: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(247,250,248,0.7)',
  },
  centered: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.foreground, marginBottom: 10 },
  msg: { fontSize: 14, color: Colors.mutedForeground, lineHeight: 20 },
  errorBox: { padding: 12, backgroundColor: '#FFF7ED' },
});
