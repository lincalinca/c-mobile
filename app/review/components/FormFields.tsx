/**
 * Reusable form field components for the Review screen
 * Data-driven approach - render fields based on configuration
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import type { FieldConfig } from '../config';

// ============================================================================
// Keyboard Type Mapping
// ============================================================================

function getKeyboardType(inputType?: string) {
  switch (inputType) {
    case 'numeric': return 'numeric';
    case 'decimal': return 'decimal-pad';
    case 'phone': return 'phone-pad';
    case 'email': return 'email-address';
    case 'url': return 'url';
    default: return 'default';
  }
}

function getAutoCapitalize(inputType?: string) {
  if (inputType === 'email' || inputType === 'url') return 'none';
  return 'sentences';
}

// ============================================================================
// Text Input Field
// ============================================================================

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  inputType?: string;
  maxLength?: number;
  isHighlighted?: boolean;
  noMargin?: boolean;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  inputType,
  maxLength,
  isHighlighted = false,
  noMargin = false,
}: TextFieldProps) {
  const keyboardType = getKeyboardType(inputType);
  const autoCapitalize = getAutoCapitalize(inputType);

  return (
    <View className={noMargin ? '' : 'mb-4'}>
      <Text className="text-crescender-400 text-sm mb-1">{label}</Text>
      <TextInput
        className={`text-base border-b py-1 ${
          isHighlighted
            ? 'text-gold font-bold border-gold'
            : 'text-white border-crescender-700'
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType as any}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
}

// ============================================================================
// Pill Select Field
// ============================================================================

interface PillOption {
  value: string;
  label: string;
  color?: string;
}

interface PillSelectFieldProps {
  label: string;
  value: string;
  options: readonly PillOption[];
  onSelect: (value: string) => void;
  horizontal?: boolean;
}

export function PillSelectField({
  label,
  value,
  options,
  onSelect,
  horizontal = false,
}: PillSelectFieldProps) {
  const content = (
    <View className={horizontal ? 'flex-row gap-2' : 'flex-row gap-2 flex-wrap'}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const bgClass = isSelected
          ? option.color || 'bg-gold'
          : 'bg-crescender-900/60';
        const borderClass = isSelected
          ? option.color ? 'border-transparent' : 'border-gold'
          : 'border-crescender-700';
        const textClass = isSelected
          ? option.color ? 'text-white' : 'text-crescender-950'
          : 'text-crescender-400';

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`px-3 py-1.5 rounded-full border ${bgClass} ${borderClass}`}
          >
            <Text className={`text-sm font-bold ${textClass}`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (horizontal) {
    return (
      <View className="mb-4">
        <Text className="text-crescender-400 text-sm mb-2">{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-crescender-400 text-sm mb-2">{label}</Text>
      {content}
    </View>
  );
}

// ============================================================================
// Two Column Row
// ============================================================================

interface TwoColumnRowProps {
  children: [React.ReactNode, React.ReactNode];
}

export function TwoColumnRow({ children }: TwoColumnRowProps) {
  return (
    <View className="flex-row gap-4 mb-4">
      <View className="flex-1">{children[0]}</View>
      <View className="flex-1">{children[1]}</View>
    </View>
  );
}

// ============================================================================
// Three Column Row (for Suburb/State/Postcode)
// ============================================================================

interface ThreeColumnRowProps {
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
  widths?: [number | 'flex', number | 'flex', number | 'flex'];
}

export function ThreeColumnRow({
  children,
  widths = ['flex', 80, 80]
}: ThreeColumnRowProps) {
  return (
    <View className="flex-row gap-4">
      {children.map((child, idx) => (
        <View
          key={idx}
          style={widths[idx] === 'flex' ? { flex: 1 } : { width: widths[idx] as number }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Section Container
// ============================================================================

interface SectionContainerProps {
  children: React.ReactNode;
}

export function SectionContainer({ children }: SectionContainerProps) {
  return (
    <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800 mb-6">
      {children}
    </View>
  );
}

// ============================================================================
// Section Title
// ============================================================================

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
}

export function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">
      {icon} {title}
    </Text>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
