import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Feather>['name'];

export interface DetailFieldConfig<T> {
  label: string;
  key: keyof T | string;
  getValue?: (data: T) => string | null | undefined;
  format?: (value: string) => string;
  numberOfLines?: number;
  onPress?: (data: T) => void;
  icon?: IconName;
  iconColor?: string;
  condition?: (data: T) => boolean;
}

interface DetailFieldProps {
  label: string;
  value: string;
  numberOfLines?: number;
  onPress?: () => void;
  icon?: IconName;
  iconColor?: string;
}

function DetailField({ label, value, numberOfLines = 1, onPress, icon, iconColor }: DetailFieldProps) {
  const content = (
    <>
      <Text className="text-crescender-400 text-sm mb-1">{label}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-base flex-1" numberOfLines={numberOfLines}>
          {value}
        </Text>
        {icon && <Feather name={icon} size={16} color={iconColor || '#9ca3af'} />}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} className="mb-3 bg-crescender-800/50 p-2 rounded-lg border border-crescender-700">
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="mb-3">{content}</View>;
}

interface DetailFieldsSectionProps<T> {
  data: T;
  fields: DetailFieldConfig<T>[];
  accentColor?: string;
  sectionTitle?: string;
}

export function DetailFieldsSection<T>({ data, fields, accentColor, sectionTitle }: DetailFieldsSectionProps<T>) {
  const visibleFields = fields.filter(field => {
    // Check custom condition first
    if (field.condition && !field.condition(data)) return false;

    // Get the value
    const value = field.getValue
      ? field.getValue(data)
      : (data as any)[field.key];

    return value !== null && value !== undefined && value !== '';
  });

  if (visibleFields.length === 0) return null;

  return (
    <View className="p-6 border-b border-crescender-800">
      {sectionTitle && (
        <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: accentColor }}>
          {sectionTitle}
        </Text>
      )}
      {visibleFields.map((field) => {
        const rawValue = field.getValue
          ? field.getValue(data)
          : (data as any)[field.key];

        const value = field.format ? field.format(rawValue) : String(rawValue);

        return (
          <DetailField
            key={String(field.key)}
            label={field.label}
            value={value}
            numberOfLines={field.numberOfLines}
            onPress={field.onPress ? () => field.onPress!(data) : undefined}
            icon={field.icon}
            iconColor={field.iconColor}
          />
        );
      })}
    </View>
  );
}
