import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import { GlassPanel } from '../../components/dashboard/Glass';
import { ModuleBackBar, ModuleEmpty, ModuleKicker, ModuleScreenHeader } from './ModuleChrome';
import { useDeskAuth } from '../../context/DeskAuthContext';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { deskFetch } from '../../lib/deskApi';
import { supabase } from '../../lib/supabase';
import { DashboardStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/yana';
import { log } from '../../lib/logger';

type Props = NativeStackScreenProps<DashboardStackParamList, 'SchoolInfo'>;

const HERO_GREEN = '#15411D';

type SchoolView = {
  id: string;
  name: string;
  code?: string | null;
  username?: string | null;
  shortName?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  type?: string | null;
  schoolLevel?: string | number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operatingHours?: string | null;
  academicYear?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function asStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function asNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Nest returns nested contact + details; Supabase org is flatter. */
function normalizeSchool(raw: Record<string, unknown>, fallbackName?: string): SchoolView {
  const contact = (raw.contact && typeof raw.contact === 'object'
    ? (raw.contact as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const details = (raw.details && typeof raw.details === 'object'
    ? (raw.details as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  return {
    id: String(raw.id ?? ''),
    name: asStr(raw.name) || asStr(raw.short_name) || fallbackName || 'School',
    code: asStr(raw.code),
    username: asStr(raw.username),
    shortName: asStr(raw.short_name),
    description: asStr(raw.description),
    logoUrl: asStr(raw.logo_url),
    type: asStr(raw.type),
    schoolLevel: asStr(raw.school_level) ?? asNum(raw.school_level),
    address: asStr(contact.address) || asStr(raw.address) || asStr(raw.location),
    city: asStr(contact.city) || asStr(raw.city) || asStr(raw.county),
    state: asStr(contact.state) || asStr(raw.state),
    country: asStr(contact.country) || asStr(raw.country),
    postalCode: asStr(contact.postal_code),
    phone: asStr(contact.phone) || asStr(raw.phone) || asStr(raw.contact_phone),
    email: asStr(contact.email) || asStr(raw.email) || asStr(raw.contact_email),
    website: asStr(contact.website) || asStr(raw.website),
    operatingHours: asStr(details.operating_hours),
    academicYear: asStr(details.academic_year),
    latitude: asNum(details.latitude),
    longitude: asNum(details.longitude),
  };
}

/** Public campus site: username@tukua.ai → https://username.tukua.ai */
function resolveSchoolSite(username?: string | null, website?: string | null): string | null {
  const u = asStr(username);
  if (u) {
    const slug = u.includes('@') ? u.split('@')[0]! : u;
    if (slug) return `https://${slug.toLowerCase()}.tukua.ai`;
  }
  const w = asStr(website);
  if (!w) return null;
  return w.startsWith('http') ? w : `https://${w}`;
}

async function openExternal(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      log.warn('SchoolInfo', 'cannot open url', url);
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    log.warn('SchoolInfo', 'openURL failed', String(e));
  }
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={HERO_GREEN} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={Colors.white} />
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SchoolInfoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedSchoolId, selectedSchool, schools } = useDeskAuth();
  const schoolId = selectedSchoolId ?? selectedSchool?.id ?? schools[0]?.id ?? null;

  const [school, setSchool] = useState<SchoolView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) {
      setError('No school selected.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      try {
        const data = await deskFetch<Record<string, unknown>>(`/schools/${schoolId}`);
        setSchool(normalizeSchool(data ?? {}, selectedSchool?.name));
        return;
      } catch (deskErr) {
        log.warn('SchoolInfo', 'desk /schools/:id failed, trying supabase', String(deskErr));
      }

      const { data, error: sbErr } = await supabase
        .from('organizations')
        .select(
          'id, name, short_name, description, logo_url, website, county, contact_email, contact_phone, location',
        )
        .eq('id', schoolId)
        .maybeSingle();

      if (sbErr || !data) {
        throw new Error(sbErr?.message || 'School not found');
      }

      setSchool(
        normalizeSchool(
          {
            ...data,
            email: data.contact_email,
            phone: data.contact_phone,
            city: data.county,
            address: data.location,
          } as Record<string, unknown>,
          selectedSchool?.name,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSchool(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedSchool?.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const addressLine = useMemo(() => {
    if (!school) return null;
    return [school.address, school.city, school.state, school.country, school.postalCode]
      .filter(Boolean)
      .join(', ');
  }, [school]);

  const mapsUrl = useMemo(() => {
    if (!school) return null;
    if (school.latitude != null && school.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${school.latitude},${school.longitude}`;
    }
    if (addressLine) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`;
    }
    return null;
  }, [school, addressLine]);

  const directionsUrl = useMemo(() => {
    if (!school) return null;
    if (school.latitude != null && school.longitude != null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${school.latitude},${school.longitude}`;
    }
    if (addressLine) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLine)}`;
    }
    return null;
  }, [school, addressLine]);

  const phone = school?.phone || null;
  const email = school?.email || null;
  const siteUrl = resolveSchoolSite(school?.username, school?.website);
  const siteLabel = siteUrl ? siteUrl.replace(/^https?:\/\//, '') : null;

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
        showsVerticalScrollIndicator={false}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>School information</ModuleKicker>
        <ModuleScreenHeader title="About your school" description="Contact, location and school details." />

        {loading ? (
          <ActivityIndicator color={Colors.brandGreenMid} style={{ marginTop: 28 }} />
        ) : error ? (
          <ModuleEmpty title="Couldn’t load school" body={error} onRetry={() => void load()} />
        ) : school ? (
          <>
            <GlassPanel tone="frost" radius={20} style={styles.heroCard}>
              <View style={styles.heroInner}>
                <View style={styles.logoWrap}>
                  {school.logoUrl ? (
                    <Image source={{ uri: school.logoUrl }} style={styles.logo} />
                  ) : (
                    <Ionicons name="school" size={32} color={HERO_GREEN} />
                  )}
                </View>
                <Text style={styles.name}>{school.name}</Text>
                {school.code ? <Text style={styles.code}>Code · {school.code}</Text> : null}
                {school.description ? <Text style={styles.desc}>{school.description}</Text> : null}
              </View>
            </GlassPanel>

            <View style={styles.actionsRow}>
              <ActionBtn
                icon="call"
                label="Call"
                disabled={!phone}
                onPress={() => void openExternal(`tel:${phone}`)}
              />
              <ActionBtn
                icon="navigate"
                label="Map"
                disabled={!mapsUrl}
                onPress={() => mapsUrl && void openExternal(mapsUrl)}
              />
              <ActionBtn
                icon="compass"
                label="Directions"
                disabled={!directionsUrl}
                onPress={() => directionsUrl && void openExternal(directionsUrl)}
              />
              <ActionBtn
                icon="globe"
                label="Site"
                disabled={!siteUrl}
                onPress={() => siteUrl && void openExternal(siteUrl)}
              />
            </View>

            <GlassPanel tone="frost" radius={18} style={styles.card}>
              <View style={styles.cardPad}>
                <Text style={styles.section}>Contact</Text>
                <InfoRow icon="call-outline" label="School phone" value={phone} />
                <InfoRow icon="mail-outline" label="Email" value={email} />
                <InfoRow icon="globe-outline" label="School site" value={siteLabel} />
                <InfoRow icon="location-outline" label="Address" value={addressLine} />
                {school.latitude != null && school.longitude != null ? (
                  <InfoRow
                    icon="navigate-outline"
                    label="Coordinates"
                    value={`${school.latitude.toFixed(5)}, ${school.longitude.toFixed(5)}`}
                  />
                ) : null}
              </View>
            </GlassPanel>

            <GlassPanel tone="frost" radius={18} style={styles.card}>
              <View style={styles.cardPad}>
                <Text style={styles.section}>About</Text>
                <InfoRow
                  icon="business-outline"
                  label="Level / type"
                  value={asStr(school.schoolLevel) || school.type || null}
                />
                <InfoRow icon="time-outline" label="Operating hours" value={school.operatingHours} />
                <InfoRow icon="school-outline" label="Academic year" value={school.academicYear} />
              </View>
            </GlassPanel>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 12 },
  heroCard: { overflow: 'hidden' },
  heroInner: { padding: 18, alignItems: 'center' },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  logo: { width: 72, height: 72 },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    textAlign: 'center',
  },
  code: { marginTop: 4, fontSize: 13, color: Colors.mutedForeground, fontWeight: '600' },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: HERO_GREEN,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  card: { overflow: 'hidden' },
  cardPad: { paddingVertical: 8, paddingHorizontal: 4 },
  section: {
    marginTop: 4,
    marginBottom: 4,
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.mutedForeground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(21,65,29,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: HERO_GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: { marginTop: 3, fontSize: 15, color: Colors.ink, lineHeight: 21 },
});
