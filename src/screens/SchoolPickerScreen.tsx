import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDeskAuth } from '../context/DeskAuthContext';
import { LinkedStudent, UserSchool } from '../lib/orgRoles';
import { Colors } from '../theme/yana';
import { LiquidGlassBackdrop } from '../components/dashboard/LiquidGlassBackdrop';
import { GlassPanel } from '../components/dashboard/Glass';
import { floatingHeaderInset, TAB_BAR_BODY_HEIGHT } from '../constants/layout';
import { ProfileAvatar } from '../components/navigation/ProfileAvatar';
import { deskFetch, ensureNestDeskSession } from '../lib/deskApi';
import { log } from '../lib/logger';

type DeskChild = {
  student_id?: string;
  admission_number?: string | null;
  full_name?: string;
  class_name?: string | null;
  relationship?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
};

type DisplayStudent = LinkedStudent & {
  className?: string | null;
};

type CardDensity = 'comfy' | 'normal' | 'tight';

const HERO_GREEN = '#15411D';

function densityForCount(count: number): CardDensity {
  if (count >= 6) return 'tight';
  if (count >= 4) return 'normal';
  return 'comfy';
}

function enrichFromDesk(student: LinkedStudent, deskKids: DeskChild[]): DisplayStudent {
  if (!deskKids.length) return student;
  const adm = student.admissionNumber?.trim().toLowerCase();
  const name = student.name.trim().toLowerCase();
  const hit =
    deskKids.find((c) => c.student_id && c.student_id === student.id) ||
    deskKids.find(
      (c) =>
        adm &&
        c.admission_number &&
        String(c.admission_number).trim().toLowerCase() === adm,
    ) ||
    deskKids.find((c) => c.full_name && c.full_name.trim().toLowerCase() === name);

  if (!hit) return student;
  const photo = hit.avatar_url || hit.photo_url || null;
  return {
    ...student,
    name: hit.full_name?.trim() || student.name,
    admissionNumber: hit.admission_number || student.admissionNumber || null,
    relationship: hit.relationship || student.relationship || null,
    className: hit.class_name || student.className || null,
    avatarUrl: photo || student.avatarUrl || null,
  };
}

/** Prefer Desk children rows when Nest returned richer details (name + class). */
function mergePickerStudents(
  linked: LinkedStudent[],
  deskKids: DeskChild[],
  schools: UserSchool[],
): DisplayStudent[] {
  if (deskKids.length > 0) {
    const byId = new Map(linked.map((s) => [s.id, s]));
    const byAdm = new Map(
      linked
        .filter((s) => s.admissionNumber)
        .map((s) => [String(s.admissionNumber).trim().toLowerCase(), s]),
    );
    const defaultSchool = schools[0];
    const out: DisplayStudent[] = [];
    const seen = new Set<string>();

    for (const c of deskKids) {
      const sid = String(c.student_id ?? '');
      const adm = c.admission_number ? String(c.admission_number).trim().toLowerCase() : '';
      const org = (sid && byId.get(sid)) || (adm && byAdm.get(adm)) || null;
      const school =
        (org && schools.find((s) => s.id === org.schoolId)) ||
        schools.find((sch) => (sch.students ?? []).some((st) => st.id === sid)) ||
        defaultSchool;
      if (!school) continue;
      const id = sid || org?.id || `desk-${adm || out.length}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        key: `${school.id}:${id}`,
        id,
        name: c.full_name?.trim() || org?.name || 'Student',
        admissionNumber: c.admission_number ?? org?.admissionNumber ?? null,
        relationship: c.relationship ?? org?.relationship ?? null,
        className: c.class_name ?? org?.className ?? null,
        avatarUrl: c.avatar_url || c.photo_url || org?.avatarUrl || null,
        schoolId: school.id,
        schoolName: school.name,
        schoolLogoUrl: school.logoUrl,
        schoolRoles: school.roles,
      });
    }

    for (const s of linked) {
      if (seen.has(s.id)) continue;
      out.push(enrichFromDesk(s, deskKids));
      seen.add(s.id);
    }
    return out;
  }

  return linked.map((s) => enrichFromDesk(s, deskKids));
}

/** Full-screen loader — never flash Chat or a half-ready picker underneath. */
export function ContextPickLoader() {
  const insets = useSafeAreaInsets();
  const tabReserve = TAB_BAR_BODY_HEIGHT + insets.bottom;
  return (
    <View style={[styles.root, { bottom: tabReserve }]}>
      <LiquidGlassBackdrop />
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={HERO_GREEN} size="large" />
        <Text style={styles.loaderText}>Preparing your school…</Text>
      </View>
    </View>
  );
}

export function SchoolPickerScreen() {
  const insets = useSafeAreaInsets();
  const {
    schools,
    linkedStudents,
    selectStudent,
    selectSchool,
    schoolsReady,
    selectedStudentId,
    selectedSchoolId,
    deskToken,
    pickerMode,
  } = useDeskAuth();

  const [deskChildren, setDeskChildren] = useState<DeskChild[]>([]);
  const [deskKidsFetched, setDeskKidsFetched] = useState(false);

  const studentMode = pickerMode === 'student' && linkedStudents.length > 0;
  const density = densityForCount(studentMode ? linkedStudents.length : schools.length);

  useEffect(() => {
    if (!studentMode || !deskToken) {
      setDeskChildren([]);
      setDeskKidsFetched(true);
      return;
    }
    let cancelled = false;
    setDeskKidsFetched(false);
    void (async () => {
      try {
        // Session restore often has Supabase JWT only — Nest reconnect first.
        await ensureNestDeskSession();
        if (cancelled) return;
        const data = await deskFetch<{ children?: DeskChild[] }>('/parents/me/children');
        if (!cancelled) {
          const kids = Array.isArray(data?.children) ? data.children : [];
          setDeskChildren(kids);
          log.info('StudentPicker', 'desk children loaded', { count: kids.length });
        }
      } catch (e) {
        log.warn('StudentPicker', 'desk children details unavailable', String(e));
        if (!cancelled) setDeskChildren([]);
      } finally {
        if (!cancelled) setDeskKidsFetched(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentMode, deskToken]);

  const displayStudents = useMemo(
    () => mergePickerStudents(linkedStudents, deskChildren, schools),
    [linkedStudents, deskChildren, schools],
  );

  // One student only → skip picker (go straight through to Chat / dashboard).
  useEffect(() => {
    if (!schoolsReady) return;
    if (studentMode && !deskKidsFetched) return;
    if (!studentMode) return;
    if (displayStudents.length === 1) {
      void selectStudent(displayStudents[0]);
    }
  }, [schoolsReady, studentMode, deskKidsFetched, displayStudents, selectStudent]);

  const onSelectStudent = useCallback(
    async (student: LinkedStudent) => {
      await selectStudent(student);
    },
    [selectStudent],
  );

  const onSelectSchool = useCallback(
    async (school: UserSchool) => {
      await selectSchool(school.id);
    },
    [selectSchool],
  );

  const bottomPad = 16;
  const tabReserve = TAB_BAR_BODY_HEIGHT + insets.bottom;
  const avatarSize = density === 'tight' ? 40 : density === 'normal' ? 44 : 48;
  const listGap = density === 'tight' ? 8 : density === 'normal' ? 10 : 12;

  // Loader only — no half-ready / previous UI.
  if (!schoolsReady || (studentMode && deskToken && !deskKidsFetched)) {
    return <ContextPickLoader />;
  }

  // Single student auto-select in flight — keep loader, never flash the list.
  if (studentMode && displayStudents.length <= 1) {
    return <ContextPickLoader />;
  }

  return (
    <View style={[styles.root, { bottom: tabReserve }]}>
      <LiquidGlassBackdrop />
      <View style={styles.page}>
        {studentMode ? (
          <FlatList
            data={displayStudents}
            keyExtractor={(item) => item.key}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            showsVerticalScrollIndicator={false}
            bounces
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                <Text style={styles.title}>Select student</Text>
                <Text style={styles.subtitle}>
                  Choose who to open. You can switch anytime from the dashboard.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected =
                item.id === selectedStudentId && item.schoolId === selectedSchoolId;
              const meta = [
                item.className,
                item.admissionNumber ? `Adm ${item.admissionNumber}` : null,
                item.relationship,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => void onSelectStudent(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}>
                  <GlassPanel
                    tone="frost"
                    radius={16}
                    shine={false}
                    accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}
                    style={styles.card}>
                    <View
                      style={[
                        styles.cardInner,
                        density === 'tight' && styles.cardInnerTight,
                        density === 'normal' && styles.cardInnerNormal,
                      ]}>
                      <ProfileAvatar name={item.name} uri={item.avatarUrl} size={avatarSize} />
                      <View style={styles.rowText}>
                        <Text
                          style={[styles.cardTitle, density === 'tight' && styles.cardTitleTight]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        {meta ? (
                          <Text style={styles.cardMeta} numberOfLines={1}>
                            {meta}
                          </Text>
                        ) : null}
                        <Text style={styles.schoolLine} numberOfLines={1}>
                          {item.schoolName}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            }}
          />
        ) : (
          <FlatList
            data={schools}
            keyExtractor={(item) => item.id}
            style={styles.listFlex}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 8 }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: listGap }} />}
            ListHeaderComponent={
              <View style={[styles.headerChrome, { paddingTop: floatingHeaderInset(insets.top) }]}>
                <Text style={styles.title}>Select school</Text>
                <Text style={styles.subtitle}>Choose the school workspace to open.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = item.id === selectedSchoolId;
              return (
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => void onSelectSchool(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}>
                  <GlassPanel
                    tone="frost"
                    radius={16}
                    shine={false}
                    accentBorder={selected ? 'rgba(238,125,19,0.7)' : null}
                    style={styles.card}>
                    <View style={styles.cardInner}>
                      <View style={[styles.logoWrap, { width: avatarSize, height: avatarSize }]}>
                        {item.logoUrl ? (
                          <Image
                            source={{ uri: item.logoUrl }}
                            style={{ width: avatarSize, height: avatarSize, borderRadius: 10 }}
                          />
                        ) : (
                          <Ionicons name="school" size={22} color={HERO_GREEN} />
                        )}
                      </View>
                      <View style={styles.rowText}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {(item.roles ?? []).join(' · ') || 'School'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                    </View>
                  </GlassPanel>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    top: 0,
    left: 0,
    right: 0,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mutedForeground,
  },
  page: { flex: 1 },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: 16 },
  headerChrome: { paddingBottom: 14 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  card: { overflow: 'hidden' },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.992 }] },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardInnerNormal: { paddingVertical: 12 },
  cardInnerTight: { paddingVertical: 10 },
  rowText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  cardTitleTight: { fontSize: 15 },
  cardMeta: { marginTop: 2, fontSize: 12, color: Colors.mutedForeground },
  schoolLine: { marginTop: 2, fontSize: 12, fontWeight: '600', color: HERO_GREEN },
  logoWrap: {
    borderRadius: 10,
    backgroundColor: '#EDF1FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
