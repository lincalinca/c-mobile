import type { EducationDetails, GearDetails, ServiceDetails } from '../types';

export interface FieldDefinition<T> {
  key: keyof T | string; 
  label: string;
  placeholder?: string;
  isEssential?: boolean;
  inputType?: 'default' | 'numeric' | 'decimal' | 'email' | 'phone';
  requiredIf?: (data: T) => boolean;
}

export const GEAR_FIELDS_CONFIG: FieldDefinition<GearDetails>[] = [
  { key: 'brand', label: 'Brand', isEssential: true },
  { key: 'modelName', label: 'Model Name', isEssential: true },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'modelNumber', label: 'Model Number', placeholder: 'SKU / Model #' },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'colour', label: 'Colour', placeholder: 'e.g. Sunburst' },
  { key: 'size', label: 'Size', placeholder: 'e.g. 3/4, Full' },
  { key: 'condition', label: 'Condition', placeholder: 'New, Used, Mint' },
];

export const EDUCATION_FIELDS_CONFIG: FieldDefinition<EducationDetails>[] = [
  { key: 'studentName', label: 'Student Name', isEssential: true },
  { key: 'focus', label: 'Focus Instrument', isEssential: true },
  { key: 'teacherName', label: 'Teacher Name', placeholder: 'Optional' },
];

export const SERVICE_FIELDS_CONFIG: FieldDefinition<ServiceDetails>[] = [
    // Service doesn't have a 'description' field in ServiceDetails interface?
    // ReviewLineItem has 'description' at top level. ServiceDetails has `workDone`.
    // Let's assume description is handled by the main card header, and here we add specifics.
    { key: 'workDone', label: 'Work Done', isEssential: true, placeholder: 'Summary of service' },
    { key: 'technicianName', label: 'Technician', placeholder: 'Who did the work?' },
    { key: 'partsUsed', label: 'Parts Used', placeholder: 'Strings, tubes, etc.' },
    { key: 'complexity', label: 'Complexity' },
];
