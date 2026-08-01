import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset } from '../../constants/layout';
import { getWebViewMediaProps, WEBVIEW_MEDIA_INJECT_JS } from '../../lib/webViewMedia';

type Props = NativeStackScreenProps<DashboardStackParamList, 'MeetingRoom'>;

/**
 * In-app Tukua Meet room (parents / signed-in members).
 * Guests still use the external short link browser page.
 */
export function MeetingRoomScreen({ route, navigation }: Props) {
  const { title, roomUrl } = route.params;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          <Text style={styles.backText}>Leave</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title || 'Tukua Meet'}
        </Text>
        <View style={styles.back} />
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loaderText}>Opening Tukua Meet…</Text>
        </View>
      ) : null}
      <WebView
        source={{ uri: roomUrl }}
        style={styles.web}
        onLoadEnd={() => setLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        injectedJavaScript={WEBVIEW_MEDIA_INJECT_JS}
        {...getWebViewMediaProps()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    zIndex: 2,
  },
  back: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
  },
  web: { flex: 1, backgroundColor: '#0b1220' },
  loader: {
    position: 'absolute',
    top: floatingHeaderInset(40),
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: { color: Colors.mutedForeground, fontSize: 13 },
});
