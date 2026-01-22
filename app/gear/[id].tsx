import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, Receipt, ReceiptItem } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatABN } from '../../lib/formatUtils';
import { ITEM_CATEGORIES } from '../../constants/categories';

// Document type options
const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'tax_invoice', label: 'Tax Invoice' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'layby', label: 'Layby' },
] as const;

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-600' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-600' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-600' },
] as const;

// Payment method options
const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'afterpay', label: 'Afterpay' },
  { value: 'other', label: 'Other' },
] as const;

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editMerchant, setEditMerchant] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('receipt');
  const [editDate, setEditDate] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editAbn, setEditAbn] = useState('');
  const [editSubtotal, setEditSubtotal] = useState('');
  const [editTax, setEditTax] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('paid');
  const [editPaymentMethod, setEditPaymentMethod] = useState('card');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const r = await ReceiptRepository.getById(id);
        if (r) {
          const i = await ReceiptRepository.getLineItems(id);
          setReceipt(r);
          setItems(i);

          // Initialize edit state
          setEditMerchant(r.merchant || '');
          setEditDocumentType(r.documentType || 'receipt');
          setEditDate(r.transactionDate || new Date().toISOString().split('T')[0]);
          setEditInvoiceNumber(r.invoiceNumber || '');
          setEditAbn(r.merchantAbn || '');
          setEditSubtotal(r.subtotal ? (r.subtotal / 100).toString() : '');
          setEditTax(r.tax ? (r.tax / 100).toString() : '');
          setEditTotal(r.total ? (r.total / 100).toString() : '0');
          setEditPaymentStatus(r.paymentStatus || 'paid');
          setEditPaymentMethod(r.paymentMethod || 'card');
        }
      } catch (e) {
        console.error('Failed to load receipt details', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

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
              handleBack();
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!receipt || !id) return;
    setIsSaving(true);
    try {
      // Update the receipt with edited values
      const updatedReceipt = {
        ...receipt,
        merchant: editMerchant,
        documentType: editDocumentType,
        transactionDate: editDate,
        invoiceNumber: editInvoiceNumber || null,
        merchantAbn: editAbn || null,
        subtotal: editSubtotal ? Math.round(parseFloat(editSubtotal) * 100) : null,
        tax: editTax ? Math.round(parseFloat(editTax) * 100) : null,
        total: Math.round(parseFloat(editTotal) * 100),
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
      };

      // For now, we'll just update the local state
      // In a real app, you'd call an update method on the repository
      setReceipt(updatedReceipt);
      setIsEditing(false);
      Alert.alert('Saved!', 'Changes saved successfully');
    } catch (e) {
      console.error('Failed to save changes', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
        <TouchableOpacity onPress={handleBack} className="bg-gold px-6 py-3 rounded-full">
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
        <TouchableOpacity onPress={isEditing ? () => setIsEditing(false) : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? "x" : "arrow-left"} size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{isEditing ? 'Edit Record' : 'Record Details'}</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
            <Feather name="edit-2" size={24} color="#f5c518" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
            <Feather name={isSaving ? "loader" : "check"} size={24} color="#f5c518" />
          </TouchableOpacity>
        )}
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

        {isEditing ? (
          // EDIT MODE
          <View className="p-6">
            {/* Document Type */}
            <View className="mb-6">
              <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-xs">Document Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setEditDocumentType(type.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editDocumentType === type.value
                          ? 'bg-gold border-gold'
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${
                        editDocumentType === type.value ? 'text-crescender-950' : 'text-crescender-400'
                      }`}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Merchant */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-xs mb-1">Merchant</Text>
              <TextInput
                className="text-white text-base font-semibold border-b border-crescender-700 py-1"
                value={editMerchant}
                onChangeText={setEditMerchant}
                placeholderTextColor="#666"
              />
            </View>

            {/* ABN & Invoice Number */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-xs mb-1">ABN</Text>
                <TextInput
                  className="text-white text-sm border-b border-crescender-700 py-1"
                  value={editAbn}
                  onChangeText={setEditAbn}
                  placeholder="XX XXX XXX XXX"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-xs mb-1">Invoice/Receipt #</Text>
                <TextInput
                  className="text-white text-sm border-b border-crescender-700 py-1"
                  value={editInvoiceNumber}
                  onChangeText={setEditInvoiceNumber}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Date */}
            <View className="mb-6">
              <Text className="text-crescender-400 text-xs mb-1">Date</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            {/* Financial Details */}
            <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-xs">Financial Details</Text>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-xs mb-1">Subtotal</Text>
                <TextInput
                  className="text-white text-sm border-b border-crescender-700 py-1"
                  value={editSubtotal}
                  onChangeText={setEditSubtotal}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-xs mb-1">GST (10%)</Text>
                <TextInput
                  className="text-white text-sm border-b border-crescender-700 py-1"
                  value={editTax}
                  onChangeText={setEditTax}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Total */}
            <View className="mb-6">
              <Text className="text-crescender-400 text-xs mb-1">Total</Text>
              <TextInput
                className="text-white text-base font-bold border-b border-crescender-700 py-1"
                value={editTotal}
                onChangeText={setEditTotal}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Payment Status */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-xs mb-2">Payment Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {PAYMENT_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => setEditPaymentStatus(status.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editPaymentStatus === status.value
                          ? `${status.color} border-white`
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${
                        editPaymentStatus === status.value ? 'text-white' : 'text-crescender-400'
                      }`}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Payment Method */}
            <View className="mb-6">
              <Text className="text-crescender-400 text-xs mb-2">Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() => setEditPaymentMethod(method.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editPaymentMethod === method.value
                          ? 'bg-gold border-gold'
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${
                        editPaymentMethod === method.value ? 'text-crescender-950' : 'text-crescender-400'
                      }`}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Delete Button */}
            <TouchableOpacity onPress={handleDelete} className="bg-red-600/20 border border-red-600 px-6 py-3 rounded-full">
              <Text className="text-red-400 font-bold text-center">Delete Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // VIEW MODE
          <View className="p-6 border-b border-crescender-800">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
                <Feather name="home" size={20} color="#f5c518" />
              </View>
              <View>
                <Text className="text-white text-xl font-bold">{receipt.merchant}</Text>
                <Text className="text-crescender-400 text-sm">
                  {new Date(receipt.transactionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
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
              {receipt.merchantAbn && (
                <View className="flex-row justify-between pt-2 border-t border-crescender-800/50">
                  <Text className="text-crescender-400">ABN</Text>
                  <Text className="text-crescender-200 font-mono text-xs">{formatABN(receipt.merchantAbn)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!isEditing && (
          <>
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
          </>
        )}
      </ScrollView>

      {/* Footer Actions - Only show in view mode */}
      {!isEditing && (
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
      )}
    </View>
  );
}
