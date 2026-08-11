/**
 * Content tab — TikTok/Reels-style vertical YouTube lessons for the student's level.
 * Error 153 = YouTube needs a real HTTPS Referer/origin in WebView embeds.
 * Fix: single embed iframe HTML with baseUrl https://tukua.ai (no Data API).
 * Shorts embed via same iframe API (youtube.com/shorts/ID → videoId).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewToken,
  FlatList,
  useWindowDimensions,
  LayoutChangeEvent,
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
import { floatingHeaderInset } from '../constants/layout';
import { log } from '../lib/logger';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';
import type { CoursesStackParamList } from '../navigation/CoursesStack';

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
  is_short?: boolean;
  unit_id?: string | null;
  unit_title?: string | null;
  unit_notes?: string | null;
};

type FeedResponse = {
  items?: FeedItem[];
  level?: string | null;
  tokens_per_view?: number;
  next_cursor?: string | null;
};

const PHONE_FRAME_MAX = 440;
const YT_EMBED_ORIGIN = 'https://tukua.ai';

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

function youtubeEmbedHtml(videoId: string, muted: boolean, isShort: boolean, autoplay: boolean): string {
  const id = String(videoId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
  // Mobile WebViews only autoplay when muted; Unmute remounts with mute=0.
  const startMute = muted ? 1 : 0;
  const doAuto = autoplay ? 'true' : 'false';
  if (isShort) {
    return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;touch-action:none}
  #crop{position:absolute;inset:0;overflow:hidden;background:#000}
  #stage{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#000}
  #player{position:absolute;inset:0;width:100%;height:100%}
  #player iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important}
</style>
</head><body>
<div id="crop"><div id="stage"><div id="player"></div></div></div>
<script>
  var VID=${JSON.stringify(id)};
  var START_MUTE=${startMute};
  var AUTOPLAY=${doAuto};
  var player=null;
  function post(playing){
    try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({playing:!!playing,short:true})); }catch(e){}
  }
  function layout(){
    var cw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    var ch = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    var playerH = Math.ceil(Math.max(ch, cw * 16 / 9));
    var playerW = Math.ceil(playerH * 16 / 9);
    var stage = document.getElementById('stage');
    if(stage){ stage.style.width = playerW + 'px'; stage.style.height = playerH + 'px'; }
    try{ if(player && player.setSize) player.setSize(playerW, playerH); }catch(e){}
  }
  function tryPlay(){
    try{
      if(!player) return;
      if(START_MUTE) player.mute && player.mute();
      if(AUTOPLAY && player.playVideo) player.playVideo();
    }catch(e){}
  }
  function bootPlayer(){
    layout();
    var stage = document.getElementById('stage');
    var w = parseInt(stage.style.width,10) || 1280;
    var h = parseInt(stage.style.height,10) || 720;
    player = new YT.Player('player',{
      videoId:VID,
      width:w,
      height:h,
      playerVars:{
        playsinline:1,rel:0,modestbranding:1,controls:1,autoplay:AUTOPLAY?1:0,
        mute:START_MUTE,fs:0,origin:${JSON.stringify(YT_EMBED_ORIGIN)}
      },
      events:{
        onReady:function(){ layout(); tryPlay(); setTimeout(layout, 250); setTimeout(tryPlay, 400); },
        onStateChange:function(e){
          if(e.data===1||e.data===3) post(true);
          else if(e.data===2||e.data===0||e.data===5) post(false);
        }
      }
    });
  }
  function onCmd(ev){
    try{
      var d = typeof ev.data==='string' ? JSON.parse(ev.data) : ev.data;
      if(!d||!player) return;
      if(d.cmd==='pause' && player.pauseVideo) player.pauseVideo();
      if(d.cmd==='play') tryPlay();
    }catch(e){}
  }
  document.addEventListener('message', onCmd);
  window.addEventListener('message', onCmd);
  window.addEventListener('resize', layout);
  window.onYouTubeIframeAPIReady = bootPlayer;
  if(window.YT && window.YT.Player){ bootPlayer(); }
</script>
<script src="https://www.youtube.com/iframe_api"></script>
</body></html>`;
  }

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden}
  body{display:flex;align-items:flex-start;justify-content:center}
  #stage{width:100%;max-width:100%;max-height:100%;aspect-ratio:16/9;position:relative;background:#000}
  #player,#player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
</style>
</head><body>
<div id="stage"><div id="player"></div></div>
<script>
  var VID=${JSON.stringify(id)};
  var START_MUTE=${startMute};
  var AUTOPLAY=${doAuto};
  var player=null;
  function post(playing){
    try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({playing:!!playing})); }catch(e){}
  }
  function tryPlay(){
    try{
      if(!player) return;
      if(START_MUTE) player.mute && player.mute();
      if(AUTOPLAY && player.playVideo) player.playVideo();
    }catch(e){}
  }
  function bootPlayer(){
    player = new YT.Player('player',{
      videoId:VID,
      width:'100%',
      height:'100%',
      playerVars:{
        playsinline:1,rel:0,modestbranding:1,controls:1,autoplay:AUTOPLAY?1:0,
        mute:START_MUTE,fs:1,origin:${JSON.stringify(YT_EMBED_ORIGIN)}
      },
      events:{
        onReady:function(){ tryPlay(); setTimeout(tryPlay, 400); },
        onStateChange:function(e){
          if(e.data===1||e.data===3) post(true);
          else if(e.data===2||e.data===0||e.data===5) post(false);
        }
      }
    });
  }
  function onCmd(ev){
    try{
      var d = typeof ev.data==='string' ? JSON.parse(ev.data) : ev.data;
      if(!d||!player) return;
      if(d.cmd==='pause' && player.pauseVideo) player.pauseVideo();
      if(d.cmd==='play') tryPlay();
    }catch(e){}
  }
  document.addEventListener('message', onCmd);
  window.addEventListener('message', onCmd);
  window.onYouTubeIframeAPIReady = bootPlayer;
  if(window.YT && window.YT.Player){ bootPlayer(); }
</script>
<script src="https://www.youtube.com/iframe_api"></script>
</body></html>`;
}

/** Prefer API is_short; also infer from title / media hints (stale Redis pages). */
function itemIsShort(item: FeedItem): boolean {
  if (item.is_short === true) return true;
  if (/^short\b/i.test(String(item.title || '').trim())) return true;
  if (String(item.media_kind || '').toLowerCase() === 'short') return true;
  return false;
}

async function ensureTukuaFolder(): Promise<string> {
  const root = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const dir = `${root}Tukua/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export function ContentScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width: winW } = useWindowDimensions();
  const { palette } = useAppTheme();
  const { selectedStudentId, selectedStudent, persona } = useDeskAuth();
  const { refreshBalance, showZeroTokenModal, isZeroBalance } = useTokenGate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [listH, setListH] = useState(0);
  const chargedRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const webRefs = useRef<Map<string, WebView | null>>(new Map());

  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const isDesktopWeb = Platform.OS === 'web' && winW >= 768;
  const frameW = isDesktopWeb ? Math.min(PHONE_FRAME_MAX, winW * 0.42) : winW;
  const topPad = floatingHeaderInset(insets.top) + 18;
  const itemH = listH > 0 ? listH : 560;

  const openUnit = useCallback(
    (item: FeedItem) => {
      if (!item.course_id || item.course_id === 'platform-shared') return;
      const path = `/courses/${item.course_id}/learn`;
      navigation.navigate('Courses', {
        screen: 'CourseWeb',
        params: {
          path,
          title: item.unit_title || item.course_title || 'Course',
        } satisfies CoursesStackParamList['CourseWeb'],
      });
    },
    [navigation],
  );

  const pauseOthers = useCallback((exceptId: string | null) => {
    webRefs.current.forEach((ref, id) => {
      if (!ref || id === exceptId) return;
      try {
        ref.postMessage(JSON.stringify({ cmd: 'pause' }));
        ref.injectJavaScript?.(
          'try{if(player&&player.pauseVideo)player.pauseVideo();}catch(e){};true;',
        );
      } catch {
        /* ignore */
      }
    });
  }, []);

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
        if (!append && batch[0]?.id) setActiveItemId(batch[0].id);
        const nc = data?.next_cursor ?? null;
        setNextCursor(nc);
        cursorRef.current = nc;
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
    } else {
      pauseOthers(null);
      setPlayingItemId(null);
    }
  }, [focused, loadPage, pauseOthers, selectedStudentId, persona]);

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

  const pauseOthersRef = useRef(pauseOthers);
  pauseOthersRef.current = pauseOthers;
  const chargeViewRef = useRef(chargeView);
  chargeViewRef.current = chargeView;

  const onViewableStable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable)?.item as FeedItem | undefined;
    if (!first) return;
    setActiveItemId((prev) => {
      if (prev !== first.id) {
        pauseOthersRef.current(first.id);
        setPlayingItemId(null);
      }
      return first.id;
    });
    void chargeViewRef.current(first);
  }).current;

  const onEndReached = useCallback(() => {
    if (cursorRef.current) void loadPage(cursorRef.current, true);
  }, [loadPage]);

  const downloadItem = useCallback(async (item: FeedItem) => {
    const hosted = String(item.download_url || '').trim();
    if (!hosted) return;
    try {
      if (Platform.OS === 'web') {
        await Linking.openURL(hosted);
        return;
      }
      const dir = await ensureTukuaFolder();
      const ext = hosted.split('?')[0].split('.').pop() || 'mp4';
      const safe = item.id.replace(/[^a-z0-9_-]/gi, '_').slice(0, 80);
      const dest = `${dir}${safe}.${ext}`;
      const result = await FileSystem.downloadAsync(hosted, dest);
      log.info('Content', 'saved to Tukua folder', result.uri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { dialogTitle: 'Saved in Tukua' });
      }
    } catch (e) {
      log.warn('Content', 'download', e);
    }
  }, []);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setListH(h);
  }, []);

  const levelLabel = selectedStudent?.className || '';

  if (loading && !items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: topPad }]}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={styles.hint}>Loading content…</Text>
      </View>
    );
  }

  if (error && !items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: topPad }]}>
        <Text style={styles.err}>{error}</Text>
        <Text style={styles.hint} onPress={() => void loadPage(null, false)}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={[styles.center, { backgroundColor: '#0a0a0a', paddingTop: topPad }]}>
        <Text style={styles.emptyTitle}>No videos for this level yet</Text>
        <Text style={styles.hint}>
          {persona === 'parent' && levelLabel
            ? `Courses for ${levelLabel} will appear here.`
            : 'Lessons for your level plus open catalog and How Tukua videos appear here.'}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: FeedItem }) => {
    const hosted = String(item.download_url || '').trim();
    const isShort = itemIsShort(item);
    const isActive = activeItemId === item.id;
    const playing = playingItemId === item.id;
    const titleBandH = isShort ? 56 : 64;
    const shortFooterH = 88; // mute row + gap above tab bar
    const maxShortH = Math.max(240, itemH - titleBandH - shortFooterH);
    const videoH = isShort
      ? Math.min(maxShortH, Math.round((frameW * 16) / 9))
      : Math.min(Math.round(itemH * 0.38), Math.round((frameW * 9) / 16));
    const videoW = frameW;
    const notes = String(item.unit_notes || '').trim();
    const showUnitCta = !isShort && !!item.course_id && item.course_id !== 'platform-shared';

    return (
      <View style={{ height: itemH, width: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
        <View
          style={[
            styles.phoneFrame,
            {
              width: frameW,
              height: itemH,
              alignSelf: 'center',
              borderRadius: isDesktopWeb ? 24 : 0,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={styles.titleBand}>
            <Text style={styles.course} numberOfLines={1}>
              {item.course_title}
              {item.unit_title && !isShort ? ` · ${item.unit_title}` : ''}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View style={[styles.videoStage, { width: videoW, height: videoH }]}>
            {isActive ? (
              <WebView
                key={`wv-${item.id}-${isShort ? 's' : 'w'}-${muted ? 'm' : 'u'}`}
                ref={(r) => {
                  webRefs.current.set(item.id, r);
                  if (r) {
                    try {
                      r.postMessage?.(JSON.stringify({ cmd: 'play' }));
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                originWhitelist={['*']}
                source={
                  item.youtube_id
                    ? {
                        html: youtubeEmbedHtml(item.youtube_id, muted, isShort, true),
                        baseUrl: YT_EMBED_ORIGIN,
                      }
                    : hosted
                      ? { uri: hosted }
                      : {
                          html: '<html><body style="background:#000"></body></html>',
                          baseUrl: YT_EMBED_ORIGIN,
                        }
                }
                style={{ width: videoW, height: videoH, backgroundColor: '#000' }}
                allowsFullscreenVideo={!isShort}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                androidLayerType="hardware"
                mixedContentMode="always"
                onMessage={(ev) => {
                  try {
                    const data = JSON.parse(String(ev.nativeEvent?.data || '{}')) as {
                      playing?: boolean;
                    };
                    if (data.playing === true) {
                      pauseOthers(item.id);
                      setPlayingItemId(item.id);
                    } else if (data.playing === false) {
                      setPlayingItemId((cur) => (cur === item.id ? null : cur));
                    }
                  } catch {
                    /* ignore */
                  }
                }}
                userAgent={
                  Platform.OS === 'android'
                    ? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                    : undefined
                }
              />
            ) : (
              <View style={[styles.placeholder, { width: videoW, height: videoH }]}>
                <Text style={styles.placeholderTxt}>{isShort ? 'Short · 9:16' : 'Video · 16:9'}</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.caption,
              {
                paddingBottom: 10 + (isShort ? 4 : insets.bottom * 0.1),
                minHeight: isShort ? shortFooterH - 8 : undefined,
              },
            ]}
          >
            {!isShort ? (
              <ScrollView
                style={styles.captionScroll}
                contentContainerStyle={styles.captionScrollInner}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
                {notes ? (
                  <>
                    <Text style={styles.notesLabel}>
                      {item.unit_title ? `Unit notes · ${item.unit_title}` : 'Unit notes'}
                    </Text>
                    <Text style={styles.notes}>{notes}</Text>
                  </>
                ) : null}
                <Text style={styles.meta}>swipe up for next{levelLabel ? ` · ${levelLabel}` : ''}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.meta}>
                swipe up for next
                {levelLabel ? ` · ${levelLabel}` : ''}
                {' · Short'}
              </Text>
            )}
            <View style={styles.controls}>
              <Pressable style={styles.ctrlBtn} onPress={() => setMuted((m) => !m)}>
                <Text style={styles.ctrlTxt}>{muted ? 'Unmute' : 'Mute'}</Text>
              </Pressable>
              {hosted ? (
                <Pressable style={styles.ctrlBtn} onPress={() => void downloadItem(item)}>
                  <Text style={styles.ctrlTxt}>Download</Text>
                </Pressable>
              ) : null}
              {showUnitCta ? (
                <Pressable style={[styles.ctrlBtn, styles.ctrlBtnPrimary]} onPress={() => openUnit(item)}>
                  <Text style={styles.ctrlTxt}>View unit</Text>
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
        paddingTop: topPad,
        alignItems: 'center',
      }}
    >
      <View
        style={{ flex: 1, width: isDesktopWeb ? frameW : '100%' }}
        onLayout={onListLayout}
      >
        {listH > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            style={{ flex: 1 }}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={itemH}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            bounces={false}
            overScrollMode="never"
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
            removeClippedSubviews
            getItemLayout={(_, index) => ({ length: itemH, offset: itemH * index, index })}
            onViewableItemsChanged={onViewableStable}
            viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            renderItem={renderItem}
            ListFooterComponent={null}
          />
        ) : null}
        {loadingMore ? (
          <View style={styles.loadMore} pointerEvents="none">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  hint: { color: '#aaa', fontSize: 13, textAlign: 'center' },
  err: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  phoneFrame: { backgroundColor: '#000', maxWidth: PHONE_FRAME_MAX, flexDirection: 'column' },
  titleBand: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#000',
  },
  videoStage: { width: '100%', backgroundColor: '#000' },
  placeholder: {
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600' },
  caption: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0a0a0a',
  },
  captionScroll: { flex: 1 },
  captionScrollInner: { paddingBottom: 8, gap: 4 },
  playingBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  loadMore: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
  },
  course: { color: Colors.primaryLight || '#86efac', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  title: { color: '#fff', fontSize: 17, fontWeight: '800' },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 19 },
  notesLabel: {
    color: Colors.primaryLight || '#86efac',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  notes: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 19 },
  meta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  ctrlBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ctrlBtnPrimary: { backgroundColor: 'rgba(34,197,94,0.35)' },
  ctrlTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
