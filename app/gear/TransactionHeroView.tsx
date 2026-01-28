import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Receipt } from '../../lib/repository';
import { formatABN } from '../../lib/formatUtils';
import { AutoSizingText } from '../../components/common/AutoSizingText';

interface TransactionHeroViewProps {
  receipt: Receipt;
}

export function TransactionHeroView({ receipt }: TransactionHeroViewProps) {
  const openPhone = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  const openEmail = (email: string) => Linking.openURL(`mailto:${email}`);
  const openWebsite = (website: string) =>
    Linking.openURL(`https://${website.replace(/^https?:\/\//, '')}`);

  const hasContactDetails =
    receipt.merchantPhone ||
    receipt.merchantEmail ||
    receipt.merchantWebsite ||
    receipt.merchantAddress;

  return (
    <View className="p-6 border-b border-crescender-800">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
          <Feather name="home" size={20} color="#f5c518" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">{receipt.merchant}</Text>
          <Text className="text-crescender-400 text-base">
            {new Date(receipt.transactionDate).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          {receipt.summary && (
            <Text className="text-gold text-sm mt-1 italic">{receipt.summary}</Text>
          )}
        </View>
      </View>

      {/* Merchant Details */}
      {hasContactDetails && (
        <View className="mb-4 bg-crescender-900/20 p-3 rounded-xl">
          <Text className="text-crescender-400 text-sm font-bold mb-2 uppercase tracking-widest">
            Merchant Details
          </Text>
          {receipt.merchantPhone && (
            <TouchableOpacity
              onPress={() => openPhone(receipt.merchantPhone!)}
              className="flex-row items-center gap-2 mb-1"
            >
              <Feather name="phone" size={12} color="#f5c518" />
              <AutoSizingText
                value={receipt.merchantPhone}
                baseFontSize={14}
                minFontSize={10}
                className="text-gold underline"
                style={{ flex: 1 }}
              />
            </TouchableOpacity>
          )}
          {receipt.merchantEmail && (
            <TouchableOpacity
              onPress={() => openEmail(receipt.merchantEmail!)}
              className="flex-row items-center gap-2 mb-1"
            >
              <Feather name="mail" size={12} color="#f5c518" />
              <AutoSizingText
                value={receipt.merchantEmail}
                baseFontSize={14}
                minFontSize={10}
                className="text-gold underline"
                style={{ flex: 1 }}
              />
            </TouchableOpacity>
          )}
          {receipt.merchantWebsite && (
            <TouchableOpacity
              onPress={() => openWebsite(receipt.merchantWebsite!)}
              className="flex-row items-center gap-2 mb-1"
            >
              <Feather name="globe" size={12} color="#f5c518" />
              <AutoSizingText
                value={receipt.merchantWebsite}
                baseFontSize={14}
                minFontSize={10}
                className="text-gold underline"
                style={{ flex: 1 }}
              />
            </TouchableOpacity>
          )}
          {receipt.merchantAddress && (
            <View className="flex-row items-start gap-2">
              <Feather name="map-pin" size={12} color="#9ca3af" style={{ marginTop: 2 }} />
              <Text className="text-crescender-300 text-sm flex-1">
                {receipt.merchantAddress}
                {receipt.merchantSuburb && `, ${receipt.merchantSuburb}`}
                {receipt.merchantState && ` ${receipt.merchantState}`}
                {receipt.merchantPostcode && ` ${receipt.merchantPostcode}`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Financial Summary */}
      <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800">
        <View className="flex-row justify-between mb-2">
          <Text className="text-crescender-400">Total Amount</Text>
          <Text className="text-white font-bold text-xl">
            ${(receipt.total / 100).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-crescender-400">GST (10%)</Text>
          <Text className="text-crescender-300">
            ${receipt.tax ? (receipt.tax / 100).toFixed(2) : '0.00'}
          </Text>
        </View>
        {receipt.merchantAbn && (
          <View className="flex-row justify-between pt-2 border-t border-crescender-800/50">
            <Text className="text-crescender-400">ABN</Text>
            <Text className="text-crescender-200 font-mono text-sm">
              {formatABN(receipt.merchantAbn)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
