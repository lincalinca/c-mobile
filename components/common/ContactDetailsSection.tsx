import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconName = 'phone' | 'mail' | 'globe' | 'map-pin';

interface ContactFieldConfig {
  key: 'phone' | 'email' | 'website' | 'address';
  icon: IconName;
  action?: 'tel' | 'mailto' | 'url';
}

interface ContactDetailsData {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}

interface ContactDetailsSectionProps {
  data: ContactDetailsData;
  accentColor: string;
  iconSize?: number;
}

const CONTACT_FIELDS: ContactFieldConfig[] = [
  { key: 'phone', icon: 'phone', action: 'tel' },
  { key: 'email', icon: 'mail', action: 'mailto' },
  { key: 'website', icon: 'globe', action: 'url' },
  { key: 'address', icon: 'map-pin' },
];

export function ContactDetailsSection({ data, accentColor, iconSize = 16 }: ContactDetailsSectionProps) {
  const hasContactDetails = data.phone || data.email || data.website || data.address;

  if (!hasContactDetails) return null;

  const handlePress = (field: ContactFieldConfig, value: string) => {
    switch (field.action) {
      case 'tel':
        Linking.openURL(`tel:${value.replace(/\s/g, '')}`);
        break;
      case 'mailto':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'url':
        Linking.openURL(`https://${value.replace(/^https?:\/\//, '')}`);
        break;
    }
  };

  const formatAddress = () => {
    const parts = [data.address];
    if (data.suburb) parts.push(data.suburb);
    if (data.state) parts.push(data.state);
    if (data.postcode) parts.push(data.postcode);
    return parts.filter(Boolean).join(', ').replace(', ,', ',');
  };

  const visibleFields = CONTACT_FIELDS.filter(field => {
    if (field.key === 'address') return data.address;
    return data[field.key];
  });

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: accentColor }}>
        Contact Details
      </Text>
      <View className="bg-crescender-900/40 p-4 rounded-xl">
        {visibleFields.map((field, index) => {
          const isLast = index === visibleFields.length - 1;
          const value = field.key === 'address' ? formatAddress() : data[field.key];

          if (!value) return null;

          const isClickable = field.action !== undefined;
          const Container = isClickable ? TouchableOpacity : View;
          const containerProps = isClickable
            ? { onPress: () => handlePress(field, data[field.key]!) }
            : {};

          return (
            <Container
              key={field.key}
              {...containerProps}
              className={`flex-row items-${field.key === 'address' ? 'start' : 'center'} gap-3 ${!isLast ? 'mb-3' : ''}`}
            >
              <Feather
                name={field.icon}
                size={iconSize}
                color={accentColor}
                style={field.key === 'address' ? { marginTop: 2 } : undefined}
              />
              <Text
                className={`text-${isClickable ? 'white' : 'crescender-300'} text-sm flex-1 ${isClickable ? 'underline' : ''}`}
              >
                {value}
              </Text>
            </Container>
          );
        })}
      </View>
    </View>
  );
}
