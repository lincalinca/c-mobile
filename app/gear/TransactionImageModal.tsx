import React from 'react';
import { View, TouchableOpacity, Text, Image, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionImageModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
}

export function TransactionImageModal({
  visible,
  imageUrl,
  onClose,
  onSave,
  onShare,
}: TransactionImageModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 bg-black/95"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <TouchableOpacity onPress={onClose} className="bg-crescender-800/50 p-3 rounded-full">
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onSave}
              className="bg-gold/20 px-4 py-3 rounded-full border border-gold/30 flex-row items-center gap-2"
            >
              <Feather name="download" size={20} color="#f5c518" />
              <Text className="text-gold font-semibold text-sm">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onShare}
              className="bg-crescender-800/50 px-4 py-3 rounded-full border border-crescender-700/50 flex-row items-center gap-2"
            >
              <Feather name="share-2" size={20} color="white" />
              <Text className="text-white font-semibold text-sm">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View className="flex-1 justify-center items-center px-4">
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              className="w-full"
              style={{ flex: 1 }}
              resizeMode="contain"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
