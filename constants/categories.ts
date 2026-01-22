/**
 * Shared category definitions with icons
 * Used across the app to ensure consistency
 */

export type CategoryValue = 'gear' | 'service' | 'education' | 'event' | 'other';

export interface Category {
  value: CategoryValue;
  label: string;
  icon: string; // Feather icon name
  desc: string;
  color?: string; // Optional color for filters
}

export const ITEM_CATEGORIES: Category[] = [
  {
    value: 'gear',
    label: 'Gear',
    icon: 'package',
    desc: 'Equipment & Hardware',
    color: '#f5c518',
  },
  {
    value: 'service',
    label: 'Service',
    icon: 'tool',
    desc: 'Repairs & Setup',
    color: '#f97316',
  },
  {
    value: 'education',
    label: 'Education',
    icon: 'book-open',
    desc: 'Lessons & Workshops',
    color: '#c084fc',
  },
  {
    value: 'event',
    label: 'Event',
    icon: 'calendar',
    desc: 'Gigs & Tickets',
    color: '#22d3ee',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'box',
    desc: 'General Items',
    color: '#a3e635',
  },
];

export const getCategoryByValue = (value: CategoryValue): Category | undefined => {
  return ITEM_CATEGORIES.find(cat => cat.value === value);
};

export const getCategoryLabel = (value: CategoryValue): string => {
  return getCategoryByValue(value)?.label || 'Other';
};

export const getCategoryIcon = (value: CategoryValue): string => {
  return getCategoryByValue(value)?.icon || 'box';
};

export const getCategoryColor = (value: CategoryValue): string => {
  return getCategoryByValue(value)?.color || '#a3e635';
};

