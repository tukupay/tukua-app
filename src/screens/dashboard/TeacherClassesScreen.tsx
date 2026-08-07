import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

import { fetchClassEnrollments, fetchMyTeacherWorkloads, type TeacherWorkload } from '../../lib/teacherPortalApi';
import { isDeskWebModuleAvailable } from '../../lib/localHost';



type Props = NativeStackScreenProps<DashboardStackParamList, 'TeacherClasses'>;



type ClassGroup = {

  classId: string;

  className: string;

  subjects: TeacherWorkload[];

  enrollments: Array<Record<string, unknown>>;

};



export function TeacherClassesScreen({ navigation }: Props) {

  const insets = useSafeAreaInsets();

  const { deskUser } = useDeskAuth();

  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();



  const [groups, setGroups] = useState<ClassGroup[]>([]);

  const [expanded, setExpanded] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async (soft = false) => {

    if (!teacherId) {

      setError('Teacher profile not linked');

      setLoading(false);

      return;

    }

    if (!soft) setLoading(true);

    setError(null);

    try {

      const workloads = await fetchMyTeacherWorkloads(teacherId);

      const byClass = new Map<string, ClassGroup>();

      for (const w of workloads) {

        const cid = String(w.class_id ?? '').trim();

        if (!cid) continue;

        if (!byClass.has(cid)) {

          byClass.set(cid, {

            classId: cid,

            className: w.class_name || 'Class',

            subjects: [],

            enrollments: [],

          });

        }

        byClass.get(cid)!.subjects.push(w);

      }

      const next = [...byClass.values()];

      await Promise.all(

        next.map(async (g) => {

          try {

            g.enrollments = await fetchClassEnrollments(g.classId);

          } catch {

            g.enrollments = [];

          }

        }),

      );

      setGroups(next);

    } catch (e) {

      const msg = e instanceof Error ? e.message : String(e);

      log.warn('TeacherClasses', msg);

      setError(msg);

      setGroups([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [teacherId]);



  useEffect(() => {

    void load();

  }, [load]);



  const totalStudents = useMemo(

    () => groups.reduce((sum, g) => sum + g.enrollments.length, 0),

    [groups],

  );

  const openEnroll = useCallback(() => {
    if (isDeskWebModuleAvailable()) {
      navigation.navigate('DeskModule', {
        title: 'Enroll student',
        deskPath: '/admin/classes',
        description: 'Add or move enrollments in Desk Admin → Classes.',
      });
      return;
    }
    navigation.navigate('FeaturePlaceholder', {
      title: 'Enroll student',
      description:
        'Class enrollment is Desk-only today (POST /classes/enrollments needs school admin). View roll here; enroll on Desk.',
      apiHint: '/classes/enrollments',
    });
  }, [navigation]);

  const openStudentDetail = useCallback(
    (e: Record<string, unknown>) => {
      const sid = String(e.student_id ?? e.id ?? '').trim();
      const name = String(
        e.full_name ?? [e.first_name, e.last_name].filter(Boolean).join(' ') ?? 'Student',
      );
      const adm = e.admission_number ?? e.student_number;
      navigation.navigate('FeaturePlaceholder', {
        title: name,
        description: [
          adm ? `#${adm}` : null,
          e.class_name ? String(e.class_name) : null,
          sid ? `Student id ${sid.slice(0, 8)}…` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        apiHint: sid ? `/students/${sid}` : undefined,
      });
    },
    [navigation],
  );



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

        <ModuleKicker>Classes</ModuleKicker>

        <ModuleScreenHeader

          title="My classes"

          description={`${groups.length} class(es) · ${totalStudents} enrolled learner(s)`}

        />



        {loading ? (

          <View style={styles.loader}>

            <ActivityIndicator color={Colors.brandGreenMid} />

          </View>

        ) : error ? (

          <ModuleEmpty title="Couldn't load classes" body={error} onRetry={() => void load()} />

        ) : groups.length === 0 ? (

          <ModuleEmpty

            title="No classes assigned"

            body="Workload assignments from the school admin will appear here."

          />

        ) : (

          groups.map((g) => {

            const open = expanded === g.classId;

            return (

              <Pressable key={g.classId} onPress={() => setExpanded(open ? null : g.classId)}>

                <ModuleGlassCard>

                  <View style={styles.row}>

                    <View style={styles.iconWrap}>

                      <Ionicons name="people-outline" size={18} color={Colors.primary} />

                    </View>

                    <View style={styles.body}>

                      <Text style={styles.title}>{g.className}</Text>

                      <Text style={styles.meta}>

                        {g.subjects.length} subject(s) · {g.enrollments.length} student(s)

                      </Text>

                    </View>

                    <Ionicons

                      name={open ? 'chevron-up' : 'chevron-down'}

                      size={18}

                      color={Colors.mutedForeground}

                    />

                  </View>

                  {open ? (

                    <View style={styles.detail}>

                      <Text style={styles.sectionLabel}>Subjects</Text>

                      {g.subjects.map((s, i) => (

                        <Text key={`${g.classId}-sub-${i}`} style={styles.line}>

                          • {s.subject_name || s.subject_code || 'Subject'}

                          {s.lessons_per_week ? ` · ${s.lessons_per_week}/wk` : ''}

                        </Text>

                      ))}

                      {g.enrollments.length ? (

                        <>

                          <Text style={styles.sectionLabel}>Students</Text>

                          {g.enrollments.slice(0, 12).map((e, i) => (

                            <Pressable
                              key={`${g.classId}-stu-${i}`}
                              onPress={() => openStudentDetail(e)}
                              accessibilityRole="button"
                              accessibilityLabel="Open student detail">

                              <Text style={styles.line}>

                                •{' '}

                                {String(

                                  e.full_name ??

                                    [e.first_name, e.last_name].filter(Boolean).join(' ') ??

                                    e.admission_number ??

                                    'Student',

                                )}

                              </Text>

                            </Pressable>

                          ))}

                          {g.enrollments.length > 12 ? (

                            <Text style={styles.more}>+{g.enrollments.length - 12} more</Text>

                          ) : null}

                        </>

                      ) : null}

                    </View>

                  ) : null}

                </ModuleGlassCard>

              </Pressable>

            );

          })

        )}

      </ScrollView>

      <Pressable style={styles.fab} onPress={openEnroll} accessibilityRole="button" accessibilityLabel="Enroll student">
        <Ionicons name="person-add-outline" size={22} color="#fff" />
        <Text style={styles.fabText}>Enroll</Text>
      </Pressable>

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

  detail: { marginTop: 12, gap: 4 },

  sectionLabel: {

    marginTop: 8,

    fontSize: 11,

    fontWeight: '800',

    letterSpacing: 0.5,

    textTransform: 'uppercase',

    color: Colors.mutedForeground,

  },

  line: { fontSize: 13, color: Colors.ink, paddingLeft: 4 },

  more: { fontSize: 12, color: Colors.mutedForeground, marginTop: 4 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    shadowColor: '#0A3D2E',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  fabText: { color: '#fff', fontWeight: '800', fontSize: 13 },

});


