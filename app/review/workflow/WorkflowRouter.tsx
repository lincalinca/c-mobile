/**
 * Workflow Router
 * 
 * Manages navigation between workflow steps
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ReviewWorkflowState, WorkflowStep, analyzeMissingData, getNextStep, countItemsByCategory } from '@lib/reviewWorkflow';
import { TransactionRepository } from '@lib/repository';
import { ProcessingQueueRepository } from '@lib/processingQueue';
import { useUploadStore } from '@lib/stores/uploadStore';
import { useInterstitialAd, usePreloadInterstitialAd } from '@components/ads';
import WorkflowTitlePage from './WorkflowTitlePage';
import WorkflowMissingDataPage from './WorkflowMissingDataPage';
import WorkflowTransactionPage from './WorkflowTransactionPage';
import WorkflowGearPage from './WorkflowGearPage';
import WorkflowServicesPage from './WorkflowServicesPage';
import WorkflowEducationPage from './WorkflowEducationPage';
import WorkflowEventsPage from './WorkflowEventsPage';

export default function ReviewWorkflow() {
  const params = useLocalSearchParams<{ data: string; uri: string; queueItemId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [workflowState, setWorkflowState] = useState<ReviewWorkflowState | null>(null);

  // Get Zustand store for bulk upload cleanup
  const { removeItem: removeUploadItem } = useUploadStore();

  // Preload interstitial ad
  usePreloadInterstitialAd();
  const { show: showInterstitial } = useInterstitialAd();

  const initialData = useMemo(() => {
    try {
      return JSON.parse(params.data || '{}');
    } catch (e) {
      return {};
    }
  }, [params.data]);

  // Extract params values to avoid object reference issues
  const paramsData = params.data || '';
  const paramsUri = params.uri || '';

  useEffect(() => {
    // Initialize workflow state from initial data
    const merchantIsNew = initialData.financial?.merchantIsNew !== false;
    
    const state: ReviewWorkflowState = {
      merchant: merchantIsNew
        ? (initialData.financial?.merchantDetails?.name || initialData.financial?.merchant || 'Unknown Merchant')
        : (initialData.financial?.merchant || 'Unknown Merchant'),
      merchantAbn: merchantIsNew ? (initialData.financial?.merchantDetails?.abn || '') : '',
      documentType: initialData.documentType || 'receipt',
      transactionDate: initialData.financial?.date || new Date().toISOString().split('T')[0],
      invoiceNumber: initialData.financial?.invoiceNumber || '',
      subtotal: initialData.financial?.subtotal?.toString() || '',
      tax: initialData.financial?.tax?.toString() || '',
      total: initialData.financial?.total?.toString() || '0',
      paymentStatus: initialData.financial?.paymentStatus || 'paid',
      paymentMethod: initialData.financial?.paymentMethod || 'card',
      summary: initialData.summary || '',
      merchantPhone: merchantIsNew ? (initialData.financial?.merchantDetails?.phone || '') : '',
      merchantEmail: merchantIsNew ? (initialData.financial?.merchantDetails?.email || '') : '',
      merchantWebsite: merchantIsNew ? (initialData.financial?.merchantDetails?.website || '') : '',
      merchantAddress: merchantIsNew ? (initialData.financial?.merchantDetails?.address || '') : '',
      merchantSuburb: merchantIsNew ? (initialData.financial?.merchantDetails?.suburb || '') : '',
      merchantState: merchantIsNew ? (initialData.financial?.merchantDetails?.state || '') : '',
      merchantPostcode: merchantIsNew ? (initialData.financial?.merchantDetails?.postcode || '') : '',
      items: initialData.items || [],
      currentStep: 'title',
      completedSteps: new Set(),
      imageUri: paramsUri,
      rawOcrData: paramsData,
      merchantIsNew,
      matchedMerchantId: initialData.financial?.merchantId || null,
    };
    
    setWorkflowState(state);
    setLoading(false);
  }, [initialData, paramsData, paramsUri]);

  const updateState = (updates: Partial<ReviewWorkflowState>) => {
    setWorkflowState(prev => prev ? { ...prev, ...updates } : null);
  };

  const navigateToStep = (step: WorkflowStep) => {
    if (!workflowState) return;
    
    const completed = new Set(workflowState.completedSteps);
    completed.add(workflowState.currentStep);
    
    updateState({
      currentStep: step,
      completedSteps: completed,
    });
  };

  const handleNext = () => {
    if (!workflowState) return;
    
    const counts = countItemsByCategory(workflowState.items);
    const missingData = analyzeMissingData(workflowState.items);
    const hasMissingData = missingData.some(m => m.required);
    
    const next = getNextStep(
      workflowState.currentStep,
      hasMissingData,
      counts.gear > 0,
      counts.services > 0,
      counts.education > 0,
      counts.events > 0
    );
    
    if (next) {
      navigateToStep(next);
    }
  };

  const handleBack = () => {
    if (!workflowState) return;
    
    // Simple back navigation - could be enhanced with history
    if (workflowState.currentStep === 'title') {
      router.back();
    } else {
      navigateToStep('title');
    }
  };

  const performSave = async (): Promise<string | null> => {
    if (!workflowState) return null;
    
    const transactionId = Crypto.randomUUID();

    await TransactionRepository.create({
      id: transactionId,
      merchant: workflowState.merchant,
      merchantAbn: workflowState.merchantAbn || null,
      merchantPhone: workflowState.merchantPhone || null,
      merchantEmail: workflowState.merchantEmail || null,
      merchantWebsite: workflowState.merchantWebsite || null,
      merchantAddress: workflowState.merchantAddress || null,
      merchantSuburb: workflowState.merchantSuburb || null,
      merchantState: workflowState.merchantState || null,
      merchantPostcode: workflowState.merchantPostcode || null,
      summary: workflowState.summary || null,
      documentType: workflowState.documentType,
      transactionDate: workflowState.transactionDate,
      invoiceNumber: workflowState.invoiceNumber || null,
      subtotal: workflowState.subtotal ? Math.round(parseFloat(workflowState.subtotal) * 100) : null,
      tax: workflowState.tax ? Math.round(parseFloat(workflowState.tax) * 100) : null,
      total: Math.round(parseFloat(workflowState.total) * 100),
      paymentStatus: workflowState.paymentStatus,
      paymentMethod: workflowState.paymentMethod,
      imageUrl: workflowState.imageUri,
      rawOcrData: workflowState.rawOcrData,
      syncStatus: 'pending',
    }, workflowState.items.map((item: any) => ({
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

  const handleSaveAndExit = useCallback(async () => {
    if (!workflowState) return;

    try {
      await performSave();

      // Clean up queue item if this came from bulk upload
      if (params.queueItemId) {
        try {
          await ProcessingQueueRepository.removeItem(params.queueItemId);
          console.log('[Workflow] Removed queue item:', params.queueItemId);
        } catch (e) {
          console.warn('[Workflow] Failed to remove queue item:', e);
        }

        // Also remove from Zustand upload store
        // Find the upload item by queueItemId
        const uploadStore = useUploadStore.getState();
        const uploadItem = uploadStore.items.find(item => item.queueItemId === params.queueItemId);
        if (uploadItem) {
          removeUploadItem(uploadItem.id);
          console.log('[Workflow] Removed upload item:', uploadItem.id);
        }
      }

      // Show interstitial ad
      setTimeout(() => {
        showInterstitial();
      }, 500);

      Alert.alert('Saved!', 'Transaction saved successfully', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (e) {
      console.error('[Workflow] Save error:', e);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  }, [workflowState, params.queueItemId, removeUploadItem, showInterstitial, router]);

  // Auto-save when reaching complete step
  useEffect(() => {
    if (workflowState?.currentStep === 'complete') {
      handleSaveAndExit();
    }
  }, [workflowState?.currentStep, handleSaveAndExit]);

  if (loading || !workflowState) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a0b4c', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#f5c518" />
        <Text style={{ color: 'white', marginTop: 16 }}>Preparing review...</Text>
      </View>
    );
  }

  // Render current step
  switch (workflowState.currentStep) {
    case 'title':
      return (
        <WorkflowTitlePage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          updateState={updateState}
        />
      );
    
    case 'missing-data':
      return (
        <WorkflowMissingDataPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          updateState={updateState}
        />
      );
    
    case 'transaction':
      return (
        <WorkflowTransactionPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          onSaveAndExit={handleSaveAndExit}
          updateState={updateState}
        />
      );
    
    case 'gear':
      return (
        <WorkflowGearPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          onSaveAndExit={handleSaveAndExit}
          updateState={updateState}
        />
      );
    
    case 'services':
      return (
        <WorkflowServicesPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          onSaveAndExit={handleSaveAndExit}
          updateState={updateState}
        />
      );
    
    case 'education':
      return (
        <WorkflowEducationPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          onSaveAndExit={handleSaveAndExit}
          updateState={updateState}
        />
      );
    
    case 'events':
      return (
        <WorkflowEventsPage
          workflowState={workflowState}
          onNext={handleNext}
          onBack={handleBack}
          onSaveAndExit={handleSaveAndExit}
          updateState={updateState}
        />
      );
    
    case 'complete':
      // Final save page - auto-save and redirect (handled by useEffect)
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a0b4c', paddingTop: insets.top }}>
          <ActivityIndicator size="large" color="#f5c518" />
          <Text style={{ color: 'white', marginTop: 16 }}>Saving transaction...</Text>
        </View>
      );
    
    default:
      return (
        <View style={{ flex: 1, backgroundColor: '#2a0b4c', paddingTop: insets.top }}>
          <Text style={{ color: 'white' }}>Unknown step</Text>
        </View>
      );
  }
}
