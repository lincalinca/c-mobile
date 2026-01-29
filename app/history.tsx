import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { ReceiptRepository, Receipt } from '@lib/repository';
import { ProcessingQueueRepository, QueueItem } from '@lib/processingQueue';
import { Feather } from '@expo/vector-icons';

import { PersistentHeader } from '@components/header/PersistentHeader';

type ViewMode = 'saved' | 'queue';

export default function HistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('saved');
  const [queueCount, setQueueCount] = useState(0);

  const loadData = async () => {
    try {
      const [receiptsData, queueData] = await Promise.all([
        ReceiptRepository.getAll(),
        ProcessingQueueRepository.getAll(),
      ]);
      setReceipts(receiptsData);
      setQueueItems(queueData);

      // Count items ready for review (for badge)
      const readyCount = queueData.filter(q => q.status === 'ready_for_review').length;
      setQueueCount(readyCount);
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

  const filteredQueueItems = queueItems.filter(q => {
    if (!searchQuery) return true;
    const merchantName = q.aiResponseData?.merchant?.name || q.aiResponseData?.merchantDetails?.name || '';
    return merchantName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQueueItemPress = (item: QueueItem) => {
    if (item.status === 'ready_for_review' && item.aiResponseData) {
      // Navigate to review with the queue item data
      router.push({
        pathname: '/review' as any,
        params: {
          data: JSON.stringify(item.aiResponseData),
          uri: item.imageUri,
          queueItemId: item.id,
        },
      });
    }
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
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

  const renderQueueItem = ({ item }: { item: QueueItem }) => {
    const merchantName = item.aiResponseData?.merchant?.name || item.aiResponseData?.merchantDetails?.name || 'Processing...';
    const total = item.aiResponseData?.financial?.total;
    const isReady = item.status === 'ready_for_review';
    const isProcessing = item.status === 'processing';
    const isError = item.status === 'error';

    return (
      <TouchableOpacity
        onPress={() => handleQueueItemPress(item)}
        disabled={!isReady}
        className={`bg-crescender-800/40 p-4 rounded-2xl mb-3 flex-row items-center border ${
          isReady ? 'border-gold' : 'border-crescender-800'
        }`}
      >
        <View className="w-16 h-20 bg-black/40 rounded-lg overflow-hidden mr-4">
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} className="w-full h-full" resizeMode="cover" />
          )}
        </View>

        <View className="flex-1">
          <Text className={`font-bold text-lg ${isReady ? 'text-white' : 'text-crescender-400'}`} numberOfLines={1}>
            {merchantName}
          </Text>
          <Text className="text-crescender-400 text-sm mb-2">
            {new Date(item.submittedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <View className="flex-row items-center gap-2">
            {isProcessing && (
              <>
                <ActivityIndicator size="small" color="#f5c518" />
                <Text className="text-gold text-xs uppercase tracking-widest">Processing</Text>
              </>
            )}
            {isReady && (
              <>
                <View className="w-2 h-2 rounded-full bg-gold" />
                <Text className="text-gold text-xs uppercase tracking-widest">Ready for review</Text>
              </>
            )}
            {isError && (
              <>
                <View className="w-2 h-2 rounded-full bg-red-500" />
                <Text className="text-red-400 text-xs uppercase tracking-widest">Failed</Text>
              </>
            )}
          </View>
        </View>

        <View className="items-end">
          {total ? (
            <Text className="text-gold font-bold text-xl">${(total / 100).toFixed(2)}</Text>
          ) : (
            <Text className="text-crescender-600 font-bold text-xl">--</Text>
          )}
          {isReady && <Feather name="chevron-right" size={16} color="#f5c518" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      {/* View Mode Toggle */}
      <View className="px-6 mt-6 mb-4">
        <View className="flex-row bg-crescender-900/60 rounded-xl p-1 border border-crescender-800">
          <TouchableOpacity
            onPress={() => setViewMode('saved')}
            className={`flex-1 py-2.5 rounded-lg ${viewMode === 'saved' ? 'bg-crescender-800' : ''}`}
          >
            <Text className={`text-center font-medium ${viewMode === 'saved' ? 'text-white' : 'text-crescender-400'}`}>
              Saved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('queue')}
            className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${viewMode === 'queue' ? 'bg-crescender-800' : ''}`}
          >
            <Text className={`text-center font-medium ${viewMode === 'queue' ? 'text-white' : 'text-crescender-400'}`}>
              Queue
            </Text>
            {queueCount > 0 && (
              <View className="bg-gold rounded-full min-w-5 h-5 ml-2 items-center justify-center px-1.5">
                <Text className="text-crescender-950 text-xs font-bold">{queueCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className="bg-crescender-900/40 border border-crescender-700/50 rounded-2xl flex-row items-center px-4 h-12">
          <Feather name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 text-white ml-2 text-base"
            placeholder={viewMode === 'saved' ? 'Search receipts...' : 'Search queue...'}
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
      ) : viewMode === 'saved' ? (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Feather name="inbox" size={48} color="#374151" />
              <Text className="text-crescender-400 mt-4">No saved receipts</Text>
              <Text className="text-crescender-500 text-sm mt-1">Scan a receipt to get started</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredQueueItems}
          renderItem={renderQueueItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Feather name="check-circle" size={48} color="#374151" />
              <Text className="text-crescender-400 mt-4">Queue is empty</Text>
              <Text className="text-crescender-500 text-sm mt-1 text-center px-8">
                Receipts being processed or awaiting your review will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
