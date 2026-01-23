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
import { LessonDateSelector } from '../../../components/education/LessonDateSelector';

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
            
            return (
              <View key={idx} className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-4">
                <Text className="text-white text-lg font-semibold mb-1">
                  {item.description || `${req.type} item ${req.itemIndex + 1}`}
                </Text>
                <Text className="text-crescender-400 text-sm mb-3">
                  {req.label}
                </Text>
                
                {req.field === 'startDate' && req.type === 'education' && (
                  <LessonDateSelector
                    item={item}
                    transactionDate={workflowState.transactionDate}
                    onUpdate={(updates) => {
                      const newItems = [...workflowState.items];
                      const updatedItem = newItems[req.itemIndex];
                      const eduDetails = typeof updatedItem.educationDetails === 'string'
                        ? JSON.parse(updatedItem.educationDetails || '{}')
                        : (updatedItem.educationDetails || {});
                      
                      updatedItem.educationDetails = {
                        ...eduDetails,
                        ...updates,
                      };
                      updateState({ items: newItems });
                    }}
                  />
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
      
    </View>
  );
}
