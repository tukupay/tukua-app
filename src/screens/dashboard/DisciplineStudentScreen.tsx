/**
 * A learner's conduct history for staff: search by name or admission number, then the discipline
 * rating (GET /discipline/students/:adm — base 50%), their recent cases and the AI learner insight.
 * Record a new case for the learner from here.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/AppThemeContext';
import { DashboardStackParamList } from '../../navigation/types';
import { INK } from '../../components/theme/ThemedPage';
import { rgba } from '../../theme/color';
import {
  ErrorState,
  ListSkeleton,
  MUTED_INK,
  ModuleScrollPage,
  SectionLabel,
  StatTile,
  StateCard,
  StatusPill,
  SurfaceCard,
  fmtDay,
  friendlyError,
} from '../../components/ui/ModuleKit';
import { PrimaryButton, ReportText } from '../../components/discipline/DisciplineParts';
import {
  analyzeDisciplineStudent,
  cap,
  fetchDisciplineStudentProfile,
  searchDisciplineStudentsList,
  severityTone,
  type StudentHit,
  type StudentProfile,
} from '../../lib/disciplineApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'DisciplineStudent'>;

export function DisciplineStudentScreen({ navigation, route }: Props) {
  const { palette } = useAppTheme();
  const adm = route.params?.admissionNumber?.trim() || '';

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(!!adm);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [ai, setAi] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adm) return;
    setError(null);
    try {
      setProfile(await fetchDisciplineStudentProfile(adm));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adm]);

  useEffect(() => {
    setProfile(null);
    setAi(null);
    setAiError(null);
    if (adm) {
      setLoading(true);
      void load();
    }
  }, [adm, load]);

  useEffect(() => {
    if (adm) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError(null);
      return undefined;
    }
    const t = setTimeout(() => {
      setSearching(true);
      searchDisciplineStudentsList(q, 20)
        .then((list) => {
          setHits(list);
          setSearchError(null);
        })
        .catch((e) => setSearchError(friendlyError(e instanceof Error ? e.message : String(e))))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query, adm]);

  const runAi = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      setAi(await analyzeDisciplineStudent(adm));
    } catch (e) {
      setAiError(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      setAiBusy(false);
    }
  };

  const name = profile?.student?.name || route.params?.name || adm;

  if (!adm) {
    return (
      <ModuleScrollPage
        title="Learner history"
        description="Find a learner by name or admission number."
        onBack={() => navigation.goBack()}>
        <View style={[styles.search, { borderColor: rgba(palette.primary, 0.16) }]}>
          <Ionicons name="search" size={16} color={MUTED_INK} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. Baraka or STUD-0957"
            placeholderTextColor={MUTED_INK}
            style={styles.searchInput}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {searching ? <ActivityIndicator size="small" color={palette.primary} /> : null}
        </View>
        <View style={{ gap: 10, marginTop: 12 }}>
          {searchError ? (
            <StateCard tone="error" icon="alert-circle-outline" title="Search failed" body={searchError} />
          ) : query.trim().length < 2 ? (
            <StateCard icon="search-outline" title="Search a learner" body="Type at least two letters of a name or the admission number." />
          ) : !searching && hits.length === 0 ? (
            <StateCard icon="person-outline" title="No learner found" body="Check the spelling or try the admission number." />
          ) : (
            hits.map((h) => (
              <SurfaceCard
                key={h.id}
                accessibilityLabel={`Open ${h.name}`}
                onPress={() => navigation.setParams({ admissionNumber: h.admission_number, name: h.name })}>
                <View style={styles.hitRow}>
                  <View style={[styles.avatar, { backgroundColor: rgba(palette.primary, 0.08) }]}>
                    <Ionicons name="person-outline" size={16} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.hitName} numberOfLines={1}>
                      {h.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {[`Adm ${h.admission_number}`, h.class_label && h.class_label !== '—' ? h.class_label : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={MUTED_INK} />
                </View>
              </SurfaceCard>
            ))
          )}
        </View>
      </ModuleScrollPage>
    );
  }

  const incidents = profile?.incidents ?? [];
  const concerns = incidents.filter((i) => Number(i.points_delta) < 0 || String(i.sentiment) === 'negative').length;
  const positives = incidents.filter((i) => Number(i.points_delta) > 0 || String(i.sentiment) === 'positive').length;
  const rating = profile?.rating_pct;

  return (
    <ModuleScrollPage
      title={name || 'Learner'}
      description={[`Adm ${adm}`, profile?.student?.class_label && profile.student.class_label !== '—' ? profile.student.class_label : null]
        .filter(Boolean)
        .join(' · ')}
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState title="Couldn’t load this learner" message={error} onRetry={() => void load()} />
      ) : (
        <View style={{ gap: 12 }}>
          <View style={styles.tiles}>
            <StatTile
              label="Rating"
              value={rating != null ? `${rating}%` : '—'}
              hint={`Starts at ${profile?.base_rating ?? 50}%`}
              style={styles.tile}
            />
            <StatTile label="Cases" value={String(concerns)} hint="Recent" style={styles.tile} />
            <StatTile label="Commendations" value={String(positives)} hint="Recent" style={styles.tile} />
          </View>

          <PrimaryButton
            label="Record a case for this learner"
            icon="add-circle-outline"
            onPress={() =>
              navigation.navigate('RecordDiscipline', {
                admissionNumber: adm,
                name: name || undefined,
                classLabel: profile?.student?.class_label,
              })
            }
          />

          <SectionLabel>{incidents.length ? `History (${incidents.length})` : 'History'}</SectionLabel>
          {incidents.length === 0 ? (
            <StateCard icon="shield-checkmark-outline" title="Clean record" body="No cases or commendations on file for this learner." />
          ) : (
            incidents.map((i, idx) => {
              const delta = Number(i.points_delta);
              const positive = delta > 0 || String(i.sentiment) === 'positive';
              return (
                <SurfaceCard
                  key={i.incident_id ?? `inc-${idx}`}
                  onPress={i.incident_id ? () => navigation.navigate('DisciplineDetail', { id: i.incident_id }) : undefined}>
                  <View style={styles.hitRow}>
                    <View
                      style={[styles.avatar, { backgroundColor: positive ? 'rgba(6,118,71,0.10)' : 'rgba(180,35,24,0.08)' }]}>
                      <Ionicons
                        name={positive ? 'ribbon-outline' : 'shield-outline'}
                        size={16}
                        color={positive ? '#067647' : '#B42318'}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.hitName} numberOfLines={2}>
                        {i.case_summary || i.category_label || 'Incident'}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {[i.created_at ? fmtDay(i.created_at, { year: true }) : null, i.category_label].filter(Boolean).join(' · ')}
                      </Text>
                      <View style={styles.pills}>
                        {!positive && i.severity ? <StatusPill label={cap(i.severity)} tone={severityTone(i.severity)} /> : null}
                        {Number.isFinite(delta) && delta !== 0 ? (
                          <StatusPill label={`${delta > 0 ? '+' : ''}${delta} pts`} tone={delta > 0 ? 'success' : 'danger'} />
                        ) : null}
                      </View>
                    </View>
                    {i.incident_id ? <Ionicons name="chevron-forward" size={18} color={MUTED_INK} /> : null}
                  </View>
                </SurfaceCard>
              );
            })
          )}

          <PrimaryButton label="AI learner insight" icon="sparkles" tone="outline" busy={aiBusy} onPress={() => void runAi()} />
          {aiError ? <Text style={styles.warn}>{aiError}</Text> : null}
          {ai ? (
            <SurfaceCard>
              <ReportText text={ai} />
            </SurfaceCard>
          ) : null}
        </View>
      )}
    </ModuleScrollPage>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: INK, paddingVertical: 10 },
  hitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hitName: { fontSize: 14.5, fontWeight: '700', color: INK },
  meta: { marginTop: 2, fontSize: 12, color: MUTED_INK },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1 },
  warn: { fontSize: 12.5, color: '#B42318' },
});
