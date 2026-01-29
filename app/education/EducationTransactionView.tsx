import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { formatFullDate } from '@lib/dateUtils';
import { ICON_SIZES } from '@lib/iconSizes';
import type { Receipt } from '@lib/repository';

const TRANSACTION_COLOR = '#10b981'; // Green for transactions

interface EducationTransactionViewProps {
  receipt: Receipt;
}

export function EducationTransactionView({ receipt }: EducationTransactionViewProps) {
  const router = useRouter();

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: TRANSACTION_COLOR }}>
        Associated Transaction
      </Text>
      <TouchableOpacity
        onPress={() => router.push(`/gear/${receipt.id}` as any)}
        className="p-4 rounded-xl border"
        style={{ backgroundColor: `${TRANSACTION_COLOR}10`, borderColor: `${TRANSACTION_COLOR}30` }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 min-w-0">
            <Text className="text-white text-base font-medium" numberOfLines={1}>
              {receipt.merchant}
            </Text>
            <Text className="text-green-300 text-sm mt-1" numberOfLines={1}>
              {formatFullDate(receipt.transactionDate)} • ${(receipt.total / 100).toFixed(2)}
            </Text>
          </View>
          <Feather name="chevron-right" size={ICON_SIZES.standard} color={TRANSACTION_COLOR} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
