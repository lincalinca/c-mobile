import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { ResultItem } from '@lib/results';
import { getRelativeDateLabel, formatFullDate } from '@lib/dateUtils';
import { CARD, getChipIcon } from './cardStyles';

export interface BaseCardProps {
  item: ResultItem;
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
  accentColor: string;
  iconName: any;
  iconBgColor: string;
  /** Rendered between header and main value. When set, contentArea uses space-between and shows [detailContent, mainValue]. */
  detailContent?: React.ReactNode;
  /** Used instead of item.subtitle (e.g. Education: studentName; Service: serviceType). */
  subtitleOverride?: string;
  /** When true, use Animated.View and Education-style glow when isHighlighted. */
  isAnimatedHighlight?: boolean;
}

export const BaseCard = ({
  item,
  onPress,
  onLinkPress,
  isHighlighted,
  accentColor,
  iconName,
  iconBgColor,
  detailContent,
  subtitleOverride,
  isAnimatedHighlight = false,
}: BaseCardProps) => {
  const glow = useSharedValue(0.3);

  useEffect(() => {
    if (isAnimatedHighlight) {
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
    }
  }, [isAnimatedHighlight, isHighlighted]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      borderColor: isHighlighted ? accentColor : (accentColor + '80'), // 50% opacity accent
      borderWidth: isHighlighted ? 2 : 0.5,
      opacity: isHighlighted ? glow.value : 1,
      shadowColor: accentColor,
      shadowOpacity: isHighlighted ? glow.value : 0,
      shadowRadius: isHighlighted ? 15 : 0,
      elevation: isHighlighted ? 8 : 0,
    }),
    [isHighlighted, accentColor]
  );

  const relativeDate = getRelativeDateLabel(item.date);
  const frequency = item.metadata?.frequency;
  const displayLabel = frequency
    ? `${frequency}. Next ${relativeDate.toLowerCase().replace('occurs ', '')}`
    : relativeDate;

  const highlightedStyles =
    !isAnimatedHighlight && isHighlighted
      ? {
          borderColor: accentColor,
          borderWidth: 2,
          shadowColor: accentColor,
          shadowOpacity: 0.6,
          shadowRadius: 15,
          elevation: 8,
        }
      : {
          borderColor: accentColor + '80', // 50% opacity
          borderWidth: 0.5,
        };

  const subtitle = subtitleOverride ?? item.subtitle ?? '';

  const mainValueNode =
    item.type === 'event' ? (
      <View>
        <Text style={[styles.mainValue, { color: accentColor }]}>
          {item.metadata?.duration || '60m'}
        </Text>
        <Text style={styles.relativeDate} numberOfLines={2} ellipsizeMode="tail">{displayLabel}</Text>
      </View>
    ) : item.amount !== undefined ? (
      <Text style={[styles.mainValue, { color: accentColor }]}>
        ${(item.amount / 100).toFixed(0)}
      </Text>
    ) : null;

  const contentAreaContent = detailContent ? (
    <>
      {detailContent}
      {mainValueNode}
    </>
  ) : (
    mainValueNode
  );

  // Group chips by type and collapse if 3+ of same type
  const groupedChips = React.useMemo(() => {
    if (!item.links || item.links.length === 0) return [];
    
    // Group by type
    const groups: Record<string, typeof item.links> = {};
    item.links.forEach(link => {
      if (!groups[link.type]) {
        groups[link.type] = [];
      }
      groups[link.type]!.push(link);
    });
    
    // Convert to array of chip groups
    return Object.entries(groups).map(([type, links]) => ({
      type,
      links: links!,
      isCollapsed: links!.length >= 3,
      count: links!.length,
    }));
  }, [item.links]);

  const Inner = isAnimatedHighlight ? Animated.View : View;
  const innerStyle = isAnimatedHighlight
    ? [styles.animatedCard, animatedStyle]
    : [styles.animatedCard, highlightedStyles];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <Inner style={innerStyle}>
        <View style={[styles.cornerIcon, { backgroundColor: iconBgColor }]}>
          <Feather name={iconName} size={CARD.cornerIconIconSize} color={accentColor} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View
          style={[
            styles.contentArea,
            ...(detailContent ? [styles.contentAreaSpaceBetween] : []),
          ]}
        >
          {contentAreaContent}
        </View>

        <View style={styles.footer}>
          <View style={styles.chipsRow}>
            {groupedChips.map((group, groupIdx) => {
              const { name, color } = getChipIcon(group.type);
              
              if (group.isCollapsed) {
                // Show collapsed badge: [icon +N]
                return (
                  <TouchableOpacity
                    key={`${group.type}-collapsed`}
                    onPress={() => {
                      // For collapsed chips, navigate to first item (or parent transaction)
                      // The handleLinkPress in index.tsx will handle navigation
                      if (group.links.length > 0) {
                        onLinkPress?.(group.links[0].id, group.type);
                      }
                    }}
                    style={styles.chipCollapsed}
                  >
                    <Feather name={name as any} size={CARD.chipIconSize} color={color} />
                    <Text style={[styles.chipCount, { color }]}>+{group.count}</Text>
                  </TouchableOpacity>
                );
              } else {
                // Show individual chips
                return (
                  <React.Fragment key={group.type}>
                    {group.links.map((link, idx) => (
                      <TouchableOpacity
                        key={`${link.id}-${idx}`}
                        onPress={() => onLinkPress?.(link.id, link.type as string)}
                        style={styles.chip}
                      >
                        <Feather name={name as any} size={CARD.chipIconSize} color={color} />
                      </TouchableOpacity>
                    ))}
                  </React.Fragment>
                );
              }
            })}
          </View>
          <Text style={styles.fullDate}>{formatFullDate(item.date)}</Text>
        </View>
      </Inner>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: CARD.cardMargin,
  },
  animatedCard: {
    minHeight: CARD.cardMinHeight,
    backgroundColor: 'rgba(30, 10, 60, 0.4)',
    padding: CARD.cardPadding,
    borderRadius: CARD.cardBorderRadius,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerIcon: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: CARD.cornerIconSize,
    height: CARD.cornerIconSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: CARD.cardBorderRadius,
  },
  headerText: {
    paddingRight: CARD.headerPaddingRight,
    marginBottom: CARD.headerMarginBottom,
  },
  title: {
    color: CARD.titleColor,
    fontWeight: 'bold',
    fontSize: CARD.titleFontSize,
    lineHeight: CARD.titleLineHeight,
  },
  subtitle: {
    color: CARD.subtitleColor,
    fontSize: CARD.subtitleFontSize,
    lineHeight: (CARD as any).subtitleLineHeight || 22,
    marginTop: CARD.subtitleMarginTop,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  contentAreaSpaceBetween: {
    justifyContent: 'space-between',
  },
  mainValue: {
    fontWeight: 'bold',
    fontSize: CARD.mainValueFontSize,
  },
  relativeDate: {
    color: CARD.relativeDateColor,
    fontSize: CARD.relativeDateFontSize,
    marginTop: CARD.relativeDateMarginTop,
    fontWeight: '600',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: CARD.footerMarginTop,
    paddingTop: CARD.footerPaddingTop,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: CARD.chipGap,
  },
  chip: {
    width: CARD.chipSize,
    height: CARD.chipSize,
    borderRadius: CARD.chipSize / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipCollapsed: {
    minWidth: CARD.chipSize + 20,
    height: CARD.chipSize,
    borderRadius: CARD.chipSize / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    paddingHorizontal: 6,
    gap: 2,
  },
  chipCount: {
    fontSize: 15,  // was 10 → now 15 (+50%)
    fontWeight: 'bold',
  },
  fullDate: {
    color: CARD.fullDateColor,
    fontSize: CARD.fullDateFontSize,
    fontWeight: 'bold',
  },
});
