import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { TransactionEditState } from './useTransactionEdit';
import { FormBuilder } from '../../lib/forms/FormBuilder';
import { TRANSACTION_FORM_SECTIONS } from '../../lib/forms/configs/transactionFormConfig';

interface TransactionEditFormProps {
  editState: TransactionEditState;
  onUpdateField: <K extends keyof TransactionEditState>(field: K, value: string) => void;
  onDatePress: () => void;
  onStatePress: () => void;
  onDelete: () => void;
}

export function TransactionEditForm({
  editState,
  onUpdateField,
  onDatePress,
  onStatePress,
  onDelete,
}: TransactionEditFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    onUpdateField(key as keyof TransactionEditState, value);
  };

  return (
    <>
      <FormBuilder
        sections={TRANSACTION_FORM_SECTIONS}
        values={editState}
        onFieldChange={handleFieldChange}
        onDatePress={onDatePress}
        onStatePress={onStatePress}
      />
      
      {/* Delete Button */}
      <TouchableOpacity
        onPress={onDelete}
        className="bg-red-600/20 border border-red-600 px-6 py-3 rounded-full mx-6 mb-6"
      >
        <Text className="text-red-400 font-bold text-center">Delete Record</Text>
      </TouchableOpacity>
    </>
  );
}
