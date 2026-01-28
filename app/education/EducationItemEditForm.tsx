import React from 'react';
import { View } from 'react-native';
import type { EducationItemEditState } from './useEducationItemEdit';
import { FormBuilder } from '../../lib/forms/FormBuilder';
import { EDUCATION_FORM_SECTIONS } from '../../lib/forms/configs/educationFormConfig';

interface EducationItemEditFormProps {
  editState: EducationItemEditState;
  onUpdateField: <K extends keyof EducationItemEditState>(field: K, value: string) => void;
}

export function EducationItemEditForm({ editState, onUpdateField }: EducationItemEditFormProps) {
  const handleFieldChange = (key: string, value: any) => {
    onUpdateField(key as keyof EducationItemEditState, value);
  };

  return (
    <View className="border-b border-crescender-800">
      <FormBuilder
        sections={EDUCATION_FORM_SECTIONS}
        values={editState}
        onFieldChange={handleFieldChange}
      />
    </View>
  );
}
