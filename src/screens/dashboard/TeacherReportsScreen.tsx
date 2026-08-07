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

import { DashboardStackParamList } from '../../navigation/types';

import { Colors } from '../../theme/yana';

import { log } from '../../lib/logger';

import { fetchExamAggregates, fetchTeacherExams, type DeskExam } from '../../lib/teacherPortalApi';



type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherReports'>;



function examLabel(e: DeskExam): string {

  return e.name || [e.term, e.academic_year ?? e.academicyear ?? e.year].filter(Boolean).join(' · ') || 'Exam';

}



export function TeacherReportsScreen({ navigation }: Props) {

  const insets = useSafeAreaInsets();

  const [exams, setExams] = useState<DeskExam[]>([]);

  const [summaries, setSummaries] = useState<Record<string, Array<Record<string, unknown>>>>({});

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async (soft = false) => {

    if (!soft) setLoading(true);

    setError(null);

    try {

      const list = await fetchTeacherExams(20);

      setExams(list);

      const agg: Record<string, Array<Record<string, unknown>>> = {};

      await Promise.all(

        list.slice(0, 8).map(async (exam) => {

          try {

            const res = await fetchExamAggregates(exam.id);

            const rows = Array.isArray(res?.aggregates) ? res.aggregates : [];

            agg[exam.id] = rows;

          } catch {

            agg[exam.id] = [];

          }

        }),

      );

      setSummaries(agg);

    } catch (e) {

      const msg = e instanceof Error ? e.message : String(e);

      log.warn('TeacherReports', msg);

      setError(msg);

      setExams([]);

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

        <ModuleKicker>Reports</ModuleKicker>

        <ModuleScreenHeader
          title="Reports hub"
          description="Pick a sector. Marks opens exam aggregates; Progress opens outstanding entry."
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {[
            { id: 'marks', label: 'Marks' },
            { id: 'progress', label: 'Progress' },
            { id: 'discipline', label: 'Discipline' },
            { id: 'attendance', label: 'Attendance' },
          ].map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                if (s.id === 'progress') navigation.navigate('TeacherProgress');
                else if (s.id === 'discipline') navigation.navigate('Discipline');
                else if (s.id === 'attendance')
                  navigation.navigate('FeaturePlaceholder', {
                    title: 'Attendance reports',
                    description: 'Class attendance summaries open on Desk for now.',
                  });
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: s.id === 'marks' ? Colors.primary : 'rgba(10,61,46,0.08)',
              }}>
              <Text style={{ fontWeight: '700', color: s.id === 'marks' ? '#fff' : Colors.primary }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (

          <View style={styles.loader}>

            <ActivityIndicator color={Colors.brandGreenMid} />

          </View>

        ) : error ? (

          <ModuleEmpty title="Couldn't load reports" body={error} onRetry={() => void load()} />

        ) : exams.length === 0 ? (

          <ModuleEmpty title="No exams" body="Exam summaries appear after marks are entered." />

        ) : (

          exams.map((exam) => {

            const rows = summaries[exam.id] ?? [];

            return (

              <Pressable

                key={exam.id}

                onPress={() =>

                  navigation.navigate('TeacherMarksheet', { examId: exam.id, title: examLabel(exam) })

                }>

                <ModuleGlassCard>

                  <View style={styles.row}>

                    <View style={styles.iconWrap}>

                      <Ionicons name="document-text-outline" size={18} color={Colors.primary} />

                    </View>

                    <View style={styles.body}>

                      <Text style={styles.title}>{examLabel(exam)}</Text>

                      <Text style={styles.meta}>

                        {rows.length

                          ? `${rows.length} aggregate row(s)`

                          : exam.marking_status || 'Open marksheet for detail'}

                      </Text>

                    </View>

                    <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />

                  </View>

                </ModuleGlassCard>

              </Pressable>

            );

          })

        )}

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#FFFFFF' },

  content: { paddingHorizontal: 18 },

  loader: { paddingVertical: 40, alignItems: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  iconWrap: {

    width: 36,

    height: 36,

    borderRadius: 10,

    backgroundColor: Colors.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

  },

  body: { flex: 1 },

  title: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },

  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },

});


