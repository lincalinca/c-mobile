import React from 'react';
import { View, Text } from 'react-native';
import type { GearDetails } from '@lib/repository';
import { AutoSizingText } from '@components/common/AutoSizingText';

interface FieldConfig {
  label: string;
  key: keyof GearDetails | 'serialNumber';
  format?: 'mono' | 'default';
}

interface DetailFieldProps {
  label: string;
  value: string;
  format?: 'mono' | 'default';
}

function DetailField({ label, value, format = 'default' }: DetailFieldProps) {
  // Serial numbers should never wrap
  const isSingleLine = format === 'mono';
  
  return (
    <View className="mb-3">
      <Text className="text-crescender-400 text-xs mb-1">{label}</Text>
      {isSingleLine ? (
        <AutoSizingText
          value={value}
          baseFontSize={16}
          minFontSize={10}
          className={`text-white ${format === 'mono' ? 'font-mono' : ''}`}
        />
      ) : (
        <Text className={`text-white text-base ${format === 'mono' ? 'font-mono' : ''}`}>
          {value}
        </Text>
      )}
    </View>
  );
}

interface GearItemSpecsViewProps {
  gearDetails: GearDetails;
  serialNumber?: string | null;
}

const SPEC_FIELDS: FieldConfig[] = [
  { label: 'Manufacturer', key: 'manufacturer' },
  { label: 'Model Name', key: 'modelName' },
  { label: 'Model Number', key: 'modelNumber' },
  { label: 'Serial Number', key: 'serialNumber', format: 'mono' },
  { label: 'Colour', key: 'colour' },
  { label: 'Size', key: 'size' },
  { label: 'Condition', key: 'condition' },
  { label: 'Tier', key: 'tier' },
  { label: 'Unique Details', key: 'uniqueDetail' },
  { label: 'Noted Damage', key: 'notedDamage' },
];

export function GearItemSpecsView({ gearDetails, serialNumber }: GearItemSpecsViewProps) {
  const data = { ...gearDetails, serialNumber };
  
  const visibleFields = SPEC_FIELDS.filter(field => {
    const value = data[field.key];
    return value && value !== '';
  });

  if (visibleFields.length === 0) return null;

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">
        Specifications
      </Text>
      <View className="bg-crescender-900/40 p-4 rounded-xl">
        {visibleFields.map((field) => (
          <DetailField
            key={field.key}
            label={field.label}
            value={data[field.key] as string}
            format={field.format}
          />
        ))}
      </View>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
