/**
 * Content tab — TikTok/Reels-style vertical YouTube lessons for the student's level.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { getNestApiBaseUrl } from '../lib/localHost';
import { resolveNestAccessTokenForWebView } from '../lib/platformNestAuth';
import { useDeskAuth } from '../context/DeskAuthContext';
import { useTokenGate } from '../context/TokenGateContext';
import { useAppTheme } from '../context/AppThemeContext';
import { Colors } from '../theme/yana';
import { TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { log } from '../lib/logger';

type FeedItem = {
  id: string;
  course_id: string;
  course_title: string;
  lesson_id: string;
  title: string;
  description: string;
  youtube_id: string;
  level?: string | null;
};

type FeedResponse = {
  items?: FeedItem[];
  level?: string | null;
  tokens_per_view?: number;
};

async function nestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await resolveNestAccessTokenForWebView();
  if (!token) throw new Error('Sign in again');
  const res = await fetch(`${getNestApiBaseUrl().replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (typeof (json as any)?.message === 'string' && (json as any).message) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const data =
    json && typeof json === 'object' && 'data' in (json as object)
      ? (json as { data: T }).data
      : (json as T);
  return data;
}

function youtubeEmbedHtml(videoId: string): string {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0&modestbranding=1`;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}iframe{border:0;position:absolute;inset:0;width:100%;height:100%}</style></head>
<body><iframe src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></body></html>`;
}

export function ContentScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { palette } = useAppTheme();
  const { selectedStudentId, selectedStudent, persona } = useDeskAuth();
  const { refreshBalance, showZeroTokenModal, isZeroBalance } = useTokenGate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokensPerView, setTokensPerView] = useState(10);
  const chargedRef = useRef<Set<string>>(new Set());
  const height = Dimensions.get('window').height - TAB_BAR_BODY_HEIGHT - insets.bottom;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (persona === 'parent' && selectedStudentId) qs.set('student_id', selectedStudentId);
      qs.set('limit', '40');
      const data = await nestJson<FeedResponse>(`/elearning/content-feed?${qs.toString()}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      if (typeof data?.tokens_per_view === 'number') setTokensPerView(data.tokens_per_view);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Content', msg);
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [persona, selectedStudentId]);

  useEffect(() => {
    if (focused) void load();
  }, [focused, load]);

  const chargeView = useCallback(
    async (item: FeedItem) => {
      if (!item?.youtube_id || chargedRef.current.has(item.id)) return;
      if (isZeroBalance) {
        showZeroTokenModal();
        return;
      }
      chargedRef.current.add(item.id);
      try {
        await nestJson('/elearning/content-feed/view', {
          method: 'POST',
          body: JSON.stringify({
            youtube_id: item.youtube_id,
            lesson_id: item.lesson_id,
            course_id: item.course_id,
          }),
        });
        void refreshBalance();
      } catch (e) {
        chargedRef.current.delete(item.id);
        const msg = e instanceof Error ? e.message : String(e);
        if (/token|balance|insufficient/i.test(msg)) showZeroTokenModal();
        log.warn('Content', 'view charge', msg);
      }
    },
    [isZeroBalance, refreshBalance, showZeroTokenModal],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable)?.item as FeedItem | undefined;
    if (first) void chargeView(first);
  }).current;

  const levelLabel = selectedStudent?.className || '';

  if (loading && !items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.hint}>Loading content…</Text>
      </View>
    );
  }

  if (error && !items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: insets.top }]}>
        <Text style={styles.err}>{error}</Text>
        <Text style={styles.hint} onPress={() => void load()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>No videos for this level yet</Text>
        <Text style={styles.hint}>
          {persona === 'parent' && levelLabel
            ? `Courses for ${levelLabel} will appear here.`
            : 'When courses match your class, YouTube lessons show here.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        renderItem={({ item }) => (
          <View style={{ height, width: '100%', backgroundColor: '#000' }}>
            <WebView
              originWhitelist={['*']}
              source={{ html: youtubeEmbedHtml(item.youtube_id) }}
              style={styles.web}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={Platform.OS === 'android' ? false : false}
              javaScriptEnabled
              domStorageEnabled
            />
            <View style={[styles.caption, { paddingBottom: 16 + insets.bottom * 0.2 }]} pointerEvents="none">
              <Text style={styles.course}>{item.course_title}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={3}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.meta}>
                {tokensPerView} tokens · scroll for next
                {levelLabel ? ` · ${levelLabel}` : ''}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  hint: { color: '#aaa', fontSize: 13, textAlign: 'center' },
  err: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  web: { flex: 1, backgroundColor: '#000' },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  course: { color: Colors.primaryLight || '#86efac', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800' },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  meta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8 },
});
