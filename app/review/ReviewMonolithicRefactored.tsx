/**
 * Review Monolithic (Refactored)
 *
 * Main entry point for the review screen.
 * Parses URL params and renders the ReviewContent component.
 *
 * This is a refactored version using data-driven, modular components
 * with full separation of concerns.
 */

import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const params = useLocalSearchParams<{ data: string; uri: string }>();
  const router = useRouter();

  // Parse initial data from URL params
  const initialData = useMemo<ReviewInitialData>(() => {
    try {
      return JSON.parse(params.data || '{}');
    } catch (e) {
      return {};
    }
  }, [params.data]);

  // If no data, show empty state
  if (!params.data && !params.uri) {
    return <EmptyState onReturnHome={() => router.replace('/')} />;
  }

  return (
    <ReviewContent
      initialData={initialData}
      imageUri={params.uri}
      rawData={params.data}
    />
  );
}
