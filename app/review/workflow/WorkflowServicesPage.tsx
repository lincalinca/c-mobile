/**
 * Workflow Services Page
 * 
 * Review and edit service items (non-gear-related)
 */

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReviewWorkflowState } from '../../../lib/reviewWorkflow';
import { PersistentHeader } from '../../../components/header/PersistentHeader';
import { SimpleServiceCard } from '../../../components/results/SimpleServiceCard';
import { useState } from 'react';
import type { ResultItem } from '../../../lib/results';

interface WorkflowServicesPageProps {
  workflowState: ReviewWorkflowState;
  onNext: () => void;
  onBack: () => void;
  onSaveAndExit: () => Promise<void>;
  updateState: (updates: Partial<ReviewWorkflowState>) => void;
}

export default function WorkflowServicesPage({
  workflowState,
  onNext,
  onBack,
  onSaveAndExit,
  updateState,
}: WorkflowServicesPageProps) {
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  
  // Services not related to gear
  const serviceItems = workflowState.items.filter(i => 
    i.category === 'service' && !i.gearDetails
  );

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await onSaveAndExit();
    } finally {
      setIsSaving(false);
    }
  };

  const serviceResultItems: ResultItem[] = serviceItems.map(item => ({
    id: item.id || '',
    type: 'service',
    title: item.description || '',
    subtitle: 'Service',
    amount: Math.round((item.totalPrice || 0) * 100), // Convert dollars to cents
    date: workflowState.transactionDate,
    metadata: {},
    receiptId: '',
  }));

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-gold text-2xl font-bold mb-6">
          Services
        </Text>
        
        {serviceItems.length === 0 ? (
          <View className="bg-crescender-900/20 p-6 rounded-2xl border border-dashed border-crescender-700 items-center">
            <Feather name="tool" size={32} color="#666" />
            <Text className="text-crescender-500 mt-2">No services detected</Text>
          </View>
        ) : (
          serviceResultItems.map((item, idx) => (
            <View key={idx} className="mb-4">
              <SimpleServiceCard
                item={item}
                onPress={() => {
                  // TODO: Navigate to service detail edit
                }}
              />
            </View>
          ))
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
