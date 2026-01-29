import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ReceiptRepository, type Receipt } from '@lib/repository';

export interface TransactionEditState {
  merchant: string;
  documentType: string;
  date: string;
  invoiceNumber: string;
  abn: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  summary: string;
  merchantPhone: string;
  merchantEmail: string;
  merchantWebsite: string;
  merchantAddress: string;
  merchantSuburb: string;
  merchantState: string;
  merchantPostcode: string;
}

const initialEditState: TransactionEditState = {
  merchant: '',
  documentType: 'receipt',
  date: '',
  invoiceNumber: '',
  abn: '',
  subtotal: '',
  tax: '',
  total: '0',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  summary: '',
  merchantPhone: '',
  merchantEmail: '',
  merchantWebsite: '',
  merchantAddress: '',
  merchantSuburb: '',
  merchantState: '',
  merchantPostcode: '',
};

export function useTransactionEdit(
  id: string | undefined,
  receipt: Receipt | null,
  onSuccess: () => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<TransactionEditState>(initialEditState);

  // Initialize edit state when receipt loads
  useEffect(() => {
    if (receipt) {
      setEditState({
        merchant: receipt.merchant || '',
        documentType: receipt.documentType || 'receipt',
        date: receipt.transactionDate || new Date().toISOString().split('T')[0],
        invoiceNumber: receipt.invoiceNumber || '',
        abn: receipt.merchantAbn || '',
        subtotal: receipt.subtotal ? (receipt.subtotal / 100).toString() : '',
        tax: receipt.tax ? (receipt.tax / 100).toString() : '',
        total: receipt.total ? (receipt.total / 100).toString() : '0',
        paymentStatus: receipt.paymentStatus || 'paid',
        paymentMethod: receipt.paymentMethod || 'card',
        summary: receipt.summary || '',
        merchantPhone: receipt.merchantPhone || '',
        merchantEmail: receipt.merchantEmail || '',
        merchantWebsite: receipt.merchantWebsite || '',
        merchantAddress: receipt.merchantAddress || '',
        merchantSuburb: receipt.merchantSuburb || '',
        merchantState: receipt.merchantState || '',
        merchantPostcode: receipt.merchantPostcode || '',
      });
    }
  }, [receipt]);

  const handleSave = useCallback(async () => {
    if (!receipt || !id) return;
    setIsSaving(true);
    try {
      await ReceiptRepository.update(id, {
        merchant: editState.merchant,
        documentType: editState.documentType,
        transactionDate: editState.date,
        invoiceNumber: editState.invoiceNumber || null,
        merchantAbn: editState.abn || null,
        subtotal: editState.subtotal ? Math.round(parseFloat(editState.subtotal) * 100) : null,
        tax: editState.tax ? Math.round(parseFloat(editState.tax) * 100) : null,
        total: Math.round(parseFloat(editState.total) * 100),
        paymentStatus: editState.paymentStatus,
        paymentMethod: editState.paymentMethod,
        summary: editState.summary || null,
        merchantPhone: editState.merchantPhone || null,
        merchantEmail: editState.merchantEmail || null,
        merchantWebsite: editState.merchantWebsite || null,
        merchantAddress: editState.merchantAddress || null,
        merchantSuburb: editState.merchantSuburb || null,
        merchantState: editState.merchantState || null,
        merchantPostcode: editState.merchantPostcode || null,
      });
      onSuccess();
      setIsEditing(false);
      Alert.alert('Saved!', 'Changes saved successfully');
    } catch (e) {
      console.error('Failed to save changes', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [id, receipt, editState, onSuccess]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    setIsEditing,
    isSaving,
    editState,
    setEditState,
    handleSave,
    handleCancelEdit,
  };
}

// Default export to prevent expo-router from treating this as a route
export default null;
