/**
 * Content tab — TikTok/Reels-style vertical YouTube lessons for the student's level.
 * Error 153 = YouTube needs a real HTTPS Referer/origin in WebView embeds.
 * Fix: single embed iframe HTML with baseUrl https://tukua.ai (no Data API).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
  download_url?: string | null;
  media_kind?: 'youtube' | 'file';
};

type FeedResponse = {
  items?: FeedItem[];
  level?: string | null;
  tokens_per_view?: number;
  next_cursor?: string | null;
};

const PHONE_FRAME_MAX = 440;

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

/** HTTPS origin YouTube accepts as Referer for in-app embeds (error 153). */
const YT_EMBED_ORIGIN = 'https://tukua.ai';

function youtubeEmbedHtml(videoId: string, muted: boolean): string {
  const id = String(videoId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
  const mute = muted ? '&mute=1' : '';
  // Single iframe only — set WebView baseUrl to YT_EMBED_ORIGIN so Referer is sent.
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<style>
  html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
  iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
</style>
</head><body>
<iframe
  src="https://www.youtube.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&controls=1&enablejsapi=1${mute}"
  title="lesson"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
</body></html>`;
}

function youtubeWatchUri(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function ContentScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width: winW, height: winH } = useWindowDimensions();
  const { palette } = useAppTheme();
  const { selectedStudentId, selectedStudent, persona } = useDeskAuth();
  const { refreshBalance, showZeroTokenModal, isZeroBalance } = useTokenGate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensPerView, setTokensPerView] = useState(10);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const chargedRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);

  const isDesktopWeb = Platform.OS === 'web' && winW >= 768;
  const frameW = isDesktopWeb ? Math.min(PHONE_FRAME_MAX, winW * 0.42) : winW;
  const availableH = winH - TAB_BAR_BODY_HEIGHT - insets.bottom - (isDesktopWeb ? 24 : 0) - insets.top;
  const itemH = Math.max(480, availableH);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (append) {
        if (loadingMoreRef.current || !cursor) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const qs = new URLSearchParams();
        if (persona === 'parent' && selectedStudentId) qs.set('student_id', selectedStudentId);
        qs.set('limit', '10');
        if (cursor) qs.set('cursor', cursor);
        const data = await nestJson<FeedResponse>(`/elearning/content-feed?${qs.toString()}`);
        const batch = Array.isArray(data?.items) ? data.items : [];
        setItems((prev) => {
          if (!append) return batch;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...batch.filter((b) => !seen.has(b.id))];
        });
        const nc = data?.next_cursor ?? null;
        setNextCursor(nc);
        cursorRef.current = nc;
        if (typeof data?.tokens_per_view === 'number') setTokensPerView(data.tokens_per_view);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Content', msg);
        if (!append) {
          setError(msg);
          setItems([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [persona, selectedStudentId],
  );

  useEffect(() => {
    if (focused) {
      chargedRef.current = new Set();
      cursorRef.current = null;
      void loadPage(null, false);
    }
  }, [focused, loadPage]);

  const chargeView = useCallback(
    async (item: FeedItem) => {
      if (!item?.id || chargedRef.current.has(item.id)) return;
      if (isZeroBalance) {
        showZeroTokenModal();
        return;
      }
      chargedRef.current.add(item.id);
      try {
        await nestJson('/elearning/content-feed/view', {
          method: 'POST',
          body: JSON.stringify({
            youtube_id: item.youtube_id || undefined,
            lesson_id: item.lesson_id,
            course_id: item.course_id,
            item_id: item.id,
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

  const onEndReached = useCallback(() => {
    if (cursorRef.current) void loadPage(cursorRef.current, true);
  }, [loadPage]);

  const openExternal = useCallback(async (item: FeedItem) => {
    const url = item.youtube_id
      ? youtubeWatchUri(item.youtube_id)
      : item.download_url || '';
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      log.warn('Content', 'open external', e);
    }
  }, []);

  const downloadItem = useCallback(async (item: FeedItem) => {
    const hosted = String(item.download_url || '').trim();
    if (hosted) {
      try {
        if (Platform.OS === 'web') {
          await Linking.openURL(hosted);
          return;
        }
        const ext = hosted.split('?')[0].split('.').pop() || 'mp4';
        const dest = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}content-${item.id.replace(/[^a-z0-9_-]/gi, '_')}.${ext}`;
        const result = await FileSystem.downloadAsync(hosted, dest);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri);
        } else {
          await Linking.openURL(result.uri);
        }
      } catch (e) {
        log.warn('Content', 'download', e);
      }
      return;
    }
    if (item.youtube_id) await openExternal(item);
  }, [openExternal]);

  const levelLabel = selectedStudent?.className || '';
  const listHeaderSpace = useMemo(() => 0, []);

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
        <Text style={styles.hint} onPress={() => void loadPage(null, false)}>
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
            : 'When courses match your level (and levels below), lessons show here.'}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: FeedItem }) => {
    const hosted = String(item.download_url || '').trim();
    const webSource = item.youtube_id
      ? { html: youtubeEmbedHtml(item.youtube_id, muted), baseUrl: YT_EMBED_ORIGIN }
      : hosted
        ? { uri: hosted }
        : { html: '<html><body style="background:#000"></body></html>', baseUrl: YT_EMBED_ORIGIN };

    return (
      <View style={{ height: itemH, width: '100%', alignItems: 'center', backgroundColor: '#000' }}>
        <View
          style={[
            styles.phoneFrame,
            {
              width: frameW,
              height: itemH,
              borderRadius: isDesktopWeb ? 24 : 0,
              overflow: 'hidden',
            },
          ]}
        >
          <WebView
            originWhitelist={['*']}
            source={webSource}
            style={styles.web}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            androidLayerType="hardware"
            mixedContentMode="always"
            userAgent={
              Platform.OS === 'android'
                ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                : undefined
            }
          />
          <View style={[styles.caption, { paddingBottom: 16 + insets.bottom * 0.2 }]} pointerEvents="box-none">
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
            <View style={styles.controls}>
              <Pressable style={styles.ctrlBtn} onPress={() => setMuted((m) => !m)}>
                <Text style={styles.ctrlTxt}>{muted ? 'Unmute' : 'Mute'}</Text>
              </Pressable>
              {item.download_url ? (
                <Pressable style={styles.ctrlBtn} onPress={() => void downloadItem(item)}>
                  <Text style={styles.ctrlTxt}>Download</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDesktopWeb ? '#111' : '#000',
        paddingTop: insets.top,
        alignItems: 'center',
      }}
    >
      {listHeaderSpace > 0 ? <View style={{ height: listHeaderSpace }} /> : null}
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        style={{ width: isDesktopWeb ? frameW : '100%' }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: itemH, offset: itemH * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={renderItem}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : nextCursor ? (
            <View style={{ height: 8 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  hint: { color: '#aaa', fontSize: 13, textAlign: 'center' },
  err: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  phoneFrame: { backgroundColor: '#000', maxWidth: PHONE_FRAME_MAX },
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
  controls: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ctrlBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ctrlTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
