# Declarative Patterns Quick Reference

**Quick guide for converting imperative code to declarative patterns**

---

## 1. Form Fields: Imperative → Declarative

### ❌ Before (Imperative)

```typescript
// app/gear/TransactionEditForm.tsx (hypothetical)
export function TransactionEditForm({ editState, setEditState }) {
  return (
    <View>
      <Text>Merchant</Text>
      <TextInput
        value={editState.merchant}
        onChangeText={(text) => setEditState({ ...editState, merchant: text })}
        placeholder="Enter merchant name"
      />
      
      <Text>Date</Text>
      <TextInput
        value={editState.date}
        onChangeText={(text) => setEditState({ ...editState, date: text })}
        placeholder="Enter date"
      />
      
      <Text>Total</Text>
      <TextInput
        value={editState.total}
        onChangeText={(text) => setEditState({ ...editState, total: text })}
        keyboardType="numeric"
        placeholder="Enter total"
      />
    </View>
  );
}
```

### ✅ After (Declarative)

```typescript
// lib/forms/configs/transactionFormConfig.ts
export const TRANSACTION_FORM_SECTIONS: FormSectionConfig[] = [
  {
    title: 'Transaction Details',
    fields: [
      {
        key: 'merchant',
        label: 'Merchant',
        type: 'input',
        placeholder: 'Enter merchant name',
        required: true,
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        required: true,
      },
      {
        key: 'total',
        label: 'Total',
        type: 'input',
        inputType: 'numeric',
        placeholder: 'Enter total',
        required: true,
      },
    ],
  },
];

// app/gear/TransactionEditForm.tsx
import { FormBuilder } from '../../components/forms/FormBuilder';
import { TRANSACTION_FORM_SECTIONS } from '../../lib/forms/configs/transactionFormConfig';

export function TransactionEditForm({ editState, setEditState }) {
  const handleFieldChange = (key: string, value: any) => {
    setEditState({ ...editState, [key]: value });
  };

  return (
    <FormBuilder
      sections={TRANSACTION_FORM_SECTIONS}
      values={editState}
      onFieldChange={handleFieldChange}
    />
  );
}
```

---

## 2. Workflow Steps: Imperative → Declarative

### ❌ Before (Imperative)

```typescript
// app/manual-entry/wizard.tsx (current)
export default function WizardScreen() {
  const [step, setStep] = useState(0);
  
  return (
    <View>
      {step === 0 && (
        <View>
          <Text>Select Category</Text>
          {/* Category selection */}
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {step === 1 && (
        <View>
          <Text>Item Details</Text>
          {/* Form fields */}
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {step === 2 && (
        <View>
          <Text>Review</Text>
          {/* Review content */}
        </View>
      )}
    </View>
  );
}
```

### ✅ After (Declarative)

```typescript
// lib/workflows/configs/manualEntryWorkflow.ts
export const MANUAL_ENTRY_WORKFLOW: WorkflowConfig = {
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
      canProceed: (state) => state.detailsComplete,
      next: 'review',
    },
    {
      id: 'review',
      title: 'Review',
      component: 'ReviewPage',
      canProceed: () => true,
      next: 'complete',
    },
  ],
};

// app/manual-entry/wizard.tsx
import { WorkflowRouter } from '../../components/workflows/WorkflowRouter';
import { MANUAL_ENTRY_WORKFLOW } from '../../lib/workflows/configs/manualEntryWorkflow';

export default function WizardScreen() {
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

## 3. Detail Fields: Imperative → Declarative

### ❌ Before (Imperative)

```typescript
// app/gear/item/[id].tsx (hypothetical)
export function GearItemDetail({ item }) {
  return (
    <View>
      {item.brand && (
        <View>
          <Text>Brand</Text>
          <Text>{item.brand}</Text>
        </View>
      )}
      
      {item.model && (
        <View>
          <Text>Model</Text>
          <Text>{item.model}</Text>
        </View>
      )}
      
      {item.serialNumber && (
        <View>
          <Text>Serial Number</Text>
          <Text>{item.serialNumber}</Text>
        </View>
      )}
      
      {item.condition && (
        <View>
          <Text>Condition</Text>
          <Text>{item.condition}</Text>
        </View>
      )}
    </View>
  );
}
```

### ✅ After (Declarative)

```typescript
// lib/fields/configs/gearFields.ts
import { DetailFieldConfig } from '../../../components/common/DetailFieldsSection';
import type { GearDetails } from '../../../lib/repository';

export const GEAR_DETAIL_FIELDS: DetailFieldConfig<GearDetails>[] = [
  {
    label: 'Brand',
    key: 'brand',
    icon: 'tag',
  },
  {
    label: 'Model',
    key: 'modelName',
    condition: (data) => !!data.modelName,
  },
  {
    label: 'Serial Number',
    key: 'serialNumber',
    icon: 'hash',
  },
  {
    label: 'Condition',
    key: 'condition',
    format: (value) => value.charAt(0).toUpperCase() + value.slice(1),
  },
];

// app/gear/item/[id].tsx
import { DetailFieldsSection } from '../../../components/common/DetailFieldsSection';
import { GEAR_DETAIL_FIELDS } from '../../../lib/fields/configs/gearFields';

export function GearItemDetail({ item }) {
  const gearDetails = item.gearDetailsParsed || {};
  
  return (
    <DetailFieldsSection
      data={gearDetails}
      fields={GEAR_DETAIL_FIELDS}
      accentColor="#f5c518"
      sectionTitle="Gear Details"
    />
  );
}
```

---

## 4. Validation Rules: Imperative → Declarative

### ❌ Before (Imperative)

```typescript
// app/gear/TransactionEditForm.tsx (hypothetical)
export function TransactionEditForm({ editState, setEditState }) {
  const handleSave = async () => {
    // Inline validation
    if (!editState.merchant || editState.merchant.length < 2) {
      Alert.alert('Error', 'Merchant name must be at least 2 characters');
      return;
    }
    
    if (!editState.date) {
      Alert.alert('Error', 'Date is required');
      return;
    }
    
    if (!editState.total || parseFloat(editState.total) <= 0) {
      Alert.alert('Error', 'Total must be greater than 0');
      return;
    }
    
    // Save logic
  };
  
  return (
    // Form JSX
  );
}
```

### ✅ After (Declarative)

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
    { type: 'maxLength', value: 100, message: 'Merchant name must be less than 100 characters' },
  ],
  date: [
    { type: 'required', message: 'Date is required' },
  ],
  total: [
    { type: 'required', message: 'Total is required' },
    {
      type: 'custom',
      message: 'Total must be greater than 0',
      validator: (value) => parseFloat(value) > 0,
    },
  ],
};

// lib/validation/validators.ts
export function validateField(
  key: string,
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message;
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message;
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message;
        }
        break;
    }
  }
  return null;
}

// app/gear/TransactionEditForm.tsx
import { VALIDATION_RULES } from '../../lib/validation/rules';
import { validateField } from '../../lib/validation/validators';

export function TransactionEditForm({ editState, setEditState }) {
  const handleSave = async () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    
    Object.keys(editState).forEach((key) => {
      const rules = VALIDATION_RULES[key];
      if (rules) {
        const error = validateField(key, editState[key], rules);
        if (error) {
          errors[key] = error;
        }
      }
    });
    
    if (Object.keys(errors).length > 0) {
      Alert.alert('Validation Error', Object.values(errors)[0]);
      return;
    }
    
    // Save logic
  };
  
  return (
    // Form JSX
  );
}
```

---

## 5. Chat Flow: Semi-Declarative → Fully Declarative

### ⚠️ Current (Semi-Declarative)

```typescript
// app/manual-entry/assistant.tsx (current)
const nextQuestion = (type: CategoryType, step: number) => {
  if (type === 'education') {
    if (step === 0) addBotMessage("Who is the teacher or school?");
    else if (step === 1) addBotMessage("How many lessons are you adding?");
    else if (step === 2) addBotMessage("When do these start?", 'date-picker');
    // ...
  }
  // ...
};
```

### ✅ After (Fully Declarative)

```typescript
// lib/chat/flows.ts
export interface ChatQuestion {
  id: string;
  text: string;
  type: 'text' | 'date-picker' | 'number-input' | 'choice';
  choices?: string[];
  required?: boolean;
  validator?: (answer: string) => boolean;
}

export interface ChatFlow {
  category: CategoryType;
  questions: ChatQuestion[];
}

export const CHAT_FLOWS: ChatFlow[] = [
  {
    category: 'education',
    questions: [
      {
        id: 'teacher',
        text: 'Who is the teacher or school?',
        type: 'text',
        required: true,
      },
      {
        id: 'count',
        text: 'How many lessons are you adding?',
        type: 'number-input',
        required: true,
        validator: (answer) => parseInt(answer) > 0,
      },
      {
        id: 'startDate',
        text: 'When do these start?',
        type: 'date-picker',
        required: true,
      },
      {
        id: 'billing',
        text: 'Are you charged by the lesson or by the term?',
        type: 'choice',
        choices: ['Lesson', 'Term'],
        required: true,
      },
    ],
  },
  // ... other flows
];

// app/manual-entry/assistant.tsx
import { CHAT_FLOWS } from '../../lib/chat/flows';

const getFlow = (type: CategoryType): ChatFlow => {
  return CHAT_FLOWS.find(f => f.category === type)!;
};

const nextQuestion = (type: CategoryType, step: number) => {
  const flow = getFlow(type);
  const question = flow.questions[step];
  
  if (question) {
    addBotMessage(question.text, question.type, {
      choices: question.choices,
    });
  } else {
    finishFlow();
  }
};
```

---

## 6. Styling: Inline → Configuration

### ❌ Before (Inline Styles)

```typescript
// components/results/GearCard.tsx (hypothetical)
export function GearCard({ item }) {
  return (
    <View style={{ 
      margin: 4, 
      padding: 16, 
      borderRadius: 22,
      backgroundColor: '#1a0b2e',
    }}>
      <Text style={{ 
        fontSize: 26, 
        fontWeight: 'bold',
        color: '#ffffff',
      }}>
        {item.title}
      </Text>
      <Text style={{ 
        fontSize: 18, 
        color: '#9ca3af',
        marginTop: 4,
      }}>
        {item.subtitle}
      </Text>
    </View>
  );
}
```

### ✅ After (Configuration)

```typescript
// components/results/cardStyles.ts (already exists)
export const CARD = {
  cardMargin: 4,
  cardPadding: 16,
  cardBorderRadius: 22,
  titleFontSize: 26,
  titleColor: '#ffffff',
  subtitleFontSize: 18,
  subtitleColor: '#9ca3af',
  subtitleMarginTop: 4,
} as const;

// components/results/GearCard.tsx
import { CARD } from './cardStyles';

export function GearCard({ item }) {
  return (
    <View style={{ 
      margin: CARD.cardMargin, 
      padding: CARD.cardPadding, 
      borderRadius: CARD.cardBorderRadius,
      backgroundColor: '#1a0b2e',
    }}>
      <Text style={{ 
        fontSize: CARD.titleFontSize, 
        fontWeight: 'bold',
        color: CARD.titleColor,
      }}>
        {item.title}
      </Text>
      <Text style={{ 
        fontSize: CARD.subtitleFontSize, 
        color: CARD.subtitleColor,
        marginTop: CARD.subtitleMarginTop,
      }}>
        {item.subtitle}
      </Text>
    </View>
  );
}
```

---

## 7. Missing Data Analysis: Already Declarative ✅

This is already well-implemented in `lib/reviewWorkflow.ts`. Use as a reference:

```typescript
// lib/reviewWorkflow.ts (current - good example)
export function analyzeMissingData(items: any[]): MissingDataRequirement[] {
  const missing: MissingDataRequirement[] = [];
  
  items.forEach((item, index) => {
    if (item.category === 'education') {
      const eduDetails = typeof item.educationDetails === 'string'
        ? JSON.parse(item.educationDetails || '{}')
        : (item.educationDetails || {});
      
      if (!eduDetails.startDate) {
        missing.push({
          type: 'education',
          itemIndex: index,
          field: 'startDate',
          label: 'Lesson start date',
          required: true,
        });
      }
      // ...
    }
  });
  
  return missing;
}
```

---

## 8. Common Patterns Summary

### Form Configuration
```typescript
const FORM_SECTIONS = [
  {
    title: 'Section Title',
    fields: [
      {
        key: 'fieldName',
        label: 'Field Label',
        type: 'input' | 'multiline' | 'date' | 'choice',
        required: boolean,
        validation: ValidationRule[],
      },
    ],
  },
];
```

### Workflow Configuration
```typescript
const WORKFLOW_CONFIG = {
  steps: [
    {
      id: 'stepId',
      title: 'Step Title',
      component: 'ComponentName',
      canProceed: (state) => boolean,
      next: 'nextStepId',
    },
  ],
};
```

### Field Configuration
```typescript
const FIELD_CONFIGS = [
  {
    label: 'Field Label',
    key: 'fieldKey',
    getValue?: (data) => value,
    format?: (value) => string,
    condition?: (data) => boolean,
    icon?: IconName,
  },
];
```

### Validation Rules
```typescript
const VALIDATION_RULES = {
  fieldName: [
    { type: 'required', message: 'Error message' },
    { type: 'minLength', value: 2, message: 'Error message' },
  ],
};
```

---

## Quick Checklist

When converting code to declarative patterns:

1. ✅ **Identify repetitive structures** (forms, workflows, fields)
2. ✅ **Extract to configuration objects** (arrays of configs)
3. ✅ **Create reusable renderers** (components that read config)
4. ✅ **Add type safety** (TypeScript interfaces for configs)
5. ✅ **Test configurations** (unit tests for config structures)
6. ✅ **Document patterns** (examples and usage guides)

---

**Remember:** The goal is to describe *what* you want, not *how* to render it. Let the declarative configuration drive the rendering logic.
