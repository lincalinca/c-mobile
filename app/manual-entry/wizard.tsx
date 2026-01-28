import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WizardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  
  const categories = [
    { id: 'gear', label: 'Gear', icon: 'package' as const },
    { id: 'education', label: 'Education', icon: 'book' as const },
    { id: 'service', label: 'Service', icon: 'settings' as const },
    { id: 'event', label: 'Event', icon: 'calendar' as const },
  ];

  return (
    <View className="flex-1 bg-crescender-950">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-4 border-b border-crescender-800 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="chevron-left" size={24} color="#f5c518" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Manual Entry</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-crescender-400 font-bold uppercase tracking-widest text-xs mb-8">
          Step {step + 1} of 3
        </Text>

        {step === 0 && (
          <View>
            <Text className="text-white text-2xl font-bold mb-6">Select Category</Text>
            <View className="gap-4">
              {categories.map((cat) => (
                <TouchableOpacity 
                   key={cat.id}
                   onPress={() => setStep(1)}
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
        )}

        {step === 1 && (
          <View>
            <Text className="text-white text-2xl font-bold mb-2">Item Details</Text>
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
              onPress={() => setStep(2)}
              className="bg-gold mt-10 p-4 rounded-xl items-center"
            >
              <Text className="text-crescender-950 font-bold text-lg">Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
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
        )}
      </ScrollView>
    </View>
  );
}
