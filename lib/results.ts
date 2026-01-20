import { Receipt, ReceiptItem } from './repository';

export type ResultType = 'gear' | 'event' | 'transaction';

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
          date: receipt.date,
          metadata: {
            brand: item.brand,
            model: item.model,
            category: item.subcategory || item.instrumentType,
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
          date: receipt.date,
          metadata: {
            venue: item.description,
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
      date: receipt.date,
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
