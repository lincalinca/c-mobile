/**
 * Review Monolithic (Refactored)
 *
 * Main entry point for the review screen.
 * Parses URL params and renders the ReviewContent component.
 *
 * This is a refactored version using data-driven, modular components
 * with full separation of concerns.
 */

import { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionRepository } from '@lib/repository';

import { ReviewContent } from './components';
import type { ReviewInitialData } from './types';

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  onReturnHome: () => void;
}

function EmptyState({ onReturnHome }: EmptyStateProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 justify-center items-center p-6"
      style={{ backgroundColor: 'transparent', paddingTop: insets.top }}
    >
      <Text className="text-white text-xl font-bold mb-4">No Transaction Data</Text>
      <Text className="text-crescender-400 text-center mb-8">
        No receipt data found. Please try scanning again.
      </Text>
      <TouchableOpacity
        onPress={onReturnHome}
        className="bg-gold px-6 py-3 rounded-xl"
      >
        <Text className="text-crescender-950 font-bold">Return Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReviewMonolithicRefactored() {
  const params = useLocalSearchParams<{ data: string; uri: string; queueItemId?: string; transactionId?: string }>();
  const router = useRouter();

  const [draftData, setDraftData] = useState<ReviewInitialData | null>(null);

  useEffect(() => {
    if (params.transactionId) {
      // Use helper internal to this effect or assume sync for now?
      // Since component function is sync, we need async fetching inside useEffect
      const fetchDraft = async () => {
        try {
          const trans = await TransactionRepository.getById(params.transactionId!);
          if (trans) {
            const items = await TransactionRepository.getLineItems(params.transactionId!);
            // Transform transaction to InitialData format used by ReviewContent
            // This needs to match the structure expected by useReviewState
            // Simplified transformation:
            setDraftData({
              financial: {
                merchant: trans.merchant,
                date: trans.transactionDate,
                total: trans.total / 100,
              },
              items: items.map((i: any) => ({
                description: i.description,
                totalPrice: i.totalPrice / 100,
                unitPrice: i.unitPrice / 100,
                quantity: i.quantity,
                category: i.category,
                // ... map other fields if needed
              }))
            });
            // Actually, for manual entry, it might be better to pass the draft directly.
            // But staying within Monolithic architecture:
            // Let's fetch the rawOcrData which we saved!
            // We trust the DB items for drafts, no need to re-parse rawOcrData
            // which might just be the manual form state without 'items' array.
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchDraft();
    }
  }, [params.transactionId]);

  // Parse initial data from URL params or use loaded draft
  const initialData = useMemo<ReviewInitialData>(() => {
    if (draftData) return draftData;
    try {
      if (params.data) return JSON.parse(params.data);
      return {};
    } catch (e) {
      return {};
    }
  }, [params.data, draftData]);

  // If no data, show empty state
  if (!params.data && !params.uri && !draftData && !params.transactionId) {
    return <EmptyState onReturnHome={() => router.replace('/')} />;
  }

  return (
    <ReviewContent
      queueItemId={params.queueItemId}
      initialData={initialData}
      imageUri={params.uri}
      rawData={params.data}
      transactionId={params.transactionId}
    />
  );
}
