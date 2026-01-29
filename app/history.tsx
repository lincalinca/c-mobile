import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { ReceiptRepository, Receipt } from '@lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersistentHeader } from '@components/header/PersistentHeader';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await ReceiptRepository.getAll();
      setReceipts(data);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredReceipts = receipts.filter(r => 
    r.merchant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderItem = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      onPress={() => router.push(`/gear/${item.id}` as any)}
      className="bg-crescender-800/40 p-4 rounded-2xl mb-3 flex-row items-center border border-crescender-800"
    >
      <View className="w-16 h-20 bg-black/40 rounded-lg overflow-hidden mr-4">
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        )}
      </View>
      
      <View className="flex-1">
        <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.merchant}</Text>
        <Text className="text-crescender-400 text-sm mb-2">
          {new Date(item.transactionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Text className="text-crescender-500 text-xs uppercase tracking-widest">Saved</Text>
        </View>
      </View>
      
      <View className="items-end">
        <Text className="text-gold font-bold text-xl">${(item.total / 100).toFixed(2)}</Text>
        <Feather name="chevron-right" size={16} color="#f5c518" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      {/* Search */}
      <View className="px-6 my-6">
        <View className="bg-crescender-900/40 border border-crescender-700/50 rounded-2xl flex-row items-center px-4 h-12">
          <Feather name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 text-white ml-2 text-base"
            placeholder="Search receipts..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f5c518" />
        </View>
      ) : (
        <FlatList
          data={filteredReceipts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Feather name="search" size={48} color="#374151" />
              <Text className="text-crescender-400 mt-4">No receipts found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
