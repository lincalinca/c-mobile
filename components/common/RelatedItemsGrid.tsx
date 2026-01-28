import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResultItem } from '../../lib/results';
import { GearCard } from '../results/GearCard';
import { ServiceCard } from '../results/ServiceCard';
import { TransactionCard } from '../results/TransactionCard';
import { EventCard } from '../results/EventCard';
import { EducationCard } from '../results/EducationCard';

const CARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  gear: GearCard,
  service: ServiceCard,
  transaction: TransactionCard,
  event: EventCard,
  education: EducationCard,
};

const ROUTE_SEGMENTS: Record<string, string> = {
  gear: 'gear/item',
  service: 'services',
  education: 'education',
  event: 'events',
  transaction: 'gear', // transactions route to receipt detail
};

interface RelatedItemsGridProps {
  items: ResultItem[];
  accentColor: string;
  title?: string;
  columnBreakpoint?: number;
}

export function RelatedItemsGrid({
  items,
  accentColor,
  title = 'Related Records',
  columnBreakpoint = 600,
}: RelatedItemsGridProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (items.length === 0) return null;

  const handleItemPress = (item: ResultItem) => {
    if (item.type === 'transaction') {
      router.push(`/gear/${item.receiptId}` as any);
    } else {
      const segment = ROUTE_SEGMENTS[item.type] || 'gear';
      router.push(`/${segment}/${item.id}` as any);
    }
  };

  const handleLinkPress = (targetId: string, targetType: string) => {
    if (targetType === 'transaction') {
      const item = items.find((x) => x.id === targetId);
      const receiptId = (item as ResultItem & { receiptId?: string })?.receiptId;
      if (receiptId) router.push(`/gear/${receiptId}` as any);
    } else {
      const segment = ROUTE_SEGMENTS[targetType] || 'gear';
      router.push(`/${segment}/${targetId}` as any);
    }
  };

  const colWidth = width < columnBreakpoint ? '100%' : '50%';

  return (
    <View className="p-6">
      <Text
        className="font-bold mb-4 uppercase tracking-widest text-xs"
        style={{ color: accentColor }}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
        {items.map((item) => {
          const CardComponent = CARD_COMPONENTS[item.type];
          if (!CardComponent) return null;

          return (
            <View key={item.id} style={{ width: colWidth, padding: 4 }}>
              <CardComponent
                item={item}
                onPress={() => handleItemPress(item)}
                onLinkPress={handleLinkPress}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
