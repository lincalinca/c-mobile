import React from 'react';
import { View } from 'react-native';
import type { ServiceItemEditState } from './useServiceItemEdit';
import { FormBuilder } from '../../lib/forms/FormBuilder';
import { SERVICE_FORM_SECTIONS } from '../../lib/forms/configs/serviceFormConfig';

interface ServiceItemEditFormProps {
  editState: ServiceItemEditState;
  onUpdateField: <K extends keyof ServiceItemEditState>(field: K, value: string) => void;
  onDatePress?: (key: string) => void;
}

export function ServiceItemEditForm({ editState, onUpdateField, onDatePress }: ServiceItemEditFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    onUpdateField(key as keyof ServiceItemEditState, value);
  };

  return (
    <View className="border-b border-crescender-800">
      <FormBuilder
        sections={SERVICE_FORM_SECTIONS}
        values={editState}
        onFieldChange={handleFieldChange}
        onDatePress={onDatePress}
      />
    </View>
  );
}
