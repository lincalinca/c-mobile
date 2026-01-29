/**
 * Notification Service
 * 
 * Domain-specific "use-case" layer for each notification type.
 * Single Responsibility: domain-specific "send X" operations.
 */

import { canSend } from './Policy';
import { scheduleLocalNotification, generateNotificationKey } from './Scheduler';
import { linkToEducationItem, linkToGearItem, linkToService, linkToProcessingQueue } from '@lib/navigation/deeplinks';
import type { NotificationCategory, NotificationMetadata } from './types';

/**
 * Send receipt ready notification - fires immediately when AI analysis completes
 * This is the most important notification type for user engagement
 */
export async function sendReceiptReadyNotification(context: {
  queueItemId: string;
  merchantName?: string;
  itemCount?: number; // For batch notifications
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { queueItemId, merchantName, itemCount } = context;

  // Fire immediately (within 2 seconds to ensure it's scheduled, not instant)
  const triggerDate = new Date(Date.now() + 2000);

  const metadata: NotificationMetadata = {
    queueItemId,
    merchantName,
    itemCount,
  };

  const policyCheck = await canSend('receipt_ready', {
    metadata,
    triggerDate,
    priority: 'critical', // Always deliver immediately
  });

  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send receipt ready notification: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }

  // Build notification content
  let title = 'Receipt ready for review';
  let body = 'Tap to review and confirm the extracted details.';

  if (itemCount && itemCount > 1) {
    title = `${itemCount} receipts ready for review`;
    body = 'Your batch upload is complete. Tap to review and confirm.';
  } else if (merchantName) {
    title = 'Receipt ready for review';
    body = `${merchantName} receipt analysed. Tap to review and confirm.`;
  }

  await scheduleLocalNotification({
    category: 'receipt_ready',
    title,
    body,
    triggerDate,
    deepLink: linkToProcessingQueue(),
    metadata,
  });

  return { scheduled: true };
}

/**
 * Send lesson reminder notification
 */
export async function sendLessonReminder(context: {
  lineItemId: string;
  studentName: string;
  instrument: string;
  lessonTime: Date; // Local time
  reminderOffsetMinutes?: number; // Minutes before lesson (default: 60)
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { lineItemId, studentName, instrument, lessonTime, reminderOffsetMinutes = 60 } = context;
  
  const triggerDate = new Date(lessonTime.getTime() - reminderOffsetMinutes * 60 * 1000);
  
  // Don't schedule if trigger date is in the past
  if (triggerDate < new Date()) {
    return { scheduled: false, reason: 'Trigger date is in the past' };
  }
  
  const metadata: NotificationMetadata = {
    lineItemId,
    lessonId: lineItemId,
    studentName,
    instrument,
  };
  
  // Check policy
  const policyCheck = await canSend('lessons', {
    metadata,
    triggerDate,
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send lesson reminder: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  // Schedule notification
  await scheduleLocalNotification({
    category: 'lessons',
    title: `Lesson today – ${instrument}`,
    body: `${studentName} has ${instrument} lessons today at ${lessonTime.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}.`,
    triggerDate,
    deepLink: linkToEducationItem(lineItemId),
    metadata,
  });
  
  return { scheduled: true };
}

/**
 * Send gear enrichment nudge notification
 */
export async function sendGearEnrichmentNudge(context: {
  gearId: string;
  gearDescription: string;
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { gearId, gearDescription } = context;
  
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 1); // Schedule for tomorrow
  
  const metadata: NotificationMetadata = {
    gearId,
  };
  
  const policyCheck = await canSend('gear_enrichment', {
    metadata,
    triggerDate,
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send gear enrichment nudge: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  await scheduleLocalNotification({
    category: 'gear_enrichment',
    title: 'Add photos to your gear',
    body: `Don't forget to add photos to ${gearDescription}.`,
    triggerDate,
    deepLink: linkToGearItem(gearId),
    metadata,
  });
  
  return { scheduled: true };
}

/**
 * Send warranty reminder notification
 */
export async function sendWarrantyReminder(context: {
  gearId: string;
  gearDescription: string;
  warrantyExpiryDate: Date; // Local time
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { gearId, gearDescription, warrantyExpiryDate } = context;
  
  // Schedule reminder 30 days before expiry
  const triggerDate = new Date(warrantyExpiryDate);
  triggerDate.setDate(triggerDate.getDate() - 30);
  
  if (triggerDate < new Date()) {
    return { scheduled: false, reason: 'Warranty expiry date is too soon' };
  }
  
  const metadata: NotificationMetadata = {
    gearId,
  };
  
  const policyCheck = await canSend('warranty', {
    metadata,
    triggerDate,
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send warranty reminder: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  await scheduleLocalNotification({
    category: 'warranty',
    title: 'Warranty expiring soon',
    body: `The warranty for ${gearDescription} expires on ${warrantyExpiryDate.toLocaleDateString('en-AU')}.`,
    triggerDate,
    deepLink: linkToGearItem(gearId),
    metadata,
  });
  
  return { scheduled: true };
}

/**
 * Send maintenance prompt notification
 */
export async function sendMaintenancePrompt(context: {
  gearId: string;
  gearDescription: string;
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { gearId, gearDescription } = context;
  
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 60); // Schedule for 60 days from now
  
  const metadata: NotificationMetadata = {
    gearId,
  };
  
  const policyCheck = await canSend('maintenance', {
    metadata,
    triggerDate,
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send maintenance prompt: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  await scheduleLocalNotification({
    category: 'maintenance',
    title: 'Time for maintenance',
    body: `Consider scheduling maintenance for ${gearDescription}.`,
    triggerDate,
    deepLink: linkToGearItem(gearId),
    metadata,
  });
  
  return { scheduled: true };
}

/**
 * Send re-engagement prompt notification
 */
export async function sendReengagementPrompt(context: {
  message: string;
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { message } = context;
  
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 21); // Schedule for 21 days from now
  
  const metadata: NotificationMetadata = {};
  
  const policyCheck = await canSend('reengagement', {
    metadata,
    triggerDate,
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send re-engagement prompt: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  await scheduleLocalNotification({
    category: 'reengagement',
    title: 'We miss you!',
    body: message,
    triggerDate,
    deepLink: 'crescender://', // Home screen
    metadata,
  });
  
  return { scheduled: true };
}

/**
 * Send service pick-up reminder notification
 */
export async function sendServicePickupReminder(context: {
  serviceId: string;
  serviceDescription: string;
  pickupDate: Date; // Local time
}): Promise<{ scheduled: boolean; reason?: string }> {
  const { serviceId, serviceDescription, pickupDate } = context;
  
  // Schedule reminder 1 day before pickup
  const triggerDate = new Date(pickupDate);
  triggerDate.setDate(triggerDate.getDate() - 1);
  
  if (triggerDate < new Date()) {
    return { scheduled: false, reason: 'Pickup date is too soon' };
  }
  
  const metadata: NotificationMetadata = {
    serviceId,
  };
  
  const policyCheck = await canSend('service', {
    metadata,
    triggerDate,
    priority: 'critical', // Service reminders are critical
  });
  
  if (!policyCheck.allowed) {
    if (__DEV__) {
      console.log(`[NotificationService] Cannot send service pickup reminder: ${policyCheck.reason}`);
    }
    return { scheduled: false, reason: policyCheck.reason };
  }
  
  await scheduleLocalNotification({
    category: 'service',
    title: 'Service pick-up reminder',
    body: `Your ${serviceDescription} is ready for pick-up tomorrow.`,
    triggerDate,
    deepLink: linkToService(serviceId),
    metadata,
  });
  
  return { scheduled: true };
}
