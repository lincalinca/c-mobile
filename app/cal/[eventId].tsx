import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Redirect route for crescender://cal/<eventId>.
 * Opens the event detail at /events/[eventId].
 */
export default function CalRedirectScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (!eventId) {
      router.replace('/');
      return;
    }
    if (eventId.startsWith('event_series_')) {
      const lineItemId = eventId.replace(/^event_series_/, '');
      router.replace(`/education/${lineItemId}` as any);
    } else {
      router.replace(`/events/${eventId}` as any);
    }
  }, [eventId, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a0b4c' }}>
      <ActivityIndicator size="large" color="#f5c518" />
    </View>
  );
}
