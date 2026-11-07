/**
 * A ScrollView for auth forms that keeps the field being typed in above the keyboard, on Android and iOS,
 * without a native keyboard library.
 *
 * - Listens to the keyboard and adds the part of this scroll view that the keyboard covers as extra bottom padding
 *   (0 when Android already resized the window), so the last field can scroll clear of the keyboard.
 * - When an AuthTextField inside it gets focus (or the keyboard opens over a focused one), scrolls just enough to
 *   show the whole field, its error line and a little room under it.
 * Works inside BookPager pages (absolute-positioned, where adjustResize alone does not help) and on plain screens.
 */
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  type KeyboardEvent,
  type ScrollViewProps,
  type View,
} from 'react-native';

/** Room kept between the bottom of the focused field and the top of the keyboard. */
const REVEAL_MARGIN = 28;

type Revealer = {
  /** A field got focus: keep it in view while the keyboard is up. */
  focused: (node: View | null) => void;
  /** That field lost focus. */
  blurred: (node: View | null) => void;
};

const KeyboardRevealContext = createContext<Revealer | null>(null);

/** For AuthTextField: the nearest KeyboardAwareScroll (null outside one: then nothing happens). */
export function useKeyboardReveal() {
  return useContext(KeyboardRevealContext);
}

/** Whether the keyboard is up, its height and its top edge (screen y; 0 when hidden). */
export function useKeyboardState() {
  const [state, setState] = useState({ visible: false, height: 0, top: 0 });
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) =>
      setState({ visible: true, height: e.endCoordinates?.height ?? 0, top: e.endCoordinates?.screenY ?? 0 });
    const subs = [
      Keyboard.addListener(showEvt, onShow),
      Keyboard.addListener(hideEvt, () => setState({ visible: false, height: 0, top: 0 })),
    ];
    if (Platform.OS === 'ios') subs.push(Keyboard.addListener('keyboardWillChangeFrame', onShow));
    return () => subs.forEach((x) => x.remove());
  }, []);
  return state;
}

type KeyboardAwareScrollProps = ScrollViewProps & {
  /**
   * Room kept between the bottom of the focused field and the keyboard (default 28). A form whose button sits
   * right under its last field can pass more, so the button (and a total line) stay in view while typing.
   */
  revealMargin?: number;
};

export const KeyboardAwareScroll = forwardRef<ScrollView, KeyboardAwareScrollProps>(function KeyboardAwareScroll(
  { contentContainerStyle, children, onScroll, onLayout, revealMargin = REVEAL_MARGIN, ...rest },
  ref,
) {
  const marginRef = useRef(revealMargin);
  marginRef.current = revealMargin;
  const scrollRef = useRef<ScrollView>(null);
  useImperativeHandle(ref, () => scrollRef.current as ScrollView);

  const kb = useKeyboardState();
  const kbTopRef = useRef(0);
  kbTopRef.current = kb.visible ? kb.top : 0;
  const scrollYRef = useRef(0);
  const focusedRef = useRef<View | null>(null);
  const [pad, setPad] = useState(0);

  /** How much of this scroll view the keyboard covers (0 if the window was resized above it). */
  const measureCover = useCallback(() => {
    const top = kbTopRef.current;
    const node = scrollRef.current;
    if (!top || !node) {
      setPad(0);
      return;
    }
    (node as unknown as View).measureInWindow((_x, y, _w, h) => {
      setPad(Math.max(0, Math.round(y + h - top)));
    });
  }, []);

  const reveal = useCallback((node: View | null) => {
    if (!node) return;
    const run = () => {
      const top = kbTopRef.current;
      if (!top || focusedRef.current !== node) return;
      node.measureInWindow((_x, y, _w, h) => {
        // Never push the field itself above the top of the screen to make room for the extra margin.
        const margin = Math.min(marginRef.current, Math.max(REVEAL_MARGIN, top - h - 80));
        const overflow = y + h + margin - top;
        if (overflow > 4) {
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollYRef.current + overflow), animated: true });
        }
      });
    };
    // Once the padding has been laid out, and again after the keyboard animation settles.
    setTimeout(run, Platform.OS === 'ios' ? 80 : 60);
    setTimeout(run, Platform.OS === 'ios' ? 320 : 280);
  }, []);

  useEffect(() => {
    measureCover();
    if (kb.visible && focusedRef.current) reveal(focusedRef.current);
  }, [kb.visible, kb.top, measureCover, reveal]);

  const revealer = useMemo<Revealer>(
    () => ({
      focused: (node) => {
        focusedRef.current = node;
        reveal(node);
      },
      blurred: (node) => {
        if (focusedRef.current === node) focusedRef.current = null;
      },
    }),
    [reveal],
  );

  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const basePad = typeof flat.paddingBottom === 'number' ? flat.paddingBottom : 0;

  return (
    <KeyboardRevealContext.Provider value={revealer}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        scrollEventThrottle={16}
        {...rest}
        contentContainerStyle={[flat, pad > 0 ? { paddingBottom: basePad + pad + 16 } : null]}
        onLayout={(e) => {
          if (kbTopRef.current) measureCover();
          onLayout?.(e);
        }}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}>
        {children}
      </ScrollView>
    </KeyboardRevealContext.Provider>
  );
});
