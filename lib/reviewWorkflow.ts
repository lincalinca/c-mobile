/**
 * Review Workflow State Management
 * 
 * Manages state and navigation for the multi-page workflow approach
 */

import type { ReceiptItem } from './repository';

export interface ReviewWorkflowState {
  // Transaction data
  merchant: string;
  merchantAbn: string;
  documentType: string;
  transactionDate: string;
  invoiceNumber: string;
  
  // Financial data
  subtotal: string;
  tax: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  summary: string;
  
  // Merchant details
  merchantPhone: string;
  merchantEmail: string;
  merchantWebsite: string;
  merchantAddress: string;
  merchantSuburb: string;
  merchantState: string;
  merchantPostcode: string;
  
  // Line items
  items: ReceiptItem[];
  
  // Workflow state
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  
  // Original data
  imageUri: string;
  rawOcrData: string;
  merchantIsNew: boolean;
  matchedMerchantId: string | null;
}

export type WorkflowStep = 
  | 'title'           // Summary page
  | 'missing-data'    // Critical missing data entry
  | 'transaction'     // Transaction details review
  | 'gear'           // Gear items review
  | 'services'       // Service items review
  | 'education'      // Education items review
  | 'events'         // Event items review
  | 'complete';      // Final save

export interface MissingDataRequirement {
  type: 'education' | 'service' | 'event';
  itemIndex: number;
  field: string;
  label: string;
  required: boolean;
}

/**
 * Analyze initial data to determine missing critical information
 */
export function analyzeMissingData(items: any[]): MissingDataRequirement[] {
  const missing: MissingDataRequirement[] = [];
  
  items.forEach((item, index) => {
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      
      // Critical: Lesson start date
      if (!eduDetails.startDate) {
        missing.push({
          type: 'education',
          itemIndex: index,
          field: 'startDate',
          label: 'Lesson start date',
          required: true,
        });
      }
      
      // Critical: Student name (important for lessons)
      if (!eduDetails.studentName) {
        missing.push({
          type: 'education',
          itemIndex: index,
          field: 'studentName',
          label: 'Student name',
          required: true,
        });
      }
      
      // Important: Teacher name
      if (!eduDetails.teacherName) {
        missing.push({
          type: 'education',
          itemIndex: index,
          field: 'teacherName',
          label: 'Teacher name',
          required: false,
        });
      }
      
      // Important: Frequency
      if (!eduDetails.frequency) {
        missing.push({
          type: 'education',
          itemIndex: index,
          field: 'frequency',
          label: 'Lesson frequency',
          required: false,
        });
      }
    }
    
    if (item.category === 'service') {
      const serviceDetails = typeof item.serviceDetails === 'string'
        ? JSON.parse(item.serviceDetails || '{}')
        : (item.serviceDetails || {});
      
      // Important: Service start date
      if (!serviceDetails.startDate && !serviceDetails.pickupDate) {
        missing.push({
          type: 'service',
          itemIndex: index,
          field: 'startDate',
          label: 'Service start date',
          required: false,
        });
      }
    }
    
    if (item.category === 'event') {
      // Critical: Event date
      if (!item.date) {
        missing.push({
          type: 'event',
          itemIndex: index,
          field: 'date',
          label: 'Event date',
          required: true,
        });
      }
    }
  });
  
  return missing;
}

/**
 * Determine next step in workflow
 */
export function getNextStep(
  currentStep: WorkflowStep,
  hasMissingData: boolean,
  hasGear: boolean,
  hasServices: boolean,
  hasEducation: boolean,
  hasEvents: boolean
): WorkflowStep | null {
  switch (currentStep) {
    case 'title':
      return hasMissingData ? 'missing-data' : getFirstCategoryStep(hasGear, hasServices, hasEducation, hasEvents);
    
    case 'missing-data':
      return getFirstCategoryStep(hasGear, hasServices, hasEducation, hasEvents);
    
    case 'transaction':
      return getFirstCategoryStep(hasGear, hasServices, hasEducation, hasEvents);
    
    case 'gear':
      return getNextCategoryStep('gear', hasServices, hasEducation, hasEvents);
    
    case 'services':
      return getNextCategoryStep('services', false, hasEducation, hasEvents);
    
    case 'education':
      return getNextCategoryStep('education', false, false, hasEvents);
    
    case 'events':
      return 'complete';
    
    case 'complete':
      return null;
    
    default:
      return null;
  }
}

function getFirstCategoryStep(
  hasGear: boolean,
  hasServices: boolean,
  hasEducation: boolean,
  hasEvents: boolean
): WorkflowStep {
  if (hasGear) return 'gear';
  if (hasServices) return 'services';
  if (hasEducation) return 'education';
  if (hasEvents) return 'events';
  return 'complete';
}

function getNextCategoryStep(
  current: 'gear' | 'services' | 'education',
  hasServices: boolean,
  hasEducation: boolean,
  hasEvents: boolean
): WorkflowStep {
  if (current === 'gear') {
    if (hasServices) return 'services';
    if (hasEducation) return 'education';
    if (hasEvents) return 'events';
  }
  if (current === 'services') {
    if (hasEducation) return 'education';
    if (hasEvents) return 'events';
  }
  if (current === 'education') {
    if (hasEvents) return 'events';
  }
  return 'complete';
}

/**
 * Count items by category
 */
export function countItemsByCategory(items: any[]): {
  gear: number;
  services: number;
  education: number;
  events: number;
} {
  return {
    gear: items.filter(i => i.category === 'gear').length,
    services: items.filter(i => i.category === 'service').length,
    education: items.filter(i => i.category === 'education').length,
    events: items.filter(i => i.category === 'event').length,
  };
}
