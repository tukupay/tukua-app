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

import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';

import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';

import { useDeskAuth } from '../../context/DeskAuthContext';

import { DashboardStackParamList } from '../../navigation/types';

import { Colors } from '../../theme/yana';

import { log } from '../../lib/logger';

import {

  fetchStudentExamSummary,

  fetchStudentExams,

  type StudentExamSummary,

} from '../../lib/studentPortalApi';

import type { DeskExam } from '../../lib/teacherPortalApi';



type Props = NativeStackScreenProps<DashboardStackParamList, 'StudentGrades'>;



function examLabel(e: DeskExam): string {

  return e.name || [e.term, e.academic_year ?? e.academicyear ?? e.year].filter(Boolean).join(' · ') || 'Exam';

}



type ExamWithReport = { exam: DeskExam; summary: StudentExamSummary | null };



export function StudentGradesScreen({ navigation }: Props) {

  const insets = useSafeAreaInsets();

  const { deskUser, selectedStudentId } = useDeskAuth();

  const studentId = String(selectedStudentId ?? deskUser?.id ?? deskUser?.user_id ?? '').trim();



  const [items, setItems] = useState<ExamWithReport[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async (soft = false) => {

    if (!studentId) {

      setError('Student profile not linked');

      setLoading(false);

      return;

    }

    if (!soft) setLoading(true);

    setError(null);

    try {

      const exams = await fetchStudentExams();

      const reports: ExamWithReport[] = [];

      for (const exam of exams.slice(0, 12)) {

        try {

          const { summary } = await fetchStudentExamSummary(exam.id, studentId);

          reports.push({ exam, summary });

        } catch {

          reports.push({ exam, summary: null });

        }

      }

      setItems(reports);

    } catch (e) {

      const msg = e instanceof Error ? e.message : String(e);

      log.warn('StudentGrades', msg);

      setError(msg);

      setItems([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [studentId]);



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

        <ModuleKicker>Grades</ModuleKicker>

        <ModuleScreenHeader title="My grades" description="Exam results from the school Nest API." />



        {loading ? (

          <View style={styles.loader}>

            <ActivityIndicator color={Colors.brandGreenMid} />

          </View>

        ) : error ? (

          <ModuleEmpty title="Couldn't load grades" body={error} onRetry={() => void load()} />

        ) : items.length === 0 ? (

          <ModuleEmpty title="No exams yet" body="Your report cards will show here after marking." />

        ) : (

          items.map(({ exam, summary }) => (

            <ModuleGlassCard key={exam.id}>

              <Text style={styles.examTitle}>{examLabel(exam)}</Text>

              <Text style={styles.meta}>{exam.marking_status || 'Exam'}</Text>

              {summary ? (

                <View style={styles.stats}>

                  <View style={styles.stat}>

                    <Text style={styles.statLabel}>Mean</Text>

                    <Text style={styles.statValue}>

                      {summary.mean_mark != null ? String(summary.mean_mark) : '—'}

                    </Text>

                  </View>

                  <View style={styles.stat}>

                    <Text style={styles.statLabel}>Grade</Text>

                    <Text style={styles.statValue}>{summary.mean_grade || '—'}</Text>

                  </View>

                  <View style={styles.stat}>

                    <Text style={styles.statLabel}>Class rank</Text>

                    <Text style={styles.statValue}>

                      {summary.rank_in_class != null && summary.rank_out_of_class != null

                        ? `${summary.rank_in_class}/${summary.rank_out_of_class}`

                        : '—'}

                    </Text>

                  </View>

                </View>

              ) : (

                <Text style={styles.noReport}>No report published for this exam yet.</Text>

              )}

            </ModuleGlassCard>

          ))

        )}

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#FFFFFF' },

  content: { paddingHorizontal: 18 },

  loader: { paddingVertical: 40, alignItems: 'center' },

  examTitle: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },

  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },

  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },

  stat: {

    flex: 1,

    backgroundColor: 'rgba(10,61,46,0.06)',

    borderRadius: 12,

    paddingVertical: 10,

    alignItems: 'center',

  },

  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },

  statValue: { marginTop: 4, fontSize: 15, fontWeight: '800', color: Colors.brandGreenDark },

  noReport: { marginTop: 10, fontSize: 13, color: Colors.mutedForeground },

});


