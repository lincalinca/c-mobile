import React, { forwardRef } from 'react';
import { View, FlatList, Text, useWindowDimensions } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, withTiming, withSpring, withDelay, useAnimatedStyle, useSharedValue, withSequence, ComplexAnimationBuilder } from 'react-native-reanimated';
import { ResultItem, ResultType } from '@lib/results';
import { GearCard } from './GearCard';
import { ServiceCard } from './ServiceCard';
import { EventCard } from './EventCard';
import { EducationCard } from './EducationCard';
import { TransactionCard } from './TransactionCard';

// Animation configuration for easy tweaking
const ANIMATION_CONFIG = {
  duration: 450,        // Total animation duration in ms
  staggerDelay: 120,    // Delay between each card in ms
  initialOffsetX: 70,   // Initial X offset in px
  initialRotation: -8,  // Initial rotation in degrees
  opacityStart: 0,      // Initial opacity
  springConfig: {
    damping: 14,        // Buoyancy control
    stiffness: 80,
    mass: 0.8,
  }
};

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
  const { width } = useWindowDimensions();
  const numColumns = width < 600 ? 1 : 2;

  const renderItem = ({ item, index }: { item: ResultItem, index: number }) => {
    const commonProps = {
      item,
      onPress: () => onItemPress(item),
      onLinkPress,
      isHighlighted: highlightedId === item.id
    };

    const isFromLeft = index % 2 === 0;
    const startX = isFromLeft ? -ANIMATION_CONFIG.initialOffsetX : ANIMATION_CONFIG.initialOffsetX;
    
    // Create custom entering animation
    const enteringAnimation = () => {
      'worklet';
      const animations = {
        transform: [
          { translateX: withDelay(index * ANIMATION_CONFIG.staggerDelay, withSpring(0, ANIMATION_CONFIG.springConfig)) },
          { rotate: withDelay(index * ANIMATION_CONFIG.staggerDelay, withSpring('0deg', ANIMATION_CONFIG.springConfig)) },
        ],
        opacity: withDelay(index * ANIMATION_CONFIG.staggerDelay, withTiming(1, { duration: ANIMATION_CONFIG.duration })),
      };
      
      const initialValues = {
        transform: [
          { translateX: startX },
          { rotate: `${ANIMATION_CONFIG.initialRotation}deg` },
        ],
        opacity: ANIMATION_CONFIG.opacityStart,
      };

      return {
        initialValues,
        animations,
      };
    };

    const cardProps = {
      ...commonProps,
      onLinkPress: onLinkPress as any,
    };

    let cardContent;
    switch (item.type) {
      case 'gear':
        cardContent = <GearCard {...cardProps} />;
        break;
      case 'service':
        cardContent = <ServiceCard {...cardProps} />;
        break;
      case 'event':
        cardContent = <EventCard {...cardProps} />;
        break;
      case 'education':
        cardContent = <EducationCard {...cardProps} />;
        break;
      case 'transaction':
        cardContent = <TransactionCard {...cardProps} />;
        break;
      default:
        cardContent = null;
    }

    if (!cardContent) return null;

    return (
      <Animated.View 
        entering={enteringAnimation}
        style={{ flex: 1 }}
      >
        {cardContent}
      </Animated.View>
    );
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Text className="text-crescender-400 text-center font-bold tracking-widest text-sm uppercase opacity-50">
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
      numColumns={numColumns}
      contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
    />
  );
});
