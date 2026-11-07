/**
 * Dashboard loading state in the dashboard's own shapes: identity row, the compact green hero card and two
 * shortcut cards (two rows of four tiles), all shimmering. Shown while the school sign-in settles.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context/AppThemeContext';
import { Skeleton } from '../ui/Skeleton';
import { CARD } from './DashboardKit';

function TileRow() {
  return (
    <View style={styles.tileRow}>
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={styles.tile}>
          <Skeleton width={52} height={52} radius={16} />
          <Skeleton width={44} height={9} radius={5} style={{ marginTop: 9 }} />
        </View>
      ))}
    </View>
  );
}

function CardShape() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Skeleton width={110} height={14} radius={7} />
      </View>
      <View style={styles.hairline} />
      <View style={styles.cardBody}>
        <TileRow />
        <TileRow />
      </View>
    </View>
  );
}

export function DashboardSkeleton({ topInset = 0 }: { topInset?: number }) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.root, { paddingTop: topInset }]} accessibilityRole="progressbar" accessibilityLabel="Loading dashboard">
      <View style={styles.topBar}>
        <Skeleton width={48} height={48} radius={24} />
        <View style={{ flex: 1, gap: 7 }}>
          <Skeleton width="45%" height={10} radius={5} />
          <Skeleton width="70%" height={16} radius={8} />
          <Skeleton width="35%" height={10} radius={5} />
        </View>
        <Skeleton width={38} height={38} radius={19} />
      </View>

      <View style={[styles.hero, { backgroundColor: palette.primary }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton onDark width="50%" height={10} radius={5} />
          <Skeleton onDark width="78%" height={24} radius={8} />
          <Skeleton onDark width="62%" height={10} radius={5} />
        </View>
        <View style={{ width: '38%', gap: 6 }}>
          <Skeleton onDark height={36} radius={10} />
          <Skeleton onDark height={36} radius={10} />
        </View>
      </View>

      <CardShape />
      <CardShape />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  card: {
    borderRadius: CARD.radius,
    borderWidth: 1,
    borderColor: CARD.border,
    backgroundColor: 'rgba(255,255,255,0.94)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHead: { paddingHorizontal: CARD.padding, paddingTop: 16, paddingBottom: 12 },
  hairline: { marginHorizontal: CARD.padding, height: 1, backgroundColor: CARD.border },
  cardBody: { paddingHorizontal: 8, paddingVertical: 14, gap: 14 },
  tileRow: { flexDirection: 'row' },
  tile: { flex: 1, alignItems: 'center' },
});
