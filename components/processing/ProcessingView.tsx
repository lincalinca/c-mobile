import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const ProcessingView = () => {
  return (
    <View className="flex-1 bg-crescender-950 justify-center items-center px-6">
      <View className="w-64 h-64 bg-crescender-900/40 rounded-3xl border border-gold/20 justify-center items-center mb-8 shadow-xl shadow-gold/10">
        <ActivityIndicator size="large" color="#f5c518" />
        <View className="absolute">
          <Feather name="zap" size={40} color="#f5c518" className="opacity-20" />
        </View>
      </View>
      
      <Text className="text-white text-2xl font-bold mb-2 tracking-widest text-center" style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
        ANALYSING RECEIPT
      </Text>
      <Text className="text-crescender-400 text-center text-sm leading-relaxed">
        Our AI is extracting your gear, events, and transactions. This usually takes 5-10 seconds.
      </Text>
      
      <View className="flex-row gap-2 mt-12 items-center">
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-60 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
      </View>
    </View>
  );
};
