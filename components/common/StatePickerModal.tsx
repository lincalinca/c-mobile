import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

const STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

interface StatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  selectedState?: string;
}

export const StatePickerModal = ({ visible, onClose, onSelect, selectedState }: StatePickerModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select State</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={STATES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
                style={[
                  styles.item,
                  selectedState === item.code && styles.selectedItem
                ]}
              >
                <View>
                  <Text style={[
                    styles.itemCode,
                    selectedState === item.code && styles.selectedText
                  ]}>{item.code}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                {selectedState === item.code && (
                  <Feather name="check" size={20} color="#f5c518" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#1e0a3c',
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.2)',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontBold: 'bold',
  } as any,
  closeButton: {
    padding: 4,
  },
  list: {
    padding: 10,
  },
  item: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedItem: {
    backgroundColor: 'rgba(245, 197, 24, 0.1)',
  },
  itemCode: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemName: {
    color: '#9ca3af',
    fontSize: 14,
  },
  selectedText: {
    color: '#f5c518',
  },
});
