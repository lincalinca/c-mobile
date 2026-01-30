/**
 * ReviewContent - Main Orchestrator Component
 * Brings together all review sections and handles save logic
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { TransactionRepository } from '@lib/repository';
import { ProcessingQueueRepository } from '@lib/processingQueue';
import { useUploadStore } from '@lib/stores/uploadStore';
import { useInterstitialAd, usePreloadInterstitialAd } from '@components/ads';
import { getEducationSeriesSummary } from '@lib/educationEvents';
import { addEducationSeriesToDeviceCalendar } from '@lib/calendarExport';
import { detectNewPeople, findBestMatchingPerson } from '@lib/peopleDetection';
import { AddPersonModal } from './AddPersonModal';
import { StudentRepository } from '@lib/repository';

import { useReviewState } from '@app/review/useReviewState';
import type { ReviewInitialData, ReviewLineItem } from '@app/review/types';
import { SectionTitle } from './FormFields';
import { ReviewTransactionSection } from './ReviewTransactionSection';
import { ReviewMerchantSection } from './ReviewMerchantSection';
import { ReviewPaymentSection } from './ReviewPaymentSection';
import { ReviewLineItemCard } from './ReviewLineItemCard';
import { ReviewSaveFooter } from './ReviewSaveFooter';

// ============================================================================
// Debug View Component
// ============================================================================

interface DebugViewProps {
  visible: boolean;
  initialData: ReviewInitialData;
}

function DebugView({ visible, initialData }: DebugViewProps) {
  if (!visible) return null;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(JSON.stringify(initialData, null, 2));
    Alert.alert('Copied!', 'Raw JSON copied to clipboard');
  };

  return (
    <View className="bg-crescender-950 border-b border-crescender-800 px-6 py-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gold text-sm font-bold">RAW OPENAI RESPONSE:</Text>
        <TouchableOpacity
          onPress={handleCopy}
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
  );
}

// ============================================================================
// New Person Modal Component (Advanced)
// ============================================================================

interface NewPersonModalProps {
  visible: boolean;
  personName: string | null;
  bestMatch: { person: any; confidence: number } | null;
  onAction: (action: 'add' | 'remind' | 'skip' | 'assign', match?: any) => void;
}

function NewPersonModal({ visible, personName, bestMatch, onAction }: NewPersonModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onAction('skip')}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-crescender-900 rounded-2xl p-6 border border-crescender-700 max-w-md w-full">
          <Text className="text-white text-xl font-bold mb-2">New Person Detected</Text>
          <Text className="text-crescender-300 text-base mb-6">
            We found "{personName}" in this transaction. Is this a new person?
          </Text>

          {bestMatch && bestMatch.confidence > 0.4 && (
             <TouchableOpacity
              onPress={() => onAction('assign', bestMatch.person)}
              className="bg-crescender-800 border border-gold/30 p-4 rounded-xl mb-4 flex-row items-center gap-3"
            >
              <View className="bg-gold/10 p-2 rounded-full">
                <Feather name="user-check" size={20} color="#f5c518" />
              </View>
              <View className="flex-1">
                <Text className="text-gold font-bold text-base">Match: {bestMatch.person.name}</Text>
                <Text className="text-crescender-400 text-xs">Assign this item to {bestMatch.person.name}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#f5c518" />
            </TouchableOpacity>
          )}

          <View className="gap-3">
            <TouchableOpacity
              onPress={() => onAction('add')}
              className="bg-gold p-4 rounded-xl flex-row justify-center items-center gap-2"
            >
              <Feather name="plus-circle" size={18} color="#2e1065" />
              <Text className="text-black font-bold text-lg">Add {personName} Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onAction('remind')}
              className="bg-crescender-800 p-4 rounded-xl flex-row justify-center items-center gap-2"
            >
              <Feather name="clock" size={18} color="#e2e8f0" />
              <Text className="text-white font-semibold text-lg">Remind Me Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onAction('skip')}
              className="p-2"
            >
              <Text className="text-crescender-400 font-semibold text-center text-base">No, Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Empty Items State Component
// ============================================================================

function EmptyItemsState() {
  return (
    <View className="bg-crescender-900/20 p-6 rounded-2xl border border-dashed border-crescender-700 items-center mb-6">
      <Feather name="inbox" size={32} color="#666" />
      <Text className="text-crescender-500 mt-2">No items detected</Text>
    </View>
  );
}

// ============================================================================
// Main Review Content Component
// ============================================================================

interface ReviewContentProps {
  queueItemId?: string;
  initialData: ReviewInitialData;
  imageUri: string;
  rawData: string;
}

export function ReviewContent({ initialData, imageUri, rawData, queueItemId }: ReviewContentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State management via custom hook
  const {
    state,
    setField,
    setMerchantIsNew,
    updateItemCategory,
    updateItemEducation,
    updateItemGear,
    hasEducationOrEvents,
  } = useReviewState(initialData);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [detectedPersonName, setDetectedPersonName] = useState<string | null>(null);
  const [bestMatchPerson, setBestMatchPerson] = useState<{ person: any; confidence: number } | null>(null);
  const [showPersonPrompt, setShowPersonPrompt] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  // Preload interstitial ad early
  usePreloadInterstitialAd();
  const { show: showInterstitial } = useInterstitialAd();

  // Detect new people from events/education items
  useEffect(() => {
    const checkForNewPeople = async () => {
      if (state.items.length === 0) return;

      try {
        const newNames = await detectNewPeople(state.items);
        if (newNames.length > 0) {
          const name = newNames[0];
          setDetectedPersonName(name);

          // Find potential match
          const match = await findBestMatchingPerson(name);
          setBestMatchPerson(match);

          setShowPersonPrompt(true);
        }
      } catch (e) {
        console.error('Failed to detect new people', e);
      }
    };

    const timeout = setTimeout(checkForNewPeople, 500);
    return () => clearTimeout(timeout);
  }, [state.items]);

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handlePersonPromptAction = async (action: 'add' | 'remind' | 'skip' | 'assign', match?: any) => {
    setShowPersonPrompt(false);

    if (action === 'add') {
      // Open add person modal without leaving page
      setShowAddPersonModal(true);
    } else if (action === 'assign' && match) {
      // Logic to assign this person to the current item(s)
      // We assume the first found name corresponds to the first education item or all relevant items
      if (detectedPersonName) {
        // Iterate items and update studentName if it matches detected name
        // Or simpler: update all education items to use this person's name
        // Ideally we find the specific item. detectNewPeople logic iterates all items.
        // For now, let's update ALL education items with this person's name if they had a missing or similar name
        // Or just override.
        state.items.forEach((item, index) => {
          if (item.category === 'education' && item.educationDetails) {
             const details = typeof item.educationDetails === 'string' ? JSON.parse(item.educationDetails) : item.educationDetails;
             if (details.studentName === detectedPersonName) {
               updateItemEducation(index, { ...details, studentName: match.name });
             }
          }
        });
        Alert.alert('Assigned', `Items assigned to ${match.name}`);
      }
      setDetectedPersonName(null);
    } else if (action === 'remind') {
      // Create draft person
      if (detectedPersonName) {
        const id = Crypto.randomUUID();
        await StudentRepository.create({
          id,
          name: detectedPersonName,
          status: 'draft',
          relationship: 'student',
          notes: 'Added from Receipt Review'
        });
        Alert.alert('Reminder Set', `${detectedPersonName} added to People as a draft.`);
      }
      setDetectedPersonName(null);
    } else {
      // Skip
      setDetectedPersonName(null);
    }
  };

  const handleAddPersonComplete = (personId: string, name: string) => {
    // Auto-update items with this new name
    if (detectedPersonName) {
      state.items.forEach((item, index) => {
          if (item.category === 'education' && item.educationDetails) {
             const details = typeof item.educationDetails === 'string' ? JSON.parse(item.educationDetails) : item.educationDetails;
             if (details.studentName === detectedPersonName) {
               updateItemEducation(index, { ...details, studentName: name });
             }
          }
      });
    }
    setDetectedPersonName(null);
  };

  // Generic field change handler
  const handleFieldChange = useCallback((field: string, value: string) => {
    setField(field as keyof typeof state, value);
  }, [setField]);

  // Save logic
  const performSave = async (): Promise<string | null> => {
    const transactionId = Crypto.randomUUID();

    await TransactionRepository.create({
      id: transactionId,
      merchant: state.merchant,
      merchantAbn: state.merchantAbn || null,
      merchantPhone: state.merchantPhone || null,
      merchantEmail: state.merchantEmail || null,
      merchantWebsite: state.merchantWebsite || null,
      merchantAddress: state.merchantAddress || null,
      merchantSuburb: state.merchantSuburb || null,
      merchantState: state.merchantState || null,
      merchantPostcode: state.merchantPostcode || null,
      summary: state.summary || null,
      documentType: state.documentType,
      transactionDate: state.transactionDate,
      invoiceNumber: state.invoiceNumber || null,
      subtotal: state.subtotal ? Math.round(parseFloat(state.subtotal) * 100) : null,
      tax: state.tax ? Math.round(parseFloat(state.tax) * 100) : null,
      total: Math.round(parseFloat(state.total) * 100),
      paymentStatus: state.paymentStatus,
      paymentMethod: state.paymentMethod,
      imageUrl: imageUri,
      rawOcrData: rawData,
      syncStatus: 'pending',
    }, state.items.map((item: ReviewLineItem) => ({
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

      if (queueItemId) {
        try {
          await ProcessingQueueRepository.removeItem(queueItemId);
          console.log('[Review] Removed queue item:', queueItemId);
        } catch (e) {
          console.warn('[Review] Failed to remove queue item:', e);
        }

        const uploadStore = useUploadStore.getState();
        const uploadItem = uploadStore.items.find(item => item.queueItemId === queueItemId);
        if (uploadItem) {
          uploadStore.removeItem(uploadItem.id);
          console.log('[Review] Removed upload item:', uploadItem.id);
        }
      }

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

  const handleSaveWithCalendar = async () => {
    setIsSaving(true);
    try {
      const transactionId = await performSave();
      if (!transactionId) throw new Error('Failed to save');

      const receipt = {
        id: transactionId,
        merchant: state.merchant,
        transactionDate: state.transactionDate,
      } as any;

      // Find education items and add to calendar
      for (const item of state.items) {
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
  };

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

      {/* Debug View */}
      <DebugView visible={showRawData} initialData={initialData} />

      {/* Main Content */}
      <ScrollView className="flex-1 px-6 py-4">
        {/* Transaction Details Section */}
        <ReviewTransactionSection
          merchant={state.merchant}
          merchantAbn={state.merchantAbn}
          documentType={state.documentType}
          transactionDate={state.transactionDate}
          invoiceNumber={state.invoiceNumber}
          summary={state.summary}
          onFieldChange={handleFieldChange}
        />

        {/* Merchant Details Section */}
        <ReviewMerchantSection
          merchantIsNew={state.merchantIsNew}
          merchant={state.merchant}
          merchantPhone={state.merchantPhone}
          merchantEmail={state.merchantEmail}
          merchantWebsite={state.merchantWebsite}
          merchantAddress={state.merchantAddress}
          merchantSuburb={state.merchantSuburb}
          merchantState={state.merchantState}
          merchantPostcode={state.merchantPostcode}
          onFieldChange={handleFieldChange}
          onSetMerchantIsNew={setMerchantIsNew}
        />

        {/* Payment Details Section */}
        <ReviewPaymentSection
          paymentStatus={state.paymentStatus}
          paymentMethod={state.paymentMethod}
          subtotal={state.subtotal}
          tax={state.tax}
          total={state.total}
          onFieldChange={handleFieldChange}
        />

        {/* Line Items Section */}
        <SectionTitle
          icon={<Feather name="list" size={12} color="#f5c518" />}
          title={`Line Items (${state.items.length})`}
        />

        {state.items.length === 0 ? (
          <EmptyItemsState />
        ) : (
          state.items.map((item, index) => (
            <ReviewLineItemCard
              key={index}
              item={item}
              index={index}
              transactionDate={state.transactionDate}
              onCategoryChange={updateItemCategory}
              onEducationUpdate={updateItemEducation}
              onGearUpdate={updateItemGear}
            />
          ))
        )}

        {/* Bottom padding for scroll */}
        <View className="h-4" />
      </ScrollView>

      {/* New Person Detection Modal */}
      <NewPersonModal
        visible={showPersonPrompt}
        personName={detectedPersonName}
        bestMatch={bestMatchPerson}
        onAction={handlePersonPromptAction}
      />

      {/* Add Person Modal (Inline) */}
      <AddPersonModal
        visible={showAddPersonModal}
        initialName={detectedPersonName || ''}
        onClose={() => setShowAddPersonModal(false)}
        onPersonAdded={handleAddPersonComplete}
      />

      {/* Save Footer */}
      <ReviewSaveFooter
        hasEducationOrEvents={hasEducationOrEvents}
        isSaving={isSaving}
        onSave={handleSave}
        onSaveWithCalendar={handleSaveWithCalendar}
      />
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
