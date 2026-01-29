import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MANUAL_ENTRY_WORKFLOW } from '@lib/workflows/configs/manualEntryWorkflow';

const STEP_NAMES = ['category', 'details', 'review'] as const;
type StepName = typeof STEP_NAMES[number];

const categories = [
  { id: 'gear', label: 'Gear', icon: 'package' as const },
  { id: 'education', label: 'Education', icon: 'book' as const },
  { id: 'service', label: 'Service', icon: 'settings' as const },
  { id: 'event', label: 'Event', icon: 'calendar' as const },
];

export default function WizardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [workflowState, setWorkflowState] = useState<{ category?: string; detailsComplete?: boolean }>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const currentStepId = STEP_NAMES[currentStepIndex];
  const currentStepConfig = MANUAL_ENTRY_WORKFLOW.steps.find(s => s.id === currentStepId);
  const totalSteps = MANUAL_ENTRY_WORKFLOW.steps.length;

  const canProceed = useMemo(() => {
    if (!currentStepConfig?.canProceed) return true;
    return currentStepConfig.canProceed(workflowState);
  }, [currentStepConfig, workflowState]);

  const handleNext = () => {
    if (!canProceed) return;
    
    const nextStepId = typeof currentStepConfig?.next === 'function' 
      ? currentStepConfig.next(workflowState)
      : currentStepConfig?.next;
    
    if (nextStepId === 'complete') {
      router.replace('/manual-entry/success');
      return;
    }
    
    if (nextStepId) {
      const nextIndex = STEP_NAMES.indexOf(nextStepId as StepName);
      if (nextIndex !== -1) {
        setCurrentStepIndex(nextIndex);
      }
    } else if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    const backStepId = typeof currentStepConfig?.back === 'function'
      ? currentStepConfig.back(workflowState)
      : currentStepConfig?.back;
    
    if (backStepId) {
      const backIndex = STEP_NAMES.indexOf(backStepId as StepName);
      if (backIndex !== -1) {
        setCurrentStepIndex(backIndex);
      }
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      router.back();
    }
  };

  const renderStep = () => {
    switch (currentStepId) {
      case 'category':
        return (
          <View>
            <Text className="text-white text-2xl font-bold mb-6">{currentStepConfig?.title}</Text>
            <View className="gap-4">
              {categories.map((cat) => (
                <TouchableOpacity 
                   key={cat.id}
                   onPress={() => {
                     setWorkflowState({ ...workflowState, category: cat.id });
                     handleNext();
                   }}
                   className="bg-crescender-900 border border-crescender-800 p-4 rounded-2xl flex-row items-center gap-4"
                >
                  <View className="w-10 h-10 rounded-full bg-gold/10 items-center justify-center">
                    <Feather name={cat.icon} size={20} color="#f5c518" />
                  </View>
                  <Text className="text-white text-lg font-medium">{cat.label}</Text>
                  <View className="flex-1" />
                  <Feather name="chevron-right" size={18} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'details':
        return (
          <View>
            <Text className="text-white text-2xl font-bold mb-2">{currentStepConfig?.title}</Text>
            <Text className="text-crescender-400 mb-6">Fill in as much as you can.</Text>
            
            <View className="gap-4">
              <View>
                <Text className="text-gold font-bold text-xs uppercase mb-2 ml-1">Title / Description</Text>
                <TextInput 
                  placeholder="e.g. Fender Stratocaster"
                  placeholderTextColor="#6b7280"
                  className="bg-crescender-900 border border-crescender-800 p-4 rounded-xl text-white"
                />
              </View>
              <View>
                <Text className="text-gold font-bold text-xs uppercase mb-2 ml-1">Merchant / Shop</Text>
                <TextInput 
                  placeholder="e.g. Better Music"
                  placeholderTextColor="#6b7280"
                  className="bg-crescender-900 border border-crescender-800 p-4 rounded-xl text-white"
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => {
                setWorkflowState({ ...workflowState, detailsComplete: true });
                handleNext();
              }}
              className="bg-gold mt-10 p-4 rounded-xl items-center"
            >
              <Text className="text-crescender-950 font-bold text-lg">Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'review':
        return (
          <View className="items-center justify-center py-20">
             <View className="w-20 h-20 rounded-full bg-gold/20 items-center justify-center mb-6">
                <Feather name="check-circle" size={40} color="#f5c518" />
             </View>
             <Text className="text-white text-2xl font-bold mb-2 text-center">Ready to Save?</Text>
             <Text className="text-crescender-400 text-center mb-10">We've gathered the core info. You can refine it later if needed.</Text>
             
             <TouchableOpacity 
                onPress={() => router.replace('/manual-entry/success')}
                className="bg-gold w-full p-4 rounded-xl items-center"
             >
                <Text className="text-crescender-950 font-bold text-lg">Finish Entry</Text>
             </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-crescender-950">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-4 border-b border-crescender-800 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Feather name="chevron-left" size={24} color="#f5c518" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Manual Entry</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-crescender-400 font-bold uppercase tracking-widest text-xs mb-8">
          Step {currentStepIndex + 1} of {totalSteps}
        </Text>

        {renderStep()}
      </ScrollView>
    </View>
  );
}
