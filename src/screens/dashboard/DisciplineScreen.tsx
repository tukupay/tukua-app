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
import { ModuleBackBar, ModuleEmpty, ModuleGlassCard, ModuleKicker } from './ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { deskFetch } from '../../lib/deskApi';
import { seedParentDemoData } from '../../lib/parentPortalApi';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Discipline'>;

type Incident = {
  id?: string;
  case_number?: string;
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  incident_date?: string;
  created_at?: string;
  category_name?: string;
  category_label?: string;
  case_summary?: string;
  students?: Array<{
    full_name?: string;
    admission_number?: string;
    student_id?: string;
  }>;
};

function unwrapList(data: unknown): Incident[] {
  if (Array.isArray(data)) return data as Incident[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.incidents)) return obj.incidents as Incident[];
    if (Array.isArray(obj.items)) return obj.items as Incident[];
    if (Array.isArray(obj.data)) return obj.data as Incident[];
  }
  return [];
}

export function DisciplineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedStudent, selectedStudentId } = useDeskAuth();
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(
    async (soft = false) => {
      if (!soft) setLoading(true);
      setError(null);
      try {
        // Student scope comes from X-Desk-Student-Id (deskApi); do not pass ?student_id=
        const data = await deskFetch<unknown>('/discipline/incidents');
        setItems(unwrapList(data));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.warn('Discipline', msg);
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStudentId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!selectedStudentId) return items;
    return items.filter((inc) =>
      (inc.students ?? []).some((s) => String(s.student_id ?? '') === selectedStudentId),
    );
  }, [items, selectedStudentId]);

  const seed = async () => {
    setSeeding(true);
    try {
      await seedParentDemoData();
      await load(true);
    } catch (e) {
      log.warn('Discipline', 'seed failed', String(e));
    } finally {
      setSeeding(false);
    }
  };

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
        <ModuleKicker>Discipline</ModuleKicker>
        <Text style={styles.heading}>
          {selectedStudent?.name ? `${selectedStudent.name}’s cases` : 'Your children’s cases'}
        </Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.brandGreenMid} />
          </View>
        ) : error ? (
          <ModuleEmpty
            title="Couldn’t load discipline"
            body={
              /session expired|401|unauthorized/i.test(error)
                ? 'School API session isn’t accepted yet for this account. Stay here — Chat still works. Pull to retry.'
                : error
            }
            onRetry={() => void load()}
          />
        ) : visible.length === 0 ? (
          <ModuleEmpty
            title="No cases on record"
            body="When the school logs a discipline incident for your child, it will show up here."
            onRetry={seeding ? undefined : () => void seed()}
          />
        ) : (
          visible.map((item, index) => {
            const key = String(item.id ?? item.case_number ?? index);
            const open = expanded === key;
            const student =
              item.students?.[0]?.full_name || item.students?.[0]?.admission_number || null;
            return (
              <Pressable key={key} onPress={() => setExpanded(open ? null : key)}>
                <ModuleGlassCard>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={Colors.destructive} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title ||
                          item.case_summary ||
                          item.case_number ||
                          item.category_label ||
                          'Incident'}
                      </Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {[item.status, item.severity, item.category_label || item.category_name, student]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.mutedForeground}
                    />
                  </View>
                  {open && item.description ? (
                    <Text style={styles.desc}>{item.description}</Text>
                  ) : null}
                  {open && (item.incident_date || item.created_at) ? (
                    <Text style={styles.date}>{item.incident_date || item.created_at}</Text>
                  ) : null}
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
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 14,
  },
  loader: { paddingVertical: 40, alignItems: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.brandGreenDark },
  meta: { marginTop: 3, fontSize: 12, color: Colors.mutedForeground },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mutedForeground,
  },
  date: { marginTop: 8, fontSize: 11, color: Colors.mutedForeground },
});
