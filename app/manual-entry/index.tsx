import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualEntryIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-crescender-950">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 20 }} className="px-6 pb-6 flex-row justify-between items-center">
        <Text className="text-white text-3xl font-bold tracking-tight" style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
          NEW ENTRY
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-crescender-800 items-center justify-center"
        >
          <Feather name="x" size={20} color="#f5c518" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 justify-center gap-6 pb-20">
        
        {/* Option 1: The Assistant (Chat) */}
        <TouchableOpacity
          onPress={() => router.push('/manual-entry/assistant')}
          activeOpacity={0.9}
          className="bg-crescender-900 border border-gold/30 rounded-[22px] p-6 shadow-xl shadow-gold/10"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="w-12 h-12 rounded-full bg-gold/20 items-center justify-center">
              <Image 
                source={require('@public/logo.png')} 
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
            <View className="bg-gold/10 px-3 py-1 rounded-full">
              <Text className="text-gold text-xs font-bold uppercase tracking-wider">Recommended</Text>
            </View>
          </View>
          
          <Text className="text-white text-xl font-bold mb-2">Ask Crescender</Text>
          <Text className="text-crescender-300 text-base leading-relaxed">
            Chat with the assistant to quickly add gear, lessons, or events. It can help you find details and format everything perfectly.
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <View className="h-[1px] bg-crescender-800 flex-1" />
          <Text className="text-crescender-500 font-bold text-xs uppercase tracking-widest">OR</Text>
          <View className="h-[1px] bg-crescender-800 flex-1" />
        </View>

        {/* Option 2: The Wizard (Form) */}
        <TouchableOpacity
          onPress={() => router.push('/manual-entry/wizard')}
          className="bg-crescender-800/50 border border-crescender-700/50 rounded-[22px] p-6 flex-row items-center gap-4"
        >
          <View className="w-12 h-12 rounded-full bg-crescender-700 items-center justify-center">
            <Feather name="list" size={24} color="#9ca3af" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">Use Manual Form</Text>
            <Text className="text-crescender-400 text-sm">Fill out the details yourself step-by-step.</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>

      </View>
    </View>
  );
}
