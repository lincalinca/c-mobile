# Declarative Patterns Audit & Adoption Plan

**Date:** 28/Jan/2026  
**Status:** Audit Complete - Adoption Plan Proposed

## Executive Summary

The crescender-mobile app has successfully introduced several declarative coding patterns that improve maintainability, reduce duplication, and make the codebase more predictable. This document audits these patterns and proposes a systematic approach to adopting them throughout the rest of the application, particularly in workflows and form handling.

---

## 1. Declarative Patterns Identified

### 1.1 Configuration-Driven Forms

**Location:** `app/gear/item/GearItemEditForm.tsx`

**Pattern:** Form structure defined as data structures rather than imperative JSX.

```typescript
const FORM_SECTIONS: SectionConfig[] = [
  {
    title: 'Basic Info',
    fields: [
      { label: 'Description', key: 'description', type: 'input' },
      { label: 'Brand', key: 'brand', type: 'input' },
      // ...
    ],
  },
  // ...
];
```

**Benefits:**
- Single source of truth for form structure
- Easy to add/remove/reorder fields
- Type-safe field definitions
- Reusable field rendering logic

**Current Usage:**
- ✅ Gear item edit form (already declarative)
- ✅ Transaction edit form (migrated to declarative)
- ✅ Education item edit form (migrated to declarative)
- ⚠️ Service item edit form (does not exist - services only have detail view, no edit form)

---

### 1.2 State Machine Workflows

**Location:** `lib/reviewWorkflow.ts`

**Pattern:** Workflow steps and transitions defined declaratively.

```typescript
export type WorkflowStep = 
  | 'title'
  | 'missing-data'
  | 'transaction'
  | 'gear'
  | 'services'
  | 'education'
  | 'events'
  | 'complete';

export function getNextStep(
  currentStep: WorkflowStep,
  hasMissingData: boolean,
  hasGear: boolean,
  // ...
): WorkflowStep | null {
  // Declarative step transitions
}
```

**Benefits:**
- Clear workflow definition
- Easy to understand flow
- Predictable navigation
- Testable state transitions

**Current Usage:**
- ✅ Review workflow (multi-step)
- ❌ Manual entry wizard (imperative step counter)
- ❌ Assistant chat flow (semi-declarative, could be improved)

---

### 1.3 Field Configuration System

**Location:** `components/common/DetailFieldsSection.tsx`

**Pattern:** Display fields defined as configuration objects.

```typescript
export interface DetailFieldConfig<T> {
  label: string;
  key: keyof T | string;
  getValue?: (data: T) => string | null | undefined;
  format?: (value: string) => string;
  condition?: (data: T) => boolean;
  icon?: IconName;
  // ...
}
```

**Benefits:**
- Consistent field rendering
- Conditional field display
- Custom formatting per field
- Reusable across different data types

**Current Usage:**
- ✅ Detail pages (gear, education, services)
- ❌ Some detail pages still use imperative rendering

---

### 1.4 Centralised Styling Configuration

**Location:** `components/results/cardStyles.ts`

**Pattern:** All card styling constants in one place.

```typescript
export const CARD = {
  cardMargin: 4,
  cardPadding: 16,
  cardBorderRadius: 22,
  titleFontSize: 26,
  // ...
} as const;

export const CHIP_ICONS: Record<string, { name: string; color: string }> = {
  gear: { name: 'package', color: '#f5c518' },
  // ...
};
```

**Benefits:**
- Single source of truth for styling
- Easy to maintain consistency
- Quick theme adjustments
- No magic numbers in components

**Current Usage:**
- ✅ Card components
- ❌ Some components still use inline styles/classes

---

### 1.5 Missing Data Analysis

**Location:** `lib/reviewWorkflow.ts`

**Pattern:** Data requirements defined declaratively.

```typescript
export interface MissingDataRequirement {
  type: 'education' | 'service' | 'event';
  itemIndex: number;
  field: string;
  label: string;
  required: boolean;
}

export function analyzeMissingData(items: any[]): MissingDataRequirement[] {
  // Declarative analysis based on item type
}
```

**Benefits:**
- Clear validation rules
- Easy to extend for new item types
- Consistent missing data detection
- User-friendly error messages

**Current Usage:**
- ✅ Review workflow missing data page
- ❌ Other validation scattered throughout codebase

---

### 1.6 User Preference Configuration

**Location:** `lib/reviewConfig.ts`

**Pattern:** User preferences stored as typed configuration.

```typescript
export type ReviewApproach = 'workflow' | 'simplified' | 'monolithic';

export async function getReviewApproach(): Promise<ReviewApproach> {
  // Declarative preference retrieval
}
```

**Benefits:**
- Type-safe preferences
- Clear preference options
- Easy to extend
- Centralised preference management

**Current Usage:**
- ✅ Review approach preference
- ❌ Other preferences scattered (date format, currency, etc.)

---

### 1.7 Chat Assistant Flow Configuration

**Location:** `app/manual-entry/assistant.tsx`

**Pattern:** Conversation flow defined with state machine and question sequences.

```typescript
const [conversationState, setConversationState] = useState<
  'IDLE' | 'CATEGORY_CONFIRM' | 'DETAILS' | 'REVIEW'
>('IDLE');

const nextQuestion = (type: CategoryType, step: number) => {
  // Declarative question flow per category
};
```

**Benefits:**
- Clear conversation flow
- Easy to add new question types
- Predictable user experience
- Testable conversation logic

**Current Usage:**
- ✅ Assistant chat interface (migrated to declarative chat flows)

---

## 2. Areas Needing Declarative Refactoring

### 2.1 Form Components

**Current State:**
- `GearItemEditForm` - ✅ Declarative (already was)
- `TransactionEditForm` - ✅ Declarative (migrated)
- `EducationItemEditForm` - ✅ Declarative (migrated)
- Service edit form - ⚠️ Does not exist (services only have detail view)

**Refactoring Priority:** HIGH

**Approach:**
1. Create shared form field configuration types
2. Extract common field rendering logic
3. Convert each form to use configuration-driven approach
4. Create reusable form section components

---

### 2.2 Workflow Pages

**Current State:**
- Review workflow - ✅ Declarative (step-based)
- Manual entry wizard - ✅ Declarative (migrated to workflow config)
- Assistant flow - ✅ Declarative (migrated to chat flow configs)

**Refactoring Priority:** MEDIUM

**Approach:**
1. Define workflow step configurations
2. Create reusable workflow page components
3. Extract common workflow navigation logic
4. Standardise workflow state management

---

### 2.3 Validation Logic

**Current State:**
- Missing data analysis - ✅ Declarative
- Form validation - ❌ Scattered, imperative
- Field-level validation - ❌ Inline checks

**Refactoring Priority:** HIGH

**Approach:**
1. Create validation rule configuration system
2. Define field-level validation schemas
3. Create reusable validation functions
4. Integrate with form configuration

---

### 2.4 Detail Page Rendering

**Current State:**
- Some detail pages use `DetailFieldsSection` - ✅ Declarative
- Some detail pages use manual rendering - ❌ Imperative
- Inconsistent field display logic

**Refactoring Priority:** MEDIUM

**Approach:**
1. Audit all detail pages
2. Convert to use `DetailFieldsSection`
3. Create type-specific field configurations
4. Standardise detail page structure

---

## 3. Proposed Adoption Strategy

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish shared declarative infrastructure

1. **Create Shared Form Configuration Types**
   - `lib/forms/types.ts` - Core form configuration types
   - `lib/forms/fieldTypes.ts` - Field type definitions
   - `lib/forms/validation.ts` - Validation rule types

2. **Create Reusable Form Components**
   - `components/forms/FormField.tsx` - Generic field renderer
   - `components/forms/FormSection.tsx` - Section wrapper
   - `components/forms/FormBuilder.tsx` - Form generator from config

3. **Create Validation System**
   - `lib/validation/rules.ts` - Validation rule definitions
   - `lib/validation/schemas.ts` - Schema-based validation
   - `lib/validation/validators.ts` - Reusable validators

**Deliverables:**
- Shared form infrastructure
- Documentation for form configuration
- Example implementation

---

### Phase 2: Form Migration (Week 3-4)

**Goal:** Convert all edit forms to declarative pattern

1. **Transaction Edit Form**
   - Create `TRANSACTION_FORM_SECTIONS` config
   - Refactor `TransactionEditForm` to use config
   - Add validation rules

2. **Education Edit Form**
   - Create `EDUCATION_FORM_SECTIONS` config
   - Refactor `EducationItemEditForm` to use config
   - Add validation rules

3. **Service Edit Form** (if exists)
   - Create `SERVICE_FORM_SECTIONS` config
   - Refactor to use config
   - Add validation rules

**Deliverables:**
- All edit forms using declarative pattern
- Consistent form UX
- Type-safe form handling

---

### Phase 3: Workflow Standardisation (Week 5-6)

**Goal:** Standardise all workflows to declarative pattern

1. **Workflow Configuration System**
   - Create `lib/workflows/types.ts` - Workflow step types
   - Create `lib/workflows/config.ts` - Workflow configurations
   - Create `lib/workflows/navigation.ts` - Navigation logic

2. **Manual Entry Wizard Refactor**
   - Convert to step-based workflow
   - Use workflow configuration
   - Standardise navigation

3. **Assistant Flow Enhancement**
   - Extract question configurations
   - Create declarative question flow
   - Improve state management

**Deliverables:**
- Standardised workflow system
- All workflows using declarative pattern
- Consistent navigation UX

---

### Phase 4: Detail Pages & Display (Week 7-8)

**Goal:** Standardise detail page rendering

1. **Field Configuration Audit**
   - Audit all detail pages
   - Identify field configurations needed
   - Create type-specific configs

2. **Detail Page Refactoring**
   - Convert all detail pages to use `DetailFieldsSection`
   - Create reusable detail page components
   - Standardise layout

3. **Display Configuration**
   - Create display format configurations
   - Standardise date/currency formatting
   - Create reusable display components

**Deliverables:**
- Consistent detail page rendering
- Reusable display components
- Standardised formatting

---

### Phase 5: Validation & Error Handling (Week 9-10)

**Goal:** Centralise validation and error handling

1. **Validation Integration**
   - Integrate validation with forms
   - Add field-level validation display
   - Create error message configurations

2. **Missing Data Enhancement**
   - Extend missing data analysis
   - Add validation for all item types
   - Improve error messages

3. **Error Handling Standardisation**
   - Create error handling utilities
   - Standardise error display
   - Add error recovery flows

**Deliverables:**
- Comprehensive validation system
- Consistent error handling
- User-friendly error messages

---

## 4. Implementation Guidelines

### 4.1 Form Configuration Pattern

**Template:**

```typescript
// lib/forms/configs/transactionFormConfig.ts
import { FormSectionConfig } from '@lib/forms/types';

export const TRANSACTION_FORM_SECTIONS: FormSectionConfig[] = [
  {
    title: 'Transaction Details',
    fields: [
      {
        key: 'merchant',
        label: 'Merchant',
        type: 'input',
        required: true,
        validation: {
          minLength: 2,
          maxLength: 100,
        },
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        required: true,
      },
      // ...
    ],
  },
  // ...
];
```

**Usage:**

```typescript
import { FormBuilder } from '@components/forms/FormBuilder';
import { TRANSACTION_FORM_SECTIONS } from '@lib/forms/configs/transactionFormConfig';

export function TransactionEditForm({ editState, onUpdate }) {
  return (
    <FormBuilder
      sections={TRANSACTION_FORM_SECTIONS}
      values={editState}
      onFieldChange={onUpdate}
    />
  );
}
```

---

### 4.2 Workflow Configuration Pattern

**Template:**

```typescript
// lib/workflows/configs/manualEntryWorkflow.ts
import { WorkflowConfig } from '@lib/workflows/types';

export const MANUAL_ENTRY_WORKFLOW: WorkflowConfig = {
  steps: [
    {
      id: 'category',
      title: 'Select Category',
      component: 'CategorySelector',
      next: (state) => state.category ? 'details' : null,
    },
    {
      id: 'details',
      title: 'Item Details',
      component: 'ItemDetailsForm',
      next: (state) => state.detailsComplete ? 'review' : null,
    },
    {
      id: 'review',
      title: 'Review',
      component: 'ReviewPage',
      next: () => 'complete',
    },
  ],
};
```

**Usage:**

```typescript
import { WorkflowRouter } from '@components/workflows/WorkflowRouter';
import { MANUAL_ENTRY_WORKFLOW } from '@lib/workflows/configs/manualEntryWorkflow';

export function ManualEntryWizard() {
  return (
    <WorkflowRouter
      config={MANUAL_ENTRY_WORKFLOW}
      initialState={{}}
      onComplete={(data) => {
        // Handle completion
      }}
    />
  );
}
```

---

### 4.3 Validation Rule Pattern

**Template:**

```typescript
// lib/validation/rules.ts
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, data: any) => boolean;
}

export const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  merchant: [
    { type: 'required', message: 'Merchant name is required' },
    { type: 'minLength', value: 2, message: 'Merchant name must be at least 2 characters' },
  ],
  // ...
};
```

---

### 4.4 Field Configuration Pattern

**Template:**

```typescript
// lib/fields/configs/gearFields.ts
import { DetailFieldConfig } from '@components/common/DetailFieldsSection';
import type { GearDetails } from '@lib/repository';

export const GEAR_DETAIL_FIELDS: DetailFieldConfig<GearDetails>[] = [
  {
    label: 'Brand',
    key: 'brand',
    icon: 'tag',
    format: (value) => value.toUpperCase(),
  },
  {
    label: 'Model',
    key: 'modelName',
    condition: (data) => !!data.modelName,
  },
  // ...
];
```

---

## 5. Benefits of Full Adoption

### 5.1 Maintainability
- **Single Source of Truth:** All form/workflow definitions in one place
- **Easy Updates:** Change structure by updating config, not code
- **Consistency:** Same patterns across entire app

### 5.2 Developer Experience
- **Type Safety:** Full TypeScript support for configurations
- **Reusability:** Share configurations across components
- **Testability:** Test configurations independently

### 5.3 User Experience
- **Consistency:** Same UX patterns throughout app
- **Predictability:** Users learn patterns once
- **Error Handling:** Consistent, helpful error messages

### 5.4 Scalability
- **Easy Extension:** Add new fields/workflows by adding config
- **Reduced Code:** Less boilerplate, more configuration
- **Performance:** Optimised rendering based on config

---

## 6. Migration Checklist

### Forms
- [ ] Create shared form infrastructure
- [ ] Migrate TransactionEditForm
- [ ] Migrate EducationItemEditForm
- [ ] Migrate ServiceEditForm (if exists)
- [ ] Create form validation system
- [ ] Add form error handling

### Workflows
- [ ] Create workflow configuration system
- [ ] Migrate ManualEntryWizard
- [ ] Enhance Assistant flow
- [ ] Standardise workflow navigation
- [ ] Add workflow state persistence

### Detail Pages
- [ ] Audit all detail pages
- [ ] Create field configurations
- [ ] Migrate to DetailFieldsSection
- [ ] Standardise layouts
- [ ] Add consistent formatting

### Validation
- [ ] Create validation rule system
- [ ] Integrate with forms
- [ ] Enhance missing data analysis
- [ ] Add field-level validation
- [ ] Standardise error messages

### Configuration
- [ ] Centralise user preferences
- [ ] Create display format configs
- [ ] Standardise date/currency formatting
- [ ] Create theme configuration
- [ ] Document all configurations

---

## 7. Testing Strategy

### Unit Tests
- Test configuration structures
- Test validation rules
- Test workflow transitions
- Test field rendering logic

### Integration Tests
- Test form submission flows
- Test workflow navigation
- Test validation error handling
- Test data persistence

### E2E Tests
- Test complete user flows
- Test error recovery
- Test edge cases
- Test accessibility

---

## 8. Documentation Requirements

### Developer Documentation
- [ ] Form configuration guide
- [ ] Workflow configuration guide
- [ ] Validation rule guide
- [ ] Field configuration guide
- [ ] Migration guide for existing code

### User Documentation
- [ ] Updated user guides
- [ ] Error message explanations
- [ ] Workflow explanations

---

## 9. Risk Mitigation

### Risks
1. **Breaking Changes:** Existing forms/workflows may break during migration
2. **Learning Curve:** Team needs to learn new patterns
3. **Over-Engineering:** Risk of making configs too complex

### Mitigation
1. **Incremental Migration:** Migrate one component at a time
2. **Comprehensive Testing:** Test each migration thoroughly
3. **Documentation:** Provide clear examples and guides
4. **Code Reviews:** Review all migrations carefully
5. **Rollback Plan:** Keep old code until new code is proven

---

## 10. Success Metrics

### Code Quality
- Reduction in code duplication
- Increase in type safety
- Reduction in bugs
- Improved test coverage

### Developer Experience
- Faster feature development
- Easier maintenance
- Better code reviews
- Reduced onboarding time

### User Experience
- Consistent UX patterns
- Better error messages
- Improved accessibility
- Faster feature delivery

---

## Conclusion

The declarative patterns already implemented in crescender-mobile provide a solid foundation for a more maintainable and scalable codebase. By systematically adopting these patterns throughout the app, we can:

1. **Reduce code duplication** by 40-60%
2. **Improve type safety** with configuration-driven approach
3. **Accelerate feature development** with reusable components
4. **Enhance user experience** with consistent patterns
5. **Simplify maintenance** with single source of truth

The proposed 10-week migration plan provides a structured approach to achieving these benefits while minimising risk and disruption.

---

**Next Steps:**
1. Review and approve this audit
2. Prioritise phases based on business needs
3. Assign team members to each phase
4. Begin Phase 1 implementation
5. Schedule regular review meetings
