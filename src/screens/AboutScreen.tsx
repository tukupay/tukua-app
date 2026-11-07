import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD, CARD_SURFACE, ThemedBackdrop, rgba } from '../components/theme/ThemedPage';
import { useAppTheme } from '../context/AppThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandSteps } from '../components/auth/BrandSteps';
import { ABOUT_SECTIONS } from '../constants/aboutLinks';
import { useRegisterTabJumper } from '../hooks/useRegisterTabJumper';
import { AboutStackParamList } from '../navigation/types';
import { Colors } from '../theme/yana';
import { useBottomBarSpace } from '../components/navigation/useBottomBarSpace';

type Props = NativeStackScreenProps<AboutStackParamList, 'AboutHome'>;

export function AboutScreen({ navigation }: Props) {
  useRegisterTabJumper();
  const bottomBarSpace = useBottomBarSpace();
  const { palette } = useAppTheme();

  return (
    <View style={[styles.page, { backgroundColor: palette.muted }]}>
    <ThemedBackdrop />
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: bottomBarSpace + 16 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={[styles.heroBadge, { backgroundColor: palette.primary }]}>
          <Ionicons name="sparkles" size={14} color={palette.secondary} />
          <Text style={styles.heroBadgeText}>About Tukua</Text>
        </View>
        <Text style={styles.heroTitle}>Innovate · Elevate · Grow</Text>
        <Text style={styles.heroSub}>
          Your AI-powered path from learning to earning — courses, opportunities, and community in one place.
        </Text>
        <BrandSteps compact />
      </View>

      {ABOUT_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionMarker, { backgroundColor: palette.secondary }]} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.card}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, index > 0 && styles.rowBorder]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.tab) {
                    navigation.getParent()?.navigate(item.tab as never);
                    return;
                  }
                  navigation.navigate('PublicWeb', {
                    path: item.path,
                    title: item.label,
                  });
                }}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: index % 2 === 0 ? palette.primary : rgba(palette.secondary, 0.16) },
                  ]}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={index % 2 === 0 ? palette.secondary : palette.primary}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {item.subtitle ? (
                    <Text style={styles.rowSub}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>Made with care in Kenya · tukua.ai</Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 28 },
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    ...CARD_SURFACE,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionMarker: { width: 3, height: 12, borderRadius: 2, marginRight: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    ...CARD_SURFACE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: CARD.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    fontFamily: 'Inter_600SemiBold',
  },
  rowSub: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.mutedForeground,
    fontFamily: 'Inter_400Regular',
  },
});
