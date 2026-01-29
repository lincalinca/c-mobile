/**
 * Line Item Card Component
 * Displays individual line items with category selection and category-specific details
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ITEM_CATEGORIES } from '@constants/categories';
import { LessonDateSelector } from '@components/education/LessonDateSelector';
import { TextField, TwoColumnRow } from './FormFields';
import type { ReviewLineItem, EducationDetails, GearDetails } from '@app/review/types';

// ============================================================================
// Field Configurations (Data-Driven)
// ============================================================================

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  isHighlighted?: boolean;
}

const GEAR_FIELDS: { row: [FieldDef, FieldDef] }[] = [
  {
    row: [
      { key: 'brand', label: 'Brand', placeholder: 'e.g., Yamaha' },
      { key: 'manufacturer', label: 'Manufacturer', placeholder: 'If different from brand' },
    ],
  },
  {
    row: [
      { key: 'modelName', label: 'Model Name', placeholder: 'e.g., PSR-E373' },
      { key: 'modelNumber', label: 'Model Number', placeholder: 'SKU or model #' },
    ],
  },
  {
    row: [
      { key: 'colour', label: 'Colour', placeholder: 'e.g., Sunburst' },
      { key: 'size', label: 'Size', placeholder: 'e.g., 3/4, Full Size' },
    ],
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

function LineItemHeader({ description, brand, model, totalPrice }: {
  description: string;
  brand?: string;
  model?: string;
  totalPrice: number;
}) {
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

function PriceDetails({ unitPrice, quantity, discountAmount, discountPercentage }: {
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  discountPercentage?: number;
}) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Text className="text-crescender-400 text-sm">
        ${unitPrice?.toFixed(2)} × {quantity}
      </Text>
      {discountAmount != null && discountAmount > 0 && (
        <View className="bg-green-900/50 px-2 py-0.5 rounded">
          <Text className="text-green-400 text-sm">-${discountAmount.toFixed(2)}</Text>
        </View>
      )}
      {discountPercentage != null && discountPercentage > 0 && (
        <View className="bg-green-900/50 px-2 py-0.5 rounded">
          <Text className="text-green-400 text-sm">-{discountPercentage}%</Text>
        </View>
      )}
    </View>
  );
}

function CategorySelection({ category, onCategoryChange }: {
  category: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <>
      <Text className="text-crescender-500 text-sm mb-2">Category</Text>
      <View className="flex-row flex-wrap gap-2">
        {ITEM_CATEGORIES.map((cat) => {
          const isSelected = category === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => onCategoryChange(cat.value)}
              className={`px-3 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                isSelected ? 'bg-gold border-gold' : 'bg-crescender-900/60 border-crescender-700'
              }`}
            >
              <Feather name={cat.icon as any} size={12} color={isSelected ? '#2e1065' : '#888'} />
              <Text className={`text-sm font-bold ${isSelected ? 'text-crescender-950' : 'text-crescender-400'}`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

function EducationDetailsSection({ educationDetails, transactionDate, onUpdate }: {
  educationDetails: EducationDetails;
  transactionDate: string;
  onUpdate: (details: Partial<EducationDetails>) => void;
}) {
  return (
    <View className="mt-4 pt-4 border-t border-crescender-700">
      <Text className="text-crescender-400 text-sm mb-3 font-semibold">EDUCATION DETAILS</Text>

      <TextField
        label="Teacher Name"
        value={educationDetails.teacherName || ''}
        onChangeText={(text) => onUpdate({ teacherName: text })}
        placeholder="Teacher's name"
      />

      <TextField
        label="Focus (e.g., Violin, Piano, Vocals, Theory)"
        value={educationDetails.focus || ''}
        onChangeText={(text) => onUpdate({ focus: text.trim() || undefined })}
        placeholder="Violin, Piano, Vocals, Theory, Etc"
      />
      {!educationDetails.focus && (
        <Text className="text-yellow-500 text-xs -mt-3 mb-4">Focus needed for chaining lessons</Text>
      )}

      <LessonDateSelector
        item={{ educationDetails }}
        transactionDate={transactionDate}
        onUpdate={onUpdate}
      />
    </View>
  );
}

function GearDetailsSection({ gearDetails, onUpdate }: {
  gearDetails: GearDetails;
  onUpdate: (details: Partial<GearDetails>) => void;
}) {
  return (
    <View className="mt-4 pt-4 border-t border-crescender-700">
      <Text className="text-crescender-400 text-sm font-bold mb-3">GEAR DETAILS</Text>

      {GEAR_FIELDS.map(({ row }, idx) => (
        <TwoColumnRow key={idx}>
          <TextField
            label={row[0].label}
            value={(gearDetails as Record<string, string>)[row[0].key] || ''}
            onChangeText={(text) => onUpdate({ [row[0].key]: text })}
            placeholder={row[0].placeholder}
            noMargin
          />
          <TextField
            label={row[1].label}
            value={(gearDetails as Record<string, string>)[row[1].key] || ''}
            onChangeText={(text) => onUpdate({ [row[1].key]: text })}
            placeholder={row[1].placeholder}
            noMargin
          />
        </TwoColumnRow>
      ))}

      <TextField
        label="Serial Number"
        value={gearDetails.serialNumber || ''}
        onChangeText={(text) => onUpdate({ serialNumber: text })}
        placeholder="Serial number"
        isHighlighted
      />
    </View>
  );
}

// ============================================================================
// Main Component
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

      {item.category === 'education' && item.educationDetails && (
        <EducationDetailsSection
          educationDetails={item.educationDetails}
          transactionDate={transactionDate}
          onUpdate={(details) => onEducationUpdate(index, details)}
        />
      )}

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
