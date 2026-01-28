import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type RelationshipType = 'self' | 'child' | 'student' | 'spouse' | 'sibling' | 'parent' | 'other';

export const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'self', label: 'Self' },
  { value: 'child', label: 'My Child' },
  { value: 'student', label: 'My Student' },
  { value: 'spouse', label: 'My Spouse' },
  { value: 'sibling', label: 'My Sibling' },
  { value: 'parent', label: 'My Parent' },
  { value: 'other', label: 'Other' },
];

interface RelationshipSelectorProps {
  value: RelationshipType | null | undefined;
  onSelect: (relationship: RelationshipType) => void;
  accentColor?: string;
}

export function RelationshipSelector({ value, onSelect, accentColor = '#c084fc' }: RelationshipSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {RELATIONSHIP_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`px-4 py-2 rounded-full border ${
              isSelected
                ? 'bg-gold border-gold'
                : 'bg-crescender-900/40 border-crescender-800'
            }`}
          >
            <Text
              className={`font-medium text-sm ${
                isSelected ? 'text-black' : 'text-white'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
