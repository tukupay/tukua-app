// Ported from TukuPay mobile (src/widgets/shared/book_pager.tsx), 2026-11-07. Flat shading only, no gradients.
// Pages that turn like a book: swipe left to turn the page over to the next one, right to turn
// back to the previous one. The turning page follows the finger, pivoting on its left edge (the
// spine) with perspective, bending slightly as it lifts; the page it uncovers lies underneath in
// its shadow.
//
// How it works: one number, `position`, says where the reader is (0 = first page, 1.5 = halfway
// through turning page 1 over to page 2). Each page draws itself from that number alone, on the UI
// thread (Reanimated), so the turn follows the finger smoothly and nothing re-renders while it
// moves. Page i is turned by clamp(position - i, 0, 1): 0 = lying flat, 1 = turned out of sight.
// Lower pages are drawn on top, so an unturned page covers the ones after it, and a fully turned
// page (edge-on, back face hidden) shows nothing. The pages on either side of the shown one stay
// mounted, so the next one is already there when a turn starts.
//
// Smoothness: a let-go page finishes with a spring that carries the finger's speed (a quick flick turns
// fast, a slow drag eases in), not a fixed-length timing; pages are rendered once and kept (the pager's own
// state changes re-render no page); and on Android a page being turned is drawn from a hardware texture,
// so a whole dashboard (glass, lists) is not redrawn on every frame of the turn.
//
// Android notes: every page always carries the same set of style props (only their values change);
// Android can't reset some props to "unset" (removing backfaceVisibility threw "Error while updating
// property 'backfaceVisibility' ... null"). The pivot is made with translateX around rotateY, and no
// elevation is used on turning pages.
import React, { createContext, memo, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface BookPagerProps {
  /** The page shown. Changing it from outside (a Next button, a step tap) turns the page too. */
  index: number;
  count: number;
  renderPage: (index: number) => ReactNode;
  /** Called when a swipe has turned to another page. */
  onFlip?: (index: number) => void;
  /** False for steps that must go in order: pages still turn, but only when `index` changes. */
  swipeable?: boolean;
  /** Page colour (white, like paper). Transparent for pages that are cards with their own shape. */
  pageBackground?: string;
  /** Shade the pages as they turn. Off for transparent pages, where the shade would show as a box. */
  shade?: boolean;
  /**
   * Keep every page built (a few tabs of forms): what was typed stays and nothing is fetched again when a page
   * comes back. Off by default: then only the shown page and one on each side are kept.
   */
  keepAll?: boolean;
  /**
   * As tall as the page shown, not filling the parent: tabs inside a scrolling page (pay by M-Pesa or TukuPay). The
   * height follows the turn from one page's height to the next. Pages then size to their content (no flex: 1).
   */
  fit?: boolean;
}

/** The pager's swipe, for a sideways list inside a page to hold it off (PagerSafeStrip). */
const PagerSwipe = createContext<GestureType | null>(null);

/**
 * A sideways-scrolling strip inside a book page (favourites, chips): a swipe on it scrolls the strip and never
 * turns the page; a swipe anywhere else turns it as usual. Outside a pager it is a plain horizontal list.
 */
export function PagerSafeStrip({ children, ...props }: Omit<ScrollViewProps, 'horizontal'> & { children: ReactNode }) {
  const swipe = useContext(PagerSwipe);
  // The strip's own scroll is the native gesture; the page's swipe waits for it to fail (it fails at once for a
  // touch that starts outside the strip).
  const native = useMemo(() => (swipe ? Gesture.Native().blocksExternalGesture(swipe) : Gesture.Native()), [swipe]);
  return (
    <GestureDetector gesture={native}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...props}>
        {children}
      </ScrollView>
    </GestureDetector>
  );
}

/**
 * Wraps one existing sideways scroller (a ScrollView / FlatList with its own ref and props) so a swipe on it scrolls
 * it and never turns the page. Same rule as PagerSafeStrip, for scrollers that are already built.
 */
export function PagerSafe({ children }: { children: React.ReactElement }) {
  const swipe = useContext(PagerSwipe);
  const native = useMemo(() => (swipe ? Gesture.Native().blocksExternalGesture(swipe) : Gesture.Native()), [swipe]);
  return <GestureDetector gesture={native}>{children}</GestureDetector>;
}

/** A full turn asked for from outside (a Next button, a step tap); a swipe finishes with a spring instead. */
const TURN_MS = 420;
/** The let-go spring: no bounce past the page, settles in about a third of a second. */
const RELEASE = { damping: 28, stiffness: 240, mass: 1, overshootClamping: true } as const;
/** How far (as a share of the width) a swipe must go to finish turning when let go. */
const COMMIT_AT = 0.3;
/** How much a turning page bends at mid-turn. */
const BEND_DEG = 5;

export function BookPager({ index, count, renderPage, onFlip, swipeable = true, pageBackground = '#FFFFFF', shade = true, keepAll = false, fit = false }: BookPagerProps) {
  const [shown, setShown] = useState(index);
  const [width, setWidth] = useState(0);
  const position = useSharedValue(index);
  const startAt = useSharedValue(index);
  const pageWidth = useSharedValue(1);
  const last = Math.max(count - 1, 0);

  // fit: each page's own height, and the pager's height between the two pages either side of `position`.
  const heights = useSharedValue<number[]>([]);
  const measured = useRef<number[]>([]);
  const measure = useCallback(
    (i: number, h: number) => {
      if (measured.current[i] === h) return;
      measured.current[i] = h;
      heights.value = [...measured.current];
    },
    [heights],
  );
  const fitStyle = useAnimatedStyle(() => {
    if (!fit) return {};
    const p = position.value;
    const a = Math.floor(p);
    const ha = heights.value[a] ?? 0;
    const hb = heights.value[Math.ceil(p)] ?? ha;
    return { height: ha + (hb - ha) * (p - a) };
  });

  // True while a page is being turned: Android draws the pages from a texture meanwhile.
  const [turning, setTurning] = useState(false);

  const settle = (target: number, fromSwipe: boolean) => {
    setTurning(false);
    setShown(target);
    if (fromSwipe) onFlip?.(target);
  };

  const turnTo = (target: number, fromSwipe: boolean) => {
    'worklet';
    position.value = withTiming(target, { duration: TURN_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(settle, target, fromSwipe);
    });
  };

  /** Let go: springs on with the finger's speed (pages per second). */
  const release = (target: number, velocity: number, flipped: boolean) => {
    'worklet';
    position.value = withSpring(target, { ...RELEASE, velocity }, (finished) => {
      if (finished) scheduleOnRN(settle, target, flipped);
      else scheduleOnRN(setTurning, false);
    });
  };

  // Turned from outside: animate to it (or jump, before the pager has a size).
  useEffect(() => {
    const target = Math.min(Math.max(index, 0), last);
    if (target === shown) return;
    if (width === 0) {
      position.value = target;
      setShown(target);
      return;
    }
    setTurning(true);
    turnTo(target, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, last]);

  // The swipe is recognised natively (gesture handler): a mostly sideways drag claims the page and
  // cancels the page's scroll view; a mostly vertical one fails, and the page scrolls as usual.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(swipeable && count > 1)
        .activeOffsetX([-12, 12])
        .failOffsetY([-14, 14])
        .onStart(() => {
          startAt.value = Math.round(position.value);
          scheduleOnRN(setTurning, true);
        })
        .onUpdate((e) => {
          const from = startAt.value;
          // One page at a time, never past the first or last.
          const lo = Math.max(from - 1, 0);
          const hi = Math.min(from + 1, last);
          position.value = Math.min(Math.max(from - e.translationX / pageWidth.value, lo), hi);
        })
        .onEnd((e) => {
          const from = startAt.value;
          const moved = position.value - from;
          // velocityX is in points per second; a flick turns the page even when it went only a little way.
          let target = from;
          if (moved > COMMIT_AT || e.velocityX < -500) target = from + 1;
          else if (moved < -COMMIT_AT || e.velocityX > 500) target = from - 1;
          target = Math.min(Math.max(target, 0), last);
          // The finger's speed carries on into the turn (right to left is forward).
          release(target, -e.velocityX / pageWidth.value, target !== from);
        }),
    // turnTo only reads shared values and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swipeable, count, last],
  );

  // The shown page and one on each side (more while turning across several pages from outside); every page with keepAll.
  const lo = keepAll ? 0 : Math.max(Math.min(shown, index) - 1, 0);
  const hi = keepAll ? last : Math.min(Math.max(shown, index) + 1, last);
  const pages: number[] = [];
  // Highest first, so lower pages are drawn on top.
  for (let i = hi; i >= lo; i--) pages.push(i);


  return (
    <PagerSwipe.Provider value={pan}>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[{ overflow: 'hidden' }, fit ? fitStyle : { flex: 1 }]}
          collapsable={false}
          onLayout={(e) => {
            const w = Math.max(Math.round(e.nativeEvent.layout.width), 1);
            pageWidth.value = w;
            setWidth(w);
          }}
        >
          {pages.map((i) => (
            <Page key={i} i={i} current={i === shown} position={position} width={width} background={pageBackground} shade={shade} turning={turning}>
              {fit ? (
                <View onLayout={(e) => measure(i, Math.ceil(e.nativeEvent.layout.height))}>
                  <PageBody i={i} render={renderPage} />
                </View>
              ) : (
                <PageBody i={i} render={renderPage} />
              )}
            </Page>
          ))}
        </Animated.View>
      </GestureDetector>
    </PagerSwipe.Provider>
  );
}

/**
 * A page's content, rendered again only for a new renderPage (the parent passed new data): the pager's own
 * changes (a turn starting, the page settling) re-render none of the pages.
 */
const PageBody = memo(function PageBody({ i, render }: { i: number; render: (i: number) => ReactNode }) {
  return <>{render(i)}</>;
});

const Page = memo(function Page({
  i,
  current,
  position,
  width,
  background,
  shade,
  turning,
  children,
}: {
  i: number;
  /** The page shown: the others are kept out of a screen reader's way. */
  current: boolean;
  position: SharedValue<number>;
  width: number;
  background: string;
  shade: boolean;
  turning: boolean;
  children: ReactNode;
}) {
  const half = width / 2;
  // A see-through page would show the next one (mounted beneath it) through its gaps: a chart of the next
  // report behind this one's. So a page under a see-through one shows only as that one turns away.
  const seeThrough = isClear(background);

  const pageStyle = useAnimatedStyle(() => {
    // How far this page is turned: 0 flat, 1 out of sight.
    const t = Math.min(Math.max(position.value - i, 0), 1);
    const bend = Math.sin(t * Math.PI) * BEND_DEG;
    // How far the page above this one has turned away (1 for the page shown).
    const uncovered = Math.min(Math.max(position.value - (i - 1), 0), 1);
    return {
      opacity: seeThrough ? uncovered : 1,
      // Rotate about the left edge (move it to the centre, rotate, move back); the skew makes the
      // lifted page look curved rather than flat.
      transform: [{ perspective: 1400 }, { translateX: -half }, { rotateY: `${-90 * t}deg` }, { translateX: half }, { skewY: `${-bend}deg` }],
    };
  });

  // The turning page darkens towards its free edge as it lifts away from the light.
  const foldStyle = useAnimatedStyle(() => {
    const t = Math.min(Math.max(position.value - i, 0), 1);
    return { opacity: shade ? Math.sin(t * Math.PI) * 0.28 + t * 0.15 : 0 };
  });

  // The page beneath lies in the shadow of the one turning over it, darkest along the fold.
  const underStyle = useAnimatedStyle(() => {
    const above = Math.min(Math.max(position.value - (i - 1), 0), 1);
    const turning = above > 0 && above < 1;
    return { opacity: shade && turning ? (1 - above) * 0.22 : 0 };
  });
  const castStyle = useAnimatedStyle(() => {
    const above = Math.min(Math.max(position.value - (i - 1), 0), 1);
    const turning = above > 0 && above < 1;
    // Where the turning page's free edge falls on this page.
    const edge = width * Math.cos((above * Math.PI) / 2);
    return {
      opacity: shade && turning ? Math.sin(above * Math.PI) * 0.3 : 0,
      transform: [{ translateX: Math.max(edge - 18, 0) }],
    };
  });

  return (
    <Animated.View
      importantForAccessibility={current ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!current}
      // Pages kept built off screen (keepAll, the neighbours) must not catch taps meant for the shown page.
      pointerEvents={current ? 'auto' : 'none'}
      renderToHardwareTextureAndroid={turning}
      style={[StyleSheet.absoluteFill, { backgroundColor: background, backfaceVisibility: 'hidden' }, pageStyle]}
    >
      {children}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade, underStyle]} />
      <Animated.View pointerEvents="none" style={[styles.cast, castStyle]} />
      <Animated.View pointerEvents="none" style={[styles.fold, foldStyle]} />
    </Animated.View>
  );
});

/** True for a colour with nothing to see: 'transparent', #RGBA / #RRGGBBAA with alpha 0, rgba(…, 0). */
function isClear(color: string) {
  const c = String(color ?? '').trim().toLowerCase();
  if (!c || c === 'transparent') return true;
  if (/^#[0-9a-f]{4}$/.test(c)) return c[4] === '0';
  if (/^#[0-9a-f]{8}$/.test(c)) return c.slice(7) === '00';
  const m = /^(rgba|hsla)\(([^)]+)\)$/.exec(c);
  return Boolean(m && Number(m[2].split(/[,\s/]+/).filter(Boolean)[3]) === 0);
}

const styles = StyleSheet.create({
  shade: { backgroundColor: '#000000' },
  // A soft band of shadow cast along the turning page's edge.
  cast: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 18, backgroundColor: '#000000' },
  // The free edge of the turning page, darkest where it curls.
  fold: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '35%', backgroundColor: '#000000' },
});
