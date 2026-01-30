import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { StudentRepository, ReceiptRepository } from '@lib/repository';
import { formatFullDate } from '@lib/dateUtils';
import { buildEducationChains } from '@lib/educationChain';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import { AutoSizingText } from '@components/common/AutoSizingText';
import { RELATIONSHIP_OPTIONS } from '@components/people/RelationshipSelector';
import { reshapeToResults, type ResultItem, type ResultType } from '@lib/results';
import { EducationCard } from '@components/results/EducationCard';
import { EventCard } from '@components/results/EventCard';
import { GearCard } from '@components/results/GearCard';
import { ServiceCard } from '@components/results/ServiceCard';

const ACCENT_COLOR = '#c084fc'; // Purple for people

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<any>(null);
  const [personResults, setPersonResults] = useState<ResultItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const personData = await StudentRepository.getById(id);
      if (!personData) {
        Alert.alert('Error', 'Person not found');
        router.back();
        return;
      }
      setPerson(personData);

      // Load all receipts to find items for this person
      const receipts = await ReceiptRepository.getAllWithItems();
      const allResults = reshapeToResults(receipts as any);
      
      // Filter for this person
      // 1. Exact match on studentName in metadata
      // 2. Fuzzy match on subtitle? (User asked for updated spelling to conform, so exact match on correct name is best if data is clean)
      // We will match normalized names
      const normalizedName = personData.name.toLowerCase().trim();
      
      const filtered = allResults.filter(item => {
        // Education items
        if (item.type === 'education') {
          const sName = item.metadata?.studentName?.toLowerCase().trim();
          return sName === normalizedName || item.subtitle?.toLowerCase().includes(normalizedName);
        }
        // Event items (lessons)
        if (item.type === 'event') {
          const sName = item.metadata?.studentName || item.subtitle;
          return sName?.toLowerCase().includes(normalizedName);
        }
        // Gear assigned to this person? (Not yet implemented in schema but good for future)
        return false;
      });

      setPersonResults(filtered);
      
    } catch (e) {
      console.error('Failed to load person details', e);
      Alert.alert('Error', 'Failed to load person details');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStartedDate = async (date: string) => {
    if (!person) return;
    try {
      await StudentRepository.update(person.id, { startedLessonsDate: date });
      setPerson({ ...person, startedLessonsDate: date });
      setShowDatePicker(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update date');
    }
  };

  const handleUpdateInstrument = async (instrument: string) => {
    if (!person) return;
    try {
      await StudentRepository.update(person.id, { instrument });
      setPerson({ ...person, instrument });
    } catch (e) {
      Alert.alert('Error', 'Failed to update instrument');
    }
  };

  const renderItem = ({ item }: { item: ResultItem }) => {
    const commonProps = {
      item,
      onPress: () => {
         if (item.type === 'education') router.push(`/education/${item.id}` as any);
         if (item.type === 'event') router.push(`/events/${item.id}` as any);
      },
      isHighlighted: false
    };

    if (item.type === 'education') return <View className="mb-4"><EducationCard {...commonProps} /></View>;
    if (item.type === 'event') return <View className="mb-4"><EventCard {...commonProps} /></View>;
    return null;
  };

  const ListHeader = () => {
    if (!person) return null;
    return (
      <View className="px-6 py-6 border-b border-crescender-800/50 mb-4">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.push('/people')}
            className="flex-row items-center gap-2 mb-4 -ml-2"
          >
            <Feather name="arrow-left" size={20} color="#f5c518" />
            <Text className="text-gold font-semibold">Back to People</Text>
          </TouchableOpacity>

          {/* Person Name & Relationship */}
          <View className="mb-6">
            <Text className="text-white text-3xl font-bold mb-2">{person.name}</Text>
            <View className="flex-row gap-2">
              {person.relationship && (
                <View className="bg-gold/20 px-4 py-2 rounded-full self-start">
                  <Text className="text-gold font-medium text-base">
                    {RELATIONSHIP_OPTIONS.find(r => r.value === person.relationship)?.label || person.relationship}
                  </Text>
                </View>
              )}
              <View className={`px-4 py-2 rounded-full self-start border ${person.status === 'draft' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                 <Text className={`${person.status === 'draft' ? 'text-orange-400' : 'text-green-400'} font-medium text-base capitalize`}>
                    {person.status || 'Active'}
                 </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-crescender-900/40 p-4 rounded-xl border border-crescender-800">
               <Text className="text-crescender-400 text-xs uppercase mb-1">Items</Text>
               <Text className="text-white text-2xl font-bold">{personResults.length}</Text>
            </View>
            {/* Instrument */}
            <TouchableOpacity 
              onPress={() => {
                   Alert.prompt(
                      'Set Instrument',
                      'Enter the focus instrument for this person',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Save', onPress: (val) => val && handleUpdateInstrument(val) },
                      ],
                      'plain-text',
                      person.instrument
                    );
              }}
              className="flex-[2] bg-crescender-900/40 p-4 rounded-xl border border-crescender-800"
            >
               <Text className="text-crescender-400 text-xs uppercase mb-1">Focus Instrument</Text>
               <Text className="text-white text-xl font-bold" numberOfLines={1}>
                 {person.instrument || 'Tap to set'}
               </Text>
            </TouchableOpacity>
          </View>

          {/* Started Lessons Date */}
          <View className="mb-6">
            <Text className="font-bold uppercase tracking-widest text-xs mb-2" style={{ color: ACCENT_COLOR }}>
              Started Lessons
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800 flex-row items-center justify-between"
            >
              <Text className="text-white text-base">
                {person.startedLessonsDate
                  ? formatFullDate(person.startedLessonsDate)
                  : 'Not set'}
              </Text>
              <Feather name="calendar" size={18} color={ACCENT_COLOR} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          {person.notes && (
            <View className="mb-6">
              <Text className="text-crescender-400 text-sm mb-2 uppercase tracking-widest" style={{ color: ACCENT_COLOR }}>
                Notes
              </Text>
              <View className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800">
                <Text className="text-white text-base">{person.notes}</Text>
              </View>
            </View>
          )}

          {/* Edit Button */}
          <TouchableOpacity
            onPress={() => router.push(`/people/${person.id}/edit`)}
            className="bg-crescender-800 px-6 py-3 rounded-xl mb-8 border border-crescender-700"
          >
            <Text className="text-crescender-300 font-bold text-center">Edit Profile Details</Text>
          </TouchableOpacity>

          <Text className="text-white font-bold text-lg mb-4 ml-1">History & Records</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      </View>
    );
  }

  if (!person) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />
      <FlatList
        data={personResults}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="p-10 items-center justify-center">
             <Text className="text-crescender-500 text-center">No records found for {person.name}</Text>
          </View>
        }
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleUpdateStartedDate}
        initialDate={person.startedLessonsDate || undefined}
        title="Started Lessons Date"
      />
    </View>
  );
}
