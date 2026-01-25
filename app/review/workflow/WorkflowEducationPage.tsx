/**
 * Workflow Education Page
 * 
 * Review and edit education items (includes education-related events)
 */

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReviewWorkflowState } from '../../../lib/reviewWorkflow';
import { PersistentHeader } from '../../../components/header/PersistentHeader';
import { SimpleEducationCard } from '../../../components/results/SimpleEducationCard';
import { LessonDateSelector } from '../../../components/education/LessonDateSelector';
import { useState } from 'react';
import type { ResultItem } from '../../../lib/results';
import { generateEducationEvents } from '../../../lib/educationEvents';

interface WorkflowEducationPageProps {
  workflowState: ReviewWorkflowState;
  onNext: () => void;
  onBack: () => void;
  onSaveAndExit: () => Promise<void>;
  updateState: (updates: Partial<ReviewWorkflowState>) => void;
}

export default function WorkflowEducationPage({
  workflowState,
  onNext,
  onBack,
  onSaveAndExit,
  updateState,
}: WorkflowEducationPageProps) {
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  
  const educationItems = workflowState.items.filter(i => i.category === 'education');
  
  // Generate education events for preview
  const receipt = {
    id: '',
    merchant: workflowState.merchant,
    transactionDate: workflowState.transactionDate,
  } as any;

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await onSaveAndExit();
    } finally {
      setIsSaving(false);
    }
  };

  const educationResultItems: ResultItem[] = educationItems.map(item => {
    const eduDetails = typeof item.educationDetails === 'string'
      ? JSON.parse(item.educationDetails || '{}')
      : (item.educationDetails || {});
    
    // Use quantity from item if available, otherwise calculate from dates
    const quantity = item.quantity || 1;
    
    // For education items, prefer showing unit price (per lesson) when quantity > 1
    // Store both in metadata for display
    const unitPrice = item.unitPrice || (item.totalPrice && quantity > 1 ? Math.round(item.totalPrice / quantity) : item.totalPrice);
    
    return {
      id: item.id || '',
      type: 'education',
      title: item.description || '',
      subtitle: eduDetails.studentName || 'Education',
      amount: Math.round((item.totalPrice || 0) * 100), // Convert dollars to cents
      date: workflowState.transactionDate,
      metadata: {
        ...eduDetails,
        quantity, // Add quantity to metadata for lesson count calculation
        unitPrice, // Add unit price for per-lesson display
        totalPrice: item.totalPrice, // Keep total for reference
      },
      receiptId: '',
    };
  });

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-gold text-2xl font-bold mb-6">
          Education Items
        </Text>
        
        {educationItems.length === 0 ? (
          <View className="bg-crescender-900/20 p-6 rounded-2xl border border-dashed border-crescender-700 items-center">
            <Feather name="book-open" size={32} color="#666" />
            <Text className="text-crescender-500 mt-2">No education items detected</Text>
          </View>
        ) : (
          <>
            {educationResultItems.map((item, idx) => {
              const eduItem = educationItems[idx];
              const events = generateEducationEvents(eduItem as any, receipt);
              
              return (
                <View key={idx} className="mb-6 bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800">
                  <SimpleEducationCard
                    item={item}
                    onPress={() => {
                      // TODO: Navigate to education detail edit
                    }}
                  />
                  
                  {/* Lesson Date Selector */}
                  <View className="mt-4 pt-4 border-t border-crescender-700">
                    <LessonDateSelector
                      item={eduItem}
                      transactionDate={workflowState.transactionDate}
                      onUpdate={(updates) => {
                        const newItems = [...workflowState.items];
                        const itemIndex = workflowState.items.findIndex(i => i.id === eduItem.id);
                        if (itemIndex >= 0) {
                          const updatedItem = newItems[itemIndex];
                          const eduDetails = typeof updatedItem.educationDetails === 'string'
                            ? JSON.parse(updatedItem.educationDetails || '{}')
                            : (updatedItem.educationDetails || {});
                          
                          updatedItem.educationDetails = {
                            ...eduDetails,
                            ...updates,
                          };
                          updateState({ items: newItems });
                        }
                      }}
                    />
                  </View>
                  
                  {events.length > 0 && (
                    <View className="mt-3 pt-3 border-t border-crescender-700">
                      <Text className="text-crescender-400 text-sm">
                        {events.length} lesson{events.length !== 1 ? 's' : ''} will be scheduled
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
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
            <Feather name="arrow-left" size={20} color="#9ca3af" />
            <Text className="text-crescender-300 font-bold text-lg">Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSaveAndExit}
            disabled={isSaving}
            className="flex-1 bg-crescender-700 h-14 rounded-xl flex-row items-center justify-center gap-3 border border-crescender-600"
          >
            {isSaving ? (
              <ActivityIndicator color="#f5c518" />
            ) : (
              <>
                <Feather name="check" size={20} color="#f5c518" />
                <Text className="text-gold font-bold text-lg">Save & Exit</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onNext}
            className="flex-1 bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
          >
            <Text className="text-crescender-950 font-bold text-lg">Save & Next</Text>
            <Feather name="arrow-right" size={20} color="#2e1065" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
