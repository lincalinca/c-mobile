import React from 'react';
import { View, TouchableOpacity, Text, Image, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionHeroView } from './TransactionHeroView';
import type { Receipt } from '@lib/repository';

interface TransactionImageModalProps {
  visible: boolean;
  imageUrl: string | null;
  receipt?: Receipt | null;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
}

export function TransactionImageModal({
  visible,
  imageUrl,
  receipt,
  onClose,
  onSave,
  onShare,
}: TransactionImageModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 bg-black"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Header Actions */}
        <View className="flex-row justify-between items-center px-4 py-2 z-10 bg-black/50 absolute top-0 left-0 right-0" style={{ marginTop: insets.top }}>
          <TouchableOpacity onPress={onClose} className="bg-crescender-800/80 p-3 rounded-full">
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onSave} className="bg-gold/20 px-4 py-3 rounded-full border border-gold/30 flex-row items-center gap-2">
              <Feather name="download" size={20} color="#f5c518" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} className="bg-crescender-800/80 px-4 py-3 rounded-full border border-crescender-700/50 flex-row items-center gap-2">
              <Feather name="share-2" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 80, paddingBottom: 40 }}>
           {/* Hero Component Overlay */}
           {receipt && (
             <View className="mb-4">
               <TransactionHeroView receipt={receipt} />
             </View>
           )}

           {/* Image */}
           <View className="min-h-[500px] justify-center items-center px-4">
             {imageUrl && (
               <Image
                 source={{ uri: imageUrl }}
                 className="w-full h-[600px]"
                 resizeMode="contain"
               />
             )}
           </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
