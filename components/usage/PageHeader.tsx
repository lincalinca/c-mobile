import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <View className="mb-6">
      <Text className="text-gold font-bold mb-2 uppercase tracking-widest text-sm">
        <Feather name={icon} size={12} color="#f5c518" /> {subtitle}
      </Text>
      <Text className="text-white text-2xl font-bold">{title}</Text>
    </View>
  );
};
