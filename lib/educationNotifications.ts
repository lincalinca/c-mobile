/**
 * Education Notifications
 * 
 * Integration layer for scheduling lesson reminder notifications.
 * Called when education items are created/updated and during reconciliation.
 */

import { sendLessonReminder } from './notifications/Service';
import type { EducationChain, ChainItem } from './educationChain';
import { generateEducationEvents } from './educationEvents';
import type { Receipt, ReceiptItem } from './repository';
import { parseISO } from 'date-fns';

/**
 * Schedule lesson notifications for an education chain
 */
export async function scheduleLessonNotificationsForChain(chain: EducationChain): Promise<void> {
  for (const chainItem of chain.items) {
    await scheduleLessonNotificationsForItem(chainItem.item, chainItem.receipt);
  }
}

/**
 * Schedule lesson notifications for a single education item
 */
export async function scheduleLessonNotificationsForItem(
  item: ReceiptItem,
  receipt: Receipt
): Promise<void> {
  // Generate education events (lessons) from the item
  const events = generateEducationEvents(item, receipt);
  
  // Parse education details
  let eduDetails: any = {};
  if (item.educationDetails) {
    try {
      eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails)
        : item.educationDetails;
    } catch (e) {
      console.warn('[educationNotifications] Failed to parse educationDetails:', e);
    }
  }
  
  const studentName = eduDetails.studentName || 'Student';
  const instrument = eduDetails.focus || eduDetails.instrument || 'Lessons';
  
  // Schedule a reminder for each upcoming lesson (next 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  for (const event of events) {
    if (!event.date) continue;
    
    const lessonDate = parseISO(event.date + 'T12:00:00'); // Parse as local date
    
    // Only schedule for future lessons within 30 days
    if (lessonDate >= now && lessonDate <= thirtyDaysFromNow) {
      // Extract lesson time from metadata or use default
      let lessonTime = lessonDate;
      if (event.metadata?.times && Array.isArray(event.metadata.times) && event.metadata.times.length > 0) {
        const timeStr = event.metadata.times[0];
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const ampm = timeMatch[3]?.toLowerCase();
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          lessonTime = new Date(lessonDate);
          lessonTime.setHours(hours, minutes, 0, 0);
        }
      } else {
        // Default to 9 AM if no time specified
        lessonTime = new Date(lessonDate);
        lessonTime.setHours(9, 0, 0, 0);
      }
      
      // Schedule reminder (60 minutes before lesson)
      await sendLessonReminder({
        lineItemId: item.id,
        studentName,
        instrument,
        lessonTime,
        reminderOffsetMinutes: 60,
      });
    }
  }
}

/**
 * Cancel lesson notifications for an education item
 */
export async function cancelLessonNotificationsForItem(itemId: string): Promise<void> {
  // This will be handled by the Scheduler when we cancel by key
  // The key format is: lessons|{itemId}|{date}
  // We'd need to query notification_events to find all keys for this item
  // For now, we'll rely on the reconciler to clean up
}
