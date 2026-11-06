import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../../context/AppThemeContext';

const TILE = 200;

function ChatTile({ C }: { C: { green: string; teal: string; amber: string } }) {
  return (
    <G>
      <Path d="M200 0H0V200" fill="none" stroke={C.green} strokeWidth={1.1} opacity={0.28} />
      <Circle cx={22} cy={168} r={14} fill={C.teal} opacity={0.22} />
      <Circle cx={178} cy={34} r={12} fill={C.amber} opacity={0.2} />
      <Circle cx={96} cy={52} r={9} fill={C.amber} opacity={0.18} />
      <Ellipse cx={154} cy={172} rx={16} ry={10} fill={C.teal} opacity={0.18} />
      <Circle cx={48} cy={98} r={7} fill={C.green} opacity={0.2} />

      <Circle cx={34} cy={40} r={5} fill="none" stroke={C.teal} strokeWidth={1.6} opacity={0.45} />
      <Circle cx={78} cy={22} r={3} fill="none" stroke={C.teal} strokeWidth={1.6} opacity={0.4} />
      <Circle cx={94} cy={62} r={4.2} fill="none" stroke={C.teal} strokeWidth={1.6} opacity={0.42} />
      <Circle cx={18} cy={74} r={3.2} fill="none" stroke={C.teal} strokeWidth={1.4} opacity={0.38} />
      <Circle cx={146} cy={132} r={4.4} fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.42} />
      <Circle cx={176} cy={112} r={2.8} fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.4} />
      <Circle cx={168} cy={154} r={5.4} fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.42} />
      <Circle cx={112} cy={28} r={3.6} fill="none" stroke={C.amber} strokeWidth={1.5} opacity={0.4} />
      <Circle cx={42} cy={132} r={6} fill="none" stroke={C.amber} strokeWidth={1.5} opacity={0.4} />
      <Circle cx={158} cy={78} r={3.2} fill="none" stroke={C.amber} strokeWidth={1.4} opacity={0.36} />

      <Circle cx={36} cy={42} r={2.2} fill={C.teal} opacity={0.5} />
      <Circle cx={72} cy={28} r={2} fill={C.teal} opacity={0.5} />
      <Circle cx={88} cy={58} r={2.1} fill={C.teal} opacity={0.5} />
      <Circle cx={52} cy={72} r={1.9} fill={C.teal} opacity={0.5} />
      <Path
        d="M36 42L72 28L88 58L52 72Z M72 28L52 72"
        fill="none"
        stroke={C.teal}
        strokeWidth={1.35}
        opacity={0.42}
      />

      <Path d="M110 95l24-16v32z" fill="none" stroke={C.amber} strokeWidth={1.6} opacity={0.4} />
      <Path d="M18 110h32l-16 24z" fill="none" stroke={C.amber} strokeWidth={1.6} opacity={0.4} />
      <Path d="M170 86l12-8v16z" fill="none" stroke={C.amber} strokeWidth={1.5} opacity={0.38} />
      <Rect
        x={116}
        y={16}
        width={22}
        height={13}
        rx={2}
        fill="none"
        stroke={C.green}
        strokeWidth={1.3}
        opacity={0.36}
      />

      <SvgText x={88} y={100} fontSize={18} fill={C.green} opacity={0.42} fontFamily="Georgia">
        ∫
      </SvgText>
      <SvgText x={164} y={76} fontSize={16} fill={C.green} opacity={0.4} fontFamily="Georgia">
        ∑
      </SvgText>
      <SvgText x={52} y={128} fontSize={15} fill={C.green} opacity={0.4} fontFamily="Georgia">
        π
      </SvgText>
      <SvgText x={36} y={20} fontSize={16} fill={C.green} opacity={0.4} fontFamily="Georgia">
        ∞
      </SvgText>
      <SvgText x={124} y={186} fontSize={15} fill={C.green} opacity={0.38} fontFamily="Georgia">
        √
      </SvgText>
      <SvgText x={68} y={18} fontSize={9} fill={C.teal} opacity={0.36} fontFamily="Menlo">
        E=mc²
      </SvgText>
    </G>
  );
}

/** Full chat wallpaper, faded so it sits quietly behind the login card. */
export function ChatPatternBackdrop() {
  const { width, height } = useWindowDimensions();
  const { palette } = useAppTheme();
  const C = useMemo(
    () => ({
      green: palette.primary,
      teal: palette.tertiary,
      amber: palette.secondary,
    }),
    [palette.primary, palette.secondary, palette.tertiary],
  );

  const cols = Math.ceil(width / TILE) + 1;
  const rows = Math.ceil(height / TILE) + 1;
  const tiles: { key: string; x: number; y: number }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      tiles.push({ key: `${r}-${c}`, x: c * TILE, y: r * TILE });
    }
  }

  return (
    <View style={styles.root} pointerEvents="none">
      <Svg width={width} height={height} opacity={0.28}>
        {tiles.map((t) => (
          <G key={t.key} transform={`translate(${t.x},${t.y})`}>
            <ChatTile C={C} />
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
});
