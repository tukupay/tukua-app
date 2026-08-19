/**
 * Web build: pill tabs + active page only (no react-native-pager-view — native-only module).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '../../theme/yana';

export type ModuleTabItem<T extends string = string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: ModuleTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  renderPage?: (key: T) => React.ReactNode;
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

  return (
    <View style={style}>
      {tabBar}
      <View style={[contentStyle, { minHeight }]}>
        {renderPage ? renderPage(value) : children}
      </View>
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
});
