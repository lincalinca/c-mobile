/**
 * Workflow Transaction Page
 * 
 * Review and edit transaction details
 */

import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReviewWorkflowState } from '../../../lib/reviewWorkflow';
import { PersistentHeader } from '../../../components/header/PersistentHeader';
import { DatePickerModal } from '../../../components/calendar/DatePickerModal';
import { useState } from 'react';

interface WorkflowTransactionPageProps {
  workflowState: ReviewWorkflowState;
  onNext: () => void;
  onBack: () => void;
  onSaveAndExit: () => Promise<void>;
  updateState: (updates: Partial<ReviewWorkflowState>) => void;
}

export default function WorkflowTransactionPage({
  workflowState,
  onNext,
  onBack,
  onSaveAndExit,
  updateState,
}: WorkflowTransactionPageProps) {
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await onSaveAndExit();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-gold text-2xl font-bold mb-6">
          Are these details correct?
        </Text>
        
        {/* Transaction Details */}
        <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-4">
          <Text className="text-crescender-400 text-sm mb-1">Merchant</Text>
          <TextInput
            className="text-white text-lg font-semibold border-b border-crescender-700 py-1"
            value={workflowState.merchant}
            onChangeText={(text) => updateState({ merchant: text })}
            placeholderTextColor="#666"
          />
          
          <View className="mt-4">
            <Text className="text-crescender-400 text-sm mb-1">Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between border-b border-crescender-700 py-1"
            >
              <Text className="text-white text-lg">
                {new Date(workflowState.transactionDate + 'T12:00:00').toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Feather name="calendar" size={20} color="#f5c518" />
            </TouchableOpacity>
          </View>
          
          <View className="mt-4">
            <Text className="text-crescender-400 text-sm mb-1">Total</Text>
            <TextInput
              className="text-gold text-xl font-bold border-b border-gold py-1"
              value={workflowState.total}
              onChangeText={(text) => updateState({ total: text })}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
            />
          </View>
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
      
      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        selectedDate={workflowState.transactionDate || null}
        onDateSelect={(date) => {
          updateState({ transactionDate: date });
          setShowDatePicker(false);
        }}
        showFutureWarning={true}
      />
    </View>
  );
}
