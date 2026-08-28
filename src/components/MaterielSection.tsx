import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

interface Field<T> {
  key: keyof T;
  placeholder: string;
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
  function updateItem(index: number, key: keyof T, value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          {fields.map((field) => (
            <TextInput
              key={String(field.key)}
              style={[styles.input, styles.rowInput]}
              value={item[field.key]}
              onChangeText={(v) => updateItem(index, field.key, v)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.neutral.textSecondary}
            />
          ))}
          <Pressable onPress={() => removeItem(index)} style={styles.remove}>
            <Ionicons name="close-circle" size={22} color={colors.neutral.textSecondary} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...items, emptyItem])}>
        <Text style={styles.addLink}>{addLabel}</Text>
      </Pressable>
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
  remove: { padding: 4 },
  addLink: { ...typography.body, color: colors.ocean[700], fontWeight: '600', marginTop: 4, marginBottom: 8 },
});
