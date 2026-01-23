import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GearItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const lineItem = await ReceiptRepository.getLineItemById(id);
      if (lineItem) {
        setItem(lineItem);
        if (lineItem.transactionId) {
          const r = await ReceiptRepository.getById(lineItem.transactionId);
          setReceipt(r);
        }
      }
    } catch (e) {
      console.error('Failed to load gear item details', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center">
        <ActivityIndicator size="large" color="#f5c518" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Item not found</Text>
        <TouchableOpacity onPress={handleBack} className="bg-gold px-6 py-3 rounded-full">
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gearDetails = item.gearDetailsParsed;
  const isGear = item.category === 'gear';

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Item Details</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          <Text className="text-gold text-sm font-bold uppercase tracking-widest mb-2">{item.category}</Text>
          <Text className="text-white text-3xl font-bold mb-2">{item.description}</Text>
          {item.brand && (
            <Text className="text-crescender-300 text-xl mb-4">{item.brand} {item.model}</Text>
          )}
          
          <View className="flex-row items-center gap-2 mb-6">
            <View className="bg-crescender-800 px-3 py-1 rounded-full">
              <Text className="text-white font-bold text-lg">${(item.totalPrice / 100).toFixed(2)}</Text>
            </View>
            {item.quantity > 1 && (
              <Text className="text-crescender-400 text-sm">({item.quantity} x ${(item.unitPrice / 100).toFixed(2)})</Text>
            )}
          </View>

          {/* Context: Receipt Link */}
          {receipt && (
            <TouchableOpacity 
              onPress={() => router.push(`/gear/${receipt.id}` as any)}
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

        {/* Granular Details */}
        {isGear && gearDetails && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">Specifications</Text>
            
            <View className="bg-crescender-900/40 rounded-xl overflow-hidden border border-crescender-800/50">
              {/* Manufacturer/Brand info */}
              {(gearDetails.manufacturer || gearDetails.brand) && (
                <View className="p-4 border-b border-crescender-800/50 flex-row">
                  <View className="flex-1">
                    <Text className="text-crescender-500 text-xs mb-1">Manufacturer</Text>
                    <Text className="text-white font-medium">{gearDetails.manufacturer || gearDetails.brand}</Text>
                  </View>
                  {gearDetails.makeYear && (
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-xs mb-1">Year</Text>
                      <Text className="text-white font-medium">{gearDetails.makeYear}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Model info */}
              {(gearDetails.modelName || gearDetails.modelNumber) && (
                <View className="p-4 border-b border-crescender-800/50 flex-row">
                  <View className="flex-1">
                    <Text className="text-crescender-500 text-xs mb-1">Model</Text>
                    <Text className="text-white font-medium">{gearDetails.modelName || '-'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-crescender-500 text-xs mb-1">Model #</Text>
                    <Text className="text-crescender-300 font-mono text-sm">{gearDetails.modelNumber || '-'}</Text>
                  </View>
                </View>
              )}

              {/* Serial & Colour */}
              {(gearDetails.serialNumber || gearDetails.colour) && (
                <View className="p-4 border-b border-crescender-800/50 flex-row">
                  {gearDetails.serialNumber && (
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-xs mb-1">Serial Number</Text>
                      <Text className="text-gold font-mono font-bold">{gearDetails.serialNumber}</Text>
                    </View>
                  )}
                  {gearDetails.colour && (
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-xs mb-1">Colour</Text>
                      <Text className="text-white font-medium">{gearDetails.colour}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Condition & Tier */}
              {(gearDetails.condition || gearDetails.tier) && (
                <View className="p-4 flex-row gap-4">
                  {gearDetails.condition && (
                    <View className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                      <Text className="text-blue-400 text-xs font-bold uppercase">{gearDetails.condition}</Text>
                    </View>
                  )}
                  {gearDetails.tier && (
                    <View className="bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                      <Text className="text-purple-400 text-xs font-bold uppercase">{gearDetails.tier}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Other details */}
            {(gearDetails.uniqueDetail || gearDetails.notedDamage) && (
              <View className="mt-4 gap-3">
                {gearDetails.uniqueDetail && (
                  <View>
                    <Text className="text-crescender-500 text-xs mb-1">Unique Details</Text>
                    <Text className="text-crescender-200 italic leading-relaxed">{gearDetails.uniqueDetail}</Text>
                  </View>
                )}
                {gearDetails.notedDamage && (
                  <View className="bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                    <Text className="text-red-400 text-xs font-bold mb-1">Noted Damage</Text>
                    <Text className="text-red-200 text-sm">{gearDetails.notedDamage}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Resources & Links */}
        {isGear && gearDetails && (gearDetails.officialUrl || gearDetails.officialManual || gearDetails.warrantyContactDetails) && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">Resources</Text>
            
            <View className="gap-3">
              {gearDetails.officialUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(gearDetails.officialUrl!.startsWith('http') ? gearDetails.officialUrl! : `https://${gearDetails.officialUrl}`)}
                  className="bg-crescender-800/30 p-4 rounded-xl flex-row items-center gap-3 border border-crescender-700/30"
                >
                  <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
                    <Feather name="globe" size={20} color="#f5c518" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">Product Page</Text>
                    <Text className="text-crescender-400 text-xs" numberOfLines={1}>{gearDetails.officialUrl}</Text>
                  </View>
                  <Feather name="external-link" size={16} color="#666" />
                </TouchableOpacity>
              )}

              {gearDetails.officialManual && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(gearDetails.officialManual!.startsWith('http') ? gearDetails.officialManual! : `https://${gearDetails.officialManual}`)}
                  className="bg-crescender-800/30 p-4 rounded-xl flex-row items-center gap-3 border border-crescender-700/30"
                >
                  <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
                    <Feather name="book" size={20} color="#f5c518" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">User Manual</Text>
                    <Text className="text-crescender-400 text-xs" numberOfLines={1}>View Documentation</Text>
                  </View>
                  <Feather name="external-link" size={16} color="#666" />
                </TouchableOpacity>
              )}

              {gearDetails.warrantyContactDetails && (
                <View className="bg-crescender-800/30 p-4 rounded-xl border border-crescender-700/30">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
                      <Feather name="shield" size={20} color="#f5c518" />
                    </View>
                    <View>
                      <Text className="text-white font-medium">Warranty Support</Text>
                      <Text className="text-crescender-400 text-xs">Contact Details</Text>
                    </View>
                  </View>
                  
                  <View className="gap-2 pl-12">
                    {gearDetails.warrantyContactDetails.phone && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(`tel:${gearDetails.warrantyContactDetails!.phone!.replace(/\s/g, '')}`)}
                        className="flex-row items-center gap-2"
                      >
                        <Feather name="phone" size={14} color="#f5c518" />
                        <Text className="text-crescender-300 text-sm underline">{gearDetails.warrantyContactDetails.phone}</Text>
                      </TouchableOpacity>
                    )}
                    {gearDetails.warrantyContactDetails.email && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(`mailto:${gearDetails.warrantyContactDetails!.email}`)}
                        className="flex-row items-center gap-2"
                      >
                        <Feather name="mail" size={14} color="#f5c518" />
                        <Text className="text-crescender-300 text-sm underline">{gearDetails.warrantyContactDetails.email}</Text>
                      </TouchableOpacity>
                    )}
                    {gearDetails.warrantyContactDetails.website && (
                      <TouchableOpacity 
                        onPress={() => Linking.openURL(`https://${gearDetails.warrantyContactDetails!.website!.replace(/^https?:\/\//, '')}`)}
                        className="flex-row items-center gap-2"
                      >
                        <Feather name="globe" size={14} color="#f5c518" />
                        <Text className="text-crescender-300 text-sm underline">{gearDetails.warrantyContactDetails.website}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* General Notes */}
        {item.notes && (
          <View className="p-6">
            <Text className="text-crescender-400 font-bold mb-2 uppercase tracking-widest text-xs">Notes</Text>
            <View className="bg-crescender-800/30 p-4 rounded-xl border border-crescender-700/30">
              <Text className="text-crescender-200 leading-relaxed">{item.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}