import React from 'react';
import { BaseCard, BaseCardProps } from './BaseCard';
import { CardDetailRows } from './CardDetailRows';
import type { CardDetailRow } from './CardDetailRows';
import { formatEducationDetailsSentence } from '../../lib/educationUtils';

const ACCENT_COLOR = '#c084fc';
const ICON_BG_COLOR = 'rgba(192, 132, 252, 0.15)';

export interface EducationCardProps {
  item: BaseCardProps['item'];
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
}

export const EducationCard = ({
  item,
  onPress,
  onLinkPress,
  isHighlighted,
}: EducationCardProps) => {
  const metadata = item.metadata || {};
  const studentName = metadata.studentName || 'Student';
  
  // Format details into a condensed sentence
  const detailsSentence = formatEducationDetailsSentence(metadata);
  
  const rows: CardDetailRow[] = [
    { icon: 'calendar', text: detailsSentence, accent: true, numberOfLines: 2 },
  ];

  const detailContent = <CardDetailRows rows={rows} accentColor={ACCENT_COLOR} />;

  return (
    <BaseCard
      item={item}
      onPress={onPress}
      onLinkPress={onLinkPress}
      isHighlighted={isHighlighted}
      accentColor={ACCENT_COLOR}
      iconName="book-open"
      iconBgColor={ICON_BG_COLOR}
      detailContent={detailContent}
      subtitleOverride={studentName}
      isAnimatedHighlight
    />
  );
};
