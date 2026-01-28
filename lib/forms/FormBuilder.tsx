/**
 * FormBuilder - Renders forms from declarative configuration
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { FormSectionConfig, FieldConfig } from './types';
import { InputField, DateField, ChipSelectorField, StatePickerField } from './fieldRenderers';

interface FormBuilderProps<T extends Record<string, any>> {
  sections: FormSectionConfig[];
  values: T;
  onFieldChange: (key: string, value: any) => void;
  onDatePress?: (key: string) => void;
  onStatePress?: (key: string) => void;
  formatDate?: (dateStr: string) => string;
}

export function FormBuilder<T extends Record<string, any>>({
  sections,
  values,
  onFieldChange,
  onDatePress,
  onStatePress,
  formatDate,
}: FormBuilderProps<T>) {
  const formatDateValue = (dateStr: string): string => {
    if (formatDate) return formatDate(dateStr);
    if (!dateStr) return 'Select date';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderField = (field: FieldConfig, value: string) => {
    switch (field.type) {
      case 'input':
      case 'multiline':
        return (
          <InputField
            field={field}
            value={value}
            onChangeText={(text) => onFieldChange(field.key, text)}
          />
        );

      case 'date':
        return (
          <DateField
            field={field}
            value={value}
            formattedDate={formatDateValue(value)}
            onPress={() => onDatePress?.(field.key)}
          />
        );

      case 'chip-selector':
        return (
          <ChipSelectorField
            field={field}
            value={value}
            onChange={(v) => onFieldChange(field.key, v)}
          />
        );

      case 'state-picker':
        return (
          <StatePickerField
            field={field}
            value={value}
            onPress={() => onStatePress?.(field.key)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View className="p-6">
      {sections.map((section, sectionIndex) => {
        // Check section condition
        if (section.condition && !section.condition(values)) {
          return null;
        }

        const visibleFields = section.fields.filter((field) => {
          if (field.condition && !field.condition(values)) {
            return false;
          }
          return true;
        });

        if (visibleFields.length === 0) {
          return null;
        }

        return (
          <View key={section.title || sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {section.title && (
              <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
                {section.title}
              </Text>
            )}

            {section.layout === 'row' ? (
              <View className="flex-row gap-4 mb-4">
                {visibleFields.map((field, index) => {
                  const value = values[field.key] || '';
                  const flexStyle = index === 0 && visibleFields.length === 3 
                    ? { flex: 2 } 
                    : { flex: 1 };

                  return (
                    <View key={field.key} style={flexStyle}>
                      {renderField(field, value)}
                    </View>
                  );
                })}
              </View>
            ) : (
              visibleFields.map((field) => {
                const value = values[field.key] || '';
                return <React.Fragment key={field.key}>{renderField(field, value)}</React.Fragment>;
              })
            )}
          </View>
        );
      })}
    </View>
  );
}
