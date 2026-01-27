import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ActionCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  buttonText: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  isSecondary?: boolean;
  buttonIcon?: keyof typeof Feather.glyphMap;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  buttonText,
  onPress,
  isLoading,
  isDisabled,
  isSecondary,
  buttonIcon,
}) => {
  return (
    <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
      <View className="flex-row items-center mb-3">
        <Feather name={icon} size={20} color="#f5c518" />
        <Text className="text-white text-lg font-bold ml-2">{title}</Text>
      </View>
      <Text className="text-crescender-300 text-sm mb-4">
        {description}
      </Text>
      
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        className={`py-3 px-4 rounded-xl border-2 items-center ${
          isSecondary 
            ? 'bg-gold/10 border-gold/40' 
            : isDisabled 
              ? 'bg-crescender-800/60 border-crescender-700' 
              : 'bg-gold border-gold'
        }`}
      >
        {isLoading ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#f5c518" />
            <Text className="text-crescender-400 font-semibold">Loading...</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            {buttonIcon && (
              <Feather 
                name={buttonIcon} 
                size={16} 
                color={isSecondary ? "#f5c518" : "#2e1065"} 
              />
            )}
            <Text className={`font-bold ${isSecondary ? "text-gold" : "text-crescender-950"}`}>
              {buttonText}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
