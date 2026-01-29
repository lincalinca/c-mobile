/**
 * Deep Link Construction
 * 
 * Central place to construct deep links for notifications and navigation.
 * Prevents multiple hard-coded deep link formats from appearing across the app.
 */

/**
 * Generate deep link to an education item
 */
export function linkToEducationItem(lineItemId: string): string {
  return `crescender://education/${lineItemId}`;
}

/**
 * Generate deep link to a gear item
 */
export function linkToGearItem(gearId: string): string {
  return `crescender://gear/item/${gearId}`;
}

/**
 * Generate deep link to a service item
 */
export function linkToService(serviceId: string): string {
  return `crescender://services/${serviceId}`;
}

/**
 * Generate deep link to a transaction
 */
export function linkToTransaction(transactionId: string): string {
  return `crescender://gear/${transactionId}`;
}

/**
 * Generate deep link to a person/student
 */
export function linkToPerson(personId: string): string {
  return `crescender://people/${personId}`;
}

/**
 * Generate deep link to the processing queue (history with queue filter)
 */
export function linkToProcessingQueue(): string {
  return `crescender://history?filter=queue`;
}

/**
 * Generate deep link to a specific queue item for review
 */
export function linkToQueueItem(queueItemId: string): string {
  return `crescender://review/queue/${queueItemId}`;
}
