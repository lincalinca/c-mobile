import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { LineItemWithDetails, Receipt } from '../../lib/repository';
import type { ResultItem } from '../../lib/results';
import { SimpleGearCard } from '../../components/results/SimpleGearCard';
import { SimpleServiceCard } from '../../components/results/SimpleServiceCard';
import { SimpleEducationCard } from '../../components/results/SimpleEducationCard';

const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  gear: SimpleGearCard,
  service: SimpleServiceCard,
  education: SimpleEducationCard,
};

// Helper to convert line item to ResultItem format for card rendering
function lineItemToResultItem(item: LineItemWithDetails, receipt: Receipt): ResultItem {
  const metadata: any = {};

  if (item.category === 'service' && item.serviceDetailsParsed) {
    metadata.serviceType = item.serviceDetailsParsed.serviceType;
    metadata.technician =
      item.serviceDetailsParsed.technicianName || item.serviceDetailsParsed.providerName;
    metadata.warranty = item.serviceDetailsParsed.warrantyDetails;
    metadata.notes = item.serviceDetailsParsed.notes;
  }

  if (item.category === 'education' && item.educationDetailsParsed) {
    metadata.studentName = item.educationDetailsParsed.studentName;
    metadata.teacherName = item.educationDetailsParsed.teacherName;
    metadata.frequency = item.educationDetailsParsed.frequency;
    metadata.duration = item.educationDetailsParsed.duration;
    metadata.startDate = item.educationDetailsParsed.startDate;
    metadata.endDate = item.educationDetailsParsed.endDate;
    metadata.daysOfWeek = item.educationDetailsParsed.daysOfWeek;
    metadata.times = item.educationDetailsParsed.times;
  }

  return {
    id: item.id,
    type: item.category as any,
    title: item.description,
    subtitle:
      item.category === 'gear' ? item.brand + (item.model ? ` ${item.model}` : '') : undefined,
    amount: item.totalPrice,
    date: receipt.transactionDate,
    metadata,
    receiptId: receipt.id,
    links: [],
  };
}

interface TransactionItemsViewProps {
  items: LineItemWithDetails[];
  receipt: Receipt;
}

export function TransactionItemsView({ items, receipt }: TransactionItemsViewProps) {
  const router = useRouter();

  const gearItems = items.filter((i) => i.category === 'gear');
  const serviceItems = items.filter((i) => i.category === 'service');
  const educationItems = items.filter((i) => i.category === 'education');
  const eventItems = items.filter((i) => i.category === 'event');

  const otherItems = [...serviceItems, ...educationItems, ...eventItems];

  const getItemRoute = (item: LineItemWithDetails) => {
    switch (item.category) {
      case 'service':
        return `/services/${item.id}`;
      case 'education':
        return `/education/${item.id}`;
      case 'event':
        return `/events/${item.id}`;
      default:
        return `/gear/item/${item.id}`;
    }
  };

  return (
    <>
      {/* Gear Items */}
      {gearItems.length > 0 && (
        <View className="p-6 border-b border-crescender-800">
          <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-sm">
            Captured Gear
          </Text>
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            {gearItems.map((item) => (
              <View key={item.id} style={{ width: '100%', padding: 4 }}>
                <SimpleGearCard
                  item={lineItemToResultItem(item, receipt)}
                  onPress={() => router.push(getItemRoute(item) as any)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Other Items */}
      {otherItems.length > 0 && (
        <View className="p-6">
          <Text className="text-crescender-400 font-bold mb-4 uppercase tracking-widest text-sm">
            Other Items and Services
          </Text>
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            {otherItems.map((item) => {
              const resultItem = lineItemToResultItem(item, receipt);
              const CardComponent = CARD_COMPONENTS[item.category] || SimpleGearCard;

              return (
                <View key={item.id} style={{ width: '100%', padding: 4 }}>
                  <CardComponent
                    item={resultItem}
                    onPress={() => router.push(getItemRoute(item) as any)}
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
