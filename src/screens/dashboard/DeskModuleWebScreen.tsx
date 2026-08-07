import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useAuth } from '../../context/AuthContext';
import { getDeskWebBaseUrlOrNull, isDeskErpPath, isDeskWebLikelyWrongHost } from '../../lib/localHost';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../../lib/webViewMedia';
import { buildPreloadSessionScript } from '../../lib/webviewAuth';
import { log } from '../../lib/logger';
import { useAppTheme } from '../../context/AppThemeContext';
import { ModuleScreenHeader } from './ModuleChrome';

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
  const { title, deskPath, description } = route.params;
  const { deskToken, deskUser, deskApiUrl, selectedStudentId, selectedSchoolId, selectedStudent } =
    useDeskAuth();
  const { session } = useAuth();
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bearer = deskToken || session?.access_token || null;
  const deskWebBase = getDeskWebBaseUrlOrNull();
  const base = deskWebBase ?? '';
  const path = deskPath.startsWith('/') ? deskPath : `/${deskPath}`;
  const uri = base ? `${base.replace(/\/$/, '')}${path}` : path;
  const wrongHost =
    isDeskErpPath(path) && (!deskWebBase || isDeskWebLikelyWrongHost(base));

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
      setError(
        `Could not load Desk UI at ${uri}. Start Desk Vite (npm run dev:desk → :3250) or set EXPO_PUBLIC_DESK_WEB_URL. API: ${deskApiUrl}`,
      );
    },
    [deskApiUrl, uri],
  );

  if (!bearer && !session) {
    return (
      <View style={[styles.centered, { paddingTop: floatingHeaderInset(insets.top) }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={palette.primary} />
          <Text style={[styles.backText, { color: palette.primary }]}>Dashboard</Text>
        </Pressable>
        <ModuleScreenHeader title={title} description={description || 'Open this Desk module.'} />
        <Text style={styles.msg}>Sign in to open this module.</Text>
      </View>
    );
  }

  if (wrongHost) {
    return (
      <View style={[styles.centered, { paddingTop: floatingHeaderInset(insets.top) }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={palette.primary} />
          <Text style={[styles.backText, { color: palette.primary }]}>Dashboard</Text>
        </Pressable>
        <ModuleScreenHeader
          title={title}
          description="This module needs the Desk app UI, not tukua.ai."
        />
        <Text style={styles.msg}>
          Mobile was pointing Desk pages at tukua.ai (empty). Run Desk on this PC
          (`npm run dev:desk` → port 3250) on the same Wi‑Fi, or set
          EXPO_PUBLIC_DESK_WEB_URL to your Desk host. Native screens are being added
          so this WebView is not required.
        </Text>
        <Text style={[styles.msg, { marginTop: 12, opacity: 0.7 }]}>Tried: {uri}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: floatingHeaderInset(insets.top) - 6 }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={palette.primary} />
          <Text style={[styles.backText, { color: palette.primary }]} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>
      </View>
      {description ? (
        <View style={styles.descWrap}>
          <Text style={styles.moduleDesc}>{description}</Text>
        </View>
      ) : null}
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
  descWrap: { paddingHorizontal: 16, paddingBottom: 6 },
  moduleDesc: { fontSize: 11, lineHeight: 15, color: Colors.mutedForeground },
});
