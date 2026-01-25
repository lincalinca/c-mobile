/**
 * Utility functions for formatting education-related data
 */

export interface EducationMetadata {
  studentName?: string;
  teacherName?: string;
  frequency?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  times?: string[];
  focus?: string; // Instrument or subject focus (e.g., "Violin", "Music Theory")
  instrument?: string; // Alternative field name for focus
  subject?: string; // Alternative field name for focus
  quantity?: number; // Number of lessons from invoice/receipt
  unitPrice?: number; // Price per lesson (in cents)
  totalPrice?: number; // Total price (in cents)
}

/**
 * Formats an education title from the raw receipt description.
 * Examples:
 * - "Term 1 fees vivian" -> "Music lessons for Vivian"
 * - "Term 1 fees vivian" (with focus: "Violin") -> "Violin lessons for Vivian"
 * - "Term 1 fees vivian" (with focus: "Music Theory") -> "Music Theory lessons for Vivian"
 */
export function formatEducationTitle(
  rawDescription: string,
  metadata: EducationMetadata
): string {
  const studentName = metadata.studentName || '';
  const focus = metadata.focus || metadata.instrument || metadata.subject;
  
  // Extract student name from description if not in metadata (fallback)
  let extractedStudent = studentName;
  if (!extractedStudent) {
    // Try to extract name from description (e.g., "Term 1 fees vivian" -> "vivian")
    const nameMatch = rawDescription.match(/\b([A-Z][a-z]+)\b/g);
    if (nameMatch && nameMatch.length > 0) {
      // Take the last capitalized word as potential student name
      extractedStudent = nameMatch[nameMatch.length - 1];
    }
  }
  
  // Capitalize first letter of student name
  const studentDisplayName = extractedStudent
    ? extractedStudent.charAt(0).toUpperCase() + extractedStudent.slice(1).toLowerCase()
    : 'Student';
  
  // Build title
  if (focus) {
    return `${focus} lessons for ${studentDisplayName}`;
  }
  return `Music lessons for ${studentDisplayName}`;
}

/**
 * Generates an education series title in the format: {focus} lessons for {name} - {term#} {year}
 * Examples:
 * - Focus: "Piano", Name: "Claudette", Term: 4, Year: 2025 -> "Piano lessons for Claudette - Term 4 2025"
 * - Focus: "Violin", Name: "John", Term: 1, Year: 2024 -> "Violin lessons for John - Term 1 2024"
 */
export function generateEducationSeriesTitle(
  metadata: EducationMetadata,
  startDate?: string
): string {
  const focus = metadata.focus || metadata.instrument || metadata.subject || 'Music';
  const studentName = metadata.studentName || 'Student';
  
  // Capitalize first letter of student name
  const studentDisplayName = studentName.charAt(0).toUpperCase() + studentName.slice(1);
  
  // Extract term number and year from startDate or use defaults
  let termNumber = '';
  let year = '';
  
  if (startDate) {
    try {
      const date = new Date(startDate + 'T12:00:00');
      year = date.getFullYear().toString();
      
      // Try to extract term number from startDate month (Australian school terms)
      // Term 1: Jan-Mar, Term 2: Apr-Jun, Term 3: Jul-Sep, Term 4: Oct-Dec
      const month = date.getMonth() + 1; // 1-12
      if (month >= 1 && month <= 3) termNumber = '1';
      else if (month >= 4 && month <= 6) termNumber = '2';
      else if (month >= 7 && month <= 9) termNumber = '3';
      else if (month >= 10 && month <= 12) termNumber = '4';
    } catch (e) {
      // If date parsing fails, use current year
      year = new Date().getFullYear().toString();
    }
  } else {
    year = new Date().getFullYear().toString();
  }
  
  // If we couldn't determine term, try to extract from metadata or use empty
  if (!termNumber) {
    // Could try to extract from subtitle or other fields if needed
    termNumber = '';
  }
  
  if (termNumber) {
    return `${focus} lessons for ${studentDisplayName} - Term ${termNumber} ${year}`;
  } else {
    return `${focus} lessons for ${studentDisplayName} - ${year}`;
  }
}

/**
 * Formats education details into a condensed sentence.
 * Examples:
 * - "9x Weekly lessons from 30th January until 30th March"
 * - "12x twice weekly lessons on Tuesday and Friday from 5th June to 18th July"
 */
export function formatEducationDetailsSentence(metadata: EducationMetadata): string {
  const frequency = metadata.frequency || 'One-off';
  const startDate = metadata.startDate;
  const endDate = metadata.endDate;
  const daysOfWeek = metadata.daysOfWeek || [];
  const times = metadata.times || [];
  
  // Prefer quantity from invoice/receipt if available (most accurate)
  let lessonCount = '';
  if (metadata.quantity && metadata.quantity > 0) {
    lessonCount = `${metadata.quantity}x `;
  } else if (startDate && endDate) {
    // Fallback: Calculate lesson count from start and end dates
    try {
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Estimate lesson count based on frequency
      if (frequency.toLowerCase().includes('weekly')) {
        const weeks = Math.ceil(daysDiff / 7);
        if (daysOfWeek.length > 0) {
          lessonCount = `${weeks * daysOfWeek.length}x `;
        } else {
          lessonCount = `${weeks}x `;
        }
      } else if (frequency.toLowerCase().includes('fortnight')) {
        const fortnights = Math.ceil(daysDiff / 14);
        lessonCount = `${fortnights}x `;
      } else if (frequency.toLowerCase().includes('monthly')) {
        const months = Math.ceil(daysDiff / 30);
        lessonCount = `${months}x `;
      }
    } catch (e) {
      // If date parsing fails, skip count
    }
  }
  
  // Format frequency
  let frequencyText = frequency.toLowerCase();
  if (frequencyText.includes('weekly') && daysOfWeek.length > 1) {
    frequencyText = 'twice weekly';
  } else if (frequencyText.includes('weekly')) {
    frequencyText = 'Weekly';
  } else if (frequencyText.includes('fortnight')) {
    frequencyText = 'Fortnightly';
  } else if (frequencyText.includes('monthly')) {
    frequencyText = 'Monthly';
  } else {
    frequencyText = frequency;
  }
  
  // Format days of week
  let daysText = '';
  if (daysOfWeek.length > 0) {
    if (daysOfWeek.length === 1) {
      daysText = `on ${daysOfWeek[0]}`;
    } else if (daysOfWeek.length === 2) {
      daysText = `on ${daysOfWeek[0]} and ${daysOfWeek[1]}`;
    } else {
      const lastDay = daysOfWeek[daysOfWeek.length - 1];
      const otherDays = daysOfWeek.slice(0, -1).join(', ');
      daysText = `on ${otherDays} and ${lastDay}`;
    }
  }
  
  // Format dates
  let dateText = '';
  if (startDate && endDate) {
    try {
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      
      const startFormatted = start.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
      });
      const endFormatted = end.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
      });
      
      dateText = `from ${startFormatted} until ${endFormatted}`;
    } catch (e) {
      // Fallback to ISO dates
      dateText = `from ${startDate} until ${endDate}`;
    }
  } else if (startDate) {
    try {
      const start = new Date(startDate + 'T12:00:00');
      const startFormatted = start.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
      });
      dateText = `from ${startFormatted}`;
    } catch (e) {
      dateText = `from ${startDate}`;
    }
  }
  
  // Combine parts
  const parts: string[] = [];
  if (lessonCount) parts.push(lessonCount);
  parts.push(frequencyText.toLowerCase());
  parts.push('lessons');
  if (daysText) parts.push(daysText);
  if (dateText) parts.push(dateText);
  
  return parts.join(' ');
}
