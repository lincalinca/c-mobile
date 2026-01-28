import React from 'react';
import { View, Text, TextInput } from 'react-native';
import type { EducationItemEditState } from './useEducationItemEdit';

interface FieldConfig {
  label: string;
  key: keyof EducationItemEditState;
  placeholder?: string;
  isTitle?: boolean;
}

interface EducationItemEditFormProps {
  editState: EducationItemEditState;
  onUpdateField: <K extends keyof EducationItemEditState>(field: K, value: string) => void;
}

const FORM_FIELDS: FieldConfig[] = [
  { label: 'Title', key: 'title', isTitle: true },
  { label: 'Subtitle (e.g. provider)', key: 'subtitle' },
  { label: 'Student', key: 'studentName', placeholder: 'Student name' },
  { label: 'Focus', key: 'focus', placeholder: 'Violin, Piano, Vocals, Theory, Etc' },
];

function InputField({
  label,
  value,
  placeholder,
  isTitle,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder?: string;
  isTitle?: boolean;
  onChangeText: (text: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-crescender-400 text-xs mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className={`bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600 ${
          isTitle ? 'text-white text-xl font-bold' : 'text-white text-base'
        }`}
      />
    </View>
  );
}

export function EducationItemEditForm({ editState, onUpdateField }: EducationItemEditFormProps) {
  return (
    <View className="p-6 border-b border-crescender-800">
      {FORM_FIELDS.map((field) => (
        <InputField
          key={field.key}
          label={field.label}
          value={editState[field.key]}
          placeholder={field.placeholder}
          isTitle={field.isTitle}
          onChangeText={(text) => onUpdateField(field.key, text)}
        />
      ))}
    </View>
  );
}
