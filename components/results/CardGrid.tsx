import React, { forwardRef } from 'react';
import { View, FlatList, Text } from 'react-native';
import { ResultItem, ResultType } from '../../lib/results';
import { GearCard } from './GearCard';
import { EventCard } from './EventCard';
import { TransactionCard } from './TransactionCard';

interface CardGridProps {
  items: ResultItem[];
  onItemPress: (item: ResultItem) => void;
  onLinkPress?: (targetId: string, targetType: ResultType) => void;
  highlightedId?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const CardGrid = forwardRef<FlatList, CardGridProps>(({ 
  items, 
  onItemPress, 
  onLinkPress,
  highlightedId,
  onRefresh, 
  refreshing 
}, ref) => {
  const renderItem = ({ item }: { item: ResultItem }) => {
    const commonProps = {
      item,
      onPress: () => onItemPress(item),
      onLinkPress,
      isHighlighted: highlightedId === item.id
    };

    switch (item.type) {
      case 'gear':
        return <GearCard {...commonProps} />;
      case 'event':
        return <EventCard {...commonProps} />;
      case 'transaction':
        return <TransactionCard {...commonProps} />;
      default:
        return null;
    }
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Text className="text-crescender-400 text-center font-bold tracking-widest text-xs uppercase opacity-50">
          No records found in this context.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={ref}
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
    />
  );
});
