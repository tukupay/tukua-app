import { Camera } from 'expo-camera';
import { PermissionsAndroid, Platform } from 'react-native';
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

/** Request camera (+ gallery on Android) before ID / document uploads. */
export async function ensureWebViewUploadPermissions(): Promise<void> {
  try {
    const cam = await Camera.requestCameraPermissionsAsync();
    if (!cam.granted) {
      log.warn('WebViewUpload', 'camera permission not granted');
    }

    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const images = await PermissionsAndroid.request(
        'android.permission.READ_MEDIA_IMAGES' as typeof PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      if (images !== PermissionsAndroid.RESULTS.GRANTED) {
        log.warn('WebViewUpload', 'READ_MEDIA_IMAGES not granted');
      }
    } else if (Platform.OS === 'android') {
      const storage = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      if (storage !== PermissionsAndroid.RESULTS.GRANTED) {
        log.warn('WebViewUpload', 'READ_EXTERNAL_STORAGE not granted');
      }
    }
  } catch (e) {
    log.warn('WebViewUpload', String(e));
  }
}
