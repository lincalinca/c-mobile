/**
 * Reusable field renderers for declarative forms
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { FieldConfig } from './types';

function getKeyboardType(inputType?: string): 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address' | 'url' {
  switch (inputType) {
    case 'numeric': return 'numeric';
    case 'decimal-pad': return 'decimal-pad';
    case 'phone': return 'phone-pad';
    case 'email': return 'email-address';
    case 'url': return 'url';
    default: return 'default';
  }
}

export function InputField({
  field,
  value,
  onChangeText,
}: {
  field: Extract<FieldConfig, { type: 'input' | 'multiline' }>;
  value: string;
  onChangeText: (text: string) => void;
}) {
  const isMultiline = field.type === 'multiline';
  const keyboardType = getKeyboardType(field.inputType);
  const autoCapitalize = field.inputType === 'url' || field.inputType === 'email' ? 'none' : 'sentences';

  // Special handling for Total field
  if (field.key === 'total' && field.isLarge) {
    return (
      <View className="mb-6">
        <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
        <TextInput
          className="text-white text-lg font-bold border-b border-crescender-700 py-1"
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          placeholderTextColor="#666"
          keyboardType={keyboardType}
        />
      </View>
    );
  }

  // Special handling for Education form fields (different styling)
  // Check if this is part of education form by checking if other education fields exist
  // For now, we'll use a simpler approach - check field key patterns
  const isEducationForm = field.key === 'title' || field.key === 'subtitle' || field.key === 'studentName' || field.key === 'focus';
  
  if (isEducationForm) {
    const isTitle = field.key === 'title';
    return (
      <View className="mb-3">
        <Text className={`${isTitle ? 'text-crescender-400 text-xs' : 'text-crescender-400 text-xs'} mb-1`}>{field.label}</Text>
        <TextInput
          className={`bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600 text-white ${
            isTitle ? 'text-xl font-bold' : 'text-base'
          }`}
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          placeholderTextColor="#9ca3af"
        />
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
      <TextInput
        className={`text-white border-b border-crescender-700 py-1 ${field.isLarge ? 'text-lg font-semibold' : 'text-base'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={field.placeholder}
        placeholderTextColor="#666"
        multiline={isMultiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={field.maxLength}
      />
    </View>
  );
}

export function DateField({
  field,
  value,
  formattedDate,
  onPress,
}: {
  field: Extract<FieldConfig, { type: 'date' }>;
  value: string;
  formattedDate: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between border-b border-crescender-700 py-1"
      >
        <Text className={`text-lg ${value ? 'text-white' : 'text-crescender-500'}`}>
          {formattedDate}
        </Text>
        <Feather name="calendar" size={20} color="#f5c518" />
      </TouchableOpacity>
    </View>
  );
}

export function ChipSelectorField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldConfig, { type: 'chip-selector' }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-2">{field.label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {field.options.map((option) => {
            const isSelected = value === option.value;
            const bgClass = field.getColor
              ? field.getColor(option, isSelected)
              : isSelected
              ? 'bg-gold border-gold'
              : 'bg-crescender-900/60 border-crescender-700';

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => onChange(option.value)}
                className={`px-3 py-1.5 rounded-full border ${bgClass}`}
              >
                <Text
                  className={`text-sm font-bold ${
                    isSelected ? 'text-crescender-950' : 'text-crescender-400'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function StatePickerField({
  field,
  value,
  onPress,
}: {
  field: Extract<FieldConfig, { type: 'state-picker' }>;
  value: string;
  onPress: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="border-b border-crescender-700 py-1 h-[34px] justify-center"
      >
        <View className="flex-row items-center justify-between">
          <Text className={`text-base ${value ? 'text-white' : 'text-crescender-500'}`}>
            {value || 'NSW...'}
          </Text>
          <Feather name="chevron-down" size={14} color="#f5c518" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
