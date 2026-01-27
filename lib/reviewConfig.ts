/**
 * Review Screen User Preference
 * 
 * User preference for how receipt review is displayed:
 * - workflow: Multi-page step-by-step workflow approach
 * - simplified: Single-page simplified approach (minimal display, trust AI)
 * - monolithic: Full details single-page approach (default/legacy)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReviewApproach = 'workflow' | 'simplified' | 'monolithic';

const REVIEW_APPROACH_PREFERENCE_KEY = 'user_preference_review_approach';
const DEFAULT_APPROACH: ReviewApproach = 'simplified'; // Default to simplified workflow

/**
 * Get the user's preferred review approach
 */
export async function getReviewApproach(): Promise<ReviewApproach> {
  try {
    const stored = await AsyncStorage.getItem(REVIEW_APPROACH_PREFERENCE_KEY);
    return (stored as ReviewApproach) || DEFAULT_APPROACH;
  } catch (e) {
    console.error('Failed to get review approach preference:', e);
    return DEFAULT_APPROACH;
  }
}

/**
 * Set the user's preferred review approach
 */
export async function setReviewApproach(approach: ReviewApproach): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_APPROACH_PREFERENCE_KEY, approach);
  } catch (e) {
    console.error('Failed to save review approach preference:', e);
  }
}

/**
 * Check if user prefers workflow approach
 */
export async function isWorkflowPreferred(): Promise<boolean> {
  const approach = await getReviewApproach();
  return approach === 'workflow';
}

/**
 * Check if user prefers simplified approach
 */
export async function isSimplifiedPreferred(): Promise<boolean> {
  const approach = await getReviewApproach();
  return approach === 'simplified';
}

/**
 * Check if user prefers monolithic approach (default/legacy)
 */
export async function isMonolithicPreferred(): Promise<boolean> {
  const approach = await getReviewApproach();
  return approach === 'monolithic';
}
