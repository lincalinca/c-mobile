import { Receipt, ReceiptItem } from './repository';

export type ResultType = 'gear' | 'service' | 'event' | 'education' | 'transaction';

export interface ResultItem {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  amount?: number;
  date: string;
  metadata: any;
  receiptId?: string;
  imageUrl?: string;
  links?: { id: string; type: ResultType }[];
}

export function reshapeToResults(receipts: (Receipt & { items: ReceiptItem[] })[]): ResultItem[] {
  const results: ResultItem[] = [];

  for (const receipt of receipts) {
    const transactionId = `trans_${receipt.id}`;
    const itemResults: ResultItem[] = [];

    // Process gear and events first to get their IDs
    for (const item of receipt.items) {
      if (item.category === 'gear') {
        itemResults.push({
          id: item.id,
          type: 'gear',
          title: item.description,
          subtitle: item.brand && item.model ? `${item.brand} ${item.model}` : item.category,
          amount: item.totalPrice,
          date: receipt.transactionDate,
          metadata: {
            brand: item.brand,
            model: item.model,
            category: item.gearCategory || item.instrumentType,
          },
          receiptId: receipt.id,
          imageUrl: receipt.imageUrl || undefined,
          links: [{ id: transactionId, type: 'transaction' }]
        });
      } else if (item.category === 'event') {
        itemResults.push({
          id: item.id,
          type: 'event',
          title: item.description,
          subtitle: 'Scheduled Event',
          date: receipt.transactionDate,
          metadata: {
            venue: item.description,
          },
          receiptId: receipt.id,
          links: [{ id: transactionId, type: 'transaction' }]
        });
      } else if (item.category === 'service') {
        // Service metadata may contain dates and gear info
        const serviceMetadata: any = {
          serviceType: item.description,
          technician: item.notes,
          notes: item.notes,
        };
        
        // Parse service details from notes if they contain structured data
        // The AI might extract: pickupDate, dropoffDate, serviceDate, gearItem
        let parsedNotes: any = {};
        try {
          if (item.notes && item.notes.startsWith('{')) {
            parsedNotes = JSON.parse(item.notes);
          }
        } catch (e) {
          // Not JSON, use as-is
        }
        
        const serviceDate = parsedNotes.serviceDate || receipt.transactionDate;
        const pickupDate = parsedNotes.pickupDate;
        const dropoffDate = parsedNotes.dropoffDate;
        const gearItemId = parsedNotes.gearItemId || parsedNotes.gearId;
        const gearDescription = parsedNotes.gearDescription;
        
        // Determine if single day or multi-day service
        const isMultiDay = pickupDate && dropoffDate && pickupDate !== dropoffDate;
        
        // Create event links for service dates
        const eventLinks: { id: string; type: ResultType }[] = [];
        if (isMultiDay) {
          // Multi-day: create 3 event IDs (overall, pickup, dropoff)
          eventLinks.push(
            { id: `event_${item.id}_overall`, type: 'event' },
            { id: `event_${item.id}_pickup`, type: 'event' },
            { id: `event_${item.id}_dropoff`, type: 'event' }
          );
        } else {
          // Single day: create 1 event ID
          eventLinks.push({ id: `event_${item.id}`, type: 'event' });
        }
        
        // Add transaction link
        const serviceLinks: { id: string; type: ResultType }[] = [
          { id: transactionId, type: 'transaction' },
          ...eventLinks
        ];
        
        // Add gear link if available
        if (gearItemId) {
          serviceLinks.push({ id: gearItemId, type: 'gear' });
        }
        
        // Store service dates in metadata
        Object.assign(serviceMetadata, {
          serviceDate,
          pickupDate,
          dropoffDate,
          isMultiDay,
          gearItemId,
          gearDescription
        });
        
        itemResults.push({
          id: item.id,
          type: 'service',
          title: item.description,
          subtitle: item.notes || 'Repair & Setup',
          amount: item.totalPrice,
          date: serviceDate,
          metadata: serviceMetadata,
          receiptId: receipt.id,
          imageUrl: receipt.imageUrl || undefined,
          links: serviceLinks
        });
        
        // Create event items for service dates
        if (isMultiDay && pickupDate && dropoffDate) {
          // Overall service event
          itemResults.push({
            id: `event_${item.id}_overall`,
            type: 'event',
            title: `${item.description} - Service Period`,
            subtitle: 'Service Event',
            date: pickupDate,
            metadata: {
              venue: receipt.merchant,
              startDate: pickupDate,
              endDate: dropoffDate,
              duration: `${Math.ceil((new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
              frequency: 'One-off'
            },
            receiptId: receipt.id,
            links: [{ id: item.id, type: 'service' }, { id: transactionId, type: 'transaction' }]
          });
          
          // Pickup event
          itemResults.push({
            id: `event_${item.id}_pickup`,
            type: 'event',
            title: `${item.description} - Pickup`,
            subtitle: 'Service Pickup',
            date: pickupDate,
            metadata: {
              venue: receipt.merchant,
              duration: '1 day',
              frequency: 'One-off'
            },
            receiptId: receipt.id,
            links: [{ id: item.id, type: 'service' }, { id: transactionId, type: 'transaction' }]
          });
          
          // Dropoff event
          itemResults.push({
            id: `event_${item.id}_dropoff`,
            type: 'event',
            title: `${item.description} - Dropoff`,
            subtitle: 'Service Dropoff',
            date: dropoffDate,
            metadata: {
              venue: receipt.merchant,
              duration: '1 day',
              frequency: 'One-off'
            },
            receiptId: receipt.id,
            links: [{ id: item.id, type: 'service' }, { id: transactionId, type: 'transaction' }]
          });
        } else {
          // Single day service event
          itemResults.push({
            id: `event_${item.id}`,
            type: 'event',
            title: `${item.description} - Service Date`,
            subtitle: 'Service Event',
            date: serviceDate,
            metadata: {
              venue: receipt.merchant,
              duration: '1 day',
              frequency: 'One-off'
            },
            receiptId: receipt.id,
            links: [{ id: item.id, type: 'service' }, { id: transactionId, type: 'transaction' }]
          });
        }
      } else if (item.category === 'education') {
        let eduDetails = {};
        try {
          eduDetails = item.educationDetails ? JSON.parse(item.educationDetails) : {};
        } catch (e) {
          console.error('Failed to parse education details', e);
        }

        itemResults.push({
          id: item.id,
          type: 'education',
          title: item.description,
          subtitle: (eduDetails as any).studentName || 'Education Session',
          amount: item.totalPrice,
          date: receipt.transactionDate,
          metadata: {
            ...eduDetails as any,
          },
          receiptId: receipt.id,
          links: [{ id: transactionId, type: 'transaction' }]
        });
      }
    }

    // Add receipt as transaction, linking to all its items
    results.push({
      id: transactionId,
      type: 'transaction',
      title: receipt.merchant,
      subtitle: 'Tax Receipt',
      amount: receipt.total,
      date: receipt.transactionDate,
      metadata: {
        merchant: receipt.merchant,
        tax: receipt.tax,
      },
      receiptId: receipt.id,
      imageUrl: receipt.imageUrl || undefined,
      links: itemResults.map(ir => ({ id: ir.id, type: ir.type }))
    });

    results.push(...itemResults);
  }

  // Sort by date descending
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
