import { Camera } from 'expo-camera';
import { Platform } from 'react-native';
import type { WebViewProps } from 'react-native-webview';
import { log } from './logger';

/**
 * Props that help Profile WebView handle file inputs,
 * camera capture (ID front), and document picks.
 */
export function getWebViewUploadProps(): Partial<WebViewProps> {
  const base: Partial<WebViewProps> = {
    mediaPlaybackRequiresUserAction: false,
  };

  if (Platform.OS === 'android') {
    return {
      ...base,
      mediaCapturePermissionGrantType: 'grantIfSameHostElsePrompt' as never,
    };
  }

  if (Platform.OS === 'ios') {
    return {
      ...base,
      allowsInlineMediaPlayback: true,
    };
  }

  return base;
}

/** Request camera before ID / document uploads. Gallery uses the system photo picker (no READ_MEDIA_*). */
export async function ensureWebViewUploadPermissions(): Promise<void> {
  try {
    const cam = await Camera.requestCameraPermissionsAsync();
    if (!cam.granted) {
      log.warn('WebViewUpload', 'camera permission not granted');
    }
  } catch (e) {
    log.warn('WebViewUpload', String(e));
  }
}
