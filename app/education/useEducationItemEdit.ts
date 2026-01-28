import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { generateEducationSeriesTitle } from '../../lib/educationUtils';

export interface EducationItemEditState {
  title: string;
  subtitle: string;
  studentName: string;
  focus: string;
}

export function useEducationItemEdit(
  item: LineItemWithDetails | null,
  receipt: Receipt | null,
  onSuccess: () => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<EducationItemEditState>({
    title: '',
    subtitle: '',
    studentName: '',
    focus: '',
  });

  // Initialize edit state when item loads or edit starts
  useEffect(() => {
    if (item && receipt) {
      const edu = item.educationDetailsParsed;
      setEditState({
        title: item.description || '',
        subtitle: edu?.subtitle ?? receipt.merchant ?? '',
        studentName: edu?.studentName ?? '',
        focus: edu?.focus ?? '',
      });
    }
  }, [item, receipt]);

  const handleStartEdit = useCallback(() => {
    if (!item || !receipt) return;
    const edu = item.educationDetailsParsed;
    setEditState({
      title: item.description || '',
      subtitle: edu?.subtitle ?? receipt.merchant ?? '',
      studentName: edu?.studentName ?? '',
      focus: edu?.focus ?? '',
    });
    setIsEditing(true);
  }, [item, receipt]);

  const handleSave = useCallback(async () => {
    if (!item || !receipt) return;
    setIsSaving(true);
    try {
      const edu = item.educationDetailsParsed || {};
      const merged = {
        ...edu,
        studentName: editState.studentName.trim() || undefined,
        subtitle: editState.subtitle.trim() || undefined,
        focus: editState.focus.trim() || undefined,
      };

      // Generate title if focus and student name are available
      let finalTitle = editState.title.trim();
      if (merged.focus && merged.studentName && merged.startDate) {
        finalTitle = generateEducationSeriesTitle(merged, merged.startDate);
      }

      await ReceiptRepository.updateLineItem(item.id, {
        description: finalTitle,
        educationDetails: JSON.stringify(merged),
      });

      onSuccess();
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save education details', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [item, receipt, editState, onSuccess]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    isSaving,
    editState,
    setEditState,
    handleStartEdit,
    handleSave,
    handleCancelEdit,
  };
}
