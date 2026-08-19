import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/yana';
import { useAuthScale } from './useAuthScale';

export type AuthSelectOption = {
  id: string;
  label: string;
  description?: string | null;
};

type Props = {
  value: string | null;
  onChange: (id: string) => void;
  options: AuthSelectOption[];
  placeholder?: string;
  title?: string;
  searchable?: boolean;
  loading?: boolean;
  emptyText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onOpen?: () => void;
};

/** Bottom-sheet searchable select — used for county, org type, schools. */
export function AuthSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  title = 'Select',
  searchable = true,
  loading = false,
  emptyText = 'Nothing to show yet',
  icon = 'list-outline',
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { s, font } = useAuthScale();

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }, [options, query]);

  const openSheet = () => {
    onOpen?.();
    setOpen(true);
  };

  return (
    <>
      <View
        style={[
          styles.triggerOuter,
          { borderWidth: Math.max(1.5, s(2)), borderRadius: s(12) },
        ]}>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            minHeight: s(52),
            borderWidth: Math.max(1, s(1)),
            borderRadius: s(10),
            paddingHorizontal: s(12),
            paddingVertical: s(10),
            gap: s(10),
          },
        ]}
        onPress={openSheet}
        activeOpacity={0.85}>
        <View style={[styles.iconBubble, { width: s(32), height: s(32), borderRadius: s(10) }]}>
          <Ionicons name={icon} size={s(16)} color={Colors.brandGreenDark} />
        </View>
        <View style={styles.triggerMeta}>
          <Text
            style={[styles.triggerText, { fontSize: font(14) }, !selected && styles.placeholder]}
            numberOfLines={1}>
            {selected?.label || placeholder}
          </Text>
          {selected?.description ? (
            <Text style={[styles.triggerHint, { fontSize: font(11) }]} numberOfLines={1}>
              {selected.description}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={s(18)} color={Colors.mutedForeground} />
      </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{title}</Text>
            {searchable ? (
              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={Colors.mutedForeground} />
                <TextInput
                  style={styles.search}
                  placeholder="Type to search…"
                  placeholderTextColor={Colors.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {loading ? (
              <ActivityIndicator color={Colors.brandGreen} style={{ marginVertical: 28 }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                ListEmptyComponent={
                  <Text style={styles.empty}>{emptyText}</Text>
                }
                renderItem={({ item }) => {
                  const on = item.id === value;
                  return (
                    <TouchableOpacity
                      style={[styles.row, on && styles.rowOn]}
                      onPress={() => {
                        onChange(item.id);
                        setOpen(false);
                        setQuery('');
                      }}
                      activeOpacity={0.85}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowLabel, on && styles.rowLabelOn]}>{item.label}</Text>
                        {item.description ? (
                          <Text style={styles.rowDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      {on ? (
                        <Ionicons name="checkmark-circle" size={22} color={Colors.brandGreen} />
                      ) : (
                        <View style={styles.radio} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerOuter: {
    width: '100%',
    borderColor: '#ffffff',
    backgroundColor: Colors.white,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  iconBubble: {
    backgroundColor: 'rgba(10,61,46,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerMeta: { flex: 1 },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.foreground,
  },
  triggerHint: {
    marginTop: 1,
    fontSize: 11,
    color: Colors.mutedForeground,
    fontFamily: 'Poppins_400Regular',
  },
  placeholder: { color: Colors.mutedForeground, fontFamily: 'Poppins_400Regular' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,20,15,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '78%',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: Colors.brandGreenDark,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: Colors.background,
  },
  search: { flex: 1, fontSize: 14, color: Colors.foreground, fontFamily: 'Poppins_400Regular' },
  list: { maxHeight: 420 },
  empty: {
    textAlign: 'center',
    color: Colors.mutedForeground,
    paddingVertical: 28,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  rowOn: { backgroundColor: 'rgba(10,61,46,0.08)' },
  rowLabel: {
    fontSize: 15,
    color: Colors.foreground,
    fontFamily: 'Poppins_600SemiBold',
  },
  rowLabelOn: { color: Colors.brandGreenDark },
  rowDesc: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.mutedForeground,
    fontFamily: 'Poppins_400Regular',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
});
