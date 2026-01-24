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
}

export const FilterBar = ({ 
  activeFilter, 
  onFilterChange, 
  useIcons = false,
  showEventSeries = true,
  onToggleEventSeries,
}: FilterBarProps) => {
  const filters: { label: string; value: FilterType; color: string; icon?: string }[] = [
    { label: 'ALL', value: 'all', color: '#f5c518', icon: 'grid' },
    { label: 'GEAR', value: 'gear', color: '#f5c518', icon: 'package' },
    { label: 'SERVICE', value: 'service', color: '#f97316', icon: 'tool' },
    { label: 'EVENTS', value: 'event', color: '#22d3ee', icon: 'calendar' },
    { label: 'EDUCATION', value: 'education', color: '#c084fc', icon: 'book-open' },
    { label: 'MONEY', value: 'transaction', color: '#a3e635', icon: 'dollar-sign' },
  ];

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <View className="flex-row gap-2 items-center">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => onFilterChange(filter.value)}
              className={`px-5 py-2 rounded-xl border flex-row items-center justify-center gap-2 ${
                activeFilter === filter.value
                  ? 'bg-gold border-gold'
                  : 'bg-crescender-900/40 border-crescender-800'
              }`}
              style={useIcons && filter.icon ? { minWidth: 44 } : undefined}
            >
              {useIcons && filter.icon ? (
                <Feather
                  name={filter.icon as any}
                  size={14}
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
          ))}
          
          {/* Event Series Toggle */}
          {onToggleEventSeries && (
            <TouchableOpacity
              onPress={onToggleEventSeries}
              className={`px-5 py-2 rounded-xl border flex-row items-center justify-center gap-2 ${
                showEventSeries
                  ? 'bg-crescender-700 border-crescender-600'
                  : 'bg-crescender-900/40 border-crescender-800'
              }`}
              style={useIcons ? { minWidth: 44 } : undefined}
            >
              {useIcons ? (
                <Feather
                  name="layers"
                  size={14}
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
