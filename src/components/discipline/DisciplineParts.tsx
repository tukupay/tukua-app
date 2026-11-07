/**
 * Small pieces shared by the discipline screens: the case row, a plain-text report view for the AI
 * write-ups (markdown without a markdown library), and themed form fields that stay above the keyboard
 * inside a KeyboardAwareScroll.
 */
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/AppThemeContext';
import { useKeyboardReveal } from '../auth/KeyboardAwareScroll';
import { INK } from '../theme/ThemedPage';
import { rgba } from '../../theme/color';
import { MUTED_INK, StatusPill, SurfaceCard, fmtDay } from '../ui/ModuleKit';
import {
  cap,
  incidentTitle,
  incidentWhen,
  isCommendation,
  severityTone,
  statusTone,
  studentName,
  type DisciplineIncident,
} from '../../lib/disciplineApi';

export function IncidentRow({
  item,
  onPress,
  showStudents = true,
}: {
  item: DisciplineIncident;
  onPress: () => void;
  showStudents?: boolean;
}) {
  const positive = isCommendation(item);
  const when = incidentWhen(item);
  const students = Array.isArray(item.students) ? item.students : [];
  const who = showStudents && students.length
    ? students.map(studentName).slice(0, 2).join(', ') + (students.length > 2 ? ` +${students.length - 2}` : '')
    : null;
  return (
    <SurfaceCard onPress={onPress} accessibilityLabel={`Open case ${item.case_number ?? ''}`}>
      <View style={styles.rowTop}>
        <View style={[styles.iconWrap, { backgroundColor: positive ? 'rgba(6,118,71,0.10)' : 'rgba(180,35,24,0.08)' }]}>
          <Ionicons name={positive ? 'ribbon-outline' : 'shield-outline'} size={18} color={positive ? '#067647' : '#B42318'} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {incidentTitle(item)}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[when ? fmtDay(when) : null, item.category_label || item.category_name, item.case_number]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {who ? (
            <Text style={styles.meta} numberOfLines={1}>
              {who}
            </Text>
          ) : null}
          <View style={styles.pills}>
            {positive ? <StatusPill label="Commendation" tone="success" icon="ribbon-outline" /> : null}
            {!positive && item.severity ? <StatusPill label={cap(item.severity)} tone={severityTone(item.severity)} /> : null}
            {item.status ? <StatusPill label={cap(item.status)} tone={statusTone(item.status)} /> : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={MUTED_INK} />
      </View>
    </SurfaceCard>
  );
}

/** AI write-ups come as markdown: show headings, bullets and paragraphs as plain styled text. */
export function ReportText({ text }: { text: string }) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n');
  return (
    <View style={styles.report}>
      {lines.map((raw, i) => {
        const line = raw.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/`/g, '');
        const t = line.trim();
        if (!t || /^[-*_]{3,}$/.test(t)) return <View key={i} style={{ height: 6 }} />;
        const h = /^(#{1,6})\s+(.*)$/.exec(t);
        if (h) {
          return (
            <Text key={i} style={[styles.reportHeading, h[1].length <= 2 && { fontSize: 15 }]}>
              {h[2]}
            </Text>
          );
        }
        const b = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(t);
        if (b) {
          return (
            <Text key={i} style={styles.reportLine}>
              {'•  '}
              {b[1]}
            </Text>
          );
        }
        if (t.startsWith('|')) {
          if (/^\|[\s:|-]+\|?$/.test(t)) return null;
          return (
            <Text key={i} style={styles.reportLine}>
              {t.split('|').map((c) => c.trim()).filter(Boolean).join('  ·  ')}
            </Text>
          );
        }
        return (
          <Text key={i} style={styles.reportLine}>
            {t.replace(/^>\s?/, '')}
          </Text>
        );
      })}
    </View>
  );
}

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {required ? <Text style={{ color: '#B42318' }}> *</Text> : null}
    </Text>
  );
}

/** Themed text field that asks the surrounding KeyboardAwareScroll to keep it above the keyboard. */
export function FormInput({ error, style, onFocus, onBlur, ...rest }: TextInputProps & { error?: string | null }) {
  const { palette } = useAppTheme();
  const reveal = useKeyboardReveal();
  const wrap = useRef<View>(null);
  return (
    <View ref={wrap} collapsable={false}>
      <TextInput
        placeholderTextColor={MUTED_INK}
        {...rest}
        onFocus={(e) => {
          reveal?.focused(wrap.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          reveal?.blurred(wrap.current);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { borderColor: error ? '#B42318' : rgba(palette.primary, 0.16) },
          rest.multiline && styles.multiline,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Pill buttons for picking one of a few values (severity, status). */
export function OptionPills<K extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly K[];
  value: K | '' | null | undefined;
  onChange: (k: K) => void;
  labels?: Partial<Record<K, string>>;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.optionWrap}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [
              styles.option,
              on
                ? { backgroundColor: palette.primary, borderColor: palette.primary }
                : { backgroundColor: '#FFFFFF', borderColor: rgba(palette.primary, 0.16) },
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={[styles.optionText, { color: on ? '#FFFFFF' : palette.primary }]}>{labels?.[o] ?? cap(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  busy,
  tone = 'primary',
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'primary' | 'outline' | 'danger';
}) {
  const { palette } = useAppTheme();
  const bg = tone === 'primary' ? palette.primary : tone === 'danger' ? 'rgba(180,35,24,0.08)' : '#FFFFFF';
  const fg = tone === 'primary' ? '#FFFFFF' : tone === 'danger' ? '#B42318' : palette.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: tone === 'outline' ? rgba(palette.primary, 0.2) : 'transparent' },
        (disabled || busy) && { opacity: 0.6 },
        pressed && { opacity: 0.85 },
      ]}>
      {icon ? <Ionicons name={busy ? 'hourglass-outline' : icon} size={17} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{busy ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: INK },
  meta: { marginTop: 3, fontSize: 12, color: MUTED_INK },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  report: { gap: 3 },
  reportHeading: { marginTop: 8, fontSize: 14, fontWeight: '800', color: INK },
  reportLine: { fontSize: 13.5, lineHeight: 20, color: INK },
  label: { marginTop: 14, marginBottom: 6, fontSize: 12, fontWeight: '800', color: MUTED_INK, letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: INK,
    backgroundColor: '#FFFFFF',
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  error: { marginTop: 4, fontSize: 12, color: '#B42318', fontWeight: '600' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  optionText: { fontSize: 13, fontWeight: '700' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  btnText: { fontWeight: '800', fontSize: 14.5 },
});
