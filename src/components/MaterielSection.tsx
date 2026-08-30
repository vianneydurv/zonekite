import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

interface Field<T> {
  key: keyof T;
  placeholder: string;
  // Si fourni, le champ devient un menu déroulant plutôt qu'un texte libre.
  // Une fonction permet de dépendre d'un autre champ du même item (ex :
  // les modèles dépendent de la marque déjà choisie) : null = repasse en
  // texte libre (ex : marque "Autre"), tableau vide = pas encore de choix
  // possible (marque pas encore choisie).
  options?: string[] | ((item: T) => string[] | null);
}

interface Props<T> {
  title: string;
  addLabel: string;
  items: T[];
  fields: Field<T>[];
  emptyItem: T;
  onChange: (items: T[]) => void;
}

export default function MaterielSection<T extends Record<keyof T, string>>({
  title,
  addLabel,
  items,
  fields,
  emptyItem,
  onChange,
}: Props<T>) {
  const [picker, setPicker] = useState<{ index: number; key: keyof T; options: string[] } | null>(null);

  function updateItem(index: number, key: keyof T, value: string) {
    onChange(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [key]: value };
        // La marque a changé : le modèle précédent n'est plus valide.
        if (String(key) === 'marque' && 'modele' in next) {
          (next as Record<string, string>).modele = '';
        }
        return next;
      })
    );
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          {fields.map((field) => {
            if (!field.options) {
              return (
                <TextInput
                  key={String(field.key)}
                  style={[styles.input, styles.rowInput]}
                  value={item[field.key]}
                  onChangeText={(v) => updateItem(index, field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.neutral.textSecondary}
                />
              );
            }

            const resolvedOptions = typeof field.options === 'function' ? field.options(item) : field.options;

            if (resolvedOptions === null) {
              return (
                <TextInput
                  key={String(field.key)}
                  style={[styles.input, styles.rowInput]}
                  value={item[field.key]}
                  onChangeText={(v) => updateItem(index, field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.neutral.textSecondary}
                />
              );
            }

            const disabled = resolvedOptions.length === 0;

            return (
              <Pressable
                key={String(field.key)}
                style={[styles.input, styles.rowInput, styles.pickerField, disabled && styles.pickerFieldDisabled]}
                disabled={disabled}
                onPress={() => setPicker({ index, key: field.key, options: resolvedOptions })}
              >
                <Text
                  style={
                    item[field.key]
                      ? styles.pickerValue
                      : disabled
                        ? styles.pickerPlaceholderDisabled
                        : styles.pickerPlaceholder
                  }
                  numberOfLines={1}
                >
                  {item[field.key] || field.placeholder}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.neutral.textSecondary} />
              </Pressable>
            );
          })}
          <Pressable onPress={() => removeItem(index)} style={styles.remove}>
            <Ionicons name="close-circle" size={22} color={colors.neutral.textSecondary} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...items, emptyItem])}>
        <Text style={styles.addLink}>{addLabel}</Text>
      </Pressable>

      <Modal visible={picker !== null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}>
          <View style={styles.modalSheet}>
            <FlatList
              data={picker?.options ?? []}
              keyExtractor={(v) => v}
              renderItem={({ item: value }) => (
                <Pressable
                  style={styles.modalOption}
                  onPress={() => {
                    if (picker) updateItem(picker.index, picker.key, value);
                    setPicker(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>{value}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.caption,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    padding: 12,
    ...typography.body,
    color: colors.ocean[900],
  },
  rowInput: { flex: 1 },
  pickerField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerFieldDisabled: { opacity: 0.5 },
  pickerValue: { ...typography.body, color: colors.ocean[900], flexShrink: 1 },
  pickerPlaceholder: { ...typography.body, color: colors.neutral.textSecondary, flexShrink: 1 },
  pickerPlaceholderDisabled: { ...typography.body, color: colors.neutral.textSecondary, flexShrink: 1 },
  remove: { padding: 4 },
  addLink: { ...typography.body, color: colors.ocean[700], fontWeight: '600', marginTop: 4, marginBottom: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6, 46, 69, 0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.neutral.border },
  modalOptionText: { ...typography.body, color: colors.ocean[900], textAlign: 'center' },
});
