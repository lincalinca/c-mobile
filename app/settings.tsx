import { View, Text, TouchableOpacity, ScrollView, Platform, Switch, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '../components/header/PersistentHeader';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [useIconFilters, setUseIconFilters] = useState(false);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('useIconFilters');
        if (saved !== null) {
          setUseIconFilters(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  // Save filter display mode setting
  const handleFilterDisplayChange = async (value: boolean) => {
    setUseIconFilters(value);
    try {
      await AsyncStorage.setItem('useIconFilters', JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.crescender.com.au/privacy');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1 px-6">
        <View className="mt-8 mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Display</Text>
          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                  <Feather name="filter" size={18} color="#f5c518" />
                </View>
                <Text className="text-white font-medium">Icon Filters</Text>
              </View>
              <Switch
                value={useIconFilters}
                onValueChange={handleFilterDisplayChange}
                trackColor={{ false: '#374151', true: '#f5c518' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : useIconFilters ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
          <Text className="text-crescender-500 text-[10px] mt-2 ml-1 leading-relaxed">
            Display category filters as icons instead of text labels.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Notifications</Text>
          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-gold/10 items-center justify-center">
                  <Feather name="bell" size={18} color="#f5c518" />
                </View>
                <Text className="text-white font-medium">Record Analysis Alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#374151', true: '#f5c518' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : notificationsEnabled ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>
          <Text className="text-crescender-500 text-[10px] mt-2 ml-1 leading-relaxed">
            Get notified when your receipts have been fully analysed and categorized.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Legal & Support</Text>
          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden">
            <TouchableOpacity 
              onPress={openPrivacyPolicy}
              className="flex-row items-center justify-between p-4 border-b border-crescender-800"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                  <Feather name="shield" size={18} color="#9ca3af" />
                </View>
                <Text className="text-white font-medium">Privacy Policy</Text>
              </View>
              <Feather name="external-link" size={18} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                  <Feather name="help-circle" size={18} color="#9ca3af" />
                </View>
                <Text className="text-white font-medium">Support</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center py-10">
          <Text className="text-crescender-600 text-[10px] mb-1">Crescender Mobile v1.0.0</Text>
          <Text className="text-crescender-700 text-[10px]">© 2024 Crescender Australia</Text>
        </View>
      </ScrollView>
    </View>
  );
}
