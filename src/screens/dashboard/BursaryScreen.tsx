import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { PaymentProcessCard } from '../../components/dashboard/PaymentProcessCard';
import { ModuleBackBar, ModuleScreenHeader, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import {
  fetchParentBursary,
  ParentBursaryContribution,
  ParentBursaryProgram,
} from '../../lib/parentPortalApi';
import { deskFetch } from '../../lib/deskApi';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import { humanizeError } from '../../lib/humanizeError';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Bursary'>;

const HERO_GREEN = '#15411D';

type ProgramRow = ParentBursaryProgram & {
  name?: string;
  status?: string;
  closes_on?: string | null;
};

function kes(n: number | undefined | null): string {
  const v = Number(n ?? 0) || 0;
  return `KES ${v.toLocaleString()}`;
}

function rolesIncludeParent(roles: unknown): boolean {
  const list = Array.isArray(roles)
    ? roles.map(String)
    : String(roles || '')
        .split(',')
        .map((r) => r.trim());
  return list.some((r) => /parent/i.test(r));
}

export function BursaryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { deskUser } = useDeskAuth();
  const isParent = useMemo(() => rolesIncludeParent(deskUser?.user_roles), [deskUser?.user_roles]);

  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [contributions, setContributions] = useState<ParentBursaryContribution[]>([]);
  const [kittyTotal, setKittyTotal] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [contribPage, setContribPage] = useState(0);
  const CONTRIB_PAGE = 8;

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const bursaryList = await deskFetch<{ programs?: ProgramRow[] }>('/bursaries/programs');
        const fromNest = Array.isArray(bursaryList?.programs) ? bursaryList.programs : [];
        setPrograms(
          fromNest.map((p) => ({
            ...p,
            title: p.title || p.name || 'Bursary program',
            description: p.description ?? null,
            deadline: p.deadline || p.closes_on || null,
          })),
        );

        if (isParent) {
          try {
            const data = await fetchParentBursary();
            if (!fromNest.length && Array.isArray(data?.programs)) {
              setPrograms(data.programs);
            }
            setContributions(data?.contributions ?? []);
            setKittyTotal(Number(data?.kitty_total ?? 0) || 0);
          } catch (parentErr) {
            log.warn('Bursary', 'parent kit', String(parentErr));
            setContributions([]);
            setKittyTotal(0);
          }
        } else {
          setContributions([]);
          setKittyTotal(0);
        }
      } catch (e) {
        const msg = humanizeError(e);
        log.warn('Bursary', msg);
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isParent],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
        keyboardShouldPersistTaps="handled"
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
        <ModuleKicker>Bursary</ModuleKicker>
        <ModuleScreenHeader
          title="Vulnerable student kitty"
          description="School bursary programs. Parents can contribute without a note."
        />
        <Text style={styles.sub}>
          Funds are reviewed and distributed by the school’s bursary committee — not automatically by the app.
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error && programs.length === 0 ? (
          <ModuleEmpty title="Could not load bursary" body={error} onRetry={() => void load()} />
        ) : (
          <>
            {isParent ? (
              <ModuleGlassCard>
                <Text style={styles.kittyLabel}>Your contributions total</Text>
                <Text style={styles.kittyValue}>{kes(kittyTotal)}</Text>
              </ModuleGlassCard>
            ) : null}

            <Text style={styles.section}>Open programs</Text>
            {programs.length === 0 ? (
              <Text style={styles.sub}>No open bursary programs right now.</Text>
            ) : (
              programs.map((p) => {
                const open = selectedProgram === p.id;
                return (
                  <Pressable key={String(p.id)} onPress={() => setSelectedProgram(p.id ?? null)}>
                    <ModuleGlassCard>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.programTitle}>{p.title || p.name || 'Bursary program'}</Text>
                          {p.description ? (
                            <Text style={styles.programDesc}>{p.description}</Text>
                          ) : null}
                          {p.deadline || p.closes_on ? (
                            <Text style={styles.programMeta}>
                              Deadline · {String(p.deadline || p.closes_on).slice(0, 10)}
                            </Text>
                          ) : null}
                        </View>
                        {open ? (
                          <Ionicons name="checkmark-circle" size={22} color={HERO_GREEN} />
                        ) : null}
                      </View>
                    </ModuleGlassCard>
                  </Pressable>
                );
              })
            )}

            {isParent ? (
              <>
                <Text style={styles.section}>Contribute</Text>
                {selectedProgram ? (
                  <Text style={styles.programMeta}>
                    Program ·{' '}
                    {programs.find((p) => p.id === selectedProgram)?.title ||
                      programs.find((p) => p.id === selectedProgram)?.name ||
                      'Selected'}
                  </Text>
                ) : (
                  <Text style={styles.programMeta}>General vulnerable student kitty</Text>
                )}
                {!showPay ? (
                  <Pressable style={styles.primaryBtn} onPress={() => setShowPay(true)}>
                    <Ionicons name="heart" size={16} color={Colors.white} />
                    <Text style={styles.primaryBtnText}>Contribute with M-Pesa</Text>
                  </Pressable>
                ) : (
                  <PaymentProcessCard
                    mode="bursary"
                    title="Bursary contribution"
                    subtitle="Pay via M-Pesa. Funds go to the school bursary kitty."
                    defaultAmount="10"
                    programId={selectedProgram}
                    onRefresh={async () => {
                      setOk('Thank you — M-Pesa contribution recorded.');
                      await load(true);
                    }}
                    onClose={() => setShowPay(false)}
                  />
                )}
                {error ? <Text style={styles.err}>{error}</Text> : null}
                {ok ? <Text style={styles.ok}>{ok}</Text> : null}
              </>
            ) : (
              <Text style={styles.sub}>Browse programs here. Parent accounts can contribute via M-Pesa.</Text>
            )}

            {isParent && contributions.length > 0 ? (
              <>
                <Text style={styles.section}>Past contributions</Text>
                <ModuleGlassCard>
                  <View style={[styles.tr, styles.trHead]}>
                    <Text style={[styles.th, styles.colDate]}>Date</Text>
                    <Text style={[styles.th, styles.colAmt]}>Amount</Text>
                    <Text style={[styles.th, styles.colStatus]}>Status</Text>
                  </View>
                  {contributions
                    .slice(contribPage * CONTRIB_PAGE, contribPage * CONTRIB_PAGE + CONTRIB_PAGE)
                    .map((c, i) => (
                      <View key={String(c.id ?? `${contribPage}-${i}`)} style={styles.tr}>
                        <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                          {String(c.created_at ?? '').slice(0, 10) || '—'}
                        </Text>
                        <Text style={[styles.td, styles.colAmt]} numberOfLines={1}>
                          {kes(Number(c.amount ?? 0))}
                        </Text>
                        <Text style={[styles.td, styles.colStatus]} numberOfLines={1}>
                          {c.status || 'recorded'}
                        </Text>
                      </View>
                    ))}
                  {contributions.length > CONTRIB_PAGE ? (
                    <View style={styles.pager}>
                      <Pressable
                        disabled={contribPage === 0}
                        onPress={() => setContribPage((p) => Math.max(0, p - 1))}>
                        <Text style={[styles.pagerText, contribPage === 0 && styles.pagerDisabled]}>
                          Prev
                        </Text>
                      </Pressable>
                      <Text style={styles.pagerMeta}>
                        {contribPage + 1}/
                        {Math.max(1, Math.ceil(contributions.length / CONTRIB_PAGE))}
                      </Text>
                      <Pressable
                        disabled={(contribPage + 1) * CONTRIB_PAGE >= contributions.length}
                        onPress={() => setContribPage((p) => p + 1)}>
                        <Text
                          style={[
                            styles.pagerText,
                            (contribPage + 1) * CONTRIB_PAGE >= contributions.length &&
                              styles.pagerDisabled,
                          ]}>
                          Next
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </ModuleGlassCard>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  sub: { fontSize: 14, color: Colors.mutedForeground, marginBottom: 4 },
  section: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  kittyLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  kittyValue: { marginTop: 4, fontSize: 28, fontWeight: '800', color: HERO_GREEN },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  programTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  programDesc: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground },
  programMeta: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.mutedForeground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  primaryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HERO_GREEN,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  err: { color: '#B91C1C', marginTop: 6, fontWeight: '600' },
  ok: { color: HERO_GREEN, marginTop: 6, fontWeight: '600' },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  trHead: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  th: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  td: { fontSize: 13, color: Colors.ink },
  colDate: { flex: 1.1 },
  colAmt: { flex: 1, textAlign: 'right' },
  colStatus: { flex: 1, textAlign: 'right' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  pagerText: { fontSize: 13, fontWeight: '700', color: HERO_GREEN },
  pagerDisabled: { color: Colors.mutedForeground },
  pagerMeta: { fontSize: 12, color: Colors.mutedForeground },
});
