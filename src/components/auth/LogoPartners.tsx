import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ColorChangingText, loginWordmarkMetrics } from './ColorChangingText';
import { useAuthScale } from './useAuthScale';

export function LogoPartners({
  compact,
  onGreen = false,
  onBrandBottom,
}: {
  compact?: boolean;
  onGreen?: boolean;
  onBrandBottom?: (bottomY: number) => void;
}) {
  const { scale, font, s } = useAuthScale();
  const { maskW } = loginWordmarkMetrics('Tukua', compact, scale);
  const brandRef = useRef<View>(null);

  const onBrandLayout = useCallback(() => {
    if (!onBrandBottom) return;
    brandRef.current?.measureInWindow((_x, y, _w, h) => {
      onBrandBottom(y + h);
    });
  }, [onBrandBottom]);

  return (
    <View style={[styles.wrapper, { gap: s(8) }]}>
      <View ref={brandRef} style={[styles.brandCenter, { width: maskW }]} onLayout={onBrandLayout}>
        <ColorChangingText
          text="Tukua"
          compact={compact}
          showStar={false}
          login
          onGreen={onGreen}
          scale={scale}
        />
        <View
          style={{
            width: maskW,
            height: compact ? font(28) : font(32),
            marginTop: 2,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  brandCenter: {
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
