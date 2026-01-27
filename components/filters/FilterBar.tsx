import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ITEM_CATEGORIES, CategoryValue } from '../../constants/categories';

export type FilterType = 'all' | 'gear' | 'service' | 'event' | 'education' | 'transaction';

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  useIcons?: boolean;
  showEventSeries?: boolean;
  onToggleEventSeries?: () => void;
  onToggleIconMode?: () => void;
}

export const FilterBar = ({ 
  activeFilter, 
  onFilterChange, 
  useIcons = false,
  showEventSeries = true,
  onToggleEventSeries,
  onToggleIconMode,
}: FilterBarProps) => {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const filters: { label: string; value: FilterType; color: string; icon?: string }[] = [
    { label: 'ALL', value: 'all', color: '#f5c518', icon: 'grid' },
    { label: 'GEAR', value: 'gear', color: '#f5c518', icon: 'package' },
    { label: 'SERVICE', value: 'service', color: '#f97316', icon: 'tool' },
    { label: 'EVENTS', value: 'event', color: '#22d3ee', icon: 'calendar' },
    { label: 'EDUCATION', value: 'education', color: '#c084fc', icon: 'book-open' },
    { label: 'MONEY', value: 'transaction', color: '#a3e635', icon: 'dollar-sign' },
  ];

  const handlePress = (filter: any) => {
    onFilterChange(filter.value);
    if (useIcons) {
      setTooltip(filter.value);
      setTimeout(() => setTooltip(null), 1500);
    }
  };

  return (
    <View className="mt-6 relative z-50">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 35 }} // Reduced from 50
        className="overflow-visible"
      >
        <View className="flex-row gap-2 items-center overflow-visible">
          {filters.map((filter) => (
            <View key={filter.value} className="items-center relative">
              {/* Tooltip Popup */}
              {tooltip === filter.value && (
                <View 
                  className="absolute top-20 z-50 items-center"
                  style={{ 
                    minWidth: 120,
                    opacity: 0.85, // Apply opacity to the parent container to solve overlapping dark corners
                  }}
                >
                  <View 
                    style={{
                      backgroundColor: '#f5c518', // solid gold
                      borderRadius: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 16,
                      shadowColor: '#000', 
                      shadowOffset: { width: 0, height: 4 }, 
                      shadowOpacity: 0.4, 
                      shadowRadius: 5, 
                      elevation: 8,
                    }}
                  >
                    <Text className="text-crescender-950 font-bold text-[10px] uppercase tracking-tight text-center whitespace-nowrap">
                      Filter by {filter.label.toLowerCase()}
                    </Text>
                  </View>
                  <View 
                    className="absolute -top-1.5 w-3 h-3 rotate-45"
                    style={{ 
                      left: '50%', 
                      marginLeft: -6,
                      backgroundColor: '#f5c518', // solid gold
                      zIndex: -1, // Hidden behind the main body to avoid overlap visual
                    }}
                  />
                </View>
              )}
              <TouchableOpacity
                onPress={() => handlePress(filter)}
                onLongPress={onToggleIconMode}
                className={`px-4 py-3 rounded-[14px] border flex-row items-center justify-center gap-2 ${
                  activeFilter === filter.value
                    ? 'bg-gold border-gold'
                    : 'bg-crescender-900/40 border-crescender-800'
                }`}
                style={useIcons && filter.icon ? { minWidth: 44 } : undefined}
              >
                {useIcons && filter.icon ? (
                  <Feather
                    name={filter.icon as any}
                    size={21}
                    color={activeFilter === filter.value ? '#2e1065' : filter.color}
                  />
                ) : (
                  <Text
                    className={`font-bold text-xs tracking-widest ${
                      activeFilter === filter.value ? 'text-crescender-950' : 'text-crescender-400'
                    }`}
                  >
                    {filter.label}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Event Series Toggle */}
          {onToggleEventSeries && (
            <TouchableOpacity
              onPress={onToggleEventSeries}
              onLongPress={onToggleIconMode}
              className={`px-4 py-3 rounded-[14px] border flex-row items-center justify-center gap-2 ${
                showEventSeries
                  ? 'bg-crescender-700 border-crescender-600'
                  : 'bg-crescender-900/40 border-crescender-800'
              }`}
              style={useIcons ? { minWidth: 44 } : undefined}
            >
              {useIcons ? (
                <Feather
                  name="layers"
                  size={21}
                  color={showEventSeries ? '#f5c518' : '#9ca3af'}
                />
              ) : (
                <Text
                  className={`font-bold text-xs tracking-widest ${
                    showEventSeries ? 'text-gold' : 'text-crescender-400'
                  }`}
                >
                  {showEventSeries ? 'SERIES' : 'EVENTS'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
