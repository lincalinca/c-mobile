/**
 * useNotificationSettings Hook
 * 
 * Hook for managing notification settings in UI components.
 * Handles loading, updating settings, and permission requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { NotificationSettingsRepository } from '@lib/notifications/NotificationRepository';
import { PermissionManager } from '@lib/notifications/PermissionManager';
import { cancelByCategory } from '@lib/notifications/Scheduler';
import type { NotificationCategory, NotificationSettings } from '@lib/notifications/types';

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await NotificationSettingsRepository.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('[useNotificationSettings] Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load notification settings.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update global notification toggle
   */
  const updateGlobal = useCallback(async (enabled: boolean) => {
    if (!settings) return;

    setIsUpdating(true);
    try {
      if (enabled) {
        // Request permission when enabling
        const permissionStatus = await PermissionManager.ensurePermissionGranted();
        
        if (permissionStatus !== 'granted') {
          // Revert toggle if permission denied
          Alert.alert(
            'Permission Required',
            'Notification permissions are required to enable notifications. Please enable them in your device settings.',
            [{ text: 'OK' }]
          );
          setIsUpdating(false);
          return;
        }
      }

      // Update settings
      const updatedSettings = {
        ...settings,
        globalEnabled: enabled,
      };
      
      await NotificationSettingsRepository.updateSettings({
        globalEnabled: enabled,
      });
      
      setSettings(updatedSettings);

      // If disabling globally, cancel all scheduled notifications
      if (!enabled) {
        const categories: NotificationCategory[] = [
          'lessons',
          'gear_enrichment',
          'warranty',
          'maintenance',
          'reengagement',
          'service',
        ];
        
        for (const category of categories) {
          await cancelByCategory(category);
        }
      }
    } catch (error) {
      console.error('[useNotificationSettings] Failed to update global setting:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsUpdating(false);
    }
  }, [settings]);

  /**
   * Update category-specific toggle
   */
  const updateCategory = useCallback(async (category: NotificationCategory, enabled: boolean) => {
    if (!settings) return;

    setIsUpdating(true);
    try {
      // If enabling a category and global is off, check if we need permission
      if (enabled && !settings.globalEnabled) {
        const permissionStatus = await PermissionManager.ensurePermissionGranted();
        
        if (permissionStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Notification permissions are required. Please enable them in your device settings.',
            [{ text: 'OK' }]
          );
          setIsUpdating(false);
          return;
        }
        
        // Also enable global when first category is enabled
        await NotificationSettingsRepository.updateSettings({
          globalEnabled: true,
        });
      }

      // Update category setting
      const updatedPerCategory = {
        ...settings.perCategoryEnabled,
        [category]: enabled,
      };
      
      await NotificationSettingsRepository.updateSettings({
        perCategoryEnabled: updatedPerCategory,
      });
      
      setSettings({
        ...settings,
        globalEnabled: enabled ? true : settings.globalEnabled,
        perCategoryEnabled: updatedPerCategory,
      });

      // If disabling category, cancel all notifications for that category
      if (!enabled) {
        await cancelByCategory(category);
      }
    } catch (error) {
      console.error('[useNotificationSettings] Failed to update category setting:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsUpdating(false);
    }
  }, [settings]);

  return {
    settings,
    isLoading,
    isUpdating,
    updateGlobal,
    updateCategory,
    reload: loadSettings,
  };
}
