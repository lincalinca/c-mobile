import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { GearDetails } from '@lib/repository';
import { AutoSizingText } from '@components/common/AutoSizingText';

type IconName = 'external-link' | 'book-open' | 'phone' | 'mail' | 'globe';
type ResourceKey = keyof Pick<GearDetails, 'officialUrl' | 'officialManual'>;
type WarrantyContactKey = 'warrantyPhone' | 'warrantyEmail' | 'warrantyWebsite';

interface ResourceLinkConfig {
  label: string;
  key: ResourceKey;
  icon: IconName;
  urlPrefix?: string;
}

interface WarrantyContactConfig {
  label: string;
  key: WarrantyContactKey;
  icon: IconName;
  urlPrefix?: string;
}

interface ResourceLinkProps {
  label: string;
  value: string;
  icon: IconName;
  onPress: () => void;
}

function ResourceLink({ label, value, icon, onPress }: ResourceLinkProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800 flex-row items-center gap-3 mb-2"
    >
      <Feather name={icon} size={18} color="#f5c518" />
      <View className="flex-1">
        <Text className="text-crescender-400 text-xs">{label}</Text>
        <AutoSizingText
          value={value}
          baseFontSize={14}
          minFontSize={10}
          className="text-white"
          style={{ flex: 1 }}
        />
      </View>
    </TouchableOpacity>
  );
}

interface WarrantyContactLinkProps {
  icon: IconName;
  value: string;
  onPress: () => void;
}

function WarrantyContactLink({ icon, value, onPress }: WarrantyContactLinkProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center gap-3 mb-2"
    >
      <Feather name={icon} size={14} color="#666" />
      <AutoSizingText
        value={value}
        baseFontSize={14}
        minFontSize={10}
        className="text-white underline"
        style={{ flex: 1 }}
      />
    </TouchableOpacity>
  );
}

interface GearItemResourcesViewProps {
  gearDetails: GearDetails;
}

const RESOURCE_LINKS: ResourceLinkConfig[] = [
  { label: 'Official Product Page', key: 'officialUrl', icon: 'external-link' },
  { label: 'Official Manual', key: 'officialManual', icon: 'book-open' },
];

const WARRANTY_CONTACTS: WarrantyContactConfig[] = [
  { label: 'Phone', key: 'warrantyPhone', icon: 'phone', urlPrefix: 'tel:' },
  { label: 'Email', key: 'warrantyEmail', icon: 'mail', urlPrefix: 'mailto:' },
  { label: 'Website', key: 'warrantyWebsite', icon: 'globe' },
];

export function GearItemResourcesView({ gearDetails }: GearItemResourcesViewProps) {
  const openUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl);
  };

  const warrantyData: Record<WarrantyContactKey, string | undefined> = {
    warrantyPhone: gearDetails.warrantyContactDetails?.phone,
    warrantyEmail: gearDetails.warrantyContactDetails?.email,
    warrantyWebsite: gearDetails.warrantyContactDetails?.website,
  };

  const visibleResources = RESOURCE_LINKS.filter(link => gearDetails[link.key]);
  const visibleWarrantyContacts = WARRANTY_CONTACTS.filter(contact => warrantyData[contact.key]);

  const hasResources = visibleResources.length > 0 || visibleWarrantyContacts.length > 0;

  if (!hasResources) return null;

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-xs">
        Resources & Warranty
      </Text>
      <View className="space-y-2">
        {visibleResources.map((link) => (
          <ResourceLink
            key={link.key}
            label={link.label}
            value={gearDetails[link.key] as string}
            icon={link.icon}
            onPress={() => openUrl(gearDetails[link.key] as string)}
          />
        ))}
        
        {visibleWarrantyContacts.length > 0 && (
          <View className="bg-crescender-900/40 p-4 rounded-xl border border-crescender-800 mt-2">
            <View className="flex-row items-center gap-2 mb-3">
              <Feather name="shield" size={16} color="#22c55e" />
              <Text className="text-green-400 font-bold text-sm">Warranty Contact</Text>
            </View>
            
            {visibleWarrantyContacts.map((contact) => {
              const value = warrantyData[contact.key]!;
              const handlePress = () => {
                if (contact.urlPrefix) {
                  Linking.openURL(`${contact.urlPrefix}${value}`);
                } else {
                  openUrl(value);
                }
              };

              return (
                <WarrantyContactLink
                  key={contact.key}
                  icon={contact.icon}
                  value={value}
                  onPress={handlePress}
                />
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
