/**
 * Workflow Title Page
 * 
 * Shows summary of detected items and AI description
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReviewWorkflowState, countItemsByCategory } from '@lib/reviewWorkflow';
import { PersistentHeader } from '@components/header/PersistentHeader';

interface WorkflowTitlePageProps {
  workflowState: ReviewWorkflowState;
  onNext: () => void;
  onBack: () => void;
  updateState: (updates: Partial<ReviewWorkflowState>) => void;
}

export default function WorkflowTitlePage({
  workflowState,
  onNext,
  onBack,
}: WorkflowTitlePageProps) {
  const insets = useSafeAreaInsets();
  const counts = countItemsByCategory(workflowState.items);
  
  const summaryPoints: string[] = [];
  if (counts.gear > 0) {
    summaryPoints.push(`${counts.gear} gear item${counts.gear !== 1 ? 's' : ''}`);
  }
  if (counts.services > 0) {
    summaryPoints.push(`${counts.services} service${counts.services !== 1 ? 's' : ''}`);
  }
  if (counts.education > 0) {
    summaryPoints.push(`${counts.education} education item${counts.education !== 1 ? 's' : ''}`);
  }
  if (counts.events > 0) {
    summaryPoints.push(`${counts.events} event${counts.events !== 1 ? 's' : ''}`);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        {/* Title */}
        <View className="mb-8">
          <Text className="text-gold text-3xl font-bold mb-3">
            Crescender AI detected some details from your receipt
          </Text>
          
          {/* AI Summary */}
          {workflowState.summary && (
            <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-4">
              <Text className="text-white text-lg leading-relaxed">
                {workflowState.summary}
              </Text>
            </View>
          )}
          
          {/* Summary Points */}
          {summaryPoints.length > 0 && (
            <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800">
              <Text className="text-crescender-300 text-base mb-2 font-semibold">Detected items:</Text>
              {summaryPoints.map((point, idx) => (
                <View key={idx} className="flex-row items-center mb-1">
                  <Feather name="check" size={16} color="#f5c518" />
                  <Text className="text-white text-base ml-2">{point}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Merchant Info */}
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
          <Text className="text-crescender-300 text-sm mb-1">Merchant</Text>
          <Text className="text-white text-xl font-bold">{workflowState.merchant}</Text>
          {workflowState.transactionDate && (
            <>
              <Text className="text-crescender-300 text-sm mt-2 mb-1">Date</Text>
              <Text className="text-white text-base">
                {new Date(workflowState.transactionDate + 'T12:00:00').toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Footer */}
      <View
        className="px-6 py-4 bg-crescender-950 border-t border-crescender-800"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onBack}
            className="flex-1 bg-crescender-800 h-14 rounded-xl flex-row items-center justify-center gap-3 border border-crescender-700"
          >
            <Feather name="x" size={20} color="#9ca3af" />
            <Text className="text-crescender-300 font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onNext}
            className="flex-1 bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
          >
            <Text className="text-crescender-950 font-bold text-lg">Next</Text>
            <Feather name="arrow-right" size={20} color="#2e1065" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
