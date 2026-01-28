import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ReceiptRepository, type LineItemWithDetails, type GearDetails } from '../../../lib/repository';
import { db, waitForDb } from '../../../db/client';
import { lineItems } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export interface GearItemEditState {
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  colour: string;
  size: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | '';
  tier: 'Entry-level' | 'Student' | 'Professional' | 'Concert' | '';
  uniqueDetail: string;
  notedDamage: string;
  officialUrl: string;
  officialManual: string;
  warrantyPhone: string;
  warrantyEmail: string;
  warrantyWebsite: string;
}

export function useGearItemEdit(itemId: string | undefined, item: LineItemWithDetails | null) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<GearItemEditState>({
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    modelName: '',
    modelNumber: '',
    colour: '',
    size: '',
    condition: '',
    tier: '',
    uniqueDetail: '',
    notedDamage: '',
    officialUrl: '',
    officialManual: '',
    warrantyPhone: '',
    warrantyEmail: '',
    warrantyWebsite: '',
  });

  // Initialize edit state when item loads
  useEffect(() => {
    if (item) {
      const gd = item.gearDetailsParsed;
      setEditState({
        description: item.description || '',
        brand: item.brand || '',
        model: item.model || '',
        serialNumber: item.serialNumber || '',
        manufacturer: gd?.manufacturer || '',
        modelName: gd?.modelName || '',
        modelNumber: gd?.modelNumber || '',
        colour: gd?.colour || '',
        size: gd?.size || '',
        condition: gd?.condition || '',
        tier: gd?.tier || '',
        uniqueDetail: gd?.uniqueDetail || '',
        notedDamage: gd?.notedDamage || '',
        officialUrl: gd?.officialUrl || '',
        officialManual: gd?.officialManual || '',
        warrantyPhone: gd?.warrantyContactDetails?.phone || '',
        warrantyEmail: gd?.warrantyContactDetails?.email || '',
        warrantyWebsite: gd?.warrantyContactDetails?.website || '',
      });
    }
  }, [item]);

  const handleSave = async (onSuccess: () => void) => {
    if (!item || !itemId) return;
    setIsSaving(true);
    try {
      const gearDetails: GearDetails = {
        manufacturer: editState.manufacturer || undefined,
        brand: editState.brand || undefined,
        modelName: editState.modelName || undefined,
        modelNumber: editState.modelNumber || undefined,
        serialNumber: editState.serialNumber || undefined,
        colour: editState.colour || undefined,
        size: editState.size || undefined,
        condition: editState.condition || undefined,
        tier: editState.tier || undefined,
        uniqueDetail: editState.uniqueDetail || undefined,
        notedDamage: editState.notedDamage || undefined,
        officialUrl: editState.officialUrl || undefined,
        officialManual: editState.officialManual || undefined,
        warrantyContactDetails: (editState.warrantyPhone || editState.warrantyEmail || editState.warrantyWebsite) ? {
          phone: editState.warrantyPhone || undefined,
          email: editState.warrantyEmail || undefined,
          website: editState.warrantyWebsite || undefined,
        } : undefined,
      };

      await waitForDb();
      await db.update(lineItems).set({
        description: editState.description,
        brand: editState.brand || null,
        model: editState.model || null,
        serialNumber: editState.serialNumber || null,
        gearDetails: JSON.stringify(gearDetails),
      }).where(eq(lineItems.id, itemId));

      onSuccess();
      setIsEditing(false);
      Alert.alert('Saved!', 'Item details updated successfully');
    } catch (e) {
      console.error('Failed to save item details', e);
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
