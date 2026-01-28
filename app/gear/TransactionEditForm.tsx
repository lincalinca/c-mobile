import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { TransactionEditState } from './useTransactionEdit';

// Document type options
const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'tax_invoice', label: 'Tax Invoice' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'layby', label: 'Layby' },
] as const;

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-600' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-600' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-600' },
] as const;

// Payment method options
const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'afterpay', label: 'Afterpay' },
  { value: 'other', label: 'Other' },
] as const;

interface TransactionEditFormProps {
  editState: TransactionEditState;
  onUpdateField: <K extends keyof TransactionEditState>(field: K, value: string) => void;
  onDatePress: () => void;
  onStatePress: () => void;
  onDelete: () => void;
}

function InputField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  isLarge = false,
  maxLength,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address' | 'url';
  isLarge?: boolean;
  maxLength?: number;
}) {
  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-1">{label}</Text>
      <TextInput
        className={`text-white border-b border-crescender-700 py-1 ${isLarge ? 'text-lg font-semibold' : 'text-base'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
  getColor,
}: {
  options: readonly { value: T; label: string; color?: string }[];
  value: T;
  onChange: (value: T) => void;
  getColor?: (option: { value: T; color?: string }, isSelected: boolean) => string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const bgClass = getColor
            ? getColor(option, isSelected)
            : isSelected
            ? 'bg-gold border-gold'
            : 'bg-crescender-900/60 border-crescender-700';

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`px-3 py-1.5 rounded-full border ${bgClass}`}
            >
              <Text
                className={`text-sm font-bold ${
                  isSelected ? 'text-crescender-950' : 'text-crescender-400'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function TransactionEditForm({
  editState,
  onUpdateField,
  onDatePress,
  onStatePress,
  onDelete,
}: TransactionEditFormProps) {
  const formattedDate = editState.date
    ? new Date(editState.date + 'T12:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Select date';

  return (
    <View className="p-6">
      {/* Document Type */}
      <View className="mb-6">
        <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">Document Type</Text>
        <ChipSelector
          options={DOCUMENT_TYPES}
          value={editState.documentType as any}
          onChange={(v) => onUpdateField('documentType', v)}
        />
      </View>

      {/* Merchant */}
      <InputField
        label="Merchant"
        value={editState.merchant}
        onChangeText={(v) => onUpdateField('merchant', v)}
        isLarge
      />

      {/* Summary */}
      <InputField
        label="Summary"
        value={editState.summary}
        placeholder="Short description (e.g. Guitar strings, lesson)"
        onChangeText={(v) => onUpdateField('summary', v)}
      />

      {/* ABN & Invoice Number */}
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <InputField
            label="ABN"
            value={editState.abn}
            placeholder="XX XXX XXX XXX"
            onChangeText={(v) => onUpdateField('abn', v)}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <InputField
            label="Invoice/Receipt #"
            value={editState.invoiceNumber}
            onChangeText={(v) => onUpdateField('invoiceNumber', v)}
          />
        </View>
      </View>

      {/* Date */}
      <View className="mb-6">
        <Text className="text-crescender-400 text-sm mb-1">Date</Text>
        <TouchableOpacity
          onPress={onDatePress}
          className="flex-row items-center justify-between border-b border-crescender-700 py-1"
        >
          <Text className={`text-lg ${editState.date ? 'text-white' : 'text-crescender-500'}`}>
            {formattedDate}
          </Text>
          <Feather name="calendar" size={20} color="#f5c518" />
        </TouchableOpacity>
      </View>

      {/* Financial Details */}
      <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">Financial Details</Text>
      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <InputField
            label="Subtotal"
            value={editState.subtotal}
            placeholder="0.00"
            onChangeText={(v) => onUpdateField('subtotal', v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <InputField
            label="GST (10%)"
            value={editState.tax}
            placeholder="0.00"
            onChangeText={(v) => onUpdateField('tax', v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Total */}
      <View className="mb-6">
        <Text className="text-crescender-400 text-sm mb-1">Total</Text>
        <TextInput
          className="text-white text-lg font-bold border-b border-crescender-700 py-1"
          value={editState.total}
          onChangeText={(v) => onUpdateField('total', v)}
          placeholder="0.00"
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Payment Status */}
      <View className="mb-4">
        <Text className="text-crescender-400 text-sm mb-2">Payment Status</Text>
        <ChipSelector
          options={PAYMENT_STATUSES}
          value={editState.paymentStatus as any}
          onChange={(v) => onUpdateField('paymentStatus', v)}
          getColor={(option, isSelected) =>
            isSelected ? `${option.color} border-white` : 'bg-crescender-900/60 border-crescender-700'
          }
        />
      </View>

      {/* Payment Method */}
      <View className="mb-4">
        <Text className="text-crescender-400 text-sm mb-2">Payment Method</Text>
        <ChipSelector
          options={PAYMENT_METHODS}
          value={editState.paymentMethod as any}
          onChange={(v) => onUpdateField('paymentMethod', v)}
        />
      </View>

      {/* Merchant Contact & Address */}
      <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
        Merchant contact & address
      </Text>

      <InputField
        label="Phone"
        value={editState.merchantPhone}
        onChangeText={(v) => onUpdateField('merchantPhone', v)}
        keyboardType="phone-pad"
      />

      <InputField
        label="Email"
        value={editState.merchantEmail}
        onChangeText={(v) => onUpdateField('merchantEmail', v)}
        keyboardType="email-address"
      />

      <InputField
        label="Website"
        value={editState.merchantWebsite}
        placeholder="example.com"
        onChangeText={(v) => onUpdateField('merchantWebsite', v)}
        keyboardType="url"
      />

      <InputField
        label="Address"
        value={editState.merchantAddress}
        onChangeText={(v) => onUpdateField('merchantAddress', v)}
      />

      <View className="flex-row gap-4 mb-4">
        <View className="flex-[2]">
          <InputField
            label="Suburb"
            value={editState.merchantSuburb}
            onChangeText={(v) => onUpdateField('merchantSuburb', v)}
          />
        </View>
        <View className="flex-1">
          <Text className="text-crescender-400 text-sm mb-1">State</Text>
          <TouchableOpacity
            onPress={onStatePress}
            className="border-b border-crescender-700 py-1 h-[34px] justify-center"
          >
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-base ${editState.merchantState ? 'text-white' : 'text-crescender-500'}`}
              >
                {editState.merchantState || 'NSW...'}
              </Text>
              <Feather name="chevron-down" size={14} color="#f5c518" />
            </View>
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          <InputField
            label="Postcode"
            value={editState.merchantPostcode}
            onChangeText={(v) => onUpdateField('merchantPostcode', v)}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        onPress={onDelete}
        className="bg-red-600/20 border border-red-600 px-6 py-3 rounded-full"
      >
        <Text className="text-red-400 font-bold text-center">Delete Record</Text>
      </TouchableOpacity>
    </View>
  );
}
