import { View, Text, Platform, TouchableOpacity, ActivityIndicator, FlatList, Modal, BackHandler } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo, useRef } from 'react';
import { ReceiptRepository } from '../lib/repository';
import { reshapeToResults, ResultItem, ResultType } from '../lib/results';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraBar } from '../components/header/CameraBar';
import { FilterBar, FilterType } from '../components/filters/FilterBar';
import { CardGrid } from '../components/results/CardGrid';
import { PersistentHeader } from '../components/header/PersistentHeader';
import { DateRangeCalendarModal } from '../components/calendar/DateRangeCalendarModal';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdBanner } from '../components/ads';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState<ResultItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [useIconFilters, setUseIconFilters] = useState(true);
  const [financialYearStartMonth, setFinancialYearStartMonth] = useState(7);
  const [showEventSeries, setShowEventSeries] = useState(true); // Default: hide individual events

  const gridRef = useRef<FlatList>(null);

  const loadData = async () => {
    try {
      const receiptsWithItems = await ReceiptRepository.getAllWithItems();
      const results = reshapeToResults(receiptsWithItems as any);
      setAllResults(results);
    } catch (e) {
      console.error('Failed to load results', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();

      // Load settings
      const loadSettings = async () => {
        try {
          const [filters, fyStart] = await Promise.all([
            AsyncStorage.getItem('useIconFilters'),
            AsyncStorage.getItem('financialYearStartMonth'),
          ]);
          setUseIconFilters(filters !== null ? JSON.parse(filters) : true);
          setFinancialYearStartMonth(fyStart !== null ? parseInt(fyStart, 10) : 7);
        } catch (e) {
          console.error('Failed to load settings', e);
        }
      };
      loadSettings();

      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        sub.remove();
      };
    }, [])
  );

  const filteredResults = useMemo(() => {
    let filtered = allResults;
    
    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === activeFilter);
    }
    
    // Filter event series: if showEventSeries is true, hide individual events (IDs starting with event_)
    if (showEventSeries) {
      filtered = filtered.filter(item => !(item.type === 'event' && item.id.startsWith('event_')));
    }
    
    // Filter by date range (item.date can be YYYY-MM-DD or ISO with time)
    const startStr = startDate ? startDate.toISOString().split('T')[0] : null;
    const endStr = endDate ? endDate.toISOString().split('T')[0] : null;
    const itemDate = (d: string) => d.slice(0, 10);
    if (startStr != null && endStr != null) {
      filtered = filtered.filter(item => itemDate(item.date) >= startStr && itemDate(item.date) <= endStr);
    } else if (startStr != null) {
      filtered = filtered.filter(item => itemDate(item.date) >= startStr);
    } else if (endStr != null) {
      filtered = filtered.filter(item => itemDate(item.date) <= endStr);
    }
    
    return filtered;
  }, [allResults, activeFilter, startDate, endDate, showEventSeries]);

  const handleItemPress = (item: ResultItem) => {
    // Clear highlight on manual touch
    if (highlightedId === item.id) {
      setHighlightedId(null);
    }

    if (item.type === 'gear') {
      router.push(`/gear/${item.id}` as any);
    } else if (item.type === 'transaction') {
      // Navigate to the gear detail page which shows full receipt details
      router.push(`/gear/${item.receiptId}` as any);
    } else if (item.type === 'service') {
      router.push(`/services/${item.id}` as any);
    } else if (item.type === 'education') {
      router.push(`/education/${item.id}` as any);
    } else if (item.type === 'event') {
      router.push(`/events/${item.id}` as any);
    }
  };

  const handleLinkPress = (targetId: string, targetType: ResultType) => {
    // For events, navigate directly to the event detail page
    if (targetType === 'event') {
      router.push(`/events/${targetId}` as any);
      return;
    }
    
    // 1. Ensure the item is visible in current filter
    if (activeFilter !== 'all' && activeFilter !== targetType) {
      setActiveFilter('all');
    }
    
    // 2. Clear date filter if target might be on a different date 
    // (In our case items on same receipt always share same date, but clearing is safer)
    // Actually, chips link items on SAME receipt, so they share date.

    // 3. Scroll to and Highlight
    setTimeout(() => {
      const index = filteredResults.findIndex(r => r.id === targetId);
      if (index !== -1) {
        gridRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        setHighlightedId(targetId);
        
        // Auto-clear highlight after 3 seconds
        setTimeout(() => setHighlightedId(prev => prev === targetId ? null : prev), 3000);
      }
    }, 100);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const onDateRangeApply = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setShowDateRangePicker(false);
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f5c518" />
        </View>
      </View>
    );
  }

  // --- EMPTY STATE ---
  if (allResults.length === 0) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 justify-center items-center px-10">
          <TouchableOpacity 
            onPress={() => router.push('/scan')}
            className="w-64 h-64 rounded-full bg-gold/10 border-4 border-gold/30 items-center justify-center shadow-2xl shadow-gold/20"
          >
            <View className="w-48 h-48 rounded-full bg-gold items-center justify-center">
              <Feather name="camera" size={64} color="#2e1065" />
            </View>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold mt-10 tracking-tight text-center" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
            GOT A RECEIPT?{'\n'}SNAP TO GET STARTED
          </Text>
          <Text className="text-crescender-400 text-center mt-4 leading-relaxed">
            Instantly track gear, events, and transactions by snapping your first receipt.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <DateRangeCalendarModal
        visible={showDateRangePicker}
        onRequestClose={() => setShowDateRangePicker(false)}
        startDate={startDate}
        endDate={endDate}
        onApply={onDateRangeApply}
        financialYearStartMonth={financialYearStartMonth}
      />

      {/* Camera Capture Bar with Date Filter */}
      <CameraBar
        startDate={startDate}
        endDate={endDate}
        onShowDatePicker={() => setShowDateRangePicker(true)}
        onClearDate={() => { setStartDate(null); setEndDate(null); }}
      />

      {/* Filter Bar */}
      <FilterBar 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
        useIcons={useIconFilters}
        showEventSeries={showEventSeries}
        onToggleEventSeries={() => setShowEventSeries(!showEventSeries)}
      />

      {/* Results Grid */}
      <CardGrid 
        ref={gridRef}
        items={filteredResults} 
        onItemPress={handleItemPress}
        onLinkPress={handleLinkPress}
        highlightedId={highlightedId}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* Banner Ad at bottom */}
      <AdBanner position="bottom" />

      {/* Exit app confirmation modal (Android hardware back on home) */}
      <Modal
        transparent
        visible={showExitModal}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-8">
          <View className="bg-crescender-900/95 rounded-2xl p-6 w-full border border-crescender-700">
            <Text className="text-white text-xl font-bold mb-2">
              Exit Crescender?
            </Text>
            <Text className="text-crescender-300 text-base mb-6">
              You’re on the home screen. Do you want to close the app?
            </Text>
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-full bg-crescender-800"
              >
                <Text className="text-crescender-100 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowExitModal(false);
                  BackHandler.exitApp();
                }}
                className="px-4 py-2 rounded-full bg-gold"
              >
                <Text className="text-crescender-950 font-bold">
                  Exit app
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
