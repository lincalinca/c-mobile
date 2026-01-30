import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { StudentRepository } from '@lib/repository';

interface AddPersonModalProps {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onPersonAdded: (personId: string, name: string) => void;
}

export function AddPersonModal({ visible, initialName, onClose, onPersonAdded }: AddPersonModalProps) {
  const [name, setName] = useState(initialName || '');
  const [instrument, setInstrument] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update state when initialName changes
  React.useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setIsSaving(true);
    try {
      const id = Crypto.randomUUID();
      await StudentRepository.create({
        id,
        name: name.trim(),
        instrument: instrument.trim() || null,
        status: 'active',
        relationship: 'student', // Default
        startedLessonsDate: new Date().toISOString().split('T')[0],
      });

      onPersonAdded(id, name.trim());
      onClose();
    } catch (e) {
      console.error('Failed to create person', e);
      Alert.alert('Error', 'Failed to save person');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <View className="bg-black/60 flex-1 justify-end">
          <View className="bg-crescender-900 rounded-t-3xl border-t border-crescender-700 p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Add New Person</Text>
              <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-crescender-400 font-bold text-xs uppercase mb-2">Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sarah Smith"
                placeholderTextColor="#6b7280"
                className="bg-crescender-950 border border-crescender-800 p-4 rounded-xl text-white text-base"
                autoFocus
              />
            </View>

            <View className="mb-6">
              <Text className="text-crescender-400 font-bold text-xs uppercase mb-2">Instrument (Optional)</Text>
              <TextInput
                value={instrument}
                onChangeText={setInstrument}
                placeholder="e.g. Piano"
                placeholderTextColor="#6b7280"
                className="bg-crescender-950 border border-crescender-800 p-4 rounded-xl text-white text-base"
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`bg-gold w-full p-4 rounded-xl items-center flex-row justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
            >
              <Text className="text-crescender-950 font-bold text-lg">
                {isSaving ? 'Saving...' : 'Save Person'}
              </Text>
              {!isSaving && <Feather name="check" size={20} color="#2e1065" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
