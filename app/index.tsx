import { View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';

export default function Home() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900 p-6">
        <Text className="text-white text-2xl font-bold mb-4 text-center">Crescender Needs Camera Access</Text>
        <Text className="text-gray-400 text-center mb-8">
          To grab gear from your receipts, we need to see them first!
        </Text>
        <TouchableOpacity 
          className="bg-blue-600 px-6 py-3 rounded-full"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} facing="back">
        <View className="flex-1 justify-end pb-20 items-center">
            <Text className="text-white bg-black/50 px-4 py-2 rounded mb-4">
                Scan Receipt to start
            </Text>
            <TouchableOpacity className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
        </View>
      </CameraView>
    </View>
  );
}
