/**
 * Save Footer Component
 * Shows save buttons - single or dual depending on whether there are education/event items
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReviewSaveFooterProps {
  hasEducationOrEvents: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSaveWithCalendar: () => void;
}

export function ReviewSaveFooter({
  hasEducationOrEvents,
  isSaving,
  onSave,
  onSaveWithCalendar,
}: ReviewSaveFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-6 py-4 bg-crescender-950 border-t border-crescender-800"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {hasEducationOrEvents ? (
        // Dual buttons for education/event items
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onSave}
            disabled={isSaving}
            className="flex-1 bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
          >
            {isSaving ? (
              <ActivityIndicator color="#2e1065" />
            ) : (
              <>
                <Feather name="check" size={20} color="#2e1065" />
                <Text className="text-crescender-950 font-bold text-lg">SAVE + VIEW</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSaveWithCalendar}
            disabled={isSaving}
            className="flex-1 bg-crescender-700 h-14 rounded-xl flex-row items-center justify-center gap-3 border border-crescender-600"
          >
            <Feather name="calendar" size={20} color="#f5c518" />
            <Text className="text-gold font-bold text-lg">+ CALENDAR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Single button for regular transactions
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          className="bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
        >
          {isSaving ? (
            <ActivityIndicator color="#2e1065" />
          ) : (
            <>
              <Feather name="check" size={24} color="#2e1065" />
              <Text className="text-crescender-950 font-bold text-xl">SAVE TRANSACTION</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
