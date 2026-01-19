import { View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { db } from '../db/client';
import { receipts } from '../db/schema';
import { desc } from 'drizzle-orm';
import { Feather } from '@expo/vector-icons';

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const result = await db.select().from(receipts).orderBy(desc(receipts.createdAt));
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
        <Text className='text-white text-3xl font-bold mb-6'>My Gear</Text>
        
        {items.length === 0 ? (
          <View className='bg-gray-900 rounded-xl p-6 items-center'>
            <Text className='text-gray-400 text-center mb-4'>No gear found yet.</Text>
            <Text className='text-gray-500 text-center text-sm'>Scan your first receipt to start building your locker.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className='bg-gray-900 mb-3 p-4 rounded-lg flex-row justify-between items-center'>
                <View>
                  <Text className='text-white font-bold text-lg'>{item.merchant}</Text>
                  <Text className='text-gray-400 text-xs'>{item.date}</Text>
                </View>
                <Text className='text-green-400 font-bold'>${(item.total / 100).toFixed(2)}</Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity 
        className='absolute bottom-10 right-6 bg-blue-600 w-16 h-16 rounded-full justify-center items-center shadow-lg'
        onPress={() => router.push('/scan')}
      >
        <Feather name='camera' size={24} color='white' />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
