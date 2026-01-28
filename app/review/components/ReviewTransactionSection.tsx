/**
 * Transaction Details Section
 * Displays document type, merchant, ABN, invoice number, date, and summary
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DOCUMENT_TYPES } from '../config';
import type { DocumentType } from '../config';
import { SectionContainer, SectionTitle, TextField, TwoColumnRow } from './FormFields';

interface ReviewTransactionSectionProps {
  merchant: string;
  merchantAbn: string;
  documentType: DocumentType;
  transactionDate: string;
  invoiceNumber: string;
  summary: string;
  onFieldChange: (field: string, value: string) => void;
}

export function ReviewTransactionSection({
  merchant,
  merchantAbn,
  documentType,
  transactionDate,
  invoiceNumber,
  summary,
  onFieldChange,
}: ReviewTransactionSectionProps) {
  return (
    <>
      <SectionTitle
        icon={<Feather name="file-text" size={12} color="#f5c518" />}
        title="Transaction Details"
      />
      <SectionContainer>
        {/* Document Type Pills */}
        <View className="mb-4">
          <Text className="text-crescender-400 text-sm mb-2">Document Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => onFieldChange('documentType', type.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    documentType === type.value
                      ? 'bg-gold border-gold'
                      : 'bg-crescender-900/60 border-crescender-700'
                  }`}
                >
                  <Text className={`text-sm font-bold ${
                    documentType === type.value ? 'text-crescender-950' : 'text-crescender-400'
                  }`}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Merchant */}
        <View className="mb-4">
          <Text className="text-crescender-400 text-sm mb-1">Merchant</Text>
          <TextInput
            className="text-white text-lg font-semibold border-b border-crescender-700 py-1"
            value={merchant}
            onChangeText={(text) => onFieldChange('merchant', text)}
            placeholderTextColor="#666"
          />
        </View>

        {/* ABN & Invoice Number Row */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-crescender-400 text-sm mb-1">ABN</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={merchantAbn}
              onChangeText={(text) => onFieldChange('merchantAbn', text)}
              placeholder="XX XXX XXX XXX"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-crescender-400 text-sm mb-1">Invoice/Receipt #</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={invoiceNumber}
              onChangeText={(text) => onFieldChange('invoiceNumber', text)}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Date */}
        <View className="mb-4">
          <Text className="text-crescender-400 text-sm mb-1">Date</Text>
          <TextInput
            className="text-white text-lg border-b border-crescender-700 py-1"
            value={transactionDate}
            onChangeText={(text) => onFieldChange('transactionDate', text)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
          />
        </View>

        {/* Transaction Summary */}
        <View>
          <Text className="text-crescender-400 text-sm mb-1">Transaction Summary (3-10 words)</Text>
          <TextInput
            className="text-white text-lg border-b border-crescender-700 py-1"
            value={summary}
            onChangeText={(text) => onFieldChange('summary', text)}
            placeholder="e.g., Piano purchase with warranty"
            placeholderTextColor="#666"
            maxLength={100}
          />
        </View>
      </SectionContainer>
    </>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
