/**
 * Chat Assistant Flow Configurations
 * Declarative definition of conversation flows for manual entry
 */

export type CategoryType = 'education' | 'gear' | 'event' | 'service' | 'transaction';

export interface ChatQuestion {
  id: string;
  text: string;
  type: 'text' | 'date-picker' | 'number-input' | 'choice';
  choices?: string[];
  required?: boolean;
  validator?: (answer: string) => boolean;
  skipIf?: (draft: Record<string, any>) => boolean;
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
        skipIf: (draft) => !!draft.merchant,
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
  {
    category: 'gear',
    questions: [
      {
        id: 'brandModel',
        text: 'What is the brand and model?',
        type: 'text',
        required: true,
      },
      {
        id: 'purchaseSource',
        text: 'Did you buy it at a store or privately?',
        type: 'choice',
        choices: ['Store', 'Private'],
        required: true,
      },
      {
        id: 'cost',
        text: 'How much did it cost?',
        type: 'number-input',
        required: true,
        validator: (answer) => parseFloat(answer.replace(/[^0-9.]/g, '')) > 0,
      },
      {
        id: 'condition',
        text: 'Is it New or Used?',
        type: 'choice',
        choices: ['New', 'Used'],
        required: true,
      },
      {
        id: 'date',
        text: 'When did you get it?',
        type: 'date-picker',
        required: true,
      },
    ],
  },
  {
    category: 'event',
    questions: [
      {
        id: 'artist',
        text: 'Who are you seeing?',
        type: 'text',
        required: true,
        skipIf: (draft) => !!draft.merchant,
      },
      {
        id: 'date',
        text: 'When is the show?',
        type: 'date-picker',
        required: true,
      },
      {
        id: 'cost',
        text: 'Total cost for tickets?',
        type: 'number-input',
        required: true,
        validator: (answer) => parseFloat(answer.replace(/[^0-9.]/g, '')) > 0,
      },
    ],
  },
  {
    category: 'service',
    questions: [
      {
        id: 'technician',
        text: 'Who did the work?',
        type: 'text',
        required: true,
        skipIf: (draft) => !!draft.merchant,
      },
      {
        id: 'workDone',
        text: 'What work was done? (e.g. Restring, Refret)',
        type: 'text',
        required: true,
      },
      {
        id: 'complexity',
        text: 'How complex was it?',
        type: 'choice',
        choices: ['Simple (DIY)', 'Medium (Maintenance)', 'Expert (Repair)'],
        required: true,
      },
      {
        id: 'cost',
        text: 'Total cost?',
        type: 'number-input',
        required: true,
        validator: (answer) => parseFloat(answer.replace(/[^0-9.]/g, '')) > 0,
      },
    ],
  },
];

export function getFlow(category: CategoryType): ChatFlow | undefined {
  return CHAT_FLOWS.find(f => f.category === category);
}

export function getQuestion(flow: ChatFlow, step: number): ChatQuestion | undefined {
  return flow.questions[step];
}
