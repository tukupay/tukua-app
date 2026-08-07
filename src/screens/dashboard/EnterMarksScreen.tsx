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

import { fetchTeacherExams, type DeskExam } from '../../lib/teacherPortalApi';



type Props = NativeStackScreenProps<DashboardStackParamList, 'EnterMarks'>;



function examLabel(e: DeskExam): string {

  return e.name || [e.term, e.academic_year ?? e.academicyear ?? e.year].filter(Boolean).join(' · ') || 'Exam';

}



export function EnterMarksScreen({ navigation }: Props) {

  const insets = useSafeAreaInsets();

  const [exams, setExams] = useState<DeskExam[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async (soft = false) => {

    if (!soft) setLoading(true);

    setError(null);

    try {

      setExams(await fetchTeacherExams());

    } catch (e) {

      const msg = e instanceof Error ? e.message : String(e);

      log.warn('EnterMarks', msg);

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

        <ModuleKicker>Assessment</ModuleKicker>

        <ModuleScreenHeader title="Enter marks" description="Pick an exam to view or fill marks." />



        {loading ? (

          <View style={styles.loader}>

            <ActivityIndicator color={Colors.brandGreenMid} />

          </View>

        ) : error ? (

          <ModuleEmpty title="Couldn't load exams" body={error} onRetry={() => void load()} />

        ) : exams.length === 0 ? (

          <ModuleEmpty title="No exams yet" body="When the school creates exams, they will appear here." />

        ) : (

          exams.map((exam) => (

            <Pressable

              key={exam.id}

              onPress={() =>

                navigation.navigate('EnterMarksEntry', {

                  examId: exam.id,

                  title: examLabel(exam),

                })

              }>

              <ModuleGlassCard>

                <View style={styles.row}>

                  <View style={styles.iconWrap}>

                    <Ionicons name="create-outline" size={18} color={Colors.primary} />

                  </View>

                  <View style={styles.body}>

                    <Text style={styles.title}>{examLabel(exam)}</Text>

                    <Text style={styles.meta}>

                      {[exam.marking_status, exam.exam_type, exam.class_name].filter(Boolean).join(' · ')}

                    </Text>

                  </View>

                  <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />

                </View>

              </ModuleGlassCard>

            </Pressable>

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


