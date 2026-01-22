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

export interface EducationCardProps {
  item: ResultItem;
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
}

export const EducationCard = ({ 
  item, 
  onPress, 
  onLinkPress, 
  isHighlighted 
}: EducationCardProps) => {
  const glow = useSharedValue(0.3);
  const accentColor = "#c084fc";
  const iconBgColor = "rgba(192, 132, 252, 0.15)";

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

  // Extract education-specific metadata
  const metadata = item.metadata || {};
  const studentName = metadata.studentName || 'Student';
  const frequency = metadata.frequency || 'One-off';
  const duration = metadata.duration || '60m';
  const daysOfWeek = metadata.daysOfWeek || [];
  const times = metadata.times || [];
  
  // Format schedule info: "3:00 PM Monday, 3:00 PM Wednesday" instead of "Monday, Wednesday 3:00 PM, 3:00 PM"
  const scheduleText = (() => {
    if (daysOfWeek.length === 0 || times.length === 0) {
      return frequency;
    }
    
    // Match each time with its corresponding day
    const schedulePairs: string[] = [];
    for (let i = 0; i < Math.max(daysOfWeek.length, times.length); i++) {
      const day = daysOfWeek[i] || daysOfWeek[0];
      const time = times[i] || times[0];
      schedulePairs.push(`${time} ${day}`);
    }
    
    return schedulePairs.join(', ');
  })();

  const relativeDate = getRelativeDateLabel(item.date);

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
          <Feather name="book-open" size={20} color={accentColor} />
        </View>

        {/* Title and Student Name */}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {studentName}
          </Text>
        </View>

        {/* Education Details */}
        <View style={styles.contentArea}>
          <View style={styles.educationInfo}>
            <View style={styles.infoRow}>
              <Feather name="clock" size={12} color={accentColor} />
              <Text style={[styles.infoText, { color: accentColor }]}>
                {duration}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="repeat" size={12} color="#9ca3af" />
              <Text style={styles.infoText} numberOfLines={1}>
                {scheduleText}
              </Text>
            </View>
            {metadata.startDate && (
              <View style={styles.infoRow}>
                <Feather name="calendar" size={12} color="#9ca3af" />
                <Text style={styles.infoText} numberOfLines={1}>
                  Starts {new Date(metadata.startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
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
  educationInfo: {
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
