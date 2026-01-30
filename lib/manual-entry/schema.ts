
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'currency' 
  | 'date' 
  | 'select' 
  | 'boolean' 
  | 'textarea'
  | 'image'
  | 'slider'
  | 'header';

export interface FieldOption {
  value: string;
  label: string;
  icon?: string;
}

export interface FieldDefinition {
  id: string; // Path to data (e.g. 'merchant', 'gearDetails.brand')
  label?: string; // If 'header', this is the section title
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  condition?: (data: any) => boolean;
  defaultValue?: any;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  condition?: (data: any) => boolean;
  fields: FieldDefinition[];
}

/**
 * The Master Schema containing all possible fields we capture, organized into a Wizard flow.
 * This structure acts as the source of truth for Manual Entry.
 */
export const MANUAL_ENTRY_SCHEMA: WizardStep[] = [
  // Step 1: Category Selection
  {
    id: 'category',
    title: 'What are you adding?',
    description: 'Select the type of item to get started.',
    fields: [
      {
        id: 'category',
        type: 'select',
        required: true,
        options: [
          { value: 'gear', label: 'Gear', icon: 'package' },
          { value: 'education', label: 'Education', icon: 'book' },
          { value: 'service', label: 'Service', icon: 'tool' }, // Feathers icon 'tool' maps to 'settings' or 'tool'
          { value: 'event', label: 'Event', icon: 'calendar' },
          { value: 'money', label: 'Money', icon: 'dollar-sign' },
        ]
      }
    ]
  },

  // Step 2: The Basics (Common to all EXCEPT Event)
  {
    id: 'basics',
    title: 'The Basics',
    condition: (data) => data.category !== 'event',
    fields: [
      { id: 'description', label: 'Title / Description', type: 'text', placeholder: 'e.g. Fender Stratocaster', required: true },
      { id: 'merchant', label: 'Merchant / Provider', type: 'text', placeholder: 'e.g. Better Music', required: true },
      { id: 'transactionDate', label: 'Purchase Date', type: 'date', required: true, defaultValue: new Date().toISOString() },
      { id: 'totalPrice', label: 'Amount', type: 'currency', placeholder: '0.00' },
      { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any other details...' },
    ]
  },

  // --- EVENT SPECIFIC STEPS ---

  // Event Step 1: What kind of event?
  {
    id: 'event_type',
    title: 'What kind of event is this?',
    condition: (data) => data.category === 'event',
    fields: [
      { 
        id: 'description', // Map Type to Description/Title for now as primary identifier
        type: 'select', 
        required: true,
        options: [
          { value: 'Performance', label: 'Performance', icon: 'mic' },
          { value: 'Concert', label: 'Concert', icon: 'music' },
          { value: 'Lesson', label: 'Lesson', icon: 'book' },
          { value: 'Meeting', label: 'Meeting', icon: 'users' },
          { value: 'Practice', label: 'Practice', icon: 'play-circle' },
          { value: 'Rehearsal', label: 'Rehearsal', icon: 'repeat' },
          { value: 'Other', label: 'Other', icon: 'calendar' },
        ]
      },
    ]
  },

  // Event Step 2: When & Recurrence
  {
    id: 'event_timing',
    title: 'When is this happening?',
    condition: (data) => data.category === 'event',
    fields: [
      { id: 'transactionDate', label: 'Start Date & Time', type: 'date', required: true },
      { 
        id: 'eventDetails.recurrence', 
        label: 'Is this recurring?', 
        type: 'select', 
        required: true,
        defaultValue: 'once',
        options: [
          { value: 'once', label: 'Once off' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'fortnightly', label: 'Fortnightly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'annually', label: 'Annually' },
        ]
      }
    ]
  },

  // Event Step 3: Location
  {
    id: 'event_location',
    title: 'Where is this happening?',
    condition: (data) => data.category === 'event',
    fields: [
      { 
        id: 'eventDetails.locationType', 
        label: 'Location Type', 
        type: 'select',
        required: true,
        options: [
          { value: 'physical', label: 'Physical Address', icon: 'map-pin' },
          { value: 'virtual', label: 'Virtual / Online', icon: 'monitor' },
          { value: 'phone', label: 'Phone', icon: 'phone' },
          { value: 'flexible', label: 'Flexible / TBD', icon: 'help-circle' },
        ]
      },
      // Conditional logic for address field?
      // Our simple schema doesn't support intra-step dependency easily without custom rendering.
      // But we can just show the address field generic.
      { 
        id: 'eventDetails.venue', 
        label: 'Address / Link / Details', 
        type: 'text', 
        placeholder: '123 Music St, or Zoom Link' 
      },
    ]
  },

  // --- END EVENT STEPS ---

  // Step 3a: Gear Details (Identity)
  {
    id: 'gear_details',
    title: 'Gear Details',
    condition: (data) => data.category === 'gear',
    fields: [
      { id: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Gibson', required: true },
      { id: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Les Paul Standard' },
      { id: 'serialNumber', label: 'Serial Number', type: 'text', placeholder: 'Optional' },
    ]
  },

  // Step 3b: Gear Specs
  {
    id: 'gear_specs',
    title: 'Specifications',
    condition: (data) => data.category === 'gear',
    fields: [
      { id: 'gearDetails.colour', label: 'Colour / Finish', type: 'text', placeholder: 'e.g. Sunburst' },
      { id: 'gearDetails.makeYear', label: 'Year of Make', type: 'text', placeholder: 'e.g. 1959' },
    ]
  },

  // Step 3c: Gear Condition & Photos
  {
    id: 'gear_condition',
    title: 'Condition & Photos',
    condition: (data) => data.category === 'gear',
    fields: [
      { id: 'gearDetails.condition', label: 'Condition', type: 'slider', defaultValue: 'New', options: [
        { value: 'New', label: 'New' },
        { value: 'Great', label: 'Great' },
        { value: 'Good', label: 'Good' },
        { value: 'Fair', label: 'Fair' },
        { value: 'Poor', label: 'Poor' },
      ]},
      { id: 'images', label: 'Photos', type: 'image', required: false },
    ]
  },

  // Step 3b: Education Specifics
  {
    id: 'education_details',
    title: 'Lesson Details',
    condition: (data) => data.category === 'education',
    fields: [
      { id: 'educationDetails.studentName', label: 'Student Name', type: 'text', required: true, placeholder: 'Who is this for?' },
      { id: 'educationDetails.focus', label: 'Instrument / Subject', type: 'text', placeholder: 'e.g. Piano' },
      { id: 'educationDetails.teacherName', label: 'Teacher Name', type: 'text', placeholder: 'Optional' },
      
      { id: 'schedule_header', label: 'Schedule', type: 'header' },
      { id: 'educationDetails.startDate', label: 'First Lesson Date', type: 'date' },
      { id: 'educationDetails.frequency', label: 'Frequency', type: 'select', options: [
        { value: 'weekly', label: 'Weekly' },
        { value: 'fortnightly', label: 'Fortnightly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'block', label: 'Block / Term' },
        { value: 'casual', label: 'Casual' },
      ]},
    ]
  },

  // Step 3c: Service Specifics
  {
    id: 'service_details',
    title: 'Service Details',
    condition: (data) => data.category === 'service',
    fields: [
      { id: 'serviceDetails.serviceType', label: 'Service Type', type: 'text', placeholder: 'e.g. Set up, Repair' },
      { id: 'serviceDetails.technicianName', label: 'Technician', type: 'text', placeholder: 'Who did the work?' },
      { id: 'serviceDetails.pickupDate', label: 'Pickup Date', type: 'date' },
      { id: 'serviceDetails.nextDueDate', label: 'Next Service Due', type: 'date' },
      { id: 'serviceDetails.relatedGearId', label: 'Related Item', type: 'select', placeholder: 'Select Item', options: [] }, // Options populated at runtime
      { id: 'images', label: 'Service Report / Photos', type: 'image', required: false },
    ]
  },

  // Step 3e: Money Specifics
  {
    id: 'money_details',
    title: 'Money Details',
    condition: (data) => data.category === 'money',
    fields: [
      { id: 'moneyDetails.type', label: 'Type', type: 'select', required: true, options: [
        { value: 'income', label: 'Income' },
        { value: 'expense', label: 'Expense' },
      ]},
      { id: 'moneyDetails.category', label: 'Category', type: 'select', options: [
        { value: 'gig', label: 'Gig / Performance' },
        { value: 'merch', label: 'Merch Sales' },
        { value: 'royalties', label: 'Royalties' },
        { value: 'grant', label: 'Grant / Funding' },
        { value: 'other', label: 'Other' },
      ]},
    ]
  },
];
