import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ResultItem } from '../../lib/results';
import { getRelativeDateLabel, formatFullDate } from '../../lib/dateUtils';

export interface ServiceCardProps {
  item: ResultItem;
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
}

export const ServiceCard = ({ 
  item, 
  onPress, 
  onLinkPress, 
  isHighlighted 
}: ServiceCardProps) => {
  const accentColor = "#f97316"; // Orange for services/tools
  const iconBgColor = "rgba(249, 115, 22, 0.15)";

  // Extract service-specific metadata
  const metadata = item.metadata || {};
  const serviceType = metadata.serviceType || metadata.type || 'Service';
  const technician = metadata.technician || metadata.provider || '';
  const warranty = metadata.warranty || '';
  const notes = metadata.notes || '';

  const relativeDate = getRelativeDateLabel(item.date);

  const highlightedStyles = isHighlighted
    ? {
        borderColor: accentColor,
        borderWidth: 2,
        shadowColor: accentColor,
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 8,
      }
    : {};

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.cardContainer}
    >
      <View style={[styles.animatedCard, highlightedStyles]}>
        {/* Icon nestled in top-right corner */}
        <View 
          style={[styles.cornerIcon, { backgroundColor: iconBgColor }]}
        >
          <Feather name="tool" size={20} color={accentColor} />
        </View>

        {/* Title and Service Type */}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {serviceType}
          </Text>
        </View>

        {/* Service Details */}
        <View style={styles.contentArea}>
          <View style={styles.serviceInfo}>
            {technician && (
              <View style={styles.infoRow}>
                <Feather name="user" size={12} color={accentColor} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {technician}
                </Text>
              </View>
            )}
            {warranty && (
              <View style={styles.infoRow}>
                <Feather name="shield" size={12} color="#9ca3af" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {warranty}
                </Text>
              </View>
            )}
            {notes && (
              <View style={styles.infoRow}>
                <Feather name="info" size={12} color="#9ca3af" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {notes}
                </Text>
              </View>
            )}
            {!technician && !warranty && !notes && (
              <Text style={[styles.relativeDate, { color: accentColor }]}>
                {relativeDate}
              </Text>
            )}
          </View>
          {item.amount !== undefined && (
            <Text style={[styles.priceText, { color: accentColor }]}>
              ${(item.amount / 100).toFixed(0)}
            </Text>
          )}
        </View>

        {/* Footer: Chips and Date */}
        <View style={styles.footer}>
          <View style={styles.chipsRow}>
            {item.links?.map((link, idx) => (
              <TouchableOpacity
                key={`${link.id}-${idx}`}
                onPress={() => onLinkPress?.(link.id, link.type as any)}
                style={styles.chip}
              >
                <Feather 
                  name={
                    link.type === 'gear' ? 'package' : 
                    link.type === 'event' ? 'calendar' : 
                    link.type === 'education' ? 'book-open' : 'dollar-sign'
                  } 
                  size={12} 
                  color={
                    link.type === 'gear' ? '#f5c518' : 
                    link.type === 'event' ? '#22d3ee' : 
                    link.type === 'education' ? '#c084fc' : '#a3e635'
                  } 
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fullDate}>
            {formatFullDate(item.date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 8,
  },
  animatedCard: {
    minHeight: 200,
    backgroundColor: 'rgba(30, 10, 60, 0.4)',
    padding: 24,
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerIcon: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
  },
  headerText: {
    paddingRight: 32,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    lineHeight: 18,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceInfo: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  relativeDate: {
    color: '#d1d5db',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceText: {
    fontWeight: 'bold',
    fontSize: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  fullDate: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
