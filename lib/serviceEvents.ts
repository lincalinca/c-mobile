import type { Receipt, ReceiptItem } from './repository';
import type { ResultItem, ResultType } from './results';

type ServiceDetails = {
  startDate?: string;
  endDate?: string;
  isMultiDay?: boolean;
  pickupDate?: string;
  dropoffDate?: string;
  technician?: string;
  gearItemId?: string;
  gearDescription?: string;
  serviceType?: string;
};

function parseServiceDetails(item: ReceiptItem): ServiceDetails {
  try {
    return (item.serviceDetails ? JSON.parse(item.serviceDetails) : {}) as ServiceDetails;
  } catch {
    return {};
  }
}

/** YYYY-MM-DD to Date at start of day (local). */
function toDate(s: string): Date {
  const d = new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Format YYYY-MM-DD. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generate event ResultItems from a service line item: single-day or multi-day service
 * with pickup, overall period, and dropoff events.
 */
export function generateServiceEvents(
  item: ReceiptItem,
  receipt: Receipt
): ResultItem[] {
  const events: ResultItem[] = [];
  const service = parseServiceDetails(item);
  const transactionId = `trans_${receipt.id}`;
  const baseTitle = item.description;
  const venue = receipt.merchant || undefined;

  const linkToService = { id: item.id, type: 'service' as ResultType };
  const linkToTrans = { id: transactionId, type: 'transaction' as ResultType };

  // Determine if this is a multi-day service
  const startDate = service.startDate || service.pickupDate || receipt.transactionDate;
  const endDate = service.endDate || service.dropoffDate;
  const isMultiDay = service.isMultiDay !== false && endDate && startDate !== endDate;

  if (!isMultiDay) {
    // --- Single-day service ---
    const serviceDate = startDate;
    events.push({
      id: `event_${item.id}`,
      type: 'event',
      title: `${baseTitle} - Service`,
      subtitle: service.serviceType || 'Service',
      date: serviceDate,
      metadata: {
        venue,
        technician: service.technician,
        serviceType: service.serviceType,
        gearItemId: service.gearItemId,
        gearDescription: service.gearDescription,
      },
      receiptId: receipt.id,
      links: [linkToService, linkToTrans],
    });
    return events;
  }

  // --- Multi-day service: pickup, overall, dropoff ---
  const pickup = toDate(startDate);
  const dropoff = toDate(endDate!);
  const daysDiff = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));

  // Overall service period event
  events.push({
    id: `event_${item.id}_overall`,
    type: 'event',
    title: `${baseTitle} - Service Period`,
    subtitle: `${daysDiff} day service`,
    date: startDate,
    metadata: {
      venue,
      startDate,
      endDate,
      duration: `${daysDiff} days`,
      technician: service.technician,
      serviceType: service.serviceType,
      gearItemId: service.gearItemId,
      gearDescription: service.gearDescription,
    },
    receiptId: receipt.id,
    links: [linkToService, linkToTrans],
  });

  // Pickup/Dropoff event
  events.push({
    id: `event_${item.id}_pickup`,
    type: 'event',
    title: `${baseTitle} - Drop-off`,
    subtitle: 'Service begins',
    date: startDate,
    metadata: {
      venue,
      technician: service.technician,
      serviceType: service.serviceType,
      gearItemId: service.gearItemId,
      gearDescription: service.gearDescription,
    },
    receiptId: receipt.id,
    links: [linkToService, linkToTrans],
  });

  // Pickup event
  events.push({
    id: `event_${item.id}_dropoff`,
    type: 'event',
    title: `${baseTitle} - Pickup`,
    subtitle: 'Service complete',
    date: endDate!,
    metadata: {
      venue,
      technician: service.technician,
      serviceType: service.serviceType,
      gearItemId: service.gearItemId,
      gearDescription: service.gearDescription,
    },
    receiptId: receipt.id,
    links: [linkToService, linkToTrans],
  });

  return events;
}
