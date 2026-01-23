import React from 'react';
import { SimpleCard } from './SimpleCard';
import { CardDetailRows } from './CardDetailRows';
import type { CardDetailRow } from './CardDetailRows';
import type { ResultItem } from '../../lib/results';

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
  const frequency = metadata.frequency || 'One-off';
  const duration = metadata.duration || '60m';
  const daysOfWeek = metadata.daysOfWeek || [];
  const times = metadata.times || [];

  const scheduleText = (() => {
    if (daysOfWeek.length === 0 || times.length === 0) return frequency;
    const schedulePairs: string[] = [];
    for (let i = 0; i < Math.max(daysOfWeek.length, times.length); i++) {
      const day = daysOfWeek[i] || daysOfWeek[0];
      const time = times[i] || times[0];
      schedulePairs.push(`${time} ${day}`);
    }
    return schedulePairs.join(', ');
  })();

  const rows: CardDetailRow[] = [
    { icon: 'clock', text: duration, accent: true },
    { icon: 'repeat', text: scheduleText },
  ];
  if (metadata.startDate) {
    rows.push({
      icon: 'calendar',
      text: `Starts ${new Date(metadata.startDate).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      })}`,
    });
  }

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
