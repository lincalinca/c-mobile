/**
 * Shared form configuration types
 * Used for declarative form definitions
 */

export type InputType = 'text' | 'url' | 'email' | 'phone' | 'numeric' | 'decimal-pad';
export type FieldType = 'input' | 'multiline' | 'date' | 'choice' | 'chip-selector' | 'state-picker';

export interface BaseFieldConfig {
  label: string;
  key: string;
  placeholder?: string;
  required?: boolean;
  condition?: (values: Record<string, any>) => boolean;
}

export interface InputFieldConfig extends BaseFieldConfig {
  type: 'input' | 'multiline';
  inputType?: InputType;
  isLarge?: boolean;
  maxLength?: number;
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
}

export interface ChoiceFieldConfig extends BaseFieldConfig {
  type: 'choice';
  options: readonly { value: string; label: string; color?: string }[];
  getColor?: (option: { value: string; color?: string }, isSelected: boolean) => string;
}

export interface ChipSelectorFieldConfig extends BaseFieldConfig {
  type: 'chip-selector';
  options: readonly { value: string; label: string; color?: string }[];
  getColor?: (option: { value: string; color?: string }, isSelected: boolean) => string;
}

export interface StatePickerFieldConfig extends BaseFieldConfig {
  type: 'state-picker';
}

export type FieldConfig = 
  | InputFieldConfig 
  | DateFieldConfig 
  | ChoiceFieldConfig 
  | ChipSelectorFieldConfig 
  | StatePickerFieldConfig;

export interface FormSectionConfig {
  title?: string;
  fields: FieldConfig[];
  condition?: (values: Record<string, any>) => boolean;
  layout?: 'column' | 'row'; // For side-by-side fields
}

export interface FormConfig {
  sections: FormSectionConfig[];
}
