import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandSteps } from './BrandSteps';
import { ColorChangingText, loginWordmarkMetrics } from './ColorChangingText';
import { useAuthScale } from './useAuthScale';

const TAGLINE = 'Your School AI Agent';

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
  const { maskW } = loginWordmarkMetrics('Tukua AI', compact, scale);
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
          text="Tukua AI"
          compact={compact}
          showStar={false}
          login
          onGreen={onGreen}
          scale={scale}
        />
        <Text
          style={[
            styles.tagline,
            compact && styles.taglineCompact,
            onGreen ? styles.taglineOnGreen : styles.taglineOnLight,
            {
              width: maskW,
              fontSize: compact ? font(22) : font(26),
              lineHeight: compact ? font(28) : font(32),
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          accessibilityRole="text">
          {TAGLINE}
        </Text>
      </View>
      <BrandSteps compact={compact} onGreen={onGreen} scale={scale} />
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
  tagline: {
    marginTop: 2,
    fontFamily: 'AlexBrush_400Regular',
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    includeFontPadding: false,
  },
  taglineCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  taglineOnGreen: {
    color: '#ffffff',
  },
  taglineOnLight: {
    color: '#1F3A2E',
  },
});
