import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Feather>['name'];

interface DetailRowProps {
  label: string;
  value: string;
  numberOfLines?: number;
  onPress?: () => void;
  icon?: IconName;
  iconColor?: string;
  isLast?: boolean;
}

export function DetailRow({
  label,
  value,
  numberOfLines = 1,
  onPress,
  icon,
  iconColor = '#9ca3af',
  isLast = false
}: DetailRowProps) {
  if (onPress) {
    return (
      <View className={isLast ? '' : 'mb-3'}>
        <Text className="text-crescender-400 text-sm mb-1">{label}</Text>
        <TouchableOpacity
          onPress={onPress}
          className="flex-row items-center justify-between bg-crescender-800/50 p-2 rounded-lg border border-crescender-700"
        >
          <Text className="text-white text-base flex-1" numberOfLines={numberOfLines}>
            {value}
          </Text>
          {icon && <Feather name={icon} size={16} color={iconColor} />}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={isLast ? '' : 'mb-3'}>
      <Text className="text-crescender-400 text-sm mb-1">{label}</Text>
      <Text className="text-white text-base" numberOfLines={numberOfLines}>
        {value}
      </Text>
    </View>
  );
}
