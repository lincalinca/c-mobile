import { get } from 'fast-levenshtein';
import { TransactionRepository } from './repository';

export interface FuzzyMatchResult {
  match: string;
  source: 'merchant' | 'provider' | 'brand';
  confidence: number; // 0-1
  details?: any; // e.g. full merchant object
}

/**
 * Identify the best match for a given user input string against our local database.
 */
export async function findBestMatch(input: string, type: 'merchant' | 'brand' = 'merchant'): Promise<FuzzyMatchResult | null> {
  if (!input || input.length < 3) return null;

  const normalizedInput = input.trim().toLowerCase();
  
  // 1. Fetch candidates from local DB
  let candidates: { name: string, data: any }[] = [];
  
  if (type === 'merchant') {
    const merchants = await TransactionRepository.getUniqueMerchants();
    candidates = merchants.map(m => ({ name: m.name, data: m }));
  } else {
    // TODO: Add a Brands table or fetch distinct brands from LineItems
    // For now, use a static list + any unique brands in history
    candidates = [
      { name: 'Fender', data: { type: 'brand' } },
      { name: 'Gibson', data: { type: 'brand' } },
      { name: 'Roland', data: { type: 'brand' } },
      { name: 'Yamaha', data: { type: 'brand' } },
      { name: 'Korg', data: { type: 'brand' } },
      { name: 'Boss', data: { type: 'brand' } },
      { name: 'Zildjian', data: { type: 'brand' } },
      // ... expand this list or fetch dynamically
    ];
  }

  // 2. Calculate Distances
  let bestCandidate = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const candidateName = candidate.name.toLowerCase();
    
    // Exact match shortcut
    if (candidateName === normalizedInput) {
      return { match: candidate.name, source: type, confidence: 1.0, details: candidate.data };
    }

    // Levenshtein distance
    const distance = get(normalizedInput, candidateName);
    
    // Normalize score based on length
    // e.g. "Jack" vs "Jack French" (distance 7, length 11) -> 4/11 match? No, that's bad logic for substrings.
    // Use raw distance for now, relative to length.
    
    if (distance < minDistance) {
      minDistance = distance;
      bestCandidate = candidate;
    }
  }

  // 3. Evaluate "Good Enough"
  // If the best match is within ~30% difference, suggest it.
  if (bestCandidate) {
    const threshold = Math.max(3, bestCandidate.name.length * 0.4);
    if (minDistance <= threshold) {
      const confidence = 1 - (minDistance / Math.max(normalizedInput.length, bestCandidate.name.length));
      return {
        match: bestCandidate.name,
        source: type,
        confidence,
        details: bestCandidate.data
      };
    }
  }

  return null;
}
