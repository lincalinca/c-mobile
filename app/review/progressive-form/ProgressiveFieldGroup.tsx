import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../components/FormFields';
import type { FieldDefinition } from './FieldRegistry';

interface Props<T> {
  config: FieldDefinition<T>[];
  data: T;
  onUpdate: (updates: Partial<T>) => void;
  renderCustomField?: (key: string) => React.ReactNode;
}

export function ProgressiveFieldGroup<T>({ config, data, onUpdate, renderCustomField }: Props<T>) {
  const [activeFields, setActiveFields] = useState<Set<string>>(new Set());

  // Initialize active fields based on data presence and rules
  useEffect(() => {
    const newActive = new Set(activeFields);
    let changed = false;

    config.forEach(field => {
      const key = field.key as string;
      const val = (data as any)[key];
      const hasValue = val !== undefined && val !== null && val !== '';
      
      const shouldBeVisible = 
        field.isEssential || 
        hasValue || 
        (field.requiredIf && field.requiredIf(data));

      if (shouldBeVisible && !newActive.has(key)) {
        newActive.add(key);
        changed = true;
      }
    });

    if (changed) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveFields(newActive);
    }
  }, [data, config]); // Re-run when data changes to handle conditional requirements

  const handleAddField = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFields(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
    });
  };

  const visibleFields = config.filter(f => activeFields.has(f.key as string));
  const hiddenFields = config.filter(f => !activeFields.has(f.key as string));

  return (
    <View>
      {visibleFields.map((field) => (
        <View key={field.key as string}>
          {renderCustomField && renderCustomField(field.key as string) ? (
             renderCustomField(field.key as string)
          ) : (
            <TextField
              label={field.label}
              value={(data as any)[field.key] || ''}
              onChangeText={(text) => onUpdate({ [field.key]: text } as any)}
              placeholder={field.placeholder}
              inputType={field.inputType}
            />
          )}
        </View>
      ))}

      {hiddenFields.length > 0 && (
        <View className="mt-2">
            <Text className="text-xs text-crescender-500 font-semibold mb-2 uppercase tracking-wide">Add Details</Text>
            <View className="flex-row flex-wrap gap-2">
                {hiddenFields.map((field) => (
                    <TouchableOpacity
                    key={field.key as string}
                    onPress={() => handleAddField(field.key as string)}
                    className="bg-crescender-800 border border-crescender-700 px-3 py-1.5 rounded-full flex-row items-center gap-1"
                    >
                    <Feather name="plus" size={12} color="#9ca3af" />
                    <Text className="text-crescender-300 text-xs font-medium">{field.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
      )}
    </View>
  );
}
