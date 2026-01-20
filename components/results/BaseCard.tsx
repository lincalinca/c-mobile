import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ResultItem } from '../../lib/results';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming, 
  useSharedValue 
} from 'react-native-reanimated';
import { getRelativeDateLabel, formatFullDate } from '../../lib/dateUtils';

export interface BaseCardProps {
  item: ResultItem;
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
  accentColor: string;
  iconName: any;
  iconBgColor: string;
}

export const BaseCard = ({ 
  item, 
  onPress, 
  onLinkPress, 
  isHighlighted, 
  accentColor, 
  iconName, 
  iconBgColor 
}: BaseCardProps) => {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (isHighlighted) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0.3);
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: isHighlighted ? accentColor : `rgba(255, 255, 255, 0.05)`,
    borderWidth: 2,
    opacity: isHighlighted ? glow.value : 1,
    shadowColor: accentColor,
    shadowOpacity: isHighlighted ? glow.value : 0,
    shadowRadius: isHighlighted ? 15 : 0,
    elevation: isHighlighted ? 8 : 0,
  }), [isHighlighted]);

  const relativeDate = getRelativeDateLabel(item.date);
  const frequency = item.metadata?.frequency;
  const displayLabel = frequency 
    ? `${frequency}. Next ${relativeDate.toLowerCase().replace('occurs ', '')}`
    : relativeDate;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.cardContainer}
    >
      <Animated.View 
        style={[styles.animatedCard, animatedStyle]}
      >
        {/* Icon nestled in top-right corner */}
        <View 
          style={[styles.cornerIcon, { backgroundColor: iconBgColor }]}
        >
          <Feather name={iconName} size={20} color={accentColor} />
        </View>

        {/* Title and Subtitle */}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>

        {/* Dynamic Content (Price or Duration) */}
        <View style={styles.contentArea}>
          {item.type === 'event' ? (
            <View>
              <Text style={[styles.mainValue, { color: accentColor }]}>
                {item.metadata?.duration || '60m'}
              </Text>
              <Text style={styles.relativeDate}>
                {displayLabel}
              </Text>
            </View>
          ) : (
            item.amount !== undefined && (
              <Text style={[styles.mainValue, { color: accentColor }]}>
                ${(item.amount / 100).toFixed(0)}
              </Text>
            )
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
                    link.type === 'event' ? 'calendar' : 'dollar-sign'
                  } 
                  size={12} 
                  color={
                    link.type === 'gear' ? '#f5c518' : 
                    link.type === 'event' ? '#22d3ee' : '#a3e635'
                  } 
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fullDate}>
            {formatFullDate(item.date)}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 8,
  },
  animatedCard: {
    height: 200,
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
    justifyContent: 'center',
  },
  mainValue: {
    fontWeight: 'bold',
    fontSize: 28,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
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
