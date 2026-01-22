import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Redirect } from 'expo-router';
import Constants from 'expo-constants';
import { PersistentHeader } from '../components/header/PersistentHeader';
import { FilterBar, FilterType } from '../components/filters/FilterBar';
import { GearCard } from '../components/results/GearCard';
import { ServiceCard } from '../components/results/ServiceCard';
import { EventCard } from '../components/results/EventCard';
import { EducationCard } from '../components/results/EducationCard';
import { TransactionCard } from '../components/results/TransactionCard';
import { CardGrid } from '../components/results/CardGrid';
import { ProcessingView } from '../components/processing/ProcessingView';
import { ResultItem } from '../lib/results';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppLaunchPreview from '../components/brand/AppLaunchPreview';

// Hide mock screen in production builds
const isDev = __DEV__ || Constants.expoConfig?.extra?.enableMockScreen === true;

export default function MockScreen() {
  // Redirect to home if not in development mode
  if (!isDev) {
    return <Redirect href="/" />;
  }
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showProcessing, setShowProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const mockItems: ResultItem[] = [
    {
      id: '1',
      type: 'gear',
      title: 'Fender Stratocaster',
      subtitle: 'Electric Guitar',
      amount: 150000,
      date: new Date().toISOString(),
      metadata: {
        brand: 'Fender',
        model: 'Stratocaster',
        category: 'Electric Guitar'
      },
      links: [{ id: '5', type: 'transaction' }]
    },
    {
      id: '2',
      type: 'event',
      title: 'Jazz Night at The Basement',
      subtitle: 'Live Performance',
      date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in future
      metadata: { 
        duration: '120m',
        venue: 'The Basement',
        frequency: 'One-off'
      },
      links: [{ id: '5', type: 'transaction' }]
    },
    {
      id: '3',
      type: 'education',
      title: 'Guitar Lessons - Intermediate',
      subtitle: 'Sarah Johnson',
      amount: 12000,
      date: new Date().toISOString(),
      metadata: {
        studentName: 'Sarah Johnson',
        frequency: 'Weekly',
        duration: '60m',
        startDate: new Date().toISOString(),
        daysOfWeek: ['Monday', 'Wednesday'],
        times: ['3:00 PM', '3:00 PM']
      },
      links: [{ id: '5', type: 'transaction' }]
    },
    {
      id: '4',
      type: 'education',
      title: 'Bass Workshop',
      subtitle: 'Michael Chen',
      amount: 8500,
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      metadata: {
        studentName: 'Michael Chen',
        frequency: 'Fortnightly',
        duration: '90m',
        startDate: new Date(Date.now() - 86400000 * 14).toISOString(),
        daysOfWeek: ['Saturday'],
        times: ['10:00 AM']
      },
      links: [{ id: '6', type: 'transaction' }]
    },
    {
      id: '5',
      type: 'transaction',
      title: 'Strings & Picks Music Store',
      subtitle: 'Tax Invoice',
      amount: 162000,
      date: new Date().toISOString(),
      metadata: {
        merchant: 'Strings & Picks Music Store',
        tax: 12000
      },
      links: [{ id: '1', type: 'gear' }, { id: '2', type: 'event' }, { id: '3', type: 'education' }]
    },
    {
      id: '6',
      type: 'transaction',
      title: 'Academy of Music',
      subtitle: 'Receipt',
      amount: 8500,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      metadata: {
        merchant: 'Academy of Music',
        tax: 850
      },
      links: [{ id: '4', type: 'education' }]
    },
    {
      id: '7',
      type: 'gear',
      title: 'Marshall AMP DSL40',
      subtitle: 'Valve Amplifier',
      amount: 120000,
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      metadata: {
        brand: 'Marshall',
        model: 'DSL40',
        category: 'Amplifier'
      },
    },
    {
      id: '8',
      type: 'event',
      title: 'Recording Session',
      subtitle: 'Studio Time',
      date: new Date(Date.now() + 86400000 * 7).toISOString(), // 1 week in future
      metadata: { 
        duration: '240m',
        venue: 'Soundproof Studios',
        frequency: 'One-off'
      },
    },
    {
      id: '9',
      type: 'service',
      title: 'Guitar Setup & Intonation',
      subtitle: 'Repair & Setup',
      amount: 9500,
      date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      metadata: {
        serviceType: 'Setup & Intonation',
        technician: 'Alex Morgan',
        notes: 'Full setup with string replacement',
        warranty: '90 days',
        serviceDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        isMultiDay: false,
        gearItemId: '1' // Links to Fender Stratocaster
      },
      links: [
        { id: '10', type: 'transaction' },
        { id: 'event_9', type: 'event' },
        { id: '1', type: 'gear' }
      ]
    },
    {
      id: '10',
      type: 'transaction',
      title: 'Guitar Repair Workshop',
      subtitle: 'Service Invoice',
      amount: 9500,
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      metadata: {
        merchant: 'Guitar Repair Workshop',
        tax: 950
      },
      links: [{ id: '9', type: 'service' }]
    },
    {
      id: '11',
      type: 'service',
      title: 'Piano Tuning',
      subtitle: 'Routine Maintenance',
      amount: 15000,
      date: new Date(Date.now() - 86400000 * 14).toISOString(), // 2 weeks ago
      metadata: {
        serviceType: 'Piano Tuning',
        technician: 'Emma Williams',
        notes: 'Standard tuning and key adjustment',
        warranty: '60 days',
        serviceDate: new Date(Date.now() - 86400000 * 14).toISOString(),
        isMultiDay: false
      },
      links: [
        { id: '12', type: 'transaction' },
        { id: 'event_11', type: 'event' }
      ]
    },
    {
      id: '12',
      type: 'transaction',
      title: 'Sound & Tune Services',
      subtitle: 'Receipt',
      amount: 15000,
      date: new Date(Date.now() - 86400000 * 14).toISOString(),
      metadata: {
        merchant: 'Sound & Tune Services',
        tax: 1500
      },
      links: [{ id: '11', type: 'service' }]
    },
    {
      id: '13',
      type: 'service',
      title: 'Amp Valve Replacement',
      subtitle: 'Repair',
      amount: 22000,
      date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago - pickup date
      metadata: {
        serviceType: 'Valve Replacement',
        technician: 'Jamie Taylor',
        notes: 'Replaced 4 power tubes and 2 preamp tubes',
        warranty: '180 days',
        pickupDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        dropoffDate: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
        serviceDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        isMultiDay: true,
        gearItemId: '7' // Links to Marshall AMP
      },
      links: [
        { id: '14', type: 'transaction' },
        { id: 'event_13_overall', type: 'event' },
        { id: 'event_13_pickup', type: 'event' },
        { id: 'event_13_dropoff', type: 'event' },
        { id: '7', type: 'gear' }
      ]
    },
    {
      id: '14',
      type: 'transaction',
      title: 'Amp Specialists',
      subtitle: 'Tax Invoice',
      amount: 22000,
      date: new Date().toISOString(),
      metadata: {
        merchant: 'Amp Specialists',
        tax: 2200
      },
      links: [{ id: '13', type: 'service' }, { id: '7', type: 'gear' }]
    }
  ];

  const filteredItems = (() => {
    let filtered = activeFilter === 'all' 
      ? mockItems 
      : mockItems.filter(item => item.type === activeFilter);
    
    // Filter by date if selected
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(item => item.date.startsWith(dateStr));
    }
    
    return filtered;
  })();

  const onDateChange = (event: any, date?: Date) => {
    // Close picker on both platforms
    setShowDatePicker(false);
    
    // Handle date selection
    if (Platform.OS === 'android') {
      // On Android, event.type can be 'set' or 'dismissed'
      if (event.type === 'set' && date) {
        setSelectedDate(date);
      }
      // If dismissed, don't update date
    } else {
      // On iOS, date is provided when user confirms
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  if (showProcessing) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <TouchableOpacity 
          onPress={() => setShowProcessing(false)}
          className="absolute top-20 left-6 z-10 bg-crescender-900/80 px-4 py-2 rounded-full border border-gold"
        >
          <Text className="text-gold text-xs font-bold">← Back to Mock UI</Text>
        </TouchableOpacity>
        <ProcessingView />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />
      
      {/* Date Filter Bar */}
      <View className="px-6 py-2 flex-row justify-between items-center bg-crescender-900/20">
        <TouchableOpacity 
          onPress={() => {
            setShowDatePicker(true);
          }}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 bg-crescender-800/40 px-3 py-1.5 rounded-full border border-crescender-700/50"
        >
          <Feather name="calendar" size={14} color="#f5c518" />
          <Text className="text-crescender-200 text-xs font-bold uppercase tracking-widest">
            {selectedDate ? selectedDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Filter by Date'}
          </Text>
        </TouchableOpacity>

        {selectedDate && (
          <TouchableOpacity onPress={() => setSelectedDate(null)} className="p-1">
            <Text className="text-gold text-[10px] font-bold uppercase tracking-tighter">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          accentColor="#f5c518"
          textColor={Platform.OS === 'ios' ? '#f5c518' : undefined}
        />
      )}
      
      <ScrollView className="flex-1">
        <View className="px-4 pb-4">
          <AppLaunchPreview />
        </View>

        <View className="p-4">
          <Text className="text-gold font-bold mb-6 uppercase tracking-widest text-lg">UI Component Library</Text>
          
          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px]">Processing View</Text>
          <TouchableOpacity 
            onPress={() => setShowProcessing(true)}
            className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6"
          >
            <Text className="text-white text-sm font-semibold mb-1">Analysing Receipt View</Text>
            <Text className="text-crescender-400 text-xs">Tap to view full screen</Text>
          </TouchableOpacity>
          
          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px] mt-6">Filter Bar</Text>
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px] mt-6">Individual Cards</Text>
          <View className="flex-row gap-1 flex-wrap">
            <View style={{ width: '48%' }}>
               <GearCard item={mockItems[0]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <ServiceCard item={mockItems[8]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <EventCard item={mockItems[1]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <EducationCard item={mockItems[2]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <ServiceCard item={mockItems[10]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <TransactionCard item={mockItems[4]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <EducationCard item={mockItems[3]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <GearCard item={mockItems[6]} onPress={() => {}} />
            </View>
            <View style={{ width: '48%' }}>
               <ServiceCard item={mockItems[12]} onPress={() => {}} />
            </View>
          </View>

          <Text className="text-crescender-500 font-bold mb-4 uppercase tracking-widest text-[10px] mt-8">Card Grid Component</Text>
        </View>

        <View style={{ minHeight: 600 }}>
          <CardGrid 
            items={filteredItems} 
            onItemPress={(item) => console.log('Mock press:', item.title)}
            onLinkPress={(targetId, targetType) => console.log('Mock link:', targetId, targetType)}
          />
        </View>
        
        <View className="p-4 pb-20">
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
