import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { PaymentBottomSheet } from '../../components/dashboard/PaymentBottomSheet';
import { PaymentProcessCard } from '../../components/dashboard/PaymentProcessCard';
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import {
  fetchParentBursary,
  ParentBursaryContribution,
  ParentBursaryProgram,
} from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Bursary'>;

const HERO_GREEN = '#15411D';

function kes(n: number | undefined | null): string {
  const v = Number(n ?? 0) || 0;
  return `KES ${v.toLocaleString()}`;
}

export function BursaryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [programs, setPrograms] = useState<ParentBursaryProgram[]>([]);
  const [contributions, setContributions] = useState<ParentBursaryContribution[]>([]);
  const [kittyTotal, setKittyTotal] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contribPage, setContribPage] = useState(0);
  const [showContribute, setShowContribute] = useState(false);
  const [contributeKey, setContributeKey] = useState(0);
  const CONTRIB_PAGE = 8;

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError(null);
    try {
      const data = await fetchParentBursary();
      setPrograms(data?.programs ?? []);
      setContributions(data?.contributions ?? []);
      setKittyTotal(Number(data?.kitty_total ?? 0) || 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.warn('Bursary', msg);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        <Text style={styles.title}>Vulnerable student kitty</Text>
        <Text style={styles.sub}>
          Contribute to support learners in need. Funds are reviewed and distributed by the school’s bursary
          committee — not automatically by the app.
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 24 }} />
        ) : error ? (
          <ModuleEmpty title="Could not load bursary" body={error} onRetry={() => void load()} />
        ) : (
          <>
            <ModuleGlassCard>
              <Text style={styles.kittyLabel}>Your contributions total</Text>
              <Text style={styles.kittyValue}>{kes(kittyTotal)}</Text>
            </ModuleGlassCard>

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
                          <Text style={styles.programTitle}>{p.title || 'Bursary program'}</Text>
                          {p.description ? (
                            <Text style={styles.programDesc}>{p.description}</Text>
                          ) : null}
                          {p.deadline ? (
                            <Text style={styles.programMeta}>Deadline · {String(p.deadline).slice(0, 10)}</Text>
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

            <Text style={styles.section}>Contribute</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                setShowContribute(true);
                setContributeKey((k) => k + 1);
              }}>
              <Ionicons name="heart" size={16} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Contribute to bursary</Text>
            </Pressable>

            {contributions.length > 0 ? (
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
                        onPress={() => setContribPage((p) => Math.max(0, p - 1))}
                      >
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
                        onPress={() => setContribPage((p) => p + 1)}
                      >
                        <Text
                          style={[
                            styles.pagerText,
                            (contribPage + 1) * CONTRIB_PAGE >= contributions.length &&
                              styles.pagerDisabled,
                          ]}
                        >
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

      <PaymentBottomSheet
        visible={showContribute}
        onClose={() => {
          setShowContribute(false);
          setContributeKey((k) => k + 1);
        }}>
        <PaymentProcessCard
          key={`bursary-${contributeKey}-${selectedProgram ?? 'none'}`}
          mode="bursary"
          title="Contribute to bursary"
          subtitle={
            selectedProgram
              ? programs.find((p) => p.id === selectedProgram)?.title || 'Selected program'
              : 'General vulnerable student kitty'
          }
          programId={selectedProgram}
          onRefresh={async () => {
            await load(true);
          }}
          onClose={() => {
            setShowContribute(false);
            setContributeKey((k) => k + 1);
          }}
        />
      </PaymentBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.ink, letterSpacing: -0.4 },
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: HERO_GREEN,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
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
