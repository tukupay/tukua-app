/**
 * Clubs on the phone. A parent sees the selected child's school clubs, registers or takes them out, and reads
 * the patrons' notes; a learner sees their own clubs and notes (their parent registers them).
 *
 * 2026-11-07: dashboard theme (white cards, palette pills, Tukua loader / skeleton, error + Retry); a parent
 * with several children and none picked app-wide gets child chips (the API already sends the children);
 * each card opens to its details and all its notes; "No linked children" shows as such, not as an error;
 * fee / counts never crash on odd values; other clubs come in batches.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { log } from '../../lib/logger';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ChipRow,
  ErrorState,
  ListSkeleton,
  ModuleScrollPage,
  MUTED_INK,
  SectionLabel,
  ShowMoreButton,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtRelative,
  useClientPager,
  type PillTone,
} from '../../components/ui/ModuleKit';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Clubs'>;

type ClubsView = FamilyClubsView & { children?: Array<{ student_id: string; name?: string; school_id?: string }> };

function money(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `KES ${n.toLocaleString()}` : '';
}

function count(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function ClubsScreen({ navigation }: Props) {
  const { palette } = useAppTheme();
  const { showDialog } = useDialog();
  const { persona, selectedStudentId, selectedStudent } = useDeskAuth();
  const isParent = persona === 'parent';
  const [pickedChild, setPickedChild] = useState<string | null>(null);
  const [view, setView] = useState<ClubsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const childId = selectedStudentId ?? pickedChild;

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const v = (isParent ? await fetchParentClubs(childId) : await fetchStudentClubs()) as ClubsView | null;
        setView(v && typeof v === 'object' ? { ...v, clubs: Array.isArray(v.clubs) ? v.clubs.filter((c) => c && c.id) : [] } : null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Clubs', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isParent, childId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const clubs = useMemo(() => view?.clubs ?? [], [view]);
  const mine = useMemo(
    () => clubs.filter((c) => c.membership && ['active', 'pending'].includes(String(c.membership.status))),
    [clubs],
  );
  const others = useMemo(() => clubs.filter((c) => !mine.includes(c)), [clubs, mine]);
  const othersPager = useClientPager(others, 8, view?.student?.id);
  const notes = useMemo(
    () =>
      mine
        .flatMap((c) => (Array.isArray(c.notes) ? c.notes : []).map((n) => ({ ...n, club: c.name })))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 5),
    [mine],
  );

  const childName =
    selectedStudent?.name?.split(' ')[0] || view?.student?.name?.split(' ')[0] || 'your child';
  const children = (view?.children ?? []).filter((k) => k && k.student_id);

  const doRegister = (c: FamilyClub) => {
    const studentId = view?.student?.id;
    if (!studentId) return;
    const meets = clubMeets(c);
    showDialog({
      title: c.requires_approval ? `Ask for a place in ${c.name}?` : `Register ${childName} for ${c.name}?`,
      message: [
        meets ? `Meets ${meets}.` : null,
        money(c.fee) ? `Fee: ${money(c.fee)} (paid to the school).` : null,
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
                  message:
                    res?.status === 'pending'
                      ? `${c.patron_name || 'The patron'} will confirm the place.`
                      : `Welcome to ${c.name}.`,
                  variant: 'success',
                  icon: 'checkmark-circle',
                });
                await load(true);
              } catch (e) {
                showDialog({
                  title: 'Not registered',
                  message: e instanceof Error ? e.message : 'Try again',
                  variant: 'warning',
                  icon: 'alert-circle',
                });
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
                await load(true);
              } catch (e) {
                showDialog({
                  title: 'That did not go through',
                  message: e instanceof Error ? e.message : 'Try again',
                  variant: 'warning',
                  icon: 'alert-circle',
                });
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    });
  };

  const placePill = (c: FamilyClub): { label: string; tone: PillTone } | null => {
    const s = c.membership?.status;
    const pos = String(c.membership?.position ?? 'member');
    if (s === 'active') return { label: pos && pos !== 'member' ? `In · ${pos}` : 'Member', tone: 'success' };
    if (s === 'pending') return { label: 'Waiting', tone: 'warning' };
    if (s === 'declined') return { label: 'Not accepted', tone: 'danger' };
    return null;
  };

  const card = (c: FamilyClub) => {
    const pill = placePill(c);
    const inClub = c.membership?.status === 'active' || c.membership?.status === 'pending';
    const open = openId === c.id;
    const members = count(c.member_count);
    const clubNotes = Array.isArray(c.notes) ? c.notes : [];
    const meets = clubMeets(c);
    return (
      <SurfaceCard key={c.id}>
        <Pressable
          onPress={() => setOpenId(open ? null : c.id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={styles.cardHead}>
          <View style={[styles.icon, { backgroundColor: rgba(palette.primary, 0.08) }]}>
            <Ionicons name="medal-outline" size={20} color={palette.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.kind}>{CLUB_KIND[c.category] || 'Other'}</Text>
            <Text style={styles.name} numberOfLines={open ? 3 : 1}>
              {c.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[meets, `${members} ${members === 1 ? 'member' : 'members'}`].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {pill ? <StatusPill label={pill.label} tone={pill.tone} /> : null}
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED_INK} />
        </Pressable>

        {open ? (
          <View style={styles.details}>
            {c.description ? <Text style={styles.desc}>{c.description}</Text> : null}
            <View style={styles.facts}>
              {c.patron_name ? <Fact icon="person-outline" text={`Patron: ${c.patron_name}`} /> : null}
              {meets ? <Fact icon="time-outline" text={meets} /> : null}
              <Fact
                icon="people-outline"
                text={`${members} ${members === 1 ? 'member' : 'members'}${c.spots_left != null ? ` · ${count(c.spots_left)} places left` : ''}`}
              />
              <Fact icon="cash-outline" text={money(c.fee) || 'No fee'} />
              {c.requires_approval ? <Fact icon="shield-checkmark-outline" text="The patron confirms each place" /> : null}
            </View>
            {clubNotes.length ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.notesHead}>Notes</Text>
                {clubNotes.slice(0, 10).map((n) => (
                  <View key={n.id} style={[styles.noteInline, { borderLeftColor: n.pinned ? palette.secondary : rgba(palette.primary, 0.15) }]}>
                    <Text style={styles.noteTitle}>{n.title}</Text>
                    <Text style={styles.meta}>{[n.author_name, fmtRelative(n.created_at)].filter(Boolean).join(' · ')}</Text>
                    {n.body ? <Text style={styles.noteBody}>{n.body}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {isParent ? (
          inClub ? (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnOutline, { borderColor: rgba(palette.primary, 0.2) }, pressed && { opacity: 0.85 }]}
              disabled={busy === c.id}
              onPress={() => doLeave(c)}
              accessibilityRole="button">
              {busy === c.id ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <Text style={[styles.btnOutlineText, { color: palette.primary }]}>
                  {c.membership?.status === 'pending' ? 'Cancel registration' : 'Leave club'}
                </Text>
              )}
            </Pressable>
          ) : c.can_register ? (
            <Pressable
              style={({ pressed }) => [styles.btn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}
              disabled={busy === c.id}
              onPress={() => doRegister(c)}
              accessibilityRole="button"
              accessibilityLabel={`Register for ${c.name}`}>
              {busy === c.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>
                  {c.requires_approval ? 'Ask for a place' : 'Register'}
                  {money(c.fee) ? ` · ${money(c.fee)}` : ''}
                </Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.closed}>{c.spots_left === 0 ? 'Full' : 'Not taking registrations now'}</Text>
          )
        ) : null}
      </SurfaceCard>
    );
  };

  const noChildren = !!error && /no linked children/i.test(error);

  return (
    <ModuleScrollPage
      title={isParent ? `${childName === 'your child' ? 'Clubs' : `${childName}'s clubs`}` : 'My clubs'}
      description={
        isParent ? 'Register for clubs and read what the patrons post.' : 'Your clubs and their notes. Your parent registers you.'
      }
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(true);
      }}>
      {isParent && !selectedStudentId && children.length > 1 ? (
        <ChipRow
          value={view?.student?.id ?? children[0].student_id}
          onChange={setPickedChild}
          options={children.map((k) => ({ key: k.student_id, label: String(k.name || 'Child').split(' ')[0] }))}
        />
      ) : null}

      {loading ? (
        <ListSkeleton rows={4} height={72} />
      ) : noChildren ? (
        <StateCard
          icon="people-outline"
          title="No linked children yet"
          body="Once the school links your child to your account, their clubs show here."
        />
      ) : error ? (
        <ErrorState title="Clubs could not load" message={error} onRetry={() => void load()} />
      ) : clubs.length === 0 ? (
        <StateCard icon="medal-outline" title="No clubs yet" body="When the school opens clubs, they will show here." />
      ) : (
        <>
          {notes.length ? (
            <>
              <SectionLabel>Latest from the clubs</SectionLabel>
              {notes.map((n) => (
                <SurfaceCard key={`${n.club}-${n.id}`} style={styles.note}>
                  <View style={styles.noteHead}>
                    {n.pinned ? <Ionicons name="pin" size={14} color={palette.tertiary || palette.primary} /> : null}
                    <Text style={[styles.noteTitle, { flex: 1 }]} numberOfLines={2}>
                      {n.title}
                    </Text>
                  </View>
                  <Text style={styles.meta}>{[n.club, n.author_name, fmtRelative(n.created_at)].filter(Boolean).join(' · ')}</Text>
                  {n.body ? (
                    <Text style={styles.noteBody} numberOfLines={4}>
                      {n.body}
                    </Text>
                  ) : null}
                </SurfaceCard>
              ))}
            </>
          ) : null}

          <SectionLabel>{isParent ? `In these clubs · ${mine.length}` : `My clubs · ${mine.length}`}</SectionLabel>
          {mine.length ? (
            mine.map(card)
          ) : (
            <StateCard
              icon="sparkles-outline"
              title="Not in a club yet"
              body={isParent ? 'Pick one below to register.' : 'Ask your parent to register you for a club below.'}
            />
          )}

          {others.length ? (
            <>
              <SectionLabel>{`Other clubs · ${others.length}`}</SectionLabel>
              {othersPager.visible.map(card)}
              {othersPager.hasMore ? (
                <ShowMoreButton shown={othersPager.shown} total={othersPager.total} onPress={othersPager.showMore} />
              ) : null}
            </>
          ) : null}
        </>
      )}
    </ModuleScrollPage>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={14} color={MUTED_INK} />
      <Text style={styles.factText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kind: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED_INK },
  name: { fontSize: 15.5, fontWeight: '800', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK, lineHeight: 17 },
  details: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E1D3', paddingTop: 10 },
  desc: { fontSize: 13.5, color: INK, lineHeight: 19 },
  facts: { marginTop: 8, gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factText: { flex: 1, fontSize: 12.5, color: INK },
  notesHead: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: MUTED_INK, marginBottom: 6 },
  noteInline: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  btn: { marginTop: 12, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnOutline: { borderWidth: 1, backgroundColor: '#FFFFFF' },
  btnOutlineText: { fontWeight: '800', fontSize: 14 },
  closed: { marginTop: 10, fontSize: 12, color: MUTED_INK },
  note: { paddingVertical: 12 },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteTitle: { fontSize: 14, fontWeight: '800', color: INK },
  noteBody: { fontSize: 13, color: INK, lineHeight: 18, marginTop: 4 },
});
