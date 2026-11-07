import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemedBackdrop, INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import { PaymentBottomSheet } from '../../components/dashboard/PaymentBottomSheet';
import { PaymentProcessCard, type PaymentOutcome } from '../../components/dashboard/PaymentProcessCard';
import {
  ListFooter,
  ListSkeleton,
  MoneyHeader,
  StateCard,
} from '../../components/dashboard/MoneyKit';
import { initialsOf, kes, maskPhoneDisplay, useWindowedList } from '../../lib/moneyFormat';
import { useBottomBarSpace } from '../../components/navigation/useBottomBarSpace';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/AppThemeContext';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { fetchChildTeachers, ParentTeacher } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { defaultMpesaPhone } from '../../lib/phoneUtils';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Teachers'>;

/** One teacher with every subject they take this class for (the API sends one row per subject). */
type TeacherCard = ParentTeacher & { subjects: string[]; photo: string | null };

type TipRecord = { amount: number; receipt?: string; status: PaymentOutcome['status'] };

const PAGE = 10;
const AVATAR = 56;

function groupTeachers(rows: ParentTeacher[]): TeacherCard[] {
  const map = new Map<string, TeacherCard>();
  for (const t of rows) {
    const id = String(t.teacher_id || t.full_name);
    const subject = t.subject_name?.trim();
    const existing = map.get(id);
    if (existing) {
      if (subject && !existing.subjects.includes(subject)) existing.subjects.push(subject);
      existing.phone_masked = existing.phone_masked || t.phone_masked;
      existing.email = existing.email || t.email;
      existing.photo = existing.photo || t.photo_url || t.avatar_url || null;
      existing.description = existing.description || t.description;
    } else {
      map.set(id, { ...t, subjects: subject ? [subject] : [], photo: t.photo_url || t.avatar_url || null });
    }
  }
  return [...map.values()];
}

function TeacherAvatar({ name, photo }: { name: string; photo: string | null }) {
  const { palette } = useAppTheme();
  const [broken, setBroken] = useState(false);
  return (
    <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
      {photo && !broken ? (
        <Image source={{ uri: photo }} style={styles.avatarImg} onError={() => setBroken(true)} />
      ) : (
        <Text style={[styles.avatarInitials, { color: palette.secondary }]}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

export function TeachersScreen({ navigation }: Props) {
  const bottomSpace = useBottomBarSpace();
  const { palette } = useAppTheme();
  const { profile } = useAuth();
  const { selectedStudentId, selectedStudent } = useDeskAuth();
  const { showDialog } = useDialog();
  const [rows, setRows] = useState<ParentTeacher[]>([]);
  const [className, setClassName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipTeacher, setTipTeacher] = useState<TeacherCard | null>(null);
  const [tips, setTips] = useState<Record<string, TipRecord>>({});

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        if (!selectedStudentId) {
          setRows([]);
          setError('Choose a learner on the dashboard first.');
          return;
        }
        const data = await fetchChildTeachers(selectedStudentId);
        setRows(data?.teachers ?? []);
        setClassName(data?.teachers?.[0]?.class_name ?? null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Teachers', msg);
        setError(msg);
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const teachers = useMemo(() => groupTeachers(rows), [rows]);
  const win = useWindowedList(teachers, PAGE);

  const onEmail = useCallback(
    async (email: string) => {
      const url = `mailto:${email}`;
      try {
        if (!(await Linking.canOpenURL(url))) {
          showDialog({ title: 'Email', message: email, variant: 'info', icon: 'mail-outline' });
          return;
        }
        await Linking.openURL(url);
      } catch (e) {
        log.warn('Teachers', 'mailto failed', String(e));
      }
    },
    [showDialog],
  );

  const childName = selectedStudent?.name ?? null;

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <FlatList
        data={loading || error ? [] : win.visible}
        keyExtractor={(t) => String(t.teacher_id || t.full_name)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomSpace + 16 }]}
        onEndReached={win.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        extraData={tips}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={palette.primary}
          />
        }
        ListHeaderComponent={
          <MoneyHeader
            title="Teachers"
            subtitle={[childName ? `${childName}'s teachers` : null, className].filter(Boolean).join(' · ') || 'Class teachers'}
            onBack={() => navigation.goBack()}
          />
        }
        renderItem={({ item: t }) => {
          const phone = maskPhoneDisplay(t.phone_masked);
          const tip = tips[String(t.teacher_id)];
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <TeacherAvatar name={t.full_name} photo={t.photo} />
                <View style={styles.cardBody}>
                  <Text style={styles.name} numberOfLines={1}>
                    {t.full_name}
                  </Text>
                  <View style={styles.subjects}>
                    {(t.subjects.length ? t.subjects : ['Teacher']).map((s) => (
                      <View key={s} style={[styles.subjectChip, { backgroundColor: rgba(palette.secondary, 0.22) }]}>
                        <Text style={[styles.subjectText, { color: palette.primary }]} numberOfLines={1}>
                          {s}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {phone ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="call-outline" size={13} color={Colors.mutedForeground} />
                      <Text style={styles.meta}>{phone}</Text>
                    </View>
                  ) : null}
                  {t.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {t.description}
                    </Text>
                  ) : null}
                </View>
              </View>

              {tip ? (
                <View
                  style={[
                    styles.tipBanner,
                    { backgroundColor: tip.status === 'success' ? 'rgba(21,128,61,0.09)' : rgba(palette.secondary, 0.18) },
                  ]}>
                  <Ionicons
                    name={tip.status === 'success' ? 'checkmark-circle' : 'time-outline'}
                    size={16}
                    color={tip.status === 'success' ? '#15803D' : palette.tertiary}
                  />
                  <Text style={styles.tipBannerText} numberOfLines={2}>
                    {tip.status === 'success'
                      ? `You tipped ${kes(tip.amount)}${tip.receipt ? ` · M-Pesa ${tip.receipt}` : ''}`
                      : `Tip of ${kes(tip.amount)} waiting for M-Pesa`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.ghostBtn, { backgroundColor: rgba(palette.primary, 0.07) }, !t.email && { opacity: 0.45 }]}
                  disabled={!t.email}
                  onPress={() => t.email && void onEmail(t.email)}
                  accessibilityRole="button"
                  accessibilityLabel={t.email ? `Email ${t.full_name}` : 'No email on file'}>
                  <Ionicons name="mail-outline" size={16} color={palette.primary} />
                  <Text style={[styles.ghostText, { color: palette.primary }]}>{t.email ? 'Email' : 'No email'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.tipBtn, { backgroundColor: palette.primary }]}
                  onPress={() => setTipTeacher(t)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tip ${t.full_name}`}>
                  <Ionicons name="heart" size={16} color={palette.secondary} />
                  <Text style={styles.tipText}>{tip?.status === 'success' ? 'Tip again' : 'Tip teacher'}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton rows={4} />
          ) : error ? (
            <StateCard tone="error" title="Could not load teachers" body={error} onRetry={() => void load()} />
          ) : (
            <StateCard
              icon="people-outline"
              title="No teachers yet"
              body="No teacher is linked to this class yet."
              onRetry={() => void load()}
            />
          )
        }
        ListFooterComponent={<ListFooter hasMore={win.hasMore} total={loading || error ? 0 : win.total} noun="teachers" />}
      />

      <PaymentBottomSheet visible={tipTeacher != null} onClose={() => setTipTeacher(null)} bare>
        {tipTeacher ? (
          <PaymentProcessCard
            key={`tip-${tipTeacher.teacher_id}`}
            layout="sheet"
            mode="teacher_tip"
            title="Tip a teacher"
            subtitle="Say thank you with M-Pesa. The school passes it on."
            recipient={{
              name: tipTeacher.full_name,
              photoUrl: tipTeacher.photo,
              detail: [tipTeacher.subjects.join(', '), tipTeacher.class_name].filter(Boolean).join(' · ') || null,
            }}
            defaultPhone={defaultMpesaPhone(profile?.phone)}
            studentId={selectedStudentId}
            teacherId={tipTeacher.teacher_id}
            onOutcome={(o) => {
              if (o.status === 'failed') return;
              setTips((prev) => ({
                ...prev,
                [String(tipTeacher.teacher_id)]: { amount: o.amount, receipt: o.mpesaReceipt, status: o.status },
              }));
            }}
            onClose={() => setTipTeacher(null)}
          />
        ) : null}
      </PaymentBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, flexGrow: 1 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: AVATAR, height: AVATAR },
  avatarInitials: { fontSize: 19, fontWeight: '800' },
  cardBody: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontSize: 17, fontWeight: '800', color: INK },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjectChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  subjectText: { fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 13, color: Colors.mutedForeground, fontVariant: ['tabular-nums'], letterSpacing: 0.4 },
  desc: { fontSize: 13, lineHeight: 18, color: Colors.mutedForeground },
  tipBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tipBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: INK },
  actions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  ghostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  ghostText: { fontWeight: '700', fontSize: 14 },
  tipBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tipText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
