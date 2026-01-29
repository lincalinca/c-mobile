import React from 'react';
import { SimpleCard } from './SimpleCard';
import { CardDetailRows } from './CardDetailRows';
import type { CardDetailRow } from './CardDetailRows';
import type { ResultItem } from '@lib/results';

const ACCENT_COLOR = '#f97316';
const ICON_BG_COLOR = 'rgba(249, 115, 22, 0.15)';

export interface SimpleServiceCardProps {
  item: ResultItem;
  onPress: () => void;
}

export const SimpleServiceCard = ({
  item,
  onPress,
}: SimpleServiceCardProps) => {
  const metadata = item.metadata || {};
  const serviceType = metadata.serviceType || metadata.type || 'Service';
  const technician = metadata.technician || metadata.provider || '';
  const warranty = metadata.warranty || '';
  const notes = metadata.notes || '';

  const rows: CardDetailRow[] = [];
  if (technician) rows.push({ icon: 'user', text: technician, accent: true });
  if (warranty) rows.push({ icon: 'shield', text: warranty });
  if (notes) rows.push({ icon: 'info', text: notes, numberOfLines: 2 });

  const detailContent = rows.length > 0 ? <CardDetailRows rows={rows} accentColor={ACCENT_COLOR} /> : undefined;

  return (
    <SimpleCard
      item={item}
      onPress={onPress}
      accentColor={ACCENT_COLOR}
      iconName="tool"
      iconBgColor={ICON_BG_COLOR}
      detailContent={detailContent}
      subtitleOverride={serviceType}
    />
  );
};
