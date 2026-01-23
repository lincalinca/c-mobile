import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { TransactionRepository } from '../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ITEM_CATEGORIES } from '../constants/categories';
import { useInterstitialAd, usePreloadInterstitialAd } from '../components/ads';
import { generateEducationEvents, getEducationSeriesSummary } from '../lib/educationEvents';
import { addEducationSeriesToDeviceCalendar, addEventToDeviceCalendar } from '../lib/calendarExport';

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

  // Merchant matching state (Phase 3)
  const merchantIsNew = initialData.financial?.merchantIsNew !== false; // Default to true if not specified
  const matchedMerchantId = initialData.financial?.merchantId || null;

  // Transaction (document) state
  const [merchant, setMerchant] = useState(
    merchantIsNew
      ? (initialData.financial?.merchantDetails?.name || initialData.financial?.merchant || 'Unknown Merchant')
      : (initialData.financial?.merchant || 'Unknown Merchant')
  );
  const [merchantAbn, setMerchantAbn] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.abn || '') : ''
  );
  const [documentType, setDocumentType] = useState(initialData.documentType || 'receipt');
  const [transactionDate, setTransactionDate] = useState(initialData.financial?.date || new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(initialData.financial?.invoiceNumber || '');

  // Financial state
  const [subtotal, setSubtotal] = useState(initialData.financial?.subtotal?.toString() || '');
  const [tax, setTax] = useState(initialData.financial?.tax?.toString() || '');
  const [total, setTotal] = useState(initialData.financial?.total?.toString() || '0');
  const [paymentStatus, setPaymentStatus] = useState(initialData.financial?.paymentStatus || 'paid');
  const [paymentMethod, setPaymentMethod] = useState(initialData.financial?.paymentMethod || 'card');

  // Merchant details state (Phase 1) - only populate if new merchant
  const [merchantPhone, setMerchantPhone] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.phone || '') : ''
  );
  const [merchantEmail, setMerchantEmail] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.email || '') : ''
  );
  const [merchantWebsite, setMerchantWebsite] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.website || '') : ''
  );
  const [merchantAddress, setMerchantAddress] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.address || '') : ''
  );
  const [merchantSuburb, setMerchantSuburb] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.suburb || '') : ''
  );
  const [merchantState, setMerchantState] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.state || '') : ''
  );
  const [merchantPostcode, setMerchantPostcode] = useState(
    merchantIsNew ? (initialData.financial?.merchantDetails?.postcode || '') : ''
  );
  const [summary, setSummary] = useState(initialData.summary || '');

  // Line items state
  const [items, setItems] = useState<any[]>(initialData.items || []);
  const [isSaving, setIsSaving] = useState(false);

  // Debug state
  const [showRawData, setShowRawData] = useState(false);

  // Preload interstitial ad early
  usePreloadInterstitialAd();
  const { show: showInterstitial } = useInterstitialAd();

  // Check if there are education or event items for conditional save buttons
  const hasEducationOrEvents = useMemo(() => {
    return items.some((item: any) => 
      item.category === 'education' || 
      item.category === 'event' ||
      (item.educationDetails && Object.keys(item.educationDetails).length > 0)
    );
  }, [items]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback: go to home
      router.replace('/');
    }
  }, [router]);

  const performSave = async (): Promise<string | null> => {
    const transactionId = Crypto.randomUUID();

    await TransactionRepository.create({
      id: transactionId,
      merchant,
      merchantAbn: merchantAbn || null,
      merchantPhone: merchantPhone || null,
      merchantEmail: merchantEmail || null,
      merchantWebsite: merchantWebsite || null,
      merchantAddress: merchantAddress || null,
      merchantSuburb: merchantSuburb || null,
      merchantState: merchantState || null,
      merchantPostcode: merchantPostcode || null,
      summary: summary || null,
      documentType,
      transactionDate,
      invoiceNumber: invoiceNumber || null,
      subtotal: subtotal ? Math.round(parseFloat(subtotal) * 100) : null,
      tax: tax ? Math.round(parseFloat(tax) * 100) : null,
      total: Math.round(parseFloat(total) * 100),
      paymentStatus,
      paymentMethod,
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
      notes: item.notes || null,
      confidence: item.confidence || null,
    })));

    return transactionId;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await performSave();

      // Show interstitial ad after successful save
      setTimeout(() => {
        showInterstitial();
      }, 500);

      Alert.alert('Saved!', 'Transaction saved successfully', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (e) {
      console.error('[Review] Save error:', e);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await performSave();

      // Show interstitial ad after successful save
      setTimeout(() => {
        showInterstitial();
      }, 500);

      Alert.alert('Saved!', 'Transaction saved successfully', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (e) {
      console.error('[Review] Save error:', e);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateItemCategory = (index: number, category: string) => {
    const newItems = [...items];
    newItems[index].category = category;
    setItems(newItems);
  };

  // If no data, show empty state instead of redirecting aggressively
  if (!params.data && !params.uri) {
     return (
        <View className="flex-1 justify-center items-center p-6" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
          <Text className="text-white text-xl font-bold mb-4">No Transaction Data</Text>
          <Text className="text-crescender-400 text-center mb-8">No receipt data found. Please try scanning again.</Text>
          <TouchableOpacity 
            onPress={() => router.replace('/')}
            className="bg-gold px-6 py-3 rounded-xl"
          >
            <Text className="text-crescender-950 font-bold">Return Home</Text>
          </TouchableOpacity>
        </View>
     );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Review Scanned Information</Text>
        <TouchableOpacity onPress={() => setShowRawData(!showRawData)} className="p-2 -mr-2">
          <Feather name="code" size={20} color="#f5c518" />
        </TouchableOpacity>
      </View>

      {/* Raw Data Debug View */}
      {showRawData && (
        <View className="bg-crescender-950 border-b border-crescender-800 px-6 py-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gold text-sm font-bold">RAW OPENAI RESPONSE:</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(JSON.stringify(initialData, null, 2));
                Alert.alert('Copied!', 'Raw JSON copied to clipboard');
              }}
              className="bg-gold/20 px-3 py-1 rounded-lg flex-row items-center gap-1"
            >
              <Feather name="copy" size={12} color="#f5c518" />
              <Text className="text-gold text-sm font-bold">Copy</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-60 bg-black/50 p-3 rounded-lg">
            <Text className="text-crescender-300 text-sm font-mono" selectable>
              {JSON.stringify(initialData, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      <ScrollView className="flex-1 px-6 py-4">
        {/* SECTION: Transaction Details */}
        <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
          <Feather name="file-text" size={12} color="#f5c518" /> Transaction Details
        </Text>
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
          {/* Document Type Pills */}
          <View className="mb-4">
            <Text className="text-crescender-400 text-sm mb-2">Document Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {DOCUMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setDocumentType(type.value)}
                    className={`px-3 py-1.5 rounded-full border ${
                      documentType === type.value
                        ? 'bg-gold border-gold'
                        : 'bg-crescender-900/60 border-crescender-700'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${
                      documentType === type.value ? 'text-crescender-950' : 'text-crescender-400'
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
            <Text className="text-crescender-400 text-sm mb-1">Merchant</Text>
            <TextInput
              className="text-white text-lg font-semibold border-b border-crescender-700 py-1"
              value={merchant}
              onChangeText={setMerchant}
              placeholderTextColor="#666"
            />
          </View>

          {/* ABN & Invoice Number Row */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">ABN</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantAbn}
                onChangeText={setMerchantAbn}
                placeholder="XX XXX XXX XXX"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Invoice/Receipt #</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* Date */}
          <View>
            <Text className="text-crescender-400 text-sm mb-1">Date</Text>
            <TextInput
              className="text-white text-lg border-b border-crescender-700 py-1"
              value={transactionDate}
              onChangeText={setTransactionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          {/* Transaction Summary */}
          <View className="mt-4">
            <Text className="text-crescender-400 text-sm mb-1">Transaction Summary (3-10 words)</Text>
            <TextInput
              className="text-white text-lg border-b border-crescender-700 py-1"
              value={summary}
              onChangeText={setSummary}
              placeholder="e.g., Piano purchase with warranty"
              placeholderTextColor="#666"
              maxLength={100}
            />
          </View>
        </View>

        {/* SECTION: Merchant Details */}
        <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
          <Feather name="map-pin" size={12} color="#f5c518" /> Merchant Details
        </Text>
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
          {/* Phone & Email Row */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Phone</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantPhone}
                onChangeText={setMerchantPhone}
                placeholder="(02) 1234 5678"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Email</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantEmail}
                onChangeText={setMerchantEmail}
                placeholder="info@merchant.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Website */}
          <View className="mb-4">
            <Text className="text-crescender-400 text-sm mb-1">Website</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={merchantWebsite}
              onChangeText={setMerchantWebsite}
              placeholder="https://www.merchant.com.au"
              placeholderTextColor="#666"
              keyboardType="url"
            />
          </View>

          {/* Address */}
          <View className="mb-4">
            <Text className="text-crescender-400 text-sm mb-1">Street Address</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={merchantAddress}
              onChangeText={setMerchantAddress}
              placeholder="123 Main Street"
              placeholderTextColor="#666"
            />
          </View>

          {/* Suburb, State, Postcode Row */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Suburb</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantSuburb}
                onChangeText={setMerchantSuburb}
                placeholder="Sydney"
                placeholderTextColor="#666"
              />
            </View>
            <View style={{ width: 80 }}>
              <Text className="text-crescender-400 text-sm mb-1">State</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantState}
                onChangeText={setMerchantState}
                placeholder="NSW"
                placeholderTextColor="#666"
                maxLength={3}
              />
            </View>
            <View style={{ width: 80 }}>
              <Text className="text-crescender-400 text-sm mb-1">Postcode</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantPostcode}
                onChangeText={setMerchantPostcode}
                placeholder="2000"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </View>

        {/* SECTION: Payment Details */}
        <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
          <Feather name="credit-card" size={12} color="#f5c518" /> Payment Details
        </Text>
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
          {/* Payment Status */}
          <View className="mb-4">
            <Text className="text-crescender-400 text-sm mb-2">Payment Status</Text>
            <View className="flex-row gap-2">
              {PAYMENT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() => setPaymentStatus(status.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    paymentStatus === status.value
                      ? `${status.color} border-transparent`
                      : 'bg-crescender-900/60 border-crescender-700'
                  }`}
                >
                  <Text className={`text-sm font-bold ${
                    paymentStatus === status.value ? 'text-white' : 'text-crescender-400'
                  }`}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View className="mb-4">
            <Text className="text-crescender-400 text-sm mb-2">Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    onPress={() => setPaymentMethod(method.value)}
                    className={`px-3 py-1.5 rounded-full border ${
                      paymentMethod === method.value
                        ? 'bg-crescender-600 border-crescender-500'
                        : 'bg-crescender-900/60 border-crescender-700'
                    }`}
                  >
                    <Text className={`text-sm font-bold ${
                      paymentMethod === method.value ? 'text-white' : 'text-crescender-400'
                    }`}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Financial Summary */}
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Subtotal</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={subtotal}
                onChangeText={setSubtotal}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">GST</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={tax}
                onChangeText={setTax}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#666"
              />
            </View>
            <View className="flex-1">
              <Text className="text-crescender-400 text-sm mb-1">Total</Text>
              <TextInput
                className="text-gold text-lg font-bold border-b border-gold py-1"
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* SECTION: Line Items */}
        <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
          <Feather name="list" size={12} color="#f5c518" /> Line Items ({items.length})
        </Text>

        {items.length === 0 ? (
          <View className="bg-crescender-900/20 p-6 rounded-2xl border border-dashed border-crescender-700 items-center mb-6">
            <Feather name="inbox" size={32} color="#666" />
            <Text className="text-crescender-500 mt-2">No items detected</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={index} className="bg-crescender-800/20 p-4 rounded-2xl mb-4 border border-crescender-800">
              {/* Item Header */}
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-4">
                  <Text className="text-white font-bold">{item.description}</Text>
                  {(item.brand || item.model) && (
                    <Text className="text-crescender-400 text-sm mt-1">
                      {[item.brand, item.model].filter(Boolean).join(' ')}
                    </Text>
                  )}
                </View>
                <Text className="text-gold font-bold text-xl">${item.totalPrice?.toFixed(2)}</Text>
              </View>

              {/* Price Details */}
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-crescender-400 text-sm">
                  ${item.unitPrice?.toFixed(2)} × {item.quantity}
                </Text>
                {item.discountAmount && (
                  <View className="bg-green-900/50 px-2 py-0.5 rounded">
                    <Text className="text-green-400 text-sm">-${item.discountAmount.toFixed(2)}</Text>
                  </View>
                )}
                {item.discountPercentage && (
                  <View className="bg-green-900/50 px-2 py-0.5 rounded">
                    <Text className="text-green-400 text-sm">-{item.discountPercentage}%</Text>
                  </View>
                )}
              </View>

              {/* Category Selection */}
              <Text className="text-crescender-500 text-sm mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {ITEM_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => updateItemCategory(index, cat.value)}
                    className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                      item.category === cat.value
                        ? 'bg-gold border-gold'
                        : 'bg-crescender-900/60 border-crescender-700'
                    }`}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={12}
                      color={item.category === cat.value ? '#2e1065' : '#888'}
                    />
                    <Text className={`text-sm font-bold ${
                      item.category === cat.value ? 'text-crescender-950' : 'text-crescender-400'
                    }`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Education Details - Teacher Name */}
              {item.category === 'education' && item.educationDetails && (
                <View className="mt-4 pt-4 border-t border-crescender-700">
                  <Text className="text-crescender-400 text-sm mb-2">Teacher Name</Text>
                  <TextInput
                    className="text-white text-base border-b border-crescender-700 py-1"
                    value={item.educationDetails.teacherName || ''}
                    onChangeText={(text) => {
                      const newItems = [...items];
                      newItems[index].educationDetails = {
                        ...newItems[index].educationDetails,
                        teacherName: text,
                      };
                      setItems(newItems);
                    }}
                    placeholder="Teacher's name"
                    placeholderTextColor="#666"
                  />
                </View>
              )}

              {/* Gear Details */}
              {item.category === 'gear' && item.gearDetails && (
                <View className="mt-4 pt-4 border-t border-crescender-700">
                  <Text className="text-crescender-400 text-sm font-bold mb-3">GEAR DETAILS</Text>

                  {/* Brand & Manufacturer Row */}
                  <View className="flex-row gap-4 mb-3">
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Brand</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.brand || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            brand: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="e.g., Yamaha"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Manufacturer</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.manufacturer || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            manufacturer: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="If different from brand"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>

                  {/* Model Name & Number Row */}
                  <View className="flex-row gap-4 mb-3">
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Model Name</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.modelName || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            modelName: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="e.g., PSR-E373"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Model Number</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.modelNumber || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            modelNumber: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="SKU or model #"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>

                  {/* Serial Number */}
                  <View className="mb-3">
                    <Text className="text-crescender-500 text-sm mb-1">Serial Number</Text>
                    <TextInput
                      className="text-gold text-base font-mono border-b border-gold py-1"
                      value={item.gearDetails.serialNumber || ''}
                      onChangeText={(text) => {
                        const newItems = [...items];
                        newItems[index].gearDetails = {
                          ...newItems[index].gearDetails,
                          serialNumber: text,
                        };
                        setItems(newItems);
                      }}
                      placeholder="Serial number"
                      placeholderTextColor="#666"
                    />
                  </View>

                  {/* Colour & Size Row */}
                  <View className="flex-row gap-4 mb-3">
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Colour</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.colour || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            colour: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="e.g., Sunburst"
                        placeholderTextColor="#666"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-crescender-500 text-sm mb-1">Size</Text>
                      <TextInput
                        className="text-white text-base border-b border-crescender-700 py-1"
                        value={item.gearDetails.size || ''}
                        onChangeText={(text) => {
                          const newItems = [...items];
                          newItems[index].gearDetails = {
                            ...newItems[index].gearDetails,
                            size: text,
                          };
                          setItems(newItems);
                        }}
                        placeholder="e.g., 3/4, Full Size"
                        placeholderTextColor="#666"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        {/* Bottom padding for scroll */}
        <View className="h-4" />
      </ScrollView>

      {/* Save Buttons */}
      <View
        className="px-6 py-4 bg-crescender-950 border-t border-crescender-800"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {hasEducationOrEvents ? (
          // Dual buttons for education/event items
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
                  // Save first
                  const transactionId = await performSave();
                  if (!transactionId) throw new Error('Failed to save');
                  
                  // Then add events to calendar
                  const receipt = {
                    id: transactionId,
                    merchant,
                    transactionDate,
                  } as any;
                  
                  // Find education items and add to calendar
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
                        console.error('Failed to add education series to calendar:', e);
                      }
                    }
                  }
                  
                  // Show interstitial ad
                  setTimeout(() => {
                    showInterstitial();
                  }, 500);
                  
                  Alert.alert('Success', 'Transaction saved and events added to calendar', [
                    { text: 'OK', onPress: () => router.replace('/') }
                  ]);
                } catch (e) {
                  console.error('Save + Calendar error:', e);
                  Alert.alert('Error', 'Failed to save or add to calendar. Please try again.');
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
          // Single button for regular transactions
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
    </View>
  );
}
