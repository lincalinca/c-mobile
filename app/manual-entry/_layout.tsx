import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function ManualEntryLayout() {
  return (
    <View className="flex-1 bg-transparent">
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}
