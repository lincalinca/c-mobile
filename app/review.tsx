import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { ReceiptRepository } from '../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReviewScreen() {
  const params = useLocalSearchParams<{ data: string; uri: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const initialData = useMemo(() => {
    try {
      return JSON.parse(params.data || '{}');
    } catch (e) {
      return {};
    }
  }, [params.data]);

  const [merchant, setMerchant] = useState(initialData.financial?.merchant || 'Unknown Merchant');
  const [total, setTotal] = useState(initialData.financial?.total?.toString() || '0');
  const [date, setDate] = useState(initialData.financial?.date || new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>(initialData.items || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const receiptId = crypto.randomUUID();
      await ReceiptRepository.create({
        id: receiptId,
        merchant: merchant,
        date: date,
        total: Math.round(parseFloat(total) * 100),
        imageUrl: params.uri,
        rawOcr: params.data,
        syncStatus: 'pending',
      }, items.map((item: any) => ({
        id: crypto.randomUUID(),
        receiptId: receiptId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        totalPrice: Math.round(item.totalPrice * 100),
        category: item.category || 'other',
        brand: item.brand,
        model: item.model,
        instrumentType: item.instrumentType,
        subcategory: item.subcategory,
      })));

      router.replace('/');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const updateItemCategory = (index: number, category: string) => {
    const newItems = [...items];
    newItems[index].category = category;
    setItems(newItems);
  };

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Review Captured Data</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#f5c518" />
          ) : (
            <Text className="text-gold font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">Merchant & Total</Text>
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
          <View className="mb-4">
            <Text className="text-crescender-400 text-xs mb-1">Merchant Name</Text>
            <TextInput 
              className="text-white text-base font-semibold border-b border-crescender-700 py-1"
              value={merchant}
              onChangeText={setMerchant}
            />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-crescender-400 text-xs mb-1">Total ($)</Text>
              <TextInput 
                className="text-white text-base font-semibold border-b border-crescender-700 py-1"
                value={total}
                onChangeText={setTotal}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-crescender-400 text-xs mb-1">Date</Text>
              <TextInput 
                className="text-white text-base font-semibold border-b border-crescender-700 py-1"
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
        </View>

        <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">Identified Items</Text>
        {items.map((item, index) => (
          <View key={index} className="bg-crescender-800/20 p-4 rounded-2xl mb-4 border border-crescender-800">
            <Text className="text-white font-bold mb-3">{item.description}</Text>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-crescender-400 text-xs">${item.unitPrice?.toFixed(2)} x {item.quantity}</Text>
              <Text className="text-gold font-bold">${item.totalPrice?.toFixed(2)}</Text>
            </View>
            
            <View className="flex-row gap-2">
              {['gear', 'event', 'transaction'].map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => updateItemCategory(index, cat)}
                  className={`px-3 py-1.5 rounded-full border ${item.category === cat ? 'bg-gold border-gold' : 'bg-crescender-900/60 border-crescender-700'}`}
                >
                  <Text className={`text-[10px] font-bold ${item.category === cat ? 'text-crescender-950' : 'text-crescender-400'}`}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <View 
        className="px-6 py-4 bg-crescender-950 border-t border-crescender-800"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSaving}
          className="bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
        >
          {isSaving ? (
            <ActivityIndicator color="#2e1065" />
          ) : (
            <>
              <Feather name="check" size={24} color="#2e1065" />
              <Text className="text-crescender-950 font-bold text-lg">CONFIRM & SAVE</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
