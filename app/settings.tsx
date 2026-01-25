import { View, Text, TouchableOpacity, ScrollView, Platform, Switch, Linking, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '../components/header/PersistentHeader';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReviewApproach, setReviewApproach, type ReviewApproach } from '../lib/reviewConfig';
import { ICON_SIZES } from '../lib/iconSizes';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [useIconFilters, setUseIconFilters] = useState(false);
  const [financialYearStartMonth, setFinancialYearStartMonth] = useState(7);
  const [showFyPicker, setShowFyPicker] = useState(false);
  const [reviewApproach, setReviewApproachState] = useState<ReviewApproach>('monolithic');
  const [showReviewApproachPicker, setShowReviewApproachPicker] = useState(false);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [filters, fy, approach] = await Promise.all([
          AsyncStorage.getItem('useIconFilters'),
          AsyncStorage.getItem('financialYearStartMonth'),
          getReviewApproach(),
        ]);
        if (filters !== null) setUseIconFilters(JSON.parse(filters));
        if (fy !== null) setFinancialYearStartMonth(parseInt(fy, 10));
        setReviewApproachState(approach);
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

  const handleFinancialYearStartChange = async (month: number) => {
    setFinancialYearStartMonth(month);
    setShowFyPicker(false);
    try {
      await AsyncStorage.setItem('financialYearStartMonth', String(month));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const handleReviewApproachChange = async (approach: ReviewApproach) => {
    setReviewApproachState(approach);
    setShowReviewApproachPicker(false);
    try {
      await setReviewApproach(approach);
    } catch (e) {
      console.error('Failed to save review approach', e);
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
                  <Feather name="filter" size={ICON_SIZES.standard} color="#f5c518" />
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
          <Text className="text-crescender-500 text-xs mt-2 ml-1 leading-relaxed">
            Display category filters as icons instead of text labels.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Receipt Review</Text>
          <TouchableOpacity
            onPress={() => setShowReviewApproachPicker(true)}
            className="bg-crescender-900/40 rounded-2xl border border-crescender-800 flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
              <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center flex-shrink-0">
                <Feather name="file-text" size={ICON_SIZES.standard} color="#f5c518" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white font-medium">Review Style</Text>
                <Text className="text-crescender-400 text-xs mt-0.5" numberOfLines={1}>
                  {reviewApproach === 'workflow' 
                    ? 'Multi-page step-by-step workflow' 
                    : reviewApproach === 'simplified' 
                    ? 'Simplified single-page view' 
                    : 'Full details single-page view'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 ml-2 flex-shrink-0">
              <Text className="text-crescender-300 text-sm font-medium" numberOfLines={1}>
                {reviewApproach === 'workflow' ? 'Workflow' : 
                 reviewApproach === 'simplified' ? 'Simplified' : 'Full Details'}
              </Text>
              <Feather name="chevron-right" size={ICON_SIZES.standard} color="#6b7280" />
            </View>
          </TouchableOpacity>
          <Text className="text-crescender-500 text-xs mt-2 ml-1 leading-relaxed">
            Choose your preferred way to review receipts after scanning. You can change this anytime.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Financial year</Text>
          <TouchableOpacity
            onPress={() => setShowFyPicker(true)}
            className="bg-crescender-900/40 rounded-2xl border border-crescender-800 flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                <Feather name="calendar" size={ICON_SIZES.standard} color="#f5c518" />
              </View>
              <Text className="text-white font-medium">Financial year start month</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-crescender-300">{MONTH_NAMES[financialYearStartMonth - 1]}</Text>
              <Feather name="chevron-down" size={ICON_SIZES.standard} color="#6b7280" />
            </View>
          </TouchableOpacity>
          <Text className="text-crescender-500 text-xs mt-2 ml-1 leading-relaxed">
            Used for “Last financial year” and “This financial year” in the date picker. Default: July.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">Notifications</Text>
          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-gold/10 items-center justify-center">
                  <Feather name="bell" size={ICON_SIZES.standard} color="#f5c518" />
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
          <Text className="text-crescender-500 text-xs mt-2 ml-1 leading-relaxed">
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
                  <Feather name="shield" size={ICON_SIZES.standard} color="#9ca3af" />
                </View>
                <Text className="text-white font-medium">Privacy Policy</Text>
              </View>
              <Feather name="external-link" size={ICON_SIZES.standard} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                  <Feather name="help-circle" size={ICON_SIZES.standard} color="#9ca3af" />
                </View>
                <Text className="text-white font-medium">Support</Text>
              </View>
              <Feather name="chevron-right" size={ICON_SIZES.standard} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center py-10">
          <Text className="text-crescender-600 text-xs mb-1">Crescender Mobile v1.0.0</Text>
          <Text className="text-crescender-700 text-xs">© 2024 Crescender Australia</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={showFyPicker} animationType="fade" onRequestClose={() => setShowFyPicker(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center px-6" onPress={() => setShowFyPicker(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-crescender-900 rounded-2xl border border-crescender-700 max-h-80">
            <Text className="text-gold font-bold text-center py-3 border-b border-crescender-700">Financial year start month</Text>
            <ScrollView>
              {MONTH_NAMES.map((name, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleFinancialYearStartChange(i + 1)}
                  className={`py-3 px-4 border-b border-crescender-800/50 ${financialYearStartMonth === i + 1 ? 'bg-gold/10' : ''}`}
                >
                  <Text className={financialYearStartMonth === i + 1 ? 'text-gold font-semibold' : 'text-white'}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={showReviewApproachPicker} animationType="fade" onRequestClose={() => setShowReviewApproachPicker(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center px-6" onPress={() => setShowReviewApproachPicker(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-crescender-900 rounded-2xl border border-crescender-700 max-h-96">
            <Text className="text-gold font-bold text-center py-4 border-b border-crescender-700">Choose Review Style</Text>
            <ScrollView>
              {[
                { 
                  value: 'monolithic' as ReviewApproach, 
                  label: 'Full Details', 
                  desc: 'See all captured information on a single page. Best for detailed review and editing.',
                  icon: 'file-text' as const
                },
                { 
                  value: 'workflow' as ReviewApproach, 
                  label: 'Workflow', 
                  desc: 'Step-by-step multi-page review. Guided process through each category.',
                  icon: 'layers' as const
                },
                { 
                  value: 'simplified' as ReviewApproach, 
                  label: 'Simplified', 
                  desc: 'Minimal display, trust AI. Only prompts for critical missing information.',
                  icon: 'check-circle' as const
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleReviewApproachChange(option.value)}
                  className={`py-4 px-4 border-b border-crescender-800/50 ${reviewApproach === option.value ? 'bg-gold/10' : ''}`}
                >
                  <View className="flex-row items-start gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${reviewApproach === option.value ? 'bg-gold/20' : 'bg-crescender-800'}`}>
                      <Feather 
                        name={option.icon} 
                        size={ICON_SIZES.medium} 
                        color={reviewApproach === option.value ? '#f5c518' : '#9ca3af'} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-base ${reviewApproach === option.value ? 'text-gold font-semibold' : 'text-white font-medium'}`}>
                        {option.label}
                      </Text>
                      <Text className={`text-xs mt-1 leading-relaxed ${reviewApproach === option.value ? 'text-gold/80' : 'text-crescender-400'}`}>
                        {option.desc}
                      </Text>
                    </View>
                    {reviewApproach === option.value && (
                      <Feather name="check" size={ICON_SIZES.medium} color="#f5c518" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
