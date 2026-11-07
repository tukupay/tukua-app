/**
 * Floating bottom tab bar (TukuPay bottom_nav look): a white rounded bar that floats over the page with a
 * small margin, a soft dark-green pill sliding behind the active icon, a small yellow dot under it,
 * active dark green, inactive grey.
 *
 * Drop-in for @react-navigation/bottom-tabs: `tabBar={(p) => <FloatingTabBar {...p} />}`.
 * Uses each route's options.tabBarIcon / tabBarLabel / title / tabBarBadge / tabBarAccessibilityLabel,
 * emits tabPress (so `listeners` with preventDefault keep working) and tabLongPress, hides itself when
 * options.tabBarStyle has display: 'none', and steps aside for the Android keyboard.
 * Only react-native's Animated is used (no reanimated). Dragging sideways across the bar moves one tab
 * (TabSwipe); taps and swipes share pressTab, so tabPress guards apply to both.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAppTheme } from '../../context/AppThemeContext';
import { rgba } from '../../theme/color';
import { pressTab, registerTabNavigator, useTabBarSwipeGesture } from '../../navigation/TabSwipe';

/** The bar's own height (without margins or the safe-area inset). */
export const FLOATING_TAB_BAR_HEIGHT = 62;
const SIDE_MARGIN = 12;
const BOTTOM_MARGIN = 8;
const RADIUS = 22;
const PILL_W = 52;
const PILL_H = 30;
const ICON_SIZE = 22;
const INACTIVE = '#7A817C';

/** Total room the floating bar takes from the bottom of the screen; pad scroll content by this. */
export function floatingTabBarSpace(bottomInset: number): number {
  return FLOATING_TAB_BAR_HEIGHT + BOTTOM_MARGIN + bottomInset + 4;
}

function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // iOS does not resize the screen, so the keyboard covers the bar there anyway.
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { palette } = useAppTheme();
  const green = palette.primary;
  const yellow = palette.secondary;
  const keyboardOpen = useKeyboardOpen();
  const swipe = useTabBarSwipeGesture();
  // Page swipes (TabSwipe) press tabs through the same navigator helpers as this bar.
  registerTabNavigator(navigation, state);

  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key]?.options ?? {};
  const flat = (StyleSheet.flatten(focusedOptions.tabBarStyle as ViewStyle) ?? {}) as ViewStyle;
  const hidden = flat.display === 'none';
  const hideOnKeyboard = focusedOptions.tabBarHideOnKeyboard !== false;

  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slotW = width > 0 ? width / count : 0;
  const x = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (slotW === 0) return;
    const target = (state.index + 0.5) * slotW - PILL_W / 2;
    if (!placed.current) {
      x.setValue(target);
      placed.current = true;
      Animated.timing(pillOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(x, {
      toValue: target,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [state.index, slotW, x, pillOpacity]);

  if (hidden || (keyboardOpen && hideOnKeyboard)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: BOTTOM_MARGIN + (insets?.bottom ?? 0) },
      ]}>
      <GestureDetector gesture={swipe}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          { boxShadow: `0px 4px 12px ${rgba(green, 0.1)}` } as ViewStyle,
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            { backgroundColor: rgba(green, 0.1), opacity: pillOpacity, transform: [{ translateX: x }] },
          ]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? green : INACTIVE;
          const title =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const onPress = () => {
            if (focused) {
              // Re-tapping the active tab still emits tabPress (listeners may scroll to top etc.).
              navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              return;
            }
            pressTab(navigation, state, index);
          };
          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const label =
            typeof options.tabBarLabel === 'function' ? (
              options.tabBarLabel({ focused, color, position: 'below-icon', children: title })
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color, fontFamily: focused ? 'Inter_700Bold' : 'Inter_500Medium', opacity: focused ? 1 : 0.85 },
                ]}>
                {title}
              </Text>
            );
          const badge = options.tabBarBadge;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
              testID={options.tabBarButtonTestID}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
              <View style={styles.iconBox}>
                {options.tabBarIcon?.({ focused, color, size: ICON_SIZE }) ?? null}
                {badge != null ? (
                  <View style={[styles.badge, { backgroundColor: yellow }]}>
                    <Text style={[styles.badgeText, { color: green }]} numberOfLines={1}>
                      {String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {label}
              <View style={[styles.dot, { backgroundColor: focused ? yellow : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 4,
  },
  bar: {
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: RADIUS,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6EBE7',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  itemPressed: { opacity: 0.7 },
  iconBox: {
    height: PILL_H,
    minWidth: PILL_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    marginTop: 1,
    paddingHorizontal: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
});
