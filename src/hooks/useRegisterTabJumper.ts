import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useWebViewControl } from '../context/WebViewControlContext';
import { MainTabParamList } from '../navigation/types';
import { log } from '../lib/logger';

type NavLike = {
  getParent(): NavLike | undefined;
  getState(): { type: string } | undefined;
};

function resolveTabNavigation(navigation: NavLike): BottomTabNavigationProp<MainTabParamList> | undefined {
  let current: NavLike | undefined = navigation;
  while (current) {
    if (current.getState()?.type === 'tab') {
      return current as BottomTabNavigationProp<MainTabParamList>;
    }
    current = current.getParent();
  }
  return undefined;
}

/**
 * Registers bottom-tab navigation for header / dashboard jumps.
 * Must stay registered even when Dashboard (non-WebView) is focused —
 * previously we only registered on focused web tabs, so Tokens → Profile
 * from Dashboard was a no-op.
 */
export function useRegisterTabJumper() {
  const navigation = useNavigation();
  const { registerTabJumper } = useWebViewControl();

  useEffect(() => {
    const tabNav = resolveTabNavigation(navigation as unknown as NavLike);
    if (!tabNav) {
      log.warn('TabJumper', 'tab navigator not found');
      return;
    }

    return registerTabJumper((tab) => {
      try {
        tabNav.navigate(tab);
      } catch (error) {
        log.warn('TabJumper', 'navigate failed', { tab, error: String(error) });
      }
    });
  }, [navigation, registerTabJumper]);
}
