import { Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import type { WebViewProps } from 'react-native-webview';

/** Inline HTML5 audio/video fixes for chat radio (Shoutcast / TV47 streams in WebView). */
export const WEBVIEW_MEDIA_INJECT_JS = `
(function() {
  function fixMedia() {
    try {
      document.querySelectorAll('audio,video').forEach(function(el) {
        el.setAttribute('playsinline', 'true');
        el.setAttribute('webkit-playsinline', 'true');
        if (el.tagName === 'AUDIO') {
          el.crossOrigin = 'anonymous';
        }
      });
    } catch (e) {}
  }
  fixMedia();
  if (document.body && window.MutationObserver) {
    new MutationObserver(fixMedia).observe(document.body, { childList: true, subtree: true });
  }
  true;
})();
`;

/** Platform-safe WebView props for inline audio/video in chat. */
export function getWebViewMediaProps(): Partial<WebViewProps> {
  const base: Partial<WebViewProps> = {
    mediaPlaybackRequiresUserAction: false,
    allowsFullscreenVideo: true,
  };

  if (Platform.OS === 'ios') {
    return {
      ...base,
      allowsInlineMediaPlayback: true,
    };
  }

  if (Platform.OS === 'android') {
    return {
      ...base,
      /** Shoutcast / legacy stream URLs are often http:// on https://tukua.ai */
      mixedContentMode: 'always',
    };
  }

  return base;
}

/** @deprecated Use getWebViewMediaProps() — kept for existing imports. */
export const webViewMediaProps = getWebViewMediaProps();

/** Route WebView audio to the device speaker (not earpiece) and play in silent mode on iOS. */
export async function configureWebViewAudioSession(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // expo-audio (expo-av was removed from the SDK): same session as before under its new names.
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    // non-fatal
  }
}
