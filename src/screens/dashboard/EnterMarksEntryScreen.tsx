/**

 * Enter marks — class + learning area from teacher workload; filter marks by subject.

 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {

  ActivityIndicator,

  FlatList,

  Pressable,

  StyleSheet,

  Text,

  TextInput,

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

import { useDeskAuth } from '../../context/DeskAuthContext';

import { DashboardStackParamList } from '../../navigation/types';

import { Colors } from '../../theme/yana';

import { log } from '../../lib/logger';

import {

  generateExamMarks,

  listAssessmentMarks,

  patchAssessmentMark,

  fetchMyTeacherWorkloads,

  type AssessmentMarkRow,

  type TeacherWorkload,

} from '../../lib/teacherPortalApi';



type Props = NativeStackScreenProps<DashboardStackParamList, 'EnterMarksEntry'>;



const PAGE = 20;



export function EnterMarksEntryScreen({ route, navigation }: Props) {

  const { examId, title, classId: initialClassId } = route.params;

  const insets = useSafeAreaInsets();

  const { deskUser } = useDeskAuth();

  const teacherId = String(deskUser?.id ?? deskUser?.user_id ?? '').trim();



  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);

  const [classId, setClassId] = useState<string | null>(initialClassId ?? null);

  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [marks, setMarks] = useState<AssessmentMarkRow[]>([]);

  const [scores, setScores] = useState<Record<string, string>>({});

  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [visible, setVisible] = useState(PAGE);

  const inputRefs = useRef<Record<string, TextInput | null>>({});



  const classOptions = useMemo(() => {

    const map = new Map<string, string>();

    for (const w of workloads) {

      if (w.class_id) map.set(w.class_id, w.class_name || 'Class');

    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));

  }, [workloads]);



  const subjectOptions = useMemo(() => {

    if (!classId) return [];

    const map = new Map<string, string>();

    for (const w of workloads) {

      if (w.class_id === classId && w.subject_id) {

        map.set(w.subject_id, w.subject_name || w.subject_code || 'Learning area');

      }

    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));

  }, [classId, workloads]);



  const load = useCallback(

    async (cid?: string | null, sid?: string | null) => {

      setLoading(true);

      setError(null);

      setSaveMsg(null);

      try {

        let wl = workloads;

        if (teacherId && wl.length === 0) {

          wl = await fetchMyTeacherWorkloads(teacherId);

          setWorkloads(wl);

        }

        const nextClass =

          cid !== undefined

            ? cid

            : classId || wl.find((w) => w.class_id)?.class_id || null;

        const classWorkloads = wl.filter((w) => w.class_id === nextClass);

        let nextSubject =

          sid !== undefined

            ? sid

            : subjectId ||

              (classWorkloads.length === 1 ? classWorkloads[0].subject_id ?? null : null);



        if (nextClass && nextClass !== classId) setClassId(nextClass);

        if (nextSubject !== subjectId) setSubjectId(nextSubject);



        if (!nextClass) {

          setMarks([]);

          setScores({});

          return;

        }

        if (!nextSubject) {

          setMarks([]);

          setScores({});

          return;

        }



        let rows = await listAssessmentMarks(examId, nextClass, nextSubject);

        if (rows.length === 0) {

          await generateExamMarks(examId);

          rows = await listAssessmentMarks(examId, nextClass, nextSubject);

        }

        setMarks(rows);

        const nextScores: Record<string, string> = {};

        for (const r of rows) {

          if (r.id) {

            nextScores[r.id] =

              r.marks === null || r.marks === undefined || r.marks === ''

                ? ''

                : String(r.marks);

          }

        }

        setScores(nextScores);

        setDirty({});

        setVisible(PAGE);

      } catch (e) {

        const msg = e instanceof Error ? e.message : String(e);

        log.warn('EnterMarksEntry', msg);

        setError(msg || 'Could not load marks. Pull to try again.');

      } finally {

        setLoading(false);

      }

    },

    [classId, examId, subjectId, teacherId, workloads],

  );



  useEffect(() => {

    void load();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / exam change

  }, [examId]);



  const onChangeScore = (id: string, value: string) => {

    const cleaned = value.replace(/[^0-9.]/g, '');

    setScores((s) => ({ ...s, [id]: cleaned }));

    setDirty((d) => ({ ...d, [id]: true }));

  };



  const focusNext = (index: number) => {

    const slice = marks.slice(0, visible);

    const next = slice[index + 1];

    if (next?.id) inputRefs.current[next.id]?.focus();

  };



  const onSave = async () => {

    const ids = Object.keys(dirty).filter((id) => dirty[id]);

    if (ids.length === 0) {

      setSaveMsg('Nothing to save yet — edit a score first.');

      return;

    }

    setSaving(true);

    setError(null);

    setSaveMsg(null);

    let saved = 0;

    let failed = 0;

    try {

      for (const id of ids) {

        const raw = scores[id];

        const num = raw === '' || raw === undefined ? null : Number(raw);

        if (num !== null && Number.isNaN(num)) {

          failed++;

          continue;

        }

        try {

          await patchAssessmentMark(id, { marks: num });

          saved++;

        } catch {

          failed++;

        }

      }

      if (failed > 0 && saved > 0) {

        setSaveMsg(`Saved ${saved} mark${saved === 1 ? '' : 's'} · ${failed} failed.`);

      } else if (failed > 0) {

        setError(`${failed} mark${failed === 1 ? '' : 's'} could not be saved. Check scores and try again.`);

      } else {

        setSaveMsg(`Saved ${saved} mark${saved === 1 ? '' : 's'}.`);

        setDirty({});

      }

      if (saved > 0) setDirty({});

      await load(classId, subjectId);

    } catch (e) {

      const msg = e instanceof Error ? e.message : String(e);

      setError(msg);

    } finally {

      setSaving(false);

    }

  };



  const slice = marks.slice(0, visible);

  const noWorkload = workloads.length === 0 && !loading;

  const noLaForClass = Boolean(classId && subjectOptions.length === 0 && !loading);



  return (

    <View style={styles.root}>

      <DashboardBackground patternOnly liquid />

      <View style={{ paddingTop: floatingHeaderInset(insets.top) }}>

        <ModuleBackBar onBack={() => navigation.goBack()} />

        <ModuleScreenHeader

          title={title || 'Enter marks'}

          description="Pick class and learning area, type scores, then Save marks."

        />

      </View>



      <View style={styles.classRow}>

        <ModuleKicker>Class</ModuleKicker>

        <ScrollClassChips

          options={classOptions}

          selected={classId}

          onSelect={(id) => {

            setSubjectId(null);

            void load(id, null);

          }}

        />

      </View>



      {classId ? (

        <View style={styles.classRow}>

          <ModuleKicker>Learning area</ModuleKicker>

          <ScrollClassChips

            options={subjectOptions}

            selected={subjectId}

            onSelect={(id) => {

              setSubjectId(id);

              void load(classId, id);

            }}

            emptyLabel="No learning areas on your workload for this class — ask admin to assign your subjects."

          />

        </View>

      ) : null}



      {loading ? (

        <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />

      ) : noWorkload ? (

        <ModuleEmpty

          title="No workload assigned yet"

          body="Your admin must assign class × subject workloads before you can enter marks here."

        />

      ) : noLaForClass ? (

        <ModuleEmpty

          title="No subjects for this class"

          body="This class is not on your teacher workload. Pick another class or ask admin to add your learning areas."

        />

      ) : !subjectId ? (

        <ModuleEmpty

          title="Pick a learning area"

          body="Select the subject you teach for this class, then enter marks for each student."

        />

      ) : error && marks.length === 0 ? (

        <ModuleEmpty title="Could not load marks" body={error} />

      ) : marks.length === 0 ? (

        <ModuleEmpty

          title="No students in this class"

          body="Pick another class or ask admin to enroll students."

        />

      ) : (

        <FlatList

          data={slice}

          keyExtractor={(item, i) => item.id || `row-${i}`}

          contentContainerStyle={{ paddingBottom: moduleScrollBottomPad(insets.bottom) + 72 }}

          onEndReached={() => {

            if (visible < marks.length) setVisible((v) => Math.min(v + PAGE, marks.length));

          }}

          onEndReachedThreshold={0.4}

          ListFooterComponent={

            visible < marks.length ? (

              <Pressable

                style={styles.loadMore}

                onPress={() => setVisible((v) => Math.min(v + PAGE, marks.length))}

              >

                <Text style={styles.loadMoreText}>

                  Load more ({marks.length - visible} left)

                </Text>

              </Pressable>

            ) : null

          }

          renderItem={({ item, index }) => {

            const id = item.id;

            const name = item.student_name || 'Student';

            const adm = item.admission_number ? `#${item.admission_number}` : '';

            return (

              <ModuleGlassCard style={styles.row}>

                <View style={styles.rowTop}>

                  <Text style={styles.name} numberOfLines={1}>

                    {adm ? `${adm} ` : ''}

                    {name}

                  </Text>

                  {item.grade ? <Text style={styles.grade}>{item.grade}</Text> : null}

                </View>

                <TextInput

                  ref={(r) => {

                    if (id) inputRefs.current[id] = r;

                  }}

                  style={styles.input}

                  keyboardType="decimal-pad"

                  returnKeyType="next"

                  value={id ? scores[id] ?? '' : ''}

                  onChangeText={(t) => id && onChangeScore(id, t)}

                  onSubmitEditing={() => focusNext(index)}

                  placeholder="Marks"

                  placeholderTextColor="rgba(255,255,255,0.35)"

                />

              </ModuleGlassCard>

            );

          }}

        />

      )}



      {(error || saveMsg) && marks.length > 0 ? (

        <Text style={[styles.banner, error ? styles.bannerErr : styles.bannerOk]}>

          {error || saveMsg}

        </Text>

      ) : null}



      <Pressable

        style={[styles.saveBtn, (saving || !subjectId) && { opacity: 0.7 }]}

        onPress={() => void onSave()}

        disabled={saving || loading || !subjectId}

      >

        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save marks'}</Text>

      </Pressable>

    </View>

  );

}



function ScrollClassChips({

  options,

  selected,

  onSelect,

  emptyLabel = 'No classes on your workload yet.',

}: {

  options: { id: string; name: string }[];

  selected: string | null;

  onSelect: (id: string) => void;

  emptyLabel?: string;

}) {

  if (!options.length) {

    return <Text style={styles.muted}>{emptyLabel}</Text>;

  }

  return (

    <View style={styles.chips}>

      {options.map((o) => {

        const on = o.id === selected;

        return (

          <Pressable

            key={o.id}

            onPress={() => onSelect(o.id)}

            style={[styles.chip, on && styles.chipOn]}

          >

            <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>

              {o.name}

            </Text>

          </Pressable>

        );

      })}

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1 },

  classRow: { paddingHorizontal: 16, marginBottom: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },

  chip: {

    paddingHorizontal: 12,

    paddingVertical: 8,

    borderRadius: 12,

    backgroundColor: 'rgba(255,255,255,0.08)',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.12)',

    maxWidth: '48%',

  },

  chipOn: { backgroundColor: 'rgba(31,139,76,0.35)', borderColor: Colors.primary },

  chipText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  chipTextOn: { color: '#fff', fontWeight: '600' },

  row: { marginHorizontal: 16, marginBottom: 10 },

  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },

  name: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },

  grade: { color: Colors.primary, fontWeight: '700' },

  input: {

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.2)',

    borderRadius: 10,

    paddingHorizontal: 12,

    paddingVertical: 10,

    color: '#fff',

    fontSize: 18,

    fontWeight: '600',

    backgroundColor: 'rgba(0,0,0,0.25)',

  },

  loadMore: { alignItems: 'center', paddingVertical: 16 },

  loadMoreText: { color: Colors.primary, fontWeight: '600' },

  saveBtn: {

    position: 'absolute',

    left: 16,

    right: 16,

    bottom: 24,

    backgroundColor: Colors.primary,

    paddingVertical: 14,

    borderRadius: 14,

    alignItems: 'center',

  },

  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  banner: { textAlign: 'center', marginBottom: 88, paddingHorizontal: 16, fontSize: 13 },

  bannerErr: { color: '#FCA5A5' },

  bannerOk: { color: '#86EFAC' },

  muted: { color: 'rgba(255,255,255,0.55)', marginTop: 6, fontSize: 13, lineHeight: 18 },

});


