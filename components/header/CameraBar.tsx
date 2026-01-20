import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const CameraBar = () => {
  const router = useRouter();

  return (
    <View className="px-6 py-2 flex-row items-center gap-3">
      <TouchableOpacity 
        onPress={() => router.push('/scan')}
        className="flex-1 h-14 bg-gold rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
      >
        <Feather name="camera" size={24} color="#2e1065" />
        <Text className="text-crescender-950 font-bold text-lg" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
          CAPTURE RECORD
        </Text>
      </TouchableOpacity>
    </View>
  );
};
