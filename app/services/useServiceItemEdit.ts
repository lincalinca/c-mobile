import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ReceiptRepository, type LineItemWithDetails, type ServiceDetails } from '@lib/repository';
import { db, waitForDb } from '@db/client';
import { lineItems } from '@db/schema';
import { eq } from 'drizzle-orm';

export interface ServiceItemEditState {
  description: string;
  serviceType: string;
  technicianName: string;
  providerName: string;
  startDate: string;
  endDate: string;
  pickupDate: string;
  dropoffDate: string;
  notes: string;
}

export function useServiceItemEdit(itemId: string | undefined, item: LineItemWithDetails | null) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<ServiceItemEditState>({
    description: '',
    serviceType: '',
    technicianName: '',
    providerName: '',
    startDate: '',
    endDate: '',
    pickupDate: '',
    dropoffDate: '',
    notes: '',
  });

  // Initialize edit state when item loads
  useEffect(() => {
    if (item) {
      const sd = item.serviceDetailsParsed;
      setEditState({
        description: item.description || '',
        serviceType: sd?.serviceType || '',
        technicianName: sd?.technicianName || '',
        providerName: sd?.providerName || '',
        startDate: sd?.startDate || '',
        endDate: sd?.endDate || '',
        pickupDate: sd?.pickupDate || '',
        dropoffDate: sd?.dropoffDate || '',
        notes: item.notes || '',
      });
    }
  }, [item]);

  const handleSave = async (onSuccess: () => void) => {
    if (!item || !itemId) return;
    setIsSaving(true);
    try {
      const serviceDetails: ServiceDetails = {
        serviceType: editState.serviceType || undefined,
        technicianName: editState.technicianName || undefined,
        providerName: editState.providerName || undefined,
        startDate: editState.startDate || undefined,
        endDate: editState.endDate || undefined,
        pickupDate: editState.pickupDate || undefined,
        dropoffDate: editState.dropoffDate || undefined,
      };

      await waitForDb();
      await db.update(lineItems).set({
        description: editState.description,
        serviceDetails: JSON.stringify(serviceDetails),
        notes: editState.notes || null,
      }).where(eq(lineItems.id, itemId));

      onSuccess();
      setIsEditing(false);
      Alert.alert('Saved!', 'Service details updated successfully');
    } catch (e) {
      console.error('Failed to save service details', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    isSaving,
    editState,
    setEditState,
    handleSave,
  };
}

// Default export to prevent expo-router from treating this as a route
export default null;
