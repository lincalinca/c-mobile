import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LineItemWithDetails, Receipt } from '../../../lib/repository';

interface GearItemHeroViewProps {
  item: LineItemWithDetails;
  receipt: Receipt | null;
  onReceiptPress: () => void;
}

export function GearItemHeroView({ item, receipt, onReceiptPress }: GearItemHeroViewProps) {
  const isGear = item.category === 'gear';

  return (
    <View>
      {/* Brand Icon/Initial */}
      {isGear && item.brand && (
        <View className="mb-4 flex-row items-center gap-3">
          <View className="w-16 h-16 bg-gold/20 rounded-2xl border-2 border-gold/30 justify-center items-center">
            <Text className="text-gold font-bold text-2xl" numberOfLines={1} ellipsizeMode="tail">
              {item.brand.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-crescender-400 text-xs mb-1">Brand</Text>
            <Text className="text-white font-bold text-lg">{item.brand}</Text>
            {item.gearCategory && (
              <Text className="text-crescender-500 text-xs mt-1">{item.gearCategory}</Text>
            )}
          </View>
        </View>
      )}
      
      <Text className="text-gold text-sm font-bold uppercase tracking-widest mb-2">{item.category}</Text>
      <Text className="text-white text-3xl font-bold mb-2">{item.description}</Text>
      {item.brand && (
        <Text className="text-crescender-300 text-xl mb-4">{item.brand} {item.model}</Text>
      )}
      
      <View className="flex-row items-center gap-2 mb-6">
        <View className="bg-crescender-800 px-3 py-1 rounded-full">
          <Text className="text-white font-bold text-lg">${(item.totalPrice / 100).toFixed(2)}</Text>
        </View>
        {item.quantity && item.quantity > 1 && (
          <Text className="text-crescender-400 text-sm">({item.quantity} x ${(item.unitPrice / 100).toFixed(2)})</Text>
        )}
      </View>

      {/* Context: Receipt Link */}
      {receipt && (
        <TouchableOpacity 
          onPress={onReceiptPress}
          className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
            <Feather name="shopping-bag" size={18} color="#f5c518" />
          </View>
          <View className="flex-1">
            <Text className="text-crescender-400 text-xs">Purchased from</Text>
            <Text className="text-white font-bold">{receipt.merchant}</Text>
            <Text className="text-crescender-400 text-xs">
              {new Date(receipt.transactionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
