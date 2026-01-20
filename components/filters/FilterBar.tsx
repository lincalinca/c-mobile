import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export type FilterType = 'all' | 'gear' | 'event' | 'transaction';

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const FilterBar = ({ activeFilter, onFilterChange }: FilterBarProps) => {
  const filters: { label: string; value: FilterType; color: string }[] = [
    { label: 'ALL', value: 'all', color: '#f5c518' },
    { label: 'GEAR', value: 'gear', color: '#f5c518' },
    { label: 'EVENTS', value: 'event', color: '#22d3ee' },
    { label: 'MONEY', value: 'transaction', color: '#a3e635' },
  ];

  return (
    <View className="mb-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <View className="flex-row gap-2">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => onFilterChange(filter.value)}
              className={`px-5 py-2 rounded-xl border ${
                activeFilter === filter.value 
                  ? 'bg-gold border-gold' 
                  : 'bg-crescender-900/40 border-crescender-800'
              }`}
            >
              <Text 
                className={`font-bold text-[10px] tracking-widest ${
                  activeFilter === filter.value ? 'text-crescender-950' : 'text-crescender-400'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
