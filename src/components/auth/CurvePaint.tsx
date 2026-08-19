import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, TextProps, useWindowDimensions, View, ViewProps } from 'react-native';
import { Colors } from '../../theme/yana';
import { isInsideHeroCurve } from './LoginHeroCurve';

const CurveHContext = createContext(0);

export function CurveHProvider({
  height,
  children,
}: {
  height: number;
  children: React.ReactNode;
}) {
  return <CurveHContext.Provider value={height}>{children}</CurveHContext.Provider>;
}

export function useInsideCurve(opts?: { fullyInside?: boolean }) {
  const curveH = useContext(CurveHContext);
  const { width } = useWindowDimensions();
  const fullyInside = opts?.fullyInside ?? false;
  const ref = useRef<View>(null);
  const [inside, setInside] = useState(false);
  const onLayout = useCallback(() => {
    const node = ref.current as View | null;
    if (!node || curveH <= 0) {
      setInside(false);
      return;
    }
    node.measureInWindow((x, y, w, h) => {
      const cx = x + w / 2;
      const top = isInsideHeroCurve(cx, y + 2, width, curveH);
      if (!fullyInside) {
        setInside(top);
        return;
      }
      const bot = isInsideHeroCurve(cx, y + Math.max(4, h - 2), width, curveH);
      setInside(top && bot);
    });
  }, [curveH, width, fullyInside]);
  return { ref, onLayout, inside };
}

/** Measures itself and renders children with inside=on-photo. */
export function CurvePaint({
  children,
  style,
  fullyInside = false,
}: {
  children: (inside: boolean) => React.ReactNode;
  style?: ViewProps['style'];
  fullyInside?: boolean;
}) {
  const { ref, onLayout, inside } = useInsideCurve({ fullyInside });
  return (
    <View ref={ref} collapsable={false} onLayout={onLayout} style={style}>
      {children(inside)}
    </View>
  );
}

/** Body copy: white on the photo, dark off it. */
export function CurveText({ style, ...rest }: TextProps) {
  return (
    <CurvePaint style={{ width: '100%', alignSelf: 'stretch' }} fullyInside>
      {(inside) => (
        <Text
          {...rest}
          style={[styles.base, inside ? styles.onPhoto : styles.offPhoto, style]}
        />
      )}
    </CurvePaint>
  );
}

const styles = StyleSheet.create({
  base: {},
  onPhoto: {
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  offPhoto: {
    color: Colors.brandGreenDark,
  },
});
