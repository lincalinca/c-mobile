import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MerchantUpdate {
  phone?: { old: string | null; new: string };
  email?: { old: string | null; new: string };
  website?: { old: string | null; new: string };
  address?: { old: string | null; new: string };
  suburb?: { old: string | null; new: string };
  state?: { old: string | null; new: string };
  postcode?: { old: string | null; new: string };
  abn?: { old: string | null; new: string };
}

interface MerchantUpdatePromptProps {
  visible: boolean;
  merchantName: string;
  updates: MerchantUpdate;
  onAccept: () => void;
  onDecline: () => void;
}

export default function MerchantUpdatePrompt({
  visible,
  merchantName,
  updates,
  onAccept,
  onDecline,
}: MerchantUpdatePromptProps) {
  const hasUpdates = Object.keys(updates).length > 0;

  if (!hasUpdates) return null;

  const renderUpdateItem = (label: string, update: { old: string | null; new: string } | undefined) => {
    if (!update) return null;

    return (
      <View key={label} style={styles.updateItem}>
        <Text style={styles.updateLabel}>{label}</Text>
        {update.old ? (
          <View style={styles.changeRow}>
            <Text style={styles.oldValue}>{update.old}</Text>
            <Feather name="arrow-right" size={16} color="#94a3b8" style={styles.arrow} />
            <Text style={styles.newValue}>{update.new}</Text>
          </View>
        ) : (
          <Text style={styles.newValue}>{update.new}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Feather name="info" size={24} color="#f5c518" />
            <Text style={styles.title}>Merchant Details Found</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            New details found for <Text style={styles.merchantName}>{merchantName}</Text>. Would you like to update this merchant's information?
          </Text>

          {/* Updates List */}
          <ScrollView style={styles.updatesList}>
            {renderUpdateItem('Phone', updates.phone)}
            {renderUpdateItem('Email', updates.email)}
            {renderUpdateItem('Website', updates.website)}
            {renderUpdateItem('Address', updates.address)}
            {renderUpdateItem('Suburb', updates.suburb)}
            {renderUpdateItem('State', updates.state)}
            {renderUpdateItem('Postcode', updates.postcode)}
            {renderUpdateItem('ABN', updates.abn)}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#f5c518',
    shadowColor: '#f5c518',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 27,  // was 18 → now 27 (+50%)
    fontWeight: 'bold',
    color: '#f5c518',
    marginLeft: 8,
  },
  message: {
    fontSize: 23,  // was 15 → now 23 (+53%)
    color: '#cbd5e1',
    marginBottom: 16,
    lineHeight: 33,  // was 22 → now 33 (+50%)
  },
  merchantName: {
    fontWeight: 'bold',
    color: '#f5c518',
  },
  updatesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  updateItem: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  updateLabel: {
    fontSize: 18,  // was 12 → now 18 (+50%)
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldValue: {
    fontSize: 21,  // was 14 → now 21 (+50%)
    color: '#64748b',
    textDecorationLine: 'line-through',
    flex: 1,
  },
  arrow: {
    marginHorizontal: 8,
  },
  newValue: {
    fontSize: 21,  // was 14 → now 21 (+50%)
    color: '#f5c518',
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: 10,
  },
  updateButton: {
    backgroundColor: '#f5c518',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#0f172a',
    fontSize: 24,  // was 16 → now 24 (+50%)
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#94a3b8',
    fontSize: 23,  // was 15 → now 23 (+53%)
    fontWeight: '600',
  },
});
