import { useEffect } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
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

/** Registers bottom-tab navigation for the native header menu (must run inside Tab.Navigator). */
export function useRegisterTabJumper() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { registerTabJumper } = useWebViewControl();

  useEffect(() => {
    if (!isFocused) return;

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
  }, [isFocused, navigation, registerTabJumper]);
}
