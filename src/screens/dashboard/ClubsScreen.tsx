import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedBackdrop } from '../../components/theme/ThemedPage';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { useDialog } from '../../context/DialogContext';
import { useAppTheme } from '../../context/AppThemeContext';
import {
  CLUB_KIND,
  clubMeets,
  fetchParentClubs,
  fetchStudentClubs,
  leaveClub,
  registerForClub,
  type FamilyClub,
  type FamilyClubsView,
} from '../../lib/clubsApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { Loader } from '../../components/ui/Loader';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Clubs'>;

function shortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Clubs on the phone. A parent sees the selected child's school clubs, registers or takes them out,
 * and reads the patrons' notes; a learner sees their own clubs and notes (their parent registers them).
 */
export function ClubsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const { persona, selectedStudentId, selectedStudent } = useDeskAuth();
  const isParent = persona === 'parent';
  const [view, setView] = useState<FamilyClubsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      setView(isParent ? await fetchParentClubs(selectedStudentId) : await fetchStudentClubs());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Clubs', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isParent, selectedStudentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const clubs = view?.clubs ?? [];
  const mine = useMemo(() => clubs.filter((c) => c.membership && ['active', 'pending'].includes(c.membership.status)), [clubs]);
  const others = useMemo(() => clubs.filter((c) => !mine.includes(c)), [clubs, mine]);
  const notes = useMemo(
    () =>
      mine
        .flatMap((c) => c.notes.map((n) => ({ ...n, club: c.name })))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 10),
    [mine],
  );
  const childName = selectedStudent?.name?.split(' ')[0] || view?.student?.name?.split(' ')[0] || 'your child';

  const doRegister = (c: FamilyClub) => {
    const studentId = view?.student?.id;
    if (!studentId) return;
    showDialog({
      title: c.requires_approval ? `Ask for a place in ${c.name}?` : `Register ${childName} for ${c.name}?`,
      message: [
        clubMeets(c) ? `Meets ${clubMeets(c)}.` : null,
        c.fee ? `Fee: KES ${c.fee.toLocaleString()} (paid to the school).` : null,
        c.requires_approval ? `${c.patron_name || 'The patron'} confirms the place.` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      icon: 'medal-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: c.requires_approval ? 'Ask for a place' : 'Register',
          onPress: () => {
            void (async () => {
              setBusy(c.id);
              try {
                const res = await registerForClub(c.id, studentId);
                showDialog({
                  title: res?.status === 'pending' ? 'Registered' : `${childName} is in`,
                  message: res?.status === 'pending' ? `${c.patron_name || 'The patron'} will confirm the place.` : `Welcome to ${c.name}.`,
                  variant: 'success',
                  icon: 'checkmark-circle',
                });
                await load();
              } catch (e) {
                showDialog({ title: 'Not registered', message: e instanceof Error ? e.message : 'Try again', variant: 'warning', icon: 'alert-circle' });
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    });
  };

  const doLeave = (c: FamilyClub) => {
    const studentId = view?.student?.id;
    if (!studentId) return;
    const pending = c.membership?.status === 'pending';
    showDialog({
      title: pending ? 'Cancel the registration?' : `Take ${childName} out of ${c.name}?`,
      message: pending ? undefined : 'Joining again needs a new registration.',
      variant: 'warning',
      icon: 'exit-outline',
      buttons: [
        { text: 'Keep', style: 'cancel' },
        {
          text: pending ? 'Cancel registration' : 'Leave club',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(c.id);
              try {
                await leaveClub(c.id, studentId);
                await load();
              } catch (e) {
                showDialog({ title: 'That did not go through', message: e instanceof Error ? e.message : 'Try again', variant: 'warning', icon: 'alert-circle' });
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    });
  };

  const placeChip = (c: FamilyClub) => {
    const s = c.membership?.status;
    if (s === 'active') return { text: c.membership!.position !== 'member' ? `In · ${c.membership!.position}` : 'In the club', bg: '#DCFCE7', fg: '#166534' };
    if (s === 'pending') return { text: 'Waiting', bg: '#FEF3C7', fg: '#B45309' };
    if (s === 'declined') return { text: 'Not accepted', bg: '#FEE2E2', fg: '#B91C1C' };
    return null;
  };

  const card = (c: FamilyClub) => {
    const chip = placeChip(c);
    const inClub = c.membership?.status === 'active' || c.membership?.status === 'pending';
    return (
      <ModuleGlassCard key={c.id} style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.icon, { backgroundColor: `${palette.primary}14` }]}>
            <Ionicons name="medal-outline" size={20} color={palette.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.kind}>{CLUB_KIND[c.category] || 'Other'}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {c.name}
            </Text>
          </View>
          {chip ? (
            <View style={[styles.chip, { backgroundColor: chip.bg }]}>
              <Text style={[styles.chipText, { color: chip.fg }]}>{chip.text}</Text>
            </View>
          ) : null}
        </View>
        {c.description ? (
          <Text style={styles.desc} numberOfLines={3}>
            {c.description}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {[c.patron_name ? `Patron: ${c.patron_name}` : null, clubMeets(c) || null].filter(Boolean).join('\n')}
        </Text>
        <Text style={styles.meta}>
          {c.member_count} {c.member_count === 1 ? 'member' : 'members'}
          {c.spots_left != null ? ` · ${c.spots_left} left` : ''}
          {c.fee ? ` · KES ${c.fee.toLocaleString()}` : ''}
        </Text>
        {isParent ? (
          inClub ? (
            <Pressable style={[styles.btn, styles.btnOutline]} disabled={busy === c.id} onPress={() => doLeave(c)} accessibilityRole="button">
              {busy === c.id ? <ActivityIndicator size="small" color={palette.primary} /> : <Text style={[styles.btnOutlineText, { color: palette.primary }]}>{c.membership?.status === 'pending' ? 'Cancel registration' : 'Leave club'}</Text>}
            </Pressable>
          ) : c.can_register ? (
            <Pressable style={[styles.btn, { backgroundColor: palette.primary }]} disabled={busy === c.id} onPress={() => doRegister(c)} accessibilityRole="button" accessibilityLabel={`Register for ${c.name}`}>
              {busy === c.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>{c.requires_approval ? 'Ask for a place' : 'Register'}</Text>}
            </Pressable>
          ) : (
            <Text style={styles.closed}>{c.spots_left === 0 ? 'Full' : 'Not taking registrations now'}</Text>
          )
        ) : null}
      </ModuleGlassCard>
    );
  };

  return (
    <View style={styles.root}>
      <ThemedBackdrop />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: floatingHeaderInset(insets.top), paddingBottom: moduleScrollBottomPad(insets.bottom) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Clubs</ModuleKicker>
        <ModuleScreenHeader
          title={isParent ? `${childName}'s clubs` : 'My clubs'}
          description={isParent ? 'Register for clubs and read what the patrons post.' : 'Your clubs and their notes. Your parent registers you.'}
        />

        {loading ? (
          <Loader />
        ) : error ? (
          <ModuleEmpty title="Clubs could not load" body={error} onRetry={() => void load()} />
        ) : (
          <>
            {notes.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes from the clubs</Text>
                {notes.map((n) => (
                  <ModuleGlassCard key={n.id} style={styles.note}>
                    <Text style={styles.noteTitle}>
                      {n.pinned ? '📌 ' : ''}
                      {n.title}
                    </Text>
                    <Text style={styles.meta}>{[n.club, n.author_name, shortDate(n.created_at)].filter(Boolean).join(' · ')}</Text>
                    {n.body ? <Text style={styles.noteBody}>{n.body}</Text> : null}
                  </ModuleGlassCard>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isParent ? `In these clubs` : 'My clubs'}</Text>
              {mine.length ? mine.map(card) : <Text style={styles.empty}>{isParent ? 'Not in a club yet. Pick one below.' : 'Not in a club yet. Ask your parent to register you.'}</Text>}
            </View>

            <View style={styles.section}>
              <Pressable style={styles.sectionHead} onPress={() => setShowOthers((v) => !v)} accessibilityRole="button">
                <Text style={styles.sectionTitle}>Other clubs ({others.length})</Text>
                <Ionicons name={showOthers ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.mutedForeground} />
              </Pressable>
              {showOthers ? (others.length ? others.map(card) : <Text style={styles.empty}>{clubs.length ? 'No other clubs.' : 'The school has no clubs yet.'}</Text>) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 12 },
  section: { gap: 10, marginTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: Colors.ink },
  card: { padding: 14, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  kind: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: Colors.mutedForeground },
  name: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 13, color: Colors.ink, lineHeight: 18 },
  meta: { fontSize: 12, color: Colors.mutedForeground, lineHeight: 17 },
  btn: { marginTop: 6, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnOutline: { borderWidth: 1, borderColor: 'rgba(10,61,46,0.2)' },
  btnOutlineText: { fontWeight: '800', fontSize: 14 },
  closed: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  note: { padding: 12, gap: 4 },
  noteTitle: { fontSize: 14, fontWeight: '800', color: Colors.ink },
  noteBody: { fontSize: 13, color: Colors.ink, lineHeight: 18, marginTop: 2 },
  empty: { fontSize: 13, color: Colors.mutedForeground, paddingVertical: 6 },
});
