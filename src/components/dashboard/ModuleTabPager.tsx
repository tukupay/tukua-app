/**
 * Shared pill tabs + react-native-pager-view swipe (nested in ScrollView via measured height).
 * Pass `renderPage` for swipeable pages; legacy `children` still works without horizontal pager.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Colors } from '../../theme/yana';

export type ModuleTabItem<T extends string = string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: ModuleTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Render each tab page — enables pager swipe. */
  renderPage?: (key: T) => React.ReactNode;
  /** Legacy: parent renders active tab content only. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  minHeight?: number;
};

export function ModuleTabPager<T extends string>({
  tabs,
  value,
  onChange,
  renderPage,
  children,
  style,
  contentStyle,
  minHeight = 280,
}: Props<T>) {
  const pagerRef = useRef<PagerView>(null);
  const index = Math.max(0, tabs.findIndex((t) => t.key === value));
  const [pageHeight, setPageHeight] = useState(minHeight);
  const syncing = useRef(false);
  /** Avoid setPage fighting swipe-back when onChange already matched pager. */
  const lastPagerPos = useRef(index);

  useEffect(() => {
    if (!renderPage || syncing.current) return;
    if (lastPagerPos.current === index) return;
    lastPagerPos.current = index;
    pagerRef.current?.setPage(index);
  }, [index, renderPage]);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const i = e.nativeEvent.position;
      lastPagerPos.current = i;
      const next = tabs[i]?.key;
      if (next && next !== value) {
        syncing.current = true;
        onChange(next);
        requestAnimationFrame(() => {
          syncing.current = false;
        });
      }
    },
    [onChange, tabs, value],
  );

  const onPageLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = Math.ceil(e.nativeEvent.layout.height);
      if (h > 0) setPageHeight((prev) => Math.max(minHeight, h, prev));
    },
    [minHeight],
  );

  const pages = useMemo(
    () => (renderPage ? tabs.map((t) => renderPage(t.key)) : []),
    [tabs, renderPage],
  );

  const tabBar = (
    <View style={styles.tabs}>
      {tabs.map((t) => (
        <Pressable
          key={t.key}
          style={[styles.tab, value === t.key && styles.tabActive]}
          onPress={() => onChange(t.key)}
        >
          <Text style={[styles.tabText, value === t.key && styles.tabTextActive]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  if (!renderPage) {
    return (
      <View style={style}>
        {tabBar}
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View style={style}>
      {tabBar}
      <PagerView
        ref={pagerRef}
        style={[styles.pager, { height: pageHeight }]}
        initialPage={index}
        onPageSelected={onPageSelected}
        overdrag
        offscreenPageLimit={Math.max(1, tabs.length - 1)}
      >
        {pages.map((node, i) => (
          <View key={tabs[i]?.key ?? String(i)} style={styles.page} collapsable={false}>
            <View style={contentStyle} onLayout={onPageLayout}>
              {node}
            </View>
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(21,65,29,0.12)',
  },
  tabActive: {
    backgroundColor: Colors.brandGreenMid,
    borderColor: Colors.brandGreenMid,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  tabTextActive: {
    color: '#fff',
  },
  pager: {
    width: '100%',
  },
  page: {
    width: '100%',
  },
});
