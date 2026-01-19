import { View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { ReceiptRepository } from '../lib/repository';
import { Feather } from '@expo/vector-icons';

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const result = await ReceiptRepository.getAll();
          setItems(result);
        } catch (e) {
          console.error('Failed to load items', e);
        }
      };
      loadData();
    }, [])
  );

  return (
    <SafeAreaView className='flex-1 bg-gray-950'>
      <View className='p-6 flex-1'>
        <View className='flex-row justify-between items-center mb-6'>
            <Text className='text-white text-3xl font-bold'>My Gear</Text>
            <TouchableOpacity className='bg-gray-800 p-2 rounded-full'>
                <Feather name='settings' size={20} color='white' />
            </TouchableOpacity>
        </View>
        
        {items.length === 0 ? (
          <View className='bg-gray-900 rounded-xl p-8 items-center border border-gray-800 border-dashed'>
            <Feather name='music' size={48} color='#4b5563' className='mb-4' />
            <Text className='text-gray-400 text-center mb-2 font-semibold text-lg'>Locker is Empty</Text>
            <Text className='text-gray-500 text-center text-sm'>
                Scan receipts to automatically extract gear, events, and services.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className='bg-gray-900 mb-3 p-4 rounded-lg flex-row justify-between items-center border border-gray-800'>
                <View className='flex-row items-center gap-3'>
                    <View className='w-10 h-10 bg-gray-800 rounded-full justify-center items-center'>
                        <Feather name='shopping-bag' size={18} color='#9ca3af' />
                    </View>
                    <View>
                        <Text className='text-white font-bold text-base'>{item.merchant}</Text>
                        <Text className='text-gray-400 text-xs'>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                </View>
                <Text className='text-green-400 font-bold text-lg'>${(item.total / 100).toFixed(2)}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <TouchableOpacity 
        className='absolute bottom-10 right-6 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg shadow-blue-900/50'
        onPress={() => router.push('/scan')}
      >
        <Feather name='camera' size={28} color='white' />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
