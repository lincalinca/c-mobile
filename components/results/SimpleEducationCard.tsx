import React from 'react';
import { SimpleCard } from './SimpleCard';
import { CardDetailRows } from './CardDetailRows';
import type { CardDetailRow } from './CardDetailRows';
import type { ResultItem } from '../../lib/results';
import { formatEducationDetailsSentence } from '../../lib/educationUtils';

const ACCENT_COLOR = '#c084fc';
const ICON_BG_COLOR = 'rgba(192, 132, 252, 0.15)';

export interface SimpleEducationCardProps {
  item: ResultItem;
  onPress: () => void;
}

export const SimpleEducationCard = ({
  item,
  onPress,
}: SimpleEducationCardProps) => {
  const metadata = item.metadata || {};
  const studentName = metadata.studentName || 'Student';
  
  // Format details into a condensed sentence
  const detailsSentence = formatEducationDetailsSentence(metadata);
  
  const rows: CardDetailRow[] = [
    { icon: 'calendar', text: detailsSentence, accent: true, numberOfLines: 2 },
  ];

  const detailContent = <CardDetailRows rows={rows} accentColor={ACCENT_COLOR} />;

  return (
    <SimpleCard
      item={item}
      onPress={onPress}
      accentColor={ACCENT_COLOR}
      iconName="book-open"
      iconBgColor={ICON_BG_COLOR}
      detailContent={detailContent}
      subtitleOverride={studentName}
    />
  );
};
