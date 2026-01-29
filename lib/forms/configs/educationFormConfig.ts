/**
 * Education Item Edit Form Configuration
 * Declarative definition of education form structure
 */

import type { FormSectionConfig } from '@lib/forms/types';

export const EDUCATION_FORM_SECTIONS: FormSectionConfig[] = [
  {
    fields: [
      {
        type: 'input',
        label: 'Title',
        key: 'title',
        isLarge: true,
      },
      {
        type: 'input',
        label: 'Subtitle (e.g. provider)',
        key: 'subtitle',
      },
      {
        type: 'input',
        label: 'Student',
        key: 'studentName',
        placeholder: 'Student name',
      },
      {
        type: 'input',
        label: 'Focus',
        key: 'focus',
        placeholder: 'Violin, Piano, Vocals, Theory, Etc',
      },
    ],
  },
];

// Special styling for education form - uses different input style
export const EDUCATION_FORM_STYLE = 'education';
