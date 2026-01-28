import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { GearItemEditState } from './useGearItemEdit';

type InputType = 'text' | 'url' | 'email' | 'phone';
type FieldType = 'input' | 'multiline' | 'buttonGroup';

interface BaseFieldConfig {
  label: string;
  key: keyof GearItemEditState;
}

interface InputFieldConfig extends BaseFieldConfig {
  type: 'input' | 'multiline';
  inputType?: InputType;
  placeholder?: string;
}

interface ButtonGroupFieldConfig extends BaseFieldConfig {
  type: 'buttonGroup';
  options: readonly string[];
}

type FieldConfig = InputFieldConfig | ButtonGroupFieldConfig;

interface SectionConfig {
  title: string;
  fields: FieldConfig[];
}

interface GearItemEditFormProps {
  editState: GearItemEditState;
  onUpdateField: <K extends keyof GearItemEditState>(field: K, value: GearItemEditState[K]) => void;
}

const FORM_SECTIONS: SectionConfig[] = [
  {
    title: 'Basic Info',
    fields: [
      { label: 'Description', key: 'description', type: 'input' },
      { label: 'Brand', key: 'brand', type: 'input' },
      { label: 'Model', key: 'model', type: 'input' },
      { label: 'Serial Number', key: 'serialNumber', type: 'input' },
    ],
  },
  {
    title: 'Detailed Specs',
    fields: [
      { label: 'Manufacturer', key: 'manufacturer', type: 'input' },
      { label: 'Model Name', key: 'modelName', type: 'input' },
      { label: 'Model Number', key: 'modelNumber', type: 'input' },
      { label: 'Colour', key: 'colour', type: 'input' },
      { label: 'Size', key: 'size', type: 'input' },
      { 
        label: 'Condition', 
        key: 'condition', 
        type: 'buttonGroup', 
        options: ['Excellent', 'Good', 'Fair', 'Poor'] as const 
      },
      { 
        label: 'Tier', 
        key: 'tier', 
        type: 'buttonGroup', 
        options: ['Entry-level', 'Student', 'Professional', 'Concert'] as const 
      },
      { label: 'Unique Details', key: 'uniqueDetail', type: 'multiline' },
      { label: 'Noted Damage', key: 'notedDamage', type: 'multiline' },
    ],
  },
  {
    title: 'Resources & Warranty',
    fields: [
      { label: 'Official URL', key: 'officialUrl', type: 'input', inputType: 'url' },
      { label: 'Official Manual URL', key: 'officialManual', type: 'input', inputType: 'url' },
      { label: 'Warranty Phone', key: 'warrantyPhone', type: 'input', inputType: 'phone' },
      { label: 'Warranty Email', key: 'warrantyEmail', type: 'input', inputType: 'email' },
      { label: 'Warranty Website', key: 'warrantyWebsite', type: 'input', inputType: 'url' },
    ],
  },
];

function getKeyboardType(inputType?: InputType) {
  switch (inputType) {
    case 'url': return 'url';
    case 'email': return 'email-address';
    case 'phone': return 'phone-pad';
    default: return 'default';
  }
}

function InputField({ 
  field, 
  value, 
  onChangeText 
}: { 
  field: InputFieldConfig; 
  value: string; 
  onChangeText: (text: string) => void;
}) {
  const isMultiline = field.type === 'multiline';
  const keyboardType = getKeyboardType(field.inputType);
  const autoCapitalize = field.inputType === 'url' || field.inputType === 'email' ? 'none' : 'sentences';

  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
      <TextInput
        className={`text-white border-b border-crescender-700 py-1 ${isMultiline ? 'text-base' : field.key === 'description' ? 'text-lg font-semibold' : 'text-base'}`}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#666"
        multiline={isMultiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function ButtonGroupField({ 
  field, 
  value, 
  onSelect 
}: { 
  field: ButtonGroupFieldConfig; 
  value: string; 
  onSelect: (option: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-2">{field.label}</Text>
      <View className="flex-row gap-2 flex-wrap">
        {field.options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`px-3 py-1.5 rounded-full border ${
              value === option 
                ? 'bg-gold border-gold' 
                : 'bg-crescender-900 border-crescender-700'
            }`}
          >
            <Text className={`text-sm font-bold ${
              value === option 
                ? 'text-crescender-950' 
                : 'text-crescender-400'
            }`}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function GearItemEditForm({ editState, onUpdateField }: GearItemEditFormProps) {
  return (
    <View>
      {FORM_SECTIONS.map((section, sectionIndex) => (
        <View key={section.title} className={sectionIndex > 0 ? 'mt-2' : ''}>
          <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-xs">
            {section.title}
          </Text>
          
          {section.fields.map((field) => {
            const value = editState[field.key] as string;
            
            if (field.type === 'buttonGroup') {
              return (
                <ButtonGroupField
                  key={field.key}
                  field={field}
                  value={value}
                  onSelect={(option) => onUpdateField(field.key, option as any)}
                />
              );
            }
            
            return (
              <InputField
                key={field.key}
                field={field}
                value={value}
                onChangeText={(text) => onUpdateField(field.key, text as any)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
