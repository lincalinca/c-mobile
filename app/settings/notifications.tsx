import { View, Text, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PersistentHeader } from '../../components/header/PersistentHeader';

/**
 * NOTIFICATIONS FEATURE ARCHIVED
 *
 * The full notification implementation has been temporarily disabled to allow
 * the app to build and run in development mode without native notification modules.
 *
 * See /docs/NOTIFICATIONS_ARCHIVE.md for full re-implementation instructions.
 *
 * Original implementation files (preserved but inactive):
 * - lib/notifications/*.ts (all notification logic)
 * - hooks/useNotificationSettings.ts
 * - lib/educationNotifications.ts
 * - db/schema.ts (notification tables still exist)
 */

export default function NotificationsSettingsScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1 px-6">
        <View className="mt-8 mb-6">
          <Text className="text-gold font-bold uppercase tracking-widest text-xs ml-1 mb-2">
            Notifications
          </Text>

          <View className="bg-crescender-900/40 rounded-2xl border border-crescender-800 overflow-hidden p-6">
            <View className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-gold/10 items-center justify-center mb-4">
                <Feather name="bell" size={32} color="#f5c518" />
              </View>

              <Text className="text-white text-xl font-semibold mb-2">
                Coming Soon
              </Text>

              <Text className="text-crescender-400 text-center text-sm leading-relaxed px-4">
                Push notifications for lesson reminders, gear maintenance alerts, warranty
                expiration warnings, and more are on the way.
              </Text>

              <View className="mt-6 bg-crescender-800/50 rounded-xl p-4 w-full">
                <Text className="text-crescender-300 text-xs text-center">
                  We're putting the finishing touches on this feature. Stay tuned!
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
