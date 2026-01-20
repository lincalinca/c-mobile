import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ReceiptRepository, Receipt, ReceiptItem } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const r = await ReceiptRepository.getById(id);
        if (r) {
          const i = await ReceiptRepository.getItems(id);
          setReceipt(r);
          setItems(i);
        }
      } catch (e) {
        console.error('Failed to load receipt details', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this receipt and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await ReceiptRepository.delete(id);
              router.back();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center">
        <ActivityIndicator size="large" color="#f5c518" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Receipt not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-gold px-6 py-3 rounded-full">
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gearItems = items.filter(item => item.category === 'gear');
  const serviceItems = items.filter(item => item.category === 'service');
  const eventItems = items.filter(item => item.category === 'event');

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Record Details</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Receipt Image */}
        {receipt.imageUrl && (
          <View className="bg-black/40 h-64 w-full">
            <Image 
              source={{ uri: receipt.imageUrl }} 
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
        )}

        {/* Merchant Section */}
        <View className="p-6 border-b border-crescender-800">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
              <Feather name="home" size={20} color="#f5c518" />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">{receipt.merchant}</Text>
              <Text className="text-crescender-400 text-sm">
                {new Date(receipt.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
          
          <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800">
            <View className="flex-row justify-between mb-2">
              <Text className="text-crescender-400">Total Amount</Text>
              <Text className="text-white font-bold text-lg">${(receipt.total / 100).toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-crescender-400">GST (10%)</Text>
              <Text className="text-crescender-300">${receipt.tax ? (receipt.tax / 100).toFixed(2) : '0.00'}</Text>
            </View>
            {receipt.abn && (
              <View className="flex-row justify-between pt-2 border-t border-crescender-800/50">
                <Text className="text-crescender-400">ABN</Text>
                <Text className="text-crescender-200 font-mono text-xs">{receipt.abn}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gear Items */}
        {gearItems.length > 0 && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">Captured Gear</Text>
            {gearItems.map((item, idx) => (
              <View key={item.id} className="bg-crescender-800/30 p-4 rounded-2xl mb-3 border border-gold/10">
                <Text className="text-white font-bold mb-2">{item.description}</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {item.brand && (
                    <View className="bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20">
                      <Text className="text-gold text-[10px] font-bold">{item.brand}</Text>
                    </View>
                  )}
                  {item.model && (
                    <View className="bg-crescender-800 px-2 py-0.5 rounded-md">
                      <Text className="text-crescender-300 text-[10px]">{item.model}</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-crescender-400 text-xs">Qty: {item.quantity}</Text>
                  <Text className="text-white font-bold">${(item.totalPrice / 100).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Other Items */}
        {(serviceItems.length > 0 || eventItems.length > 0) && (
          <View className="p-6">
            <Text className="text-crescender-400 font-bold mb-4 uppercase tracking-widest text-xs">Other Items</Text>
            {[...serviceItems, ...eventItems].map((item, idx) => (
              <View key={item.id} className="flex-row justify-between items-center mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-white font-medium">{item.description}</Text>
                  <Text className="text-crescender-500 text-xs capitalize">{item.category}</Text>
                </View>
                <Text className="text-crescender-200">${(item.totalPrice / 100).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-crescender-950 p-6 border-t border-crescender-800 flex-row gap-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity 
          className="flex-1 bg-crescender-800/50 py-4 rounded-xl border border-crescender-700/50 flex-row justify-center items-center gap-2"
          onPress={() => router.push('/scan')}
        >
          <Feather name="refresh-cw" size={18} color="white" />
          <Text className="text-white font-bold">Rescan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-1 bg-red-500/10 py-4 rounded-xl border border-red-500/30 flex-row justify-center items-center gap-2"
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
