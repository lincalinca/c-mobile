import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionFooterActionsProps {
  hasImage: boolean;
  onReplaceImage: () => void;
  onReprocess: () => void;
  onDelete: () => void;
}

export function TransactionFooterActions({
  hasImage,
  onReplaceImage,
  onReprocess,
  onDelete,
}: TransactionFooterActionsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-crescender-950/95 px-4 py-3 border-t border-crescender-800"
      style={{ paddingBottom: insets.bottom + 8 }}
    >
      <View className="flex-row gap-2 justify-center">
        <TouchableOpacity
          className="flex-1 bg-crescender-800/50 py-3 rounded-xl border border-crescender-700/50 items-center"
          onPress={onReplaceImage}
        >
          <Feather name="image" size={20} color="white" />
          <Text className="text-white text-xs font-semibold mt-1">
            {hasImage ? 'Replace' : 'Add'}
          </Text>
        </TouchableOpacity>

        {hasImage && (
          <TouchableOpacity
            className="flex-1 bg-crescender-800/50 py-3 rounded-xl border border-crescender-700/50 items-center"
            onPress={onReprocess}
          >
            <Feather name="refresh-cw" size={20} color="white" />
            <Text className="text-white text-xs font-semibold mt-1">Reprocess</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="flex-1 bg-red-500/10 py-3 rounded-xl border border-red-500/30 items-center"
          onPress={onDelete}
        >
          <Feather name="trash-2" size={20} color="#ef4444" />
          <Text className="text-red-500 text-xs font-semibold mt-1">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
