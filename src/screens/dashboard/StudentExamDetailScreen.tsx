import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';
import {
  fetchStudentExamMarksheet,
  type StudentExamMarksheetRow,
} from '../../lib/studentPortalApi';

type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentExamDetail'>;

type SubjectCell = {
  marks?: number | null;
  grade?: string | null;
  max_marks?: number | null;
  marks_percentage?: number | null;
  status?: string | null;
};

export function StudentExamDetailScreen({ route, navigation }: Props) {
  const { examId, title } = route.params;
  const insets = useSafeAreaInsets();
  const [row, setRow] = useState<StudentExamMarksheetRow | null>(null);
  const [subjectColumns, setSubjectColumns] = useState<Array<{ id?: string; name?: string; code?: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        const res = await fetchStudentExamMarksheet(examId);
        setRow(res.row);
        setSubjectColumns(res.subjectColumns);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('StudentExamDetail', msg);
        setError(msg);
        setRow(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [examId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = (row?.subjects ?? []) as SubjectCell[];

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
        <ModuleKicker>Exam detail</ModuleKicker>
        <ModuleScreenHeader
          title={title || 'Exam results'}
          description="Per-subject marks and rank (read-only)."
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty title="Couldn't load exam" body={error} onRetry={() => void load()} />
        ) : !row ? (
          <ModuleEmpty title="No marks yet" body="Your report for this exam is not published." />
        ) : (
          <>
            <ModuleGlassCard>
              <View style={styles.summaryRow}>
                <View style={styles.summaryStat}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{row.total_marks ?? '—'}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.statLabel}>Mean</Text>
                  <Text style={styles.statValue}>
                    {row.mean != null ? String(row.mean) : row.overall_grade ?? '—'}
                  </Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.statLabel}>Class rank</Text>
                  <Text style={styles.statValue}>
                    {row.rank_in_class != null && row.rank_out_of_class != null
                      ? `${row.rank_in_class}/${row.rank_out_of_class}`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.statLabel}>Level rank</Text>
                  <Text style={styles.statValue}>
                    {row.rank_in_level != null && row.rank_out_of_level != null
                      ? `${row.rank_in_level}/${row.rank_out_of_level}`
                      : '—'}
                  </Text>
                </View>
              </View>
            </ModuleGlassCard>

            {subjectColumns.map((col, idx) => {
              const cell = subjects[idx];
              return (
                <ModuleGlassCard key={col.id ?? col.code ?? String(idx)}>
                  <Text style={styles.subjectName}>{col.name || col.code || 'Subject'}</Text>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectMeta}>
                      Mark: {cell?.marks != null ? String(cell.marks) : '—'}
                      {cell?.max_marks != null ? ` / ${cell.max_marks}` : ''}
                    </Text>
                    <Text style={styles.subjectGrade}>{cell?.grade || '—'}</Text>
                  </View>
                  {cell?.marks_percentage != null ? (
                    <Text style={styles.subjectPct}>{cell.marks_percentage}%</Text>
                  ) : null}
                </ModuleGlassCard>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryStat: {
    flexBasis: '47%',
    backgroundColor: 'rgba(10,61,46,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  statValue: { marginTop: 4, fontSize: 16, fontWeight: '800', color: Colors.brandGreenDark },
  subjectName: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  subjectRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectMeta: { fontSize: 13, color: Colors.mutedForeground },
  subjectGrade: { fontSize: 16, fontWeight: '800', color: Colors.brandGreenDark },
  subjectPct: { marginTop: 4, fontSize: 12, color: Colors.mutedForeground },
});
