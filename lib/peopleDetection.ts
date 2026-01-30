/**
 * People Detection - Detects potential person names from events and education items
 */

import { StudentRepository, type Student } from './repository';

/**
 * Extract potential person names from event/education metadata
 * Looks for studentName fields or names in subtitles
 */
export function extractPotentialPersonNames(items: any[]): string[] {
  const names = new Set<string>();

  for (const item of items) {
    // Check education details
    if (item.category === 'education' && item.educationDetails) {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails)
        : item.educationDetails;
      
      if (eduDetails?.studentName) {
        const name = eduDetails.studentName.trim();
        if (name && name.length > 1) {
          names.add(name);
        }
      }
    }

    // Check event items - events might be standalone or generated from education
    if (item.category === 'event') {
      // Check if event has metadata with studentName (from education-generated events)
      if (item.metadata?.studentName) {
        const name = item.metadata.studentName.trim();
        if (name && name.length > 1) {
          names.add(name);
        }
      }
      
      // Check subtitle field (events from education have studentName as subtitle)
      if (item.subtitle && 
          item.subtitle !== 'Lesson' && 
          item.subtitle !== 'Scheduled Event' &&
          item.subtitle !== 'Service Event' &&
          !item.subtitle.includes('–') &&
          item.subtitle.length > 1 &&
          item.subtitle.length < 50) {
        // Check if it looks like a name (contains letters, not all caps common words)
        const subtitle = item.subtitle.trim();
        if (/^[A-Za-z\s'-]+$/.test(subtitle) && subtitle.split(' ').length <= 4) {
          names.add(subtitle);
        }
      }
      
      // Also check description for name-like patterns (e.g., "John's Recital")
      if (item.description) {
        const desc = item.description.trim();
        // Look for patterns like "Name's Event" or "Name - Event"
        const nameMatch = desc.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?:\s*['-]\s*|\s*–\s*)/);
        if (nameMatch && nameMatch[1]) {
          const potentialName = nameMatch[1].trim();
          if (potentialName.length > 1 && potentialName.length < 30 && potentialName.split(' ').length <= 3) {
            names.add(potentialName);
          }
        }
      }
    }
  }

  return Array.from(names);
}

/**
 * Check if a detected name already exists in the people database
 */
export async function checkIfPersonExists(name: string): Promise<boolean> {
  try {
    const allPeople = await StudentRepository.getAll();
    return allPeople.some(
      (person: Student) => person.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
  } catch (e) {
    console.error('Failed to check if person exists', e);
    return false;
  }
}

/**
 * Detect new people from items and return names that don't exist yet
 */
export async function detectNewPeople(items: any[]): Promise<string[]> {
  const potentialNames = extractPotentialPersonNames(items);
  const newNames: string[] = [];

  for (const name of potentialNames) {
    const exists = await checkIfPersonExists(name);
    if (!exists) {
      newNames.push(name);
    }
  }

  return newNames;
}
