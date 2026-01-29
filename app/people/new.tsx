import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { PersistentHeader } from '@components/header/PersistentHeader';
import * as Crypto from 'expo-crypto';
import { StudentRepository } from '@lib/repository';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import { RelationshipSelector, type RelationshipType } from '@components/people/RelationshipSelector';

const ACCENT_COLOR = '#c084fc'; // Purple for people

export default function NewPersonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; instrument?: string; startedLessonsDate?: string }>();
  const [name, setName] = useState(params.name || '');
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [instrument, setInstrument] = useState(params.instrument || '');
  const [startedLessonsDate, setStartedLessonsDate] = useState<string | undefined>(params.startedLessonsDate || undefined);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setSaving(true);
    try {
      const personId = Crypto.randomUUID();
      await StudentRepository.create({
        id: personId,
        name: name.trim(),
        relationship: relationship || null,
        instrument: instrument.trim() || null,
        startedLessonsDate: startedLessonsDate || null,
        notes: notes.trim() || null,
      });

      router.replace(`/people/${personId}`);
    } catch (e) {
      console.error('Failed to create person', e);
      Alert.alert('Error', 'Failed to create person. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-2">New Person</Text>
            <Text className="text-crescender-400 text-sm">Add someone to track their learning journey</Text>
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
              autoFocus
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
            className={`bg-gold px-6 py-4 rounded-full ${saving || !name.trim() ? 'opacity-50' : ''}`}
          >
            <Text className="text-black font-bold text-center text-lg">
              {saving ? 'Saving...' : 'Create Person'}
            </Text>
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
