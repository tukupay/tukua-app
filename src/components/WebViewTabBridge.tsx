import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useWebViewControl } from '../context/WebViewControlContext';
import { MainTabParamList } from '../navigation/types';

/** Registers tab navigation from inside the tab navigator (header uses stack nav otherwise). */
export function WebViewTabBridge() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { registerTabJumper } = useWebViewControl();

  useEffect(() => {
    return registerTabJumper((tab) => {
      navigation.navigate(tab);
    });
  }, [navigation, registerTabJumper]);

  return null;
}
