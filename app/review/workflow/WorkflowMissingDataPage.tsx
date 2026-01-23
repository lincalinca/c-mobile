/**
 * Workflow Missing Data Page
 * 
 * Prompts user to enter critical missing data (e.g., lesson start dates)
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ReviewWorkflowState, MissingDataRequirement, analyzeMissingData } from '../../../lib/reviewWorkflow';
import { PersistentHeader } from '../../../components/header/PersistentHeader';
import { DatePickerModal } from '../../../components/calendar/DatePickerModal';
import { useState } from 'react';

interface WorkflowMissingDataPageProps {
  workflowState: ReviewWorkflowState;
  onNext: () => void;
  onBack: () => void;
  updateState: (updates: Partial<ReviewWorkflowState>) => void;
}

export default function WorkflowMissingDataPage({
  workflowState,
  onNext,
  onBack,
  updateState,
}: WorkflowMissingDataPageProps) {
  const insets = useSafeAreaInsets();
  const missingData = analyzeMissingData(workflowState.items);
  const requiredMissing = missingData.filter(m => m.required);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleDateSelect = (date: string) => {
    if (editingIndex === null || !editingField) return;
    
    const newItems = [...workflowState.items];
    const item = newItems[editingIndex];
    
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      
      eduDetails[editingField] = date;
      item.educationDetails = eduDetails;
    }
    
    updateState({ items: newItems });
    setShowDatePicker(false);
    setEditingIndex(null);
    setEditingField(null);
  };

  const openDatePicker = (index: number, field: string) => {
    setEditingIndex(index);
    setEditingField(field);
    setShowDatePicker(true);
  };

  const getCurrentValue = (index: number, field: string): string | null => {
    const item = workflowState.items[index];
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      return eduDetails[field] || null;
    }
    return null;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent', paddingTop: insets.top }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-gold text-2xl font-bold mb-2">
          Missing Information
        </Text>
        <Text className="text-crescender-300 text-base mb-6">
          Please provide the following details to complete your receipt:
        </Text>
        
        {requiredMissing.length === 0 ? (
          <View className="bg-green-900/20 p-4 rounded-2xl border border-green-700">
            <Text className="text-green-400 text-base">
              ✓ All required information is present. You can proceed.
            </Text>
          </View>
        ) : (
          requiredMissing.map((req, idx) => {
            const item = workflowState.items[req.itemIndex];
            const currentValue = getCurrentValue(req.itemIndex, req.field);
            
            return (
              <View key={idx} className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-4">
                <Text className="text-white text-lg font-semibold mb-1">
                  {item.description || `${req.type} item ${req.itemIndex + 1}`}
                </Text>
                <Text className="text-crescender-400 text-sm mb-3">
                  {req.label}
                </Text>
                
                {req.field === 'startDate' && (
                  <TouchableOpacity
                    onPress={() => openDatePicker(req.itemIndex, req.field)}
                    className="bg-crescender-800 p-3 rounded-xl flex-row items-center justify-between border border-crescender-700"
                  >
                    <Text className={`text-base ${currentValue ? 'text-white' : 'text-crescender-500'}`}>
                      {currentValue
                        ? new Date(currentValue + 'T12:00:00').toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Select date'}
                    </Text>
                    <Feather name="calendar" size={20} color="#f5c518" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
            onPress={onNext}
            className="flex-1 bg-gold h-14 rounded-xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
          >
            <Text className="text-crescender-950 font-bold text-lg">Next</Text>
            <Feather name="arrow-right" size={20} color="#2e1065" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Picker Modal */}
      {editingIndex !== null && editingField && (
        <DatePickerModal
          visible={showDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
            setEditingIndex(null);
            setEditingField(null);
          }}
          selectedDate={getCurrentValue(editingIndex, editingField)}
          onDateSelect={handleDateSelect}
          showFutureWarning={true}
        />
      )}
    </View>
  );
}
