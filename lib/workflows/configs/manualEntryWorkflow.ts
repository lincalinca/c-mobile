/**
 * Manual Entry Wizard Workflow Configuration
 * Declarative definition of manual entry workflow steps
 */

import type { WorkflowConfig } from '@lib/workflows/types';

export const MANUAL_ENTRY_WORKFLOW: WorkflowConfig = {
  id: 'manual-entry',
  initialStep: 'category',
  steps: [
    {
      id: 'category',
      title: 'Select Category',
      component: 'CategorySelector',
      canProceed: (state) => !!state.category,
      next: 'details',
    },
    {
      id: 'details',
      title: 'Item Details',
      component: 'ItemDetailsForm',
      canProceed: (state) => state.detailsComplete || false,
      next: 'review',
      back: 'category',
    },
    {
      id: 'review',
      title: 'Review',
      component: 'ReviewPage',
      canProceed: () => true,
      next: 'complete',
      back: 'details',
    },
  ],
};
