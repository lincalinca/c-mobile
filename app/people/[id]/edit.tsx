import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { StudentRepository, type Student } from '@lib/repository';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import { RelationshipSelector, type RelationshipType } from '@components/people/RelationshipSelector';

const ACCENT_COLOR = '#c084fc'; // Purple for people

export default function EditPersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [instrument, setInstrument] = useState('');
  const [startedLessonsDate, setStartedLessonsDate] = useState<string | undefined>();
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPerson();
  }, [id]);

  const loadPerson = async () => {
    if (!id) return;
    try {
      const personData = await StudentRepository.getById(id);
      if (!personData) {
        Alert.alert('Error', 'Person not found');
        router.back();
        return;
      }
      setPerson(personData);
      setName(personData.name);
      setRelationship((personData.relationship as RelationshipType) || null);
      setInstrument(personData.instrument || '');
      setStartedLessonsDate(personData.startedLessonsDate || undefined);
      setNotes(personData.notes || '');
    } catch (e) {
      console.error('Failed to load person', e);
      Alert.alert('Error', 'Failed to load person');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!person || !name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setSaving(true);
    try {
      await StudentRepository.update(person.id, {
        name: name.trim(),
        relationship: relationship || null,
        instrument: instrument.trim() || null,
        startedLessonsDate: startedLessonsDate || null,
        notes: notes.trim() || null,
      });

      router.back();
    } catch (e) {
      console.error('Failed to update person', e);
      Alert.alert('Error', 'Failed to update person. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!person) return;
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StudentRepository.delete(person.id);
              router.replace('/people');
            } catch (e) {
              console.error('Failed to delete person', e);
              Alert.alert('Error', 'Failed to delete person');
            }
          },
        },
      ]
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

  if (!person) {
    return null;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-2">Edit Person</Text>
            <Text className="text-crescender-400 text-sm">Update person's profile information</Text>
          </View>

          {/* Name */}
          <View className="mb-6">
            <Text className="text-crescender-400 text-sm mb-2 uppercase tracking-widest" style={{ color: ACCENT_COLOR }}>
              Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Person's name"
              placeholderTextColor="#6b7280"
              className="bg-crescender-900/40 border border-crescender-800 rounded-xl px-4 py-3 text-white text-base"
            />
          </View>

          {/* Relationship */}
          <View className="mb-6">
            <Text className="text-crescender-400 text-sm mb-2 uppercase tracking-widest" style={{ color: ACCENT_COLOR }}>
              Relationship
            </Text>
            <RelationshipSelector
              value={relationship}
              onSelect={setRelationship}
              accentColor={ACCENT_COLOR}
            />
          </View>

          {/* Instrument */}
          <View className="mb-6">
            <Text className="font-bold uppercase tracking-widest text-xs mb-2" style={{ color: ACCENT_COLOR }}>
              Focus Instrument
            </Text>
            <TextInput
              value={instrument}
              onChangeText={setInstrument}
              placeholder="e.g., Violin, Piano, Guitar"
              placeholderTextColor="#6b7280"
              className="bg-crescender-900/40 border border-crescender-800 rounded-xl px-4 py-3 text-white text-base"
            />
          </View>

          {/* Started Lessons Date */}
          <View className="mb-6">
            <Text className="font-bold uppercase tracking-widest text-xs mb-2" style={{ color: ACCENT_COLOR }}>
              Started Lessons Date
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-crescender-900/40 border border-crescender-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={startedLessonsDate ? 'text-white text-base' : 'text-crescender-500 text-base'}>
                {startedLessonsDate ? new Date(startedLessonsDate).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : 'Select date'}
              </Text>
              <Feather name="calendar" size={18} color={ACCENT_COLOR} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-crescender-400 text-sm mb-2 uppercase tracking-widest" style={{ color: ACCENT_COLOR }}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional information..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-crescender-900/40 border border-crescender-800 rounded-xl px-4 py-3 text-white text-base"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !name.trim()}
            className={`bg-gold px-6 py-4 rounded-full mb-4 ${saving || !name.trim() ? 'opacity-50' : ''}`}
          >
            <Text className="text-black font-bold text-center text-lg">
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-600/20 border border-red-600 px-6 py-4 rounded-full"
          >
            <Text className="text-red-400 font-bold text-center">Delete Person</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setStartedLessonsDate(date);
          setShowDatePicker(false);
        }}
        initialDate={startedLessonsDate}
        title="Started Lessons Date"
      />
    </View>
  );
}
