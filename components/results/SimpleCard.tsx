import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ResultItem } from '@lib/results';
import { CARD } from './cardStyles';

export interface SimpleCardProps {
  item: ResultItem;
  onPress: () => void;
  accentColor: string;
  iconName: any;
  iconBgColor: string;
  /** Rendered between header and main value. When set, contentArea uses space-between and shows [detailContent, mainValue]. */
  detailContent?: React.ReactNode;
  /** Used instead of item.subtitle (e.g. Education: studentName; Service: serviceType). */
  subtitleOverride?: string;
}

/**
 * Simplified version of BaseCard for use in detail pages.
 * Does NOT show:
 * - Footer with date and link chips
 * - Highlight animations
 *
 * Shows:
 * - Corner icon
 * - Title and subtitle
 * - Detail content (optional)
 * - Main value (amount or duration)
 */
export const SimpleCard = ({
  item,
  onPress,
  accentColor,
  iconName,
  iconBgColor,
  detailContent,
  subtitleOverride,
}: SimpleCardProps) => {
  const subtitle = subtitleOverride ?? item.subtitle ?? '';

  const mainValueNode =
    item.type === 'event' ? (
      <Text style={[styles.mainValue, { color: accentColor }]}>
        {item.metadata?.duration || '60m'}
      </Text>
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <View style={styles.card}>
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
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: CARD.cardMargin,
  },
  card: {
    minHeight: CARD.cardMinHeight - 40, // Shorter since no footer
    backgroundColor: 'rgba(30, 10, 60, 0.4)',
    padding: CARD.cardPadding,
    borderRadius: CARD.cardBorderRadius,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
});
