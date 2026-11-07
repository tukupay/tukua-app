/**
 * Swipe between the bottom tabs (Dashboard ↔ AI ↔ Courses ↔ Content ↔ Profile).
 *
 * - Native tabs (Dashboard, Profile) at the root of their stack: a horizontal fling anywhere on the page.
 *   Vertical scrolling fails the gesture, and on Android a horizontal ScrollView / carousel claims the touch
 *   first, so carousels keep scrolling.
 * - WebView tabs (AI chat, Courses, Content): only from a thin strip at the left / right screen edge, so the
 *   page's own horizontal scrolling (carousels, code blocks) and text selection keep working.
 * - Deeper screens of a tab's stack (maps, forms, the stack's own back swipe): no tab swiping.
 * - The floating tab bar itself is also swipeable (see FloatingTabBar).
 *
 * Every swipe goes through the same path as a tap on the bar: `tabPress` is emitted first, so the
 * token / join guards in MainTabs can cancel it, then the tab navigator navigates (the bar's pill follows
 * state.index). The page transition itself is the navigator's slide (TAB_SLIDE_* in MainTabs).
 */
import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions, type ParamListBase, type RouteProp } from '@react-navigation/native';

type BarNav = BottomTabBarProps['navigation'];
type BarState = BottomTabBarProps['state'];

/** Latest navigator helpers + state, registered by the tab bar on every render. */
let registered: { navigation: BarNav; state: BarState } | null = null;

export function registerTabNavigator(navigation: BarNav, state: BarState): void {
  registered = { navigation, state };
}

/**
 * Press tab `index` the way the bar does: emit tabPress (guards may cancel), then navigate.
 * Returns true when the tab changed.
 */
export function pressTab(navigation: BarNav, state: BarState, index: number): boolean {
  const route = state.routes[index];
  if (!route || index === state.index) return false;
  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
  if (event.defaultPrevented) return false;
  navigation.dispatch({ ...CommonActions.navigate(route.name, route.params), target: state.key });
  return true;
}

/** Move to the next (+1) or previous (-1) tab. */
export function goToNeighbourTab(direction: 1 | -1): boolean {
  if (!registered) return false;
  const { navigation, state } = registered;
  return pressTab(navigation, state, state.index + direction);
}

/** Tabs whose page is a WebView: edge swipes only. */
const EDGE_ONLY_TABS = new Set(['Chat', 'Courses', 'Content']);
const EDGE_WIDTH = 18;
/** Horizontal travel before the pan takes over (vertical travel past FAIL_Y cancels it). */
const ACTIVE_X = 24;
const FAIL_Y = 16;
const DISTANCE_TO_SWITCH = 70;
const VELOCITY_TO_SWITCH = 550;
/** How far the page follows the finger before letting go (fraction of the drag, capped). */
const FOLLOW = 0.3;
const FOLLOW_MAX = 90;

/** Decide from a finished pan whether to switch: -1 = previous tab, 1 = next tab, 0 = stay. */
function flingDirection(translationX: number, velocityX: number): 1 | -1 | 0 {
  const far = Math.abs(translationX) >= DISTANCE_TO_SWITCH;
  const fast = Math.abs(velocityX) >= VELOCITY_TO_SWITCH && Math.abs(translationX) >= ACTIVE_X;
  if (!far && !fast) return 0;
  // Finger moving left (negative) reveals the page on the right → next tab.
  return translationX < 0 ? 1 : -1;
}

/** Index of the nested stack (0 = its root screen, or not mounted yet). */
function nestedIndex(route: RouteProp<ParamListBase>): number {
  const nested = (route as { state?: { index?: number } }).state;
  return typeof nested?.index === 'number' ? nested.index : 0;
}

/**
 * Wraps one tab's page (used as the Tab.Navigator `screenLayout`). Adds the swipe gesture and a small
 * follow-the-finger offset while dragging.
 */
export function TabSwipeLayout({
  route,
  children,
}: {
  route: RouteProp<ParamListBase>;
  children: React.ReactNode;
}) {
  const edgeOnly = EDGE_ONLY_TABS.has(route.name);
  const atRoot = nestedIndex(route) === 0;
  const dx = useRef(new Animated.Value(0)).current;

  const gesture = useMemo(() => {
    const settle = () => {
      Animated.timing(dx, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    const make = () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-ACTIVE_X, ACTIVE_X])
        .failOffsetY([-FAIL_Y, FAIL_Y])
        .onUpdate((e) => {
          const follow = Math.max(-FOLLOW_MAX, Math.min(FOLLOW_MAX, e.translationX * FOLLOW));
          dx.setValue(follow);
        })
        .onEnd((e) => {
          const dir = flingDirection(e.translationX, e.velocityX);
          if (dir !== 0) goToNeighbourTab(dir);
          settle();
        })
        .onFinalize(() => settle());
    return { full: make(), left: make(), right: make() };
  }, [dx]);

  if (!atRoot) return <>{children}</>;

  const page = (
    <Animated.View style={[styles.fill, { transform: [{ translateX: dx }] }]}>{children}</Animated.View>
  );

  if (!edgeOnly) {
    return <GestureDetector gesture={gesture.full}>{page}</GestureDetector>;
  }

  // WebView pages: thin edge strips over the page catch the swipe; the WebView keeps everything else.
  return (
    <View style={styles.fill}>
      {page}
      <GestureDetector gesture={gesture.left}>
        <View style={[styles.edge, styles.edgeLeft]} collapsable={false} />
      </GestureDetector>
      <GestureDetector gesture={gesture.right}>
        <View style={[styles.edge, styles.edgeRight]} collapsable={false} />
      </GestureDetector>
    </View>
  );
}

/** Pan for the floating tab bar: drag sideways across the bar to move one tab. */
export function useTabBarSwipeGesture() {
  return useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-ACTIVE_X, ACTIVE_X])
        .failOffsetY([-FAIL_Y, FAIL_Y])
        .onEnd((e) => {
          // On the bar the finger points at where to go: dragging right goes to the next tab.
          const dir = flingDirection(e.translationX, e.velocityX);
          if (dir !== 0) goToNeighbourTab(dir === 1 ? -1 : 1);
        }),
    [],
  );
}

/** Tab change transition: the pages slide like a pager (old one out, new one in from the side). */
export const TAB_SLIDE_TRANSITION_SPEC = {
  animation: 'timing' as const,
  config: { duration: 260, easing: Easing.out(Easing.cubic) },
};

export function tabSlideInterpolator({ current }: { current: { progress: Animated.Value } }) {
  const width = Dimensions.get('window').width || 400;
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-width, 0, width],
          }),
        },
      ],
    },
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  edge: { position: 'absolute', top: 0, bottom: 0, width: EDGE_WIDTH },
  edgeLeft: { left: 0 },
  edgeRight: { right: 0 },
});
