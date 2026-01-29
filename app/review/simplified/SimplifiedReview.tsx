/**
 * Simplified Review Screen
 * 
 * Single-page approach with minimal display, trusting AI captured data.
 * Only prompts for critical missing information.
 */

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { TransactionRepository } from '@lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { useInterstitialAd } from '@components/ads';
import { analyzeMissingData } from '@lib/reviewWorkflow';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import { generateEducationEvents, getEducationSeriesSummary } from '@lib/educationEvents';
import { addEducationSeriesToDeviceCalendar } from '@lib/calendarExport';

export default function ReviewSimplified() {
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

  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Minimal state - only what's needed
  const [items, setItems] = useState<any[]>(initialData.items || []);
  const [merchant, setMerchant] = useState(
    initialData.financial?.merchantDetails?.name || initialData.financial?.merchant || 'Unknown Merchant'
  );
  const [transactionDate, setTransactionDate] = useState(
    initialData.financial?.date || new Date().toISOString().split('T')[0]
  );
  const [total, setTotal] = useState(initialData.financial?.total?.toString() || '0');

  const { show: showInterstitial } = useInterstitialAd();

  // Check for critical missing data
  const missingData = useMemo(() => analyzeMissingData(items), [items]);
  const criticalMissing = missingData.filter(m => m.required);

  const performSave = async (): Promise<string | null> => {
    const transactionId = Crypto.randomUUID();

    await TransactionRepository.create({
      id: transactionId,
      merchant,
      merchantAbn: initialData.financial?.merchantDetails?.abn || null,
      merchantPhone: initialData.financial?.merchantDetails?.phone || null,
      merchantEmail: initialData.financial?.merchantDetails?.email || null,
      merchantWebsite: initialData.financial?.merchantDetails?.website || null,
      merchantAddress: initialData.financial?.merchantDetails?.address || null,
      merchantSuburb: initialData.financial?.merchantDetails?.suburb || null,
      merchantState: initialData.financial?.merchantDetails?.state || null,
      merchantPostcode: initialData.financial?.merchantDetails?.postcode || null,
      summary: initialData.summary || null,
      documentType: initialData.documentType || 'receipt',
      transactionDate,
      invoiceNumber: initialData.financial?.invoiceNumber || null,
      subtotal: initialData.financial?.subtotal ? Math.round(initialData.financial.subtotal * 100) : null,
      tax: initialData.financial?.tax ? Math.round(initialData.financial.tax * 100) : null,
      total: Math.round(parseFloat(total) * 100),
      paymentStatus: initialData.financial?.paymentStatus || 'paid',
      paymentMethod: initialData.financial?.paymentMethod || 'card',
      imageUrl: params.uri,
      rawOcrData: params.data,
      syncStatus: 'pending',
    }, items.map((item: any) => ({
      id: Crypto.randomUUID(),
      transactionId,
      description: item.description,
      category: item.category || 'other',
      brand: item.brand || null,
      model: item.model || null,
      instrumentType: item.instrumentType || null,
      gearCategory: item.gearCategory || null,
      serialNumber: item.serialNumber || null,
      quantity: item.quantity || 1,
      originalUnitPrice: item.originalUnitPrice ? Math.round(item.originalUnitPrice * 100) : null,
      unitPrice: Math.round((item.unitPrice || 0) * 100),
      discountAmount: item.discountAmount ? Math.round(item.discountAmount * 100) : null,
      discountPercentage: item.discountPercentage || null,
      totalPrice: Math.round((item.totalPrice || 0) * 100),
      gearDetails: item.gearDetails ? JSON.stringify(item.gearDetails) : null,
      educationDetails: item.educationDetails ? JSON.stringify(item.educationDetails) : null,
      serviceDetails: item.serviceDetails ? JSON.stringify(item.serviceDetails) : null,
      notes: item.notes || null,
      confidence: item.confidence || null,
    })));

    return transactionId;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await performSave();

      // Show interstitial ad
      setTimeout(() => {
        showInterstitial();
      }, 500);

      Alert.alert('Saved!', 'Transaction saved successfully', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (e) {
      console.error('[Simplified Review] Save error:', e);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (date: string) => {
    if (editingItemIndex === null || !editingField) return;
    
    const newItems = [...items];
    const item = newItems[editingItemIndex];
    
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      
      eduDetails[editingField] = date;
      item.educationDetails = eduDetails;
    }
    
    setItems(newItems);
    setShowDatePicker(false);
    setEditingItemIndex(null);
    setEditingField(null);
  };

  const getCurrentValue = (index: number, field: string): string | null => {
    const item = items[index];
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      return eduDetails[field] || null;
    }
    return null;
  };

  const updateEducationDetail = useCallback((itemIndex: number, field: string, value: string) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    if (item?.category !== 'education') return;
    const eduDetails = typeof item.educationDetails === 'string'
      ? JSON.parse(item.educationDetails || '{}')
      : (item.educationDetails || {});
    eduDetails[field] = value.trim() || undefined;
    item.educationDetails = eduDetails;
    setItems(newItems);
  }, [items]);

  const hasEducationOrEvents = items.some((item: any) => 
    item.category === 'education' || 
    item.category === 'event' ||
    (item.educationDetails && Object.keys(item.educationDetails).length > 0)
  );

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        {/* Summary Card */}
        <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
          <Text className="text-gold text-xl font-bold mb-2">{merchant}</Text>
          {initialData.summary && (
            <Text className="text-white text-base mb-4">{initialData.summary}</Text>
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-crescender-400 text-sm">Total</Text>
            <Text className="text-gold text-2xl font-bold">${parseFloat(total).toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-crescender-400 text-sm">Date</Text>
            <Text className="text-white text-base">
              {new Date(transactionDate + 'T12:00:00').toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Critical Missing Data Prompt */}
        {criticalMissing.length > 0 && (
          <View className="bg-yellow-900/20 p-4 rounded-2xl border border-yellow-700 mb-6">
            <Text className="text-yellow-400 font-bold mb-3">⚠️ Missing Information</Text>
            {criticalMissing.map((req, idx) => {
              const item = items[req.itemIndex];
              const currentValue = getCurrentValue(req.itemIndex, req.field);
              
              return (
                <View key={idx} className="mb-3 last:mb-0">
                  <Text className="text-white text-sm mb-1">{item.description || 'Item'}</Text>
                  {req.field === 'startDate' && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingItemIndex(req.itemIndex);
                        setEditingField(req.field);
                        setShowDatePicker(true);
                      }}
                      className="bg-crescender-800 p-3 rounded-xl flex-row items-center justify-between border border-crescender-700"
                    >
                      <Text className={`text-base ${currentValue ? 'text-white' : 'text-crescender-500'}`}>
                        {currentValue
                          ? new Date(currentValue + 'T12:00:00').toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : `Select ${req.label.toLowerCase()}`}
                      </Text>
                      <Feather name="calendar" size={18} color="#f5c518" />
                    </TouchableOpacity>
                  )}
                  {(req.field === 'studentName' || req.field === 'teacherName') && (
                    <TextInput
                      className="bg-crescender-800 text-white text-base p-3 rounded-xl border border-crescender-700"
                      value={currentValue ?? ''}
                      onChangeText={(text) => updateEducationDetail(req.itemIndex, req.field, text)}
                      placeholder={req.field === 'studentName' ? 'e.g. Alex, Jordan' : 'e.g. Jane Smith'}
                      placeholderTextColor="#6b7280"
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Trust Message */}
        <View className="bg-crescender-900/20 p-4 rounded-2xl border border-crescender-800 mb-6">
          <View className="flex-row items-start gap-3">
            <Feather name="info" size={20} color="#f5c518" />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold mb-1">
                AI has captured all details from your receipt
              </Text>
              <Text className="text-crescender-400 text-xs">
                {items.length} item{items.length !== 1 ? 's' : ''} detected and saved. You can edit details later if needed.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        className="px-6 py-4 bg-crescender-950 border-t border-crescender-800"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {hasEducationOrEvents ? (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
            >
              {isSaving ? (
                <ActivityIndicator color="#2e1065" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#2e1065" />
                  <Text className="text-crescender-950 font-bold text-lg">SAVE + VIEW</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setIsSaving(true);
                try {
                  const transactionId = await performSave();
                  if (!transactionId) throw new Error('Failed to save');
                  
                  const receipt = {
                    id: transactionId,
                    merchant,
                    transactionDate,
                  } as any;
                  
                  for (const item of items) {
                    if (item.category === 'education' && item.educationDetails) {
                      try {
                        const eduDetails = typeof item.educationDetails === 'string'
                          ? JSON.parse(item.educationDetails)
                          : item.educationDetails;
                        const lineItem = {
                          id: Crypto.randomUUID(),
                          description: item.description,
                          educationDetails: JSON.stringify(eduDetails),
                        } as any;
                        
                        const series = getEducationSeriesSummary(lineItem, receipt);
                        if (series) {
                          await addEducationSeriesToDeviceCalendar(series, receipt);
                        }
                      } catch (e) {
                        console.error('Failed to add to calendar:', e);
                      }
                    }
                  }
                  
                  setTimeout(() => {
                    showInterstitial();
                  }, 500);
                  
                  Alert.alert('Success', 'Saved and added to calendar', [
                    { text: 'OK', onPress: () => router.replace('/') }
                  ]);
                } catch (e) {
                  console.error('Save + Calendar error:', e);
                  Alert.alert('Error', 'Failed to save or add to calendar');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="flex-1 bg-crescender-700 h-14 rounded-xl flex-row items-center justify-center gap-3 border border-crescender-600"
            >
              <Feather name="calendar" size={20} color="#f5c518" />
              <Text className="text-gold font-bold text-lg">+ CALENDAR</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                <Text className="text-crescender-950 font-bold text-xl">SAVE TRANSACTION</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal */}
      {editingItemIndex !== null && editingField && (
        <DatePickerModal
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
            setEditingItemIndex(null);
            setEditingField(null);
          }}
          selectedDate={getCurrentValue(editingItemIndex, editingField)}
          onDateSelect={handleDateSelect}
          showFutureWarning={true}
        />
      )}
    </View>
  );
}
