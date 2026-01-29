/**
 * Transaction Edit Form Configuration
 * Declarative definition of transaction form structure
 */

import type { FormSectionConfig } from '@lib/forms/types';

// Document type options
const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'tax_invoice', label: 'Tax Invoice' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'layby', label: 'Layby' },
] as const;

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-600' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-600' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-600' },
] as const;

// Payment method options
const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'afterpay', label: 'Afterpay' },
  { value: 'other', label: 'Other' },
] as const;

export const TRANSACTION_FORM_SECTIONS: FormSectionConfig[] = [
  {
    title: 'Document Type',
    fields: [
      {
        type: 'chip-selector',
        label: '',
        key: 'documentType',
        options: DOCUMENT_TYPES,
      },
    ],
  },
  {
    fields: [
      {
        type: 'input',
        label: 'Merchant',
        key: 'merchant',
        isLarge: true,
      },
      {
        type: 'input',
        label: 'Summary',
        key: 'summary',
        placeholder: 'Short description (e.g. Guitar strings, lesson)',
      },
    ],
  },
  {
    layout: 'row',
    fields: [
      {
        type: 'input',
        label: 'ABN',
        key: 'abn',
        placeholder: 'XX XXX XXX XXX',
        inputType: 'numeric',
      },
      {
        type: 'input',
        label: 'Invoice/Receipt #',
        key: 'invoiceNumber',
      },
    ],
  },
  {
    fields: [
      {
        type: 'date',
        label: 'Date',
        key: 'date',
      },
    ],
  },
  {
    title: 'Financial Details',
    layout: 'row',
    fields: [
      {
        type: 'input',
        label: 'Subtotal',
        key: 'subtotal',
        placeholder: '0.00',
        inputType: 'decimal-pad',
      },
      {
        type: 'input',
        label: 'GST (10%)',
        key: 'tax',
        placeholder: '0.00',
        inputType: 'decimal-pad',
      },
    ],
  },
  {
    fields: [
      {
        type: 'input',
        label: 'Total',
        key: 'total',
        placeholder: '0.00',
        inputType: 'decimal-pad',
        isLarge: true,
      },
    ],
  },
  {
    fields: [
      {
        type: 'chip-selector',
        label: 'Payment Status',
        key: 'paymentStatus',
        options: PAYMENT_STATUSES,
        getColor: (option, isSelected) =>
          isSelected ? `${option.color} border-white` : 'bg-crescender-900/60 border-crescender-700',
      },
      {
        type: 'chip-selector',
        label: 'Payment Method',
        key: 'paymentMethod',
        options: PAYMENT_METHODS,
      },
    ],
  },
  {
    title: 'Merchant contact & address',
    fields: [
      {
        type: 'input',
        label: 'Phone',
        key: 'merchantPhone',
        inputType: 'phone',
      },
      {
        type: 'input',
        label: 'Email',
        key: 'merchantEmail',
        inputType: 'email',
      },
      {
        type: 'input',
        label: 'Website',
        key: 'merchantWebsite',
        placeholder: 'example.com',
        inputType: 'url',
      },
      {
        type: 'input',
        label: 'Address',
        key: 'merchantAddress',
      },
    ],
  },
  {
    layout: 'row',
    fields: [
      {
        type: 'input',
        label: 'Suburb',
        key: 'merchantSuburb',
      },
      {
        type: 'state-picker',
        label: 'State',
        key: 'merchantState',
      },
      {
        type: 'input',
        label: 'Postcode',
        key: 'merchantPostcode',
        inputType: 'numeric',
        maxLength: 4,
      },
    ],
  },
];
