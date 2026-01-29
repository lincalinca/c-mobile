import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { StudentRepository, ReceiptRepository, type Student, type Receipt, type LineItemWithDetails } from '@lib/repository';
import { formatFullDate } from '@lib/dateUtils';
import { buildEducationChains, type EducationChain } from '@lib/educationChain';
import { EducationLearningPathView } from '../education/EducationLearningPathView';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import { AutoSizingText } from '@components/common/AutoSizingText';
import { RELATIONSHIP_OPTIONS } from '@components/people/RelationshipSelector';

const ACCENT_COLOR = '#c084fc'; // Purple for people

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Student | null>(null);
  const [educationChains, setEducationChains] = useState<EducationChain[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLearningPathInfo, setShowLearningPathInfo] = useState(false);
  const [currentChainIndices, setCurrentChainIndices] = useState<Record<string, number>>({});
  const [currentChain, setCurrentChain] = useState<EducationChain | null>(null);

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

      // Load all receipts to find education items for this person
      const receipts = await ReceiptRepository.getAllWithItems();
      
      // Filter education chains for this person
      const allChains = buildEducationChains(receipts);
      const personChains = allChains.filter(
        chain => chain.studentName?.toLowerCase() === personData.name.toLowerCase()
      );
      
      setEducationChains(personChains);
      
      // Set the first chain as current if available
      if (personChains.length > 0) {
        setCurrentChain(personChains[0]);
        setCurrentChainIndex(0);
      }
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
      console.error('Failed to update started date', e);
      Alert.alert('Error', 'Failed to update date');
    }
  };

  const handleUpdateInstrument = async (instrument: string) => {
    if (!person) return;
    try {
      await StudentRepository.update(person.id, { instrument });
      setPerson({ ...person, instrument });
    } catch (e) {
      console.error('Failed to update instrument', e);
      Alert.alert('Error', 'Failed to update instrument');
    }
  };

  const handleChainItemChange = (chainKey: string) => (index: number, itemId: string) => {
    setCurrentChainIndices(prev => ({ ...prev, [chainKey]: index }));
    // Could navigate to education item detail here if needed
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

  if (!person) {
    return null;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-6">
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
            {person.relationship && (
              <View className="bg-gold/20 px-4 py-2 rounded-full self-start mt-2">
                <Text className="text-gold font-medium text-base">
                  {RELATIONSHIP_OPTIONS.find(r => r.value === person.relationship)?.label || person.relationship}
                </Text>
              </View>
            )}
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

          {/* Instrument */}
          <View className="mb-6">
            <Text className="font-bold uppercase tracking-widest text-xs mb-2" style={{ color: ACCENT_COLOR }}>
              Focus Instrument
            </Text>
            <View className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800">
              {person.instrument ? (
                <AutoSizingText
                  value={person.instrument}
                  baseFontSize={16}
                  minFontSize={12}
                  className="text-white text-base"
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    Alert.prompt(
                      'Set Instrument',
                      'Enter the focus instrument for this person',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Save',
                          onPress: (instrument) => {
                            if (instrument) handleUpdateInstrument(instrument);
                          },
                        },
                      ],
                      'plain-text'
                    );
                  }}
                  className="flex-row items-center gap-2"
                >
                  <Text className="text-crescender-500 text-base">Not set</Text>
                  <Feather name="plus" size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Learning Paths */}
          {educationChains.length > 0 && (
            <View className="mb-6">
              {educationChains.map((chain, idx) => (
                <View key={chain.chainKey} className="mb-6">
                  <EducationLearningPathView
                    chain={chain}
                    currentChainIndex={currentChainIndices[chain.chainKey] ?? 0}
                    onItemChange={handleChainItemChange(chain.chainKey)}
                    showInfoModal={showLearningPathInfo && idx === 0}
                    onShowInfoModal={setShowLearningPathInfo}
                    variant="nested"
                  />
                </View>
              ))}
            </View>
          )}

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
            className="bg-gold px-6 py-4 rounded-full"
          >
            <Text className="text-black font-bold text-center text-lg">Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {person && (
        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onConfirm={handleUpdateStartedDate}
          initialDate={person.startedLessonsDate || undefined}
          title="Started Lessons Date"
        />
      )}
    </View>
  );
}
