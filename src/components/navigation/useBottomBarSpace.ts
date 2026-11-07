import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { floatingTabBarSpace } from './FloatingTabBar';

/**
 * Room the floating bottom tab bar takes from the bottom of a tab screen (bar + margin + safe area).
 * Pad scroll content with it, and lift absolutely-positioned bottom buttons/FABs by it, so nothing
 * ends up under the bar.
 */
export function useBottomBarSpace(): number {
  const insets = useSafeAreaInsets();
  return floatingTabBarSpace(insets.bottom);
}
