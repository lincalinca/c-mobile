import { View, Text, ScrollView, Switch, Platform, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '../../components/header/PersistentHeader';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { ICON_SIZES } from '../../lib/iconSizes';
import type { NotificationCategory } from '../../lib/notifications/types';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  lessons: 'Lessons & calendar reminders',
  gear_enrichment: 'Gear photos & enrichment',
  warranty: 'Warranty & upgrade reminders',
  maintenance: 'Instrument maintenance reminders',
  reengagement: 'We miss you / educator discovery',
  service: 'Service & repairs (pick-ups, follow-ups)',
};

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, isLoading, isUpdating, updateGlobal, updateCategory } = useNotificationSettings();

  if (isLoading || !settings) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 items-center justify-center">
          <Text className="text-crescender-400">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />
      
      <ScrollView className="flex-1 px-6">
        <View className="mt-8 mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">
            Notifications
          </Text>
          
          {/* First-run explainer */}
          {!settings.globalEnabled && Object.values(settings.perCategoryEnabled).every(v => !v) && (
            <View className="bg-crescender-800/50 rounded-xl border border-crescender-700 p-4 mb-4">
              <Text className="text-crescender-300 text-sm leading-relaxed">
                Control how often Crescender notifies you. You can change this any time.
              </Text>
            </View>
          )}

          {/* Global toggle */}
          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden mb-4">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-8 h-8 rounded-full bg-gold/10 items-center justify-center">
                  <Feather name="bell" size={ICON_SIZES.standard} color="#f5c518" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-medium">Allow notifications</Text>
                  <Text className="text-crescender-400 text-xs mt-0.5">
                    Master switch for all notification categories
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.globalEnabled}
                onValueChange={updateGlobal}
                disabled={isUpdating}
                trackColor={{ false: '#374151', true: '#f5c518' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : settings.globalEnabled ? '#ffffff' : '#9ca3af'}
              />
            </View>
          </View>

          {/* Category toggles */}
          {settings.globalEnabled && (
            <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden">
              {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((category, index) => (
                <View
                  key={category}
                  className={`flex-row items-center justify-between p-4 ${
                    index < Object.keys(CATEGORY_LABELS).length - 1
                      ? 'border-b border-crescender-800'
                      : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-8 h-8 rounded-full bg-crescender-800 items-center justify-center">
                      <Feather
                        name={
                          category === 'lessons'
                            ? 'calendar'
                            : category === 'gear_enrichment'
                            ? 'camera'
                            : category === 'warranty'
                            ? 'shield'
                            : category === 'maintenance'
                            ? 'tool'
                            : category === 'reengagement'
                            ? 'heart'
                            : 'wrench'
                        }
                        size={ICON_SIZES.standard}
                        color="#9ca3af"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-medium">
                        {CATEGORY_LABELS[category]}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.perCategoryEnabled[category]}
                    onValueChange={(enabled) => updateCategory(category, enabled)}
                    disabled={isUpdating}
                    trackColor={{ false: '#374151', true: '#f5c518' }}
                    thumbColor={
                      Platform.OS === 'ios'
                        ? '#ffffff'
                        : settings.perCategoryEnabled[category]
                        ? '#ffffff'
                        : '#9ca3af'
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
