import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, useWindowDimensions, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatFullDate } from '../../lib/dateUtils';
import { getEducationSeriesSummary } from '../../lib/educationEvents';
import type { EducationChain } from '../../lib/educationChain';

const ACCENT_COLOR = '#c084fc'; // Purple for education

interface EducationLearningPathViewProps {
  chain: EducationChain;
  currentChainIndex: number;
  onItemChange: (index: number, itemId: string) => void;
  showInfoModal: boolean;
  onShowInfoModal: (show: boolean) => void;
  /**
   * Layout variant:
   * - 'standalone': Component has its own padding (default, for education detail page)
   * - 'nested': Component is inside a padded container (for person detail page)
   */
  variant?: 'standalone' | 'nested';
}

export function EducationLearningPathView({
  chain,
  currentChainIndex,
  onItemChange,
  showInfoModal,
  onShowInfoModal,
  variant = 'standalone',
}: EducationLearningPathViewProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  
  // Calculate actual item width based on variant
  // In standalone mode: full width (component has its own padding)
  // In nested mode: width minus container padding (24px on each side = 48px total)
  const containerPadding = variant === 'nested' ? 48 : 0; // 24px * 2
  const itemWidth = width - containerPadding;

  // Scroll to current item when chain loads
  useEffect(() => {
    if (flatListRef.current && currentChainIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentChainIndex,
          animated: false,
        });
      }, 100);
    }
  }, [currentChainIndex]);

  const handleScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    if (newIndex !== currentChainIndex && newIndex >= 0 && newIndex < chain.items.length) {
      const newItem = chain.items[newIndex];
      onItemChange(newIndex, newItem.item.id);
    }
  };

  if (chain.items.length <= 1) return null;

  // Apply padding based on variant
  const containerClassName = variant === 'standalone' 
    ? 'p-6 border-b border-crescender-800'
    : 'py-6 border-b border-crescender-800';

  return (
    <View className={containerClassName}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>
          Learning Path
        </Text>
        <TouchableOpacity onPress={() => onShowInfoModal(true)} className="p-1">
          <Feather name="info" size={14} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View className="mb-2">
        <Text className="text-crescender-400 text-sm mb-1">
          {chain.items.length} term{chain.items.length !== 1 ? 's' : ''} of {chain.focus} lessons
        </Text>
      </View>

      <View 
        style={{ 
          height: 120, 
          marginHorizontal: variant === 'standalone' ? -24 : 0 
        }}
      >
        <FlatList
          ref={flatListRef}
          data={chain.items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          keyExtractor={(ci) => ci.item.id}
          initialScrollIndex={currentChainIndex >= 0 ? currentChainIndex : 0}
          contentContainerStyle={{ 
            paddingHorizontal: variant === 'standalone' ? 24 : 0 
          }}
          getItemLayout={(_, index) => ({
            length: itemWidth,
            offset: itemWidth * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 500);
          }}
          renderItem={({ item: chainItem }) => {
            const currentSeries = getEducationSeriesSummary(chainItem.item, chainItem.receipt);
            return (
              <View style={{ width: itemWidth }} className={variant === 'standalone' ? 'px-6' : ''}>
                <View className="bg-crescender-900/40 p-4 rounded-xl">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 min-w-0">
                      <Text className="text-white text-base font-medium" numberOfLines={2}>
                        {chainItem.item.description}
                      </Text>
                      <Text className="text-crescender-400 text-sm mt-1">
                        {formatFullDate(chainItem.receipt.transactionDate)}
                      </Text>
                    </View>
                    <Text className="text-crescender-500 text-base ml-2 flex-shrink-0">
                      ${(chainItem.item.totalPrice / 100).toFixed(2)}
                    </Text>
                  </View>
                  {currentSeries && currentSeries.count > 0 && (
                    <Text className="text-crescender-400 text-sm">
                      {currentSeries.count} lesson{currentSeries.count !== 1 ? 's' : ''} scheduled
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Page Indicators */}
      <View className="mt-3">
        <View className="flex-row justify-center items-center gap-2">
          {chain.items.map((_, idx) => (
            <View
              key={idx}
              className={`h-1.5 rounded-full ${idx === currentChainIndex ? 'bg-gold' : 'bg-crescender-700'}`}
              style={{ width: idx === currentChainIndex ? 24 : 8 }}
            />
          ))}
        </View>
      </View>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => onShowInfoModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => onShowInfoModal(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-crescender-900 rounded-2xl p-6 border border-crescender-700 max-w-md w-full"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">Learning Path</Text>
              <TouchableOpacity onPress={() => onShowInfoModal(false)}>
                <Feather name="x" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text className="text-crescender-300 text-base leading-6">
              Swipe left/right to view other lessons in this series
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
