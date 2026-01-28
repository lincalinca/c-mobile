import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualEntrySuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-crescender-950 items-center justify-center px-6">
      <View className="mb-8 items-center">
        <View className="w-24 h-24 rounded-full bg-gold/20 items-center justify-center mb-6">
            <Image 
              source={require('../../public/logo.png')} 
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
        </View>
        <Text className="text-white text-3xl font-bold text-center mb-2">Processing...</Text>
        <Text className="text-crescender-300 text-center text-lg">
          I'm organising those details and adding them to your collection. It will appear on your home screen shortly.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.navigate('/')}
        className="w-full bg-gold py-4 rounded-xl flex-row items-center justify-center gap-2"
      >
        <Text className="text-crescender-950 font-bold text-lg">Back to Home</Text>
        <Feather name="arrow-right" size={20} color="#2e1065" />
      </TouchableOpacity>
    </View>
  );
}
