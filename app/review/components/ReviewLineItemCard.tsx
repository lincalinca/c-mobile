/**
 * Line Item Card Component
 * Displays individual line items with category selection and category-specific details
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ITEM_CATEGORIES } from '../../../constants/categories';
import { LessonDateSelector } from '../../../components/education/LessonDateSelector';
import type { ReviewLineItem, EducationDetails, GearDetails } from '../types';

// ============================================================================
// Line Item Header
// ============================================================================

interface LineItemHeaderProps {
  description: string;
  brand?: string;
  model?: string;
  totalPrice: number;
}

function LineItemHeader({ description, brand, model, totalPrice }: LineItemHeaderProps) {
  return (
    <View className="flex-row justify-between items-start mb-2">
      <View className="flex-1 pr-4">
        <Text className="text-white font-bold">{description}</Text>
        {(brand || model) && (
          <Text className="text-crescender-400 text-sm mt-1">
            {[brand, model].filter(Boolean).join(' ')}
          </Text>
        )}
      </View>
      <Text className="text-gold font-bold text-xl">${totalPrice?.toFixed(2)}</Text>
    </View>
  );
}

// ============================================================================
// Price Details
// ============================================================================

interface PriceDetailsProps {
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  discountPercentage?: number;
}

function PriceDetails({ unitPrice, quantity, discountAmount, discountPercentage }: PriceDetailsProps) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Text className="text-crescender-400 text-sm">
        ${unitPrice?.toFixed(2)} × {quantity}
      </Text>
      {discountAmount && (
        <View className="bg-green-900/50 px-2 py-0.5 rounded">
          <Text className="text-green-400 text-sm">-${discountAmount.toFixed(2)}</Text>
        </View>
      )}
      {discountPercentage && (
        <View className="bg-green-900/50 px-2 py-0.5 rounded">
          <Text className="text-green-400 text-sm">-{discountPercentage}%</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Category Selection
// ============================================================================

interface CategorySelectionProps {
  category: string;
  onCategoryChange: (category: string) => void;
}

function CategorySelection({ category, onCategoryChange }: CategorySelectionProps) {
  return (
    <>
      <Text className="text-crescender-500 text-sm mb-2">Category</Text>
      <View className="flex-row flex-wrap gap-2">
        {ITEM_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => onCategoryChange(cat.value)}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
              category === cat.value
                ? 'bg-gold border-gold'
                : 'bg-crescender-900/60 border-crescender-700'
            }`}
          >
            <Feather
              name={cat.icon as any}
              size={12}
              color={category === cat.value ? '#2e1065' : '#888'}
            />
            <Text className={`text-sm font-bold ${
              category === cat.value ? 'text-crescender-950' : 'text-crescender-400'
            }`}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// ============================================================================
// Education Details Section
// ============================================================================

interface EducationDetailsSectionProps {
  educationDetails: EducationDetails;
  transactionDate: string;
  onUpdate: (details: Partial<EducationDetails>) => void;
}

function EducationDetailsSection({
  educationDetails,
  transactionDate,
  onUpdate,
}: EducationDetailsSectionProps) {
  return (
    <View className="mt-4 pt-4 border-t border-crescender-700">
      <Text className="text-crescender-400 text-sm mb-3 font-semibold">EDUCATION DETAILS</Text>

      {/* Teacher Name */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">Teacher Name</Text>
        <TextInput
          className="text-white text-base border-b border-crescender-700 py-1"
          value={educationDetails.teacherName || ''}
          onChangeText={(text) => onUpdate({ teacherName: text })}
          placeholder="Teacher's name"
          placeholderTextColor="#666"
        />
      </View>

      {/* Focus Field */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">
          Focus <Text className="text-crescender-600">(e.g., Violin, Piano, Vocals, Theory)</Text>
        </Text>
        <TextInput
          className="text-white text-base border-b border-crescender-700 py-1"
          value={educationDetails.focus || ''}
          onChangeText={(text) => onUpdate({ focus: text.trim() || undefined })}
          placeholder="Violin, Piano, Vocals, Theory, Etc"
          placeholderTextColor="#666"
        />
        {!educationDetails.focus && (
          <Text className="text-yellow-500 text-xs mt-1">Focus needed for chaining lessons</Text>
        )}
      </View>

      {/* Lesson Date Selector */}
      <LessonDateSelector
        item={{ educationDetails }}
        transactionDate={transactionDate}
        onUpdate={onUpdate}
      />
    </View>
  );
}

// ============================================================================
// Gear Details Section
// ============================================================================

interface GearDetailsSectionProps {
  gearDetails: GearDetails;
  onUpdate: (details: Partial<GearDetails>) => void;
}

function GearDetailsSection({ gearDetails, onUpdate }: GearDetailsSectionProps) {
  return (
    <View className="mt-4 pt-4 border-t border-crescender-700">
      <Text className="text-crescender-400 text-sm font-bold mb-3">GEAR DETAILS</Text>

      {/* Brand & Manufacturer Row */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Brand</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.brand || ''}
            onChangeText={(text) => onUpdate({ brand: text })}
            placeholder="e.g., Yamaha"
            placeholderTextColor="#666"
          />
        </View>
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Manufacturer</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.manufacturer || ''}
            onChangeText={(text) => onUpdate({ manufacturer: text })}
            placeholder="If different from brand"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Model Name & Number Row */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Model Name</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.modelName || ''}
            onChangeText={(text) => onUpdate({ modelName: text })}
            placeholder="e.g., PSR-E373"
            placeholderTextColor="#666"
          />
        </View>
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Model Number</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.modelNumber || ''}
            onChangeText={(text) => onUpdate({ modelNumber: text })}
            placeholder="SKU or model #"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Serial Number */}
      <View className="mb-3">
        <Text className="text-crescender-500 text-sm mb-1">Serial Number</Text>
        <TextInput
          className="text-gold text-base font-mono border-b border-gold py-1"
          value={gearDetails.serialNumber || ''}
          onChangeText={(text) => onUpdate({ serialNumber: text })}
          placeholder="Serial number"
          placeholderTextColor="#666"
        />
      </View>

      {/* Colour & Size Row */}
      <View className="flex-row gap-4 mb-3">
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Colour</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.colour || ''}
            onChangeText={(text) => onUpdate({ colour: text })}
            placeholder="e.g., Sunburst"
            placeholderTextColor="#666"
          />
        </View>
        <View className="flex-1">
          <Text className="text-crescender-500 text-sm mb-1">Size</Text>
          <TextInput
            className="text-white text-base border-b border-crescender-700 py-1"
            value={gearDetails.size || ''}
            onChangeText={(text) => onUpdate({ size: text })}
            placeholder="e.g., 3/4, Full Size"
            placeholderTextColor="#666"
          />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Main Line Item Card
// ============================================================================

interface ReviewLineItemCardProps {
  item: ReviewLineItem;
  index: number;
  transactionDate: string;
  onCategoryChange: (index: number, category: string) => void;
  onEducationUpdate: (index: number, details: Partial<EducationDetails>) => void;
  onGearUpdate: (index: number, details: Partial<GearDetails>) => void;
}

export function ReviewLineItemCard({
  item,
  index,
  transactionDate,
  onCategoryChange,
  onEducationUpdate,
  onGearUpdate,
}: ReviewLineItemCardProps) {
  return (
    <View className="bg-crescender-800/20 p-4 rounded-2xl mb-4 border border-crescender-800">
      <LineItemHeader
        description={item.description}
        brand={item.brand}
        model={item.model}
        totalPrice={item.totalPrice}
      />

      <PriceDetails
        unitPrice={item.unitPrice}
        quantity={item.quantity}
        discountAmount={item.discountAmount}
        discountPercentage={item.discountPercentage}
      />

      <CategorySelection
        category={item.category}
        onCategoryChange={(category) => onCategoryChange(index, category)}
      />

      {/* Education Details */}
      {item.category === 'education' && item.educationDetails && (
        <EducationDetailsSection
          educationDetails={item.educationDetails}
          transactionDate={transactionDate}
          onUpdate={(details) => onEducationUpdate(index, details)}
        />
      )}

      {/* Gear Details */}
      {item.category === 'gear' && item.gearDetails && (
        <GearDetailsSection
          gearDetails={item.gearDetails}
          onUpdate={(details) => onGearUpdate(index, details)}
        />
      )}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
