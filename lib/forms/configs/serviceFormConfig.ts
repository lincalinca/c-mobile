/**
 * Service Item Edit Form Configuration
 * Declarative definition of service form structure
 */

import type { FormSectionConfig } from '../types';

export const SERVICE_FORM_SECTIONS: FormSectionConfig[] = [
  {
    fields: [
      {
        type: 'input',
        label: 'Description',
        key: 'description',
        isLarge: true,
      },
      {
        type: 'input',
        label: 'Service Type',
        key: 'serviceType',
        placeholder: 'e.g. Repair, Setup, Maintenance',
      },
      {
        type: 'input',
        label: 'Technician Name',
        key: 'technicianName',
      },
      {
        type: 'input',
        label: 'Provider Name',
        key: 'providerName',
      },
    ],
  },
  {
    title: 'Dates',
    fields: [
      {
        type: 'date',
        label: 'Start Date',
        key: 'startDate',
      },
      {
        type: 'date',
        label: 'End Date',
        key: 'endDate',
      },
      {
        type: 'date',
        label: 'Pickup Date',
        key: 'pickupDate',
      },
      {
        type: 'date',
        label: 'Dropoff Date',
        key: 'dropoffDate',
      },
    ],
  },
  {
    fields: [
      {
        type: 'multiline',
        label: 'Notes',
        key: 'notes',
        placeholder: 'Additional notes about this service...',
      },
    ],
  },
];
