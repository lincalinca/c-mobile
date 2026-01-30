/**
 * Review Screen Router
 *
 * Routes to appropriate review component based on user preference
 */

import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { getReviewApproach } from '@lib/reviewConfig';
import ReviewWorkflow from './workflow/WorkflowRouter';
import ReviewSimplified from './simplified/SimplifiedReview';
import ReviewMonolithic from './ReviewMonolithicRefactored';

export default function ReviewRouter() {
  const params = useLocalSearchParams<{ data: string; uri: string; queueItemId?: string; forceMonolithic?: string }>();
  const router = useRouter();
  const [approach, setApproach] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.forceMonolithic === 'true') {
      setApproach('monolithic');
      setLoading(false);
      return;
    }
    getReviewApproach().then((appr) => {
      setApproach(appr);
      setLoading(false);
    });
  }, [params.forceMonolithic]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a0b4c' }}>
        <ActivityIndicator size="large" color="#f5c518" />
        <Text style={{ color: 'white', marginTop: 16 }}>Loading review...</Text>
      </View>
    );
  }

  // Route to appropriate component based on user preference
  switch (approach) {
    case 'workflow':
      return <ReviewWorkflow />;
    case 'simplified':
      return <ReviewSimplified />;
    case 'monolithic':
    default:
      return <ReviewMonolithic />;
  }
}
