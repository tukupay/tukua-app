import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { fetchChildTeachers, ParentTeacher } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Teachers'>;

const HERO_GREEN = '#15411D';
const AVATAR = 52;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function TeachersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const [teachers, setTeachers] = useState<ParentTeacher[]>([]);
  const [childName, setChildName] = useState<string | null>(selectedStudent?.name ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const studentId = selectedStudentId;
        setChildName(selectedStudent?.name ?? null);
        if (!studentId) {
          setTeachers([]);
          setError('Select a student first');
          return;
        }
        const data = await fetchChildTeachers(studentId);
        setTeachers(data?.teachers ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Teachers', msg);
        setError(msg);
        setTeachers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId, selectedStudent?.name],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onTip = useCallback(
    (teacher: ParentTeacher) => {
      showDialog({
        title: 'Tip teacher',
        message: `Tipping ${teacher.full_name} will be available soon.`,
        variant: 'info',
        icon: 'heart-outline',
      });
    },
    [showDialog],
  );

  const onEmail = useCallback(
    async (email: string) => {
      const url = `mailto:${email}`;
      try {
        const can = await Linking.canOpenURL(url);
        if (!can) {
          showDialog({
            title: 'Email',
            message: email,
            variant: 'info',
            icon: 'mail-outline',
          });
          return;
        }
        await Linking.openURL(url);
      } catch (e) {
        log.warn('Teachers', 'mailto failed', String(e));
      }
    },
    [showDialog],
  );

  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: floatingHeaderInset(insets.top),
            paddingBottom: moduleScrollBottomPad(insets.bottom),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={Colors.brandGreenMid}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Teachers</ModuleKicker>
        <Text style={styles.title}>
          {childName ? `${childName}'s teachers` : 'Class teachers'}
        </Text>
        <Text style={styles.sub}>From school workload — tap email to write.</Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error ? (
          <ModuleEmpty title="Could not load teachers" body={error} onRetry={() => void load()} />
        ) : teachers.length === 0 ? (
          <ModuleEmpty
            title="No teachers yet"
            body="No workload is linked to this class, or the student has no class."
            onRetry={() => void load()}
          />
        ) : (
          teachers.map((t) => (
            <ModuleGlassCard key={`${t.teacher_id}-${t.subject_name}-${t.class_name}`}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  {t.photo_url ? (
                    <Image source={{ uri: t.photo_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarInitials}>{initials(t.full_name)}</Text>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {t.full_name}
                  </Text>
                  <Text style={styles.subject} numberOfLines={1}>
                    {t.subject_name?.trim() || 'Subject'}
                    {t.class_name ? ` · ${t.class_name}` : ''}
                  </Text>
                  {t.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {t.description}
                    </Text>
                  ) : null}
                  <Pressable
                    style={styles.emailRow}
                    disabled={!t.email}
                    onPress={() => t.email && void onEmail(t.email)}
                    hitSlop={6}
                    accessibilityRole={t.email ? 'link' : 'text'}
                    accessibilityLabel={t.email ? `Email ${t.email}` : 'No email on file'}>
                    <Ionicons
                      name="mail"
                      size={14}
                      color={t.email ? Colors.primary : Colors.mutedForeground}
                    />
                    <Text
                      style={[styles.email, !t.email && styles.emailMissing]}
                      numberOfLines={1}>
                      {t.email || 'No email on file'}
                    </Text>
                  </Pressable>
                  {t.phone_masked ? (
                    <Text style={styles.phone} numberOfLines={1}>
                      {t.phone_masked}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actions}>
                {t.email ? (
                  <Pressable
                    style={styles.emailBtn}
                    onPress={() => void onEmail(t.email!)}
                    accessibilityRole="button"
                    accessibilityLabel={`Email ${t.full_name}`}>
                    <Ionicons name="mail-outline" size={16} color={HERO_GREEN} />
                    <Text style={styles.emailBtnText}>Email</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.tipBtn}
                  onPress={() => onTip(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tip ${t.full_name}`}>
                  <Ionicons name="heart" size={16} color={Colors.white} />
                  <Text style={styles.tipBtnText}>Tip teacher</Text>
                </Pressable>
              </View>
            </ModuleGlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 14,
    backgroundColor: 'rgba(21,65,29,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: AVATAR, height: AVATAR },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: HERO_GREEN },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  subject: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: HERO_GREEN,
  },
  desc: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.mutedForeground,
  },
  emailRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  email: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  emailMissing: {
    fontWeight: '500',
    color: Colors.mutedForeground,
    textDecorationLine: 'none',
    fontStyle: 'italic',
  },
  phone: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, fontVariant: ['tabular-nums'] },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(21,65,29,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emailBtnText: { color: HERO_GREEN, fontWeight: '700', fontSize: 14 },
  tipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: HERO_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tipBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
