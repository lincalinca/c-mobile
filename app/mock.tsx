import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { PersistentHeader } from '../components/header/PersistentHeader';
import { FilterBar, FilterType } from '../components/filters/FilterBar';
import { GearCard } from '../components/results/GearCard';
import { EventCard } from '../components/results/EventCard';
import { TransactionCard } from '../components/results/TransactionCard';
import { CardGrid } from '../components/results/CardGrid';
import { ResultItem } from '../lib/results';

export default function MockScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const mockItems: ResultItem[] = [
    {
      id: '1',
      type: 'gear',
      title: 'Fender Stratocaster',
      subtitle: 'Electric Guitar',
      amount: 150000,
      date: new Date().toISOString(),
      metadata: {},
      links: [{ id: '3', type: 'transaction' }]
    },
    {
      id: '2',
      type: 'event',
      title: 'Bass Lesson',
      subtitle: 'Academy of Music',
      date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in future
      metadata: { duration: '45m', frequency: 'Weekly' },
      links: [{ id: '3', type: 'transaction' }]
    },
    {
      id: '3',
      type: 'transaction',
      title: 'Strings & Picks',
      subtitle: 'Accessories Purchase',
      amount: 4500,
      date: new Date().toISOString(),
      metadata: {},
      links: [{ id: '1', type: 'gear' }, { id: '2', type: 'event' }]
    },
    {
      id: '4',
      type: 'gear',
      title: 'Marshall AMP DSL40',
      subtitle: 'Valve Amplifier',
      amount: 120000,
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      metadata: {},
    }
  ];

  const filteredItems = activeFilter === 'all' 
    ? mockItems 
    : mockItems.filter(item => item.type === activeFilter);

  return (
    <View className="flex-1 bg-crescender-950">
      <PersistentHeader />
      
      <ScrollView className="flex-1">
        <View className="p-6">
          <Text className="text-gold font-bold mb-6 uppercase tracking-widest text-lg">UI Component Library</Text>
          
          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px]">Filter Bar</Text>
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px] mt-6">Individual Cards</Text>
          <View className="flex-row gap-2 flex-wrap">
            <View style={{ width: '48%' }}>
               <GearCard item={mockItems[0]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <EventCard item={mockItems[1]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <TransactionCard item={mockItems[2]} onPress={() => {}} />
            </View>
          </View>

          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px] mt-8">Card Grid Component</Text>
        </View>

        <View style={{ height: 400 }}>
          <CardGrid 
            items={filteredItems} 
            onItemPress={(item) => console.log('Mock press:', item.title)} 
          />
        </View>
        
        <View className="p-6 pb-20">
          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px]">Typography</Text>
          <Text className="text-white text-4xl mb-2" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>Heading Large</Text>
          <Text className="text-gold text-2xl mb-4" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>Heading Medium Gold</Text>
          <Text className="text-crescender-200 text-base leading-relaxed mb-4">
            This is standard body text in Crescender 200 light purple. It is designed to be highly readable against the dark background.
          </Text>
          <Text className="text-crescender-400 text-sm italic">
            Captioned text or helper text in Crescender 400.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
