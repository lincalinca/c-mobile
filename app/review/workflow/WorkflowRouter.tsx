/**
 * Workflow Router
 * 
 * Manages navigation between workflow steps
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  const params = useLocalSearchParams<{ data: string; uri: string; queueItemId?: string; transactionId?: string }>();
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

  const paramsTransactionId = params.transactionId as string | undefined;
  const dataCreatedRef = useRef(false);

  useEffect(() => {
    const initWorkflow = async () => {
      // 1. Existing Draft: Load from DB
      if (paramsTransactionId) {
        try {
          const txn = await TransactionRepository.getById(paramsTransactionId);
          if (!txn) {
            console.error('Transaction not found:', paramsTransactionId);
            return;
          }
          const items = await TransactionRepository.getLineItems(paramsTransactionId);
          
          setWorkflowState({
            transactionId: txn.id,
            merchant: txn.merchant,
            merchantAbn: txn.merchantAbn || '',
            documentType: txn.documentType,
            transactionDate: txn.transactionDate,
            invoiceNumber: txn.invoiceNumber || '',
            subtotal: (txn.subtotal ? txn.subtotal / 100 : 0).toString(),
            tax: (txn.tax ? txn.tax / 100 : 0).toString(),
            total: (txn.total / 100).toString(),
            paymentStatus: txn.paymentStatus || 'paid',
            paymentMethod: txn.paymentMethod || 'card',
            summary: txn.summary || '',
            merchantPhone: txn.merchantPhone || '',
            merchantEmail: txn.merchantEmail || '',
            merchantWebsite: txn.merchantWebsite || '',
            merchantAddress: txn.merchantAddress || '',
            merchantSuburb: txn.merchantSuburb || '',
            merchantState: txn.merchantState || '',
            merchantPostcode: txn.merchantPostcode || '',
            items: items as any[],
            currentStep: 'title',
            completedSteps: new Set(),
            imageUri: txn.imageUrl || '',
            rawOcrData: txn.rawOcrData || '',
            merchantIsNew: false,
            matchedMerchantId: null,
          });
        } catch (e) {
          console.error('Failed to load transaction:', e);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2. Legacy Data (Camera/Upload): Auto-create draft
      if (initialData && !dataCreatedRef.current) {
        dataCreatedRef.current = true; // Prevent double creation
        try {
          // Parse data
          const merchantIsNew = initialData.financial?.merchantIsNew !== false;
          const transactionId = Crypto.randomUUID();
          
          const newTxn = {
            id: transactionId,
            merchant: merchantIsNew
              ? (initialData.financial?.merchantDetails?.name || initialData.financial?.merchant || 'Unknown Merchant')
              : (initialData.financial?.merchant || 'Unknown Merchant'),
            merchantAbn: merchantIsNew ? (initialData.financial?.merchantDetails?.abn || '') : '',
            merchantPhone: merchantIsNew ? (initialData.financial?.merchantDetails?.phone || '') : '',
            merchantEmail: merchantIsNew ? (initialData.financial?.merchantDetails?.email || '') : '',
            merchantWebsite: merchantIsNew ? (initialData.financial?.merchantDetails?.website || '') : '',
            merchantAddress: merchantIsNew ? (initialData.financial?.merchantDetails?.address || '') : '',
            merchantSuburb: merchantIsNew ? (initialData.financial?.merchantDetails?.suburb || '') : '',
            merchantState: merchantIsNew ? (initialData.financial?.merchantDetails?.state || '') : '',
            merchantPostcode: merchantIsNew ? (initialData.financial?.merchantDetails?.postcode || '') : '',
            summary: initialData.summary || '',
            documentType: (initialData.documentType || 'receipt') as any,
            transactionDate: initialData.financial?.date || new Date().toISOString().split('T')[0],
            invoiceNumber: initialData.financial?.invoiceNumber || '',
            subtotal: initialData.financial?.subtotal ? Math.round(parseFloat(initialData.financial.subtotal) * 100) : null,
            tax: initialData.financial?.tax ? Math.round(parseFloat(initialData.financial.tax) * 100) : null,
            total: Math.round((parseFloat(initialData.financial?.total) || 0) * 100),
            paymentStatus: (initialData.financial?.paymentStatus || 'paid') as any,
            paymentMethod: (initialData.financial?.paymentMethod || 'card') as any,
            imageUrl: params.uri || '',
            rawOcrData: params.data || '',
            syncStatus: 'pending' as const,
          };

          const newItems = (initialData.items || []).map((item: any) => ({
            id: Crypto.randomUUID(),
            transactionId,
            description: item.description,
            category: item.category || 'other',
            brand: item.brand || null,
            model: item.model || null,
            quantity: item.quantity || 1,
            unitPrice: Math.round((item.unitPrice || 0) * 100),
            totalPrice: Math.round((item.totalPrice || 0) * 100),
            gearDetails: item.gearDetails ? JSON.stringify(item.gearDetails) : null,
            educationDetails: item.educationDetails ? JSON.stringify(item.educationDetails) : null,
            serviceDetails: item.serviceDetails ? JSON.stringify(item.serviceDetails) : null,
            notes: item.notes || null,
          }));

          // Save to DB immediately
          await TransactionRepository.createDraft(newTxn, newItems);
          
          // Update URL to prevent re-creation on refresh
          router.setParams({ transactionId, data: undefined });

          // Initialize State
          setWorkflowState({
            transactionId,
            merchant: newTxn.merchant,
            merchantAbn: newTxn.merchantAbn || '',
            documentType: newTxn.documentType,
            transactionDate: newTxn.transactionDate,
            invoiceNumber: newTxn.invoiceNumber || '',
            subtotal: (newTxn.subtotal ? newTxn.subtotal / 100 : 0).toString(),
            tax: (newTxn.tax ? newTxn.tax / 100 : 0).toString(),
            total: (newTxn.total / 100).toString(),
            paymentStatus: newTxn.paymentStatus,
            paymentMethod: newTxn.paymentMethod,
            summary: newTxn.summary || '',
            merchantPhone: newTxn.merchantPhone || '',
            merchantEmail: newTxn.merchantEmail || '',
            merchantWebsite: newTxn.merchantWebsite || '',
            merchantAddress: newTxn.merchantAddress || '',
            merchantSuburb: newTxn.merchantSuburb || '',
            merchantState: newTxn.merchantState || '',
            merchantPostcode: newTxn.merchantPostcode || '',
            items: newItems,
            currentStep: 'title',
            completedSteps: new Set(),
            imageUri: newTxn.imageUrl || '',
            rawOcrData: newTxn.rawOcrData || '',
            merchantIsNew,
            matchedMerchantId: initialData.financial?.merchantId || null,
          });
        } catch (e) {
          console.error('Failed to auto-create draft:', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    initWorkflow();
  }, [initialData, params.data, params.uri, paramsTransactionId]);

  const updateState = (updates: Partial<ReviewWorkflowState>) => {
    setWorkflowState(prev => {
       if (!prev) return null;
       const newState = { ...prev, ...updates };
       
       // Optimization: If we have a transactionId, we *could* save to DB here.
       // For now, we rely on final save, OR implement specific save points.
       // Ideally, updating items array should trigger a DB update.
       
       return newState;
    });
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
    
    // TODO: Sync to DB here if using persistence to prevent data loss on crash
    
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

  /**
   * Creates a NEW transaction (Legacy support)
   */
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
      documentType: workflowState.documentType as any,
      transactionDate: workflowState.transactionDate,
      invoiceNumber: workflowState.invoiceNumber || null,
      subtotal: workflowState.subtotal ? Math.round(parseFloat(workflowState.subtotal) * 100) : null,
      tax: workflowState.tax ? Math.round(parseFloat(workflowState.tax) * 100) : null,
      total: Math.round(parseFloat(workflowState.total) * 100),
      paymentStatus: workflowState.paymentStatus as any,
      paymentMethod: workflowState.paymentMethod as any,
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

  /**
   * Synchronizes current workflow state to DB (for existing Draft)
   * Used before confirming
   */
  const syncDraftToDb = async (id: string) => {
    if (!workflowState) return;
    
    // Update Transaction
    await TransactionRepository.update(id, {
      merchant: workflowState.merchant,
      // ... update other transaction fields
      total: Math.round(parseFloat(workflowState.total) * 100),
      summary: workflowState.summary,
      transactionDate: workflowState.transactionDate,
    });
    
    // Replace Items (easiest way to sync changed array)
    // In a more granular system we'd update specific lines, but for 'Save & Exit' this is safe
    const newItems = workflowState.items.map((item: any) => ({
      id: item.id || Crypto.randomUUID(),
      transactionId: id,
      description: item.description,
      category: item.category || 'other',
      brand: item.brand || null,
      model: item.model || null,
      quantity: item.quantity || 1,
      unitPrice: Math.round((item.unitPrice || 0) * 100),
      totalPrice: Math.round((item.totalPrice || 0) * 100),
      gearDetails: item.gearDetails ? JSON.stringify(item.gearDetails) : null,
      educationDetails: item.educationDetails ? JSON.stringify(item.educationDetails) : null,
      serviceDetails: item.serviceDetails ? JSON.stringify(item.serviceDetails) : null,
      // ... map other fields
    }));
    
    await TransactionRepository.replaceLineItems(id, newItems as any);
  };

  const handleSaveAndExit = useCallback(async () => {
    if (!workflowState) return;

    try {
      if (workflowState.transactionId) {
        // Mode A: Confirm Draft (Persistence)
        await syncDraftToDb(workflowState.transactionId); // Ensure latest state is saved
        await TransactionRepository.confirmDraft(workflowState.transactionId);
      } else {
        // Mode B: Create New (Legacy)
        await performSave();
      }

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
