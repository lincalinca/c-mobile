/**
 * Merchant Details Section
 * Shows matched merchant or full form for new merchants
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SectionContainer, SectionTitle } from './FormFields';

interface ReviewMerchantSectionProps {
  merchantIsNew: boolean;
  merchant: string;
  merchantPhone: string;
  merchantEmail: string;
  merchantWebsite: string;
  merchantAddress: string;
  merchantSuburb: string;
  merchantState: string;
  merchantPostcode: string;
  onFieldChange: (field: string, value: string) => void;
  onSetMerchantIsNew: (value: boolean) => void;
}

export function ReviewMerchantSection({
  merchantIsNew,
  merchant,
  merchantPhone,
  merchantEmail,
  merchantWebsite,
  merchantAddress,
  merchantSuburb,
  merchantState,
  merchantPostcode,
  onFieldChange,
  onSetMerchantIsNew,
}: ReviewMerchantSectionProps) {
  const handleNotCorrectPress = () => {
    Alert.alert(
      'Wrong Merchant?',
      'This will let you enter merchant details manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enter Manually', onPress: () => onSetMerchantIsNew(true) }
      ]
    );
  };

  return (
    <>
      <SectionTitle
        icon={<Feather name="map-pin" size={12} color="#f5c518" />}
        title="Merchant Details"
      />
      <SectionContainer>
        {!merchantIsNew ? (
          /* Matched Merchant - Compact View */
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Feather name="check-circle" size={16} color="#22c55e" />
                <Text className="text-green-400 text-sm font-semibold">Matched</Text>
              </View>
              <Text className="text-white text-lg font-bold mt-1">{merchant}</Text>
            </View>
            <TouchableOpacity
              onPress={handleNotCorrectPress}
              className="bg-crescender-800 px-3 py-2 rounded-lg border border-crescender-700"
            >
              <Text className="text-crescender-300 text-sm">Not correct?</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* New Merchant - Full Form */
          <>
            {/* Phone & Email Row */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Phone</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={merchantPhone}
                  onChangeText={(text) => onFieldChange('merchantPhone', text)}
                  placeholder="(02) 1234 5678"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Email</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={merchantEmail}
                  onChangeText={(text) => onFieldChange('merchantEmail', text)}
                  placeholder="info@merchant.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Website */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Website</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantWebsite}
                onChangeText={(text) => onFieldChange('merchantWebsite', text)}
                placeholder="https://www.merchant.com.au"
                placeholderTextColor="#666"
                keyboardType="url"
              />
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Street Address</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={merchantAddress}
                onChangeText={(text) => onFieldChange('merchantAddress', text)}
                placeholder="123 Main Street"
                placeholderTextColor="#666"
              />
            </View>

            {/* Suburb, State, Postcode Row */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Suburb</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={merchantSuburb}
                  onChangeText={(text) => onFieldChange('merchantSuburb', text)}
                  placeholder="Sydney"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={{ width: 80 }}>
                <Text className="text-crescender-400 text-sm mb-1">State</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={merchantState}
                  onChangeText={(text) => onFieldChange('merchantState', text)}
                  placeholder="NSW"
                  placeholderTextColor="#666"
                  maxLength={3}
                />
              </View>
              <View style={{ width: 80 }}>
                <Text className="text-crescender-400 text-sm mb-1">Postcode</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={merchantPostcode}
                  onChangeText={(text) => onFieldChange('merchantPostcode', text)}
                  placeholder="2000"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </>
        )}
      </SectionContainer>
    </>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
