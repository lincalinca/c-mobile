/**
 * Payment Details Section
 * Displays payment status, method, and financial summary
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '@app/review/config';
import type { PaymentStatus, PaymentMethod } from '@app/review/config';
import { SectionContainer, SectionTitle } from './FormFields';

interface ReviewPaymentSectionProps {
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  tax: string;
  total: string;
  onFieldChange: (field: string, value: string) => void;
}

export function ReviewPaymentSection({
  paymentStatus,
  paymentMethod,
  subtotal,
  tax,
  total,
  onFieldChange,
}: ReviewPaymentSectionProps) {
  return (
    <>
      <SectionTitle
        icon={<Feather name="credit-card" size={18} color="#f5c518" />}
        title="Payment & Totals"
      />
      <SectionContainer>
        {/* Payment Status */}
        <View className="mb-4">
          <Text className="text-crescender-400 text-sm mb-2">Payment Status</Text>
          <View className="flex-row gap-2">
            {PAYMENT_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                onPress={() => onFieldChange('paymentStatus', status.value)}
                className={`px-3 py-1.5 rounded-full border ${
                  paymentStatus === status.value
                    ? `${status.color} border-transparent`
                    : 'bg-crescender-900/60 border-crescender-700'
                }`}
              >
                <Text className={`text-sm font-bold ${
                  paymentStatus === status.value ? 'text-white' : 'text-crescender-400'
                }`}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View className="mb-4">
          <Text className="text-crescender-400 text-sm mb-2">Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  onPress={() => onFieldChange('paymentMethod', method.value)}
                  className={`px-3 py-1.5 rounded-full border ${
                    paymentMethod === method.value
                      ? 'bg-crescender-600 border-crescender-500'
                      : 'bg-crescender-900/60 border-crescender-700'
                  }`}
                >
                  <Text className={`text-sm font-bold ${
                    paymentMethod === method.value ? 'text-white' : 'text-crescender-400'
                  }`}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Financial Summary */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-crescender-400 text-sm mb-1">Subtotal</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={subtotal}
              onChangeText={(text) => onFieldChange('subtotal', text)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#666"
            />
          </View>
          <View className="flex-1">
            <Text className="text-crescender-400 text-sm mb-1">GST</Text>
            <TextInput
              className="text-white text-base border-b border-crescender-700 py-1"
              value={tax}
              onChangeText={(text) => onFieldChange('tax', text)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#666"
            />
          </View>
          <View className="flex-1">
            <Text className="text-crescender-400 text-sm mb-1">Total</Text>
            <TextInput
              className="text-gold text-lg font-bold border-b border-gold py-1"
              value={total}
              onChangeText={(text) => onFieldChange('total', text)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </SectionContainer>
    </>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
