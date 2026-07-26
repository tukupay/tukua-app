import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/yana';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { GlassPanel } from '../../components/dashboard/Glass';
import { useDeskAuth } from '../../context/DeskAuthContext';

type Props = NativeStackScreenProps<DashboardStackParamList, 'FeaturePlaceholder'>;

const HERO_GREEN = '#15411D';

export function FeaturePlaceholderScreen({ route, navigation }: Props) {
  const { title, description, apiHint } = route.params;
  const { deskApiUrl, deskToken } = useDeskAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <View
        style={[
          styles.content,
          {
            paddingTop: floatingHeaderInset(insets.top),
            paddingBottom: moduleScrollBottomPad(insets.bottom),
          },
        ]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
          <Text style={styles.backText}>Dashboard</Text>
        </Pressable>

        <GlassPanel tone="clear" intensity={40} radius={16} style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.iconCircle}>
              <Ionicons name="construct-outline" size={26} color={HERO_GREEN} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.desc}>{description}</Text>
          </View>
        </GlassPanel>

        <GlassPanel tone="frost" intensity={42} radius={16} style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>
              {apiHint
                ? `Will call Nest: ${apiHint}`
                : 'Native shell — open from a module that has a desk path, or wire Nest when ready.'}
            </Text>
          </View>
        </GlassPanel>

        <GlassPanel tone="frost" intensity={42} radius={16} style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.label}>Desk API</Text>
            <Text style={styles.value}>{deskApiUrl}</Text>
            <Text style={styles.meta}>{deskToken ? 'Authenticated' : 'Not connected'}</Text>
          </View>
        </GlassPanel>

        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backBtnSolid}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backTextBtn}>Back to dashboard</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: { color: Colors.ink, fontWeight: '600', fontSize: 15 },
  hero: { marginBottom: 14 },
  heroInner: { padding: 16 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EDF1FD',
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.ink },
  desc: { marginTop: 6, fontSize: 15, color: Colors.mutedForeground, lineHeight: 22 },
  card: { marginTop: 12 },
  cardInner: { padding: 14 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: Colors.brandGreenMid,
    textTransform: 'uppercase',
  },
  value: { marginTop: 6, fontSize: 14, color: Colors.ink, lineHeight: 20 },
  meta: { marginTop: 6, fontSize: 12, color: Colors.mutedForeground },
  backBtn: { marginTop: 24 },
  backBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: HERO_GREEN,
  },
  backTextBtn: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
