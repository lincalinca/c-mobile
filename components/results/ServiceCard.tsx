import React from 'react';
import { BaseCard, BaseCardProps } from './BaseCard';
import { CardDetailRows } from './CardDetailRows';
import type { CardDetailRow } from './CardDetailRows';
import { getRelativeDateLabel } from '@lib/dateUtils';

const ACCENT_COLOR = '#f97316';
const ICON_BG_COLOR = 'rgba(249, 115, 22, 0.15)';

export interface ServiceCardProps {
  item: BaseCardProps['item'];
  onPress: () => void;
  onLinkPress?: (targetId: string, targetType: string) => void;
  isHighlighted?: boolean;
}

export const ServiceCard = ({
  item,
  onPress,
  onLinkPress,
  isHighlighted,
}: ServiceCardProps) => {
  const metadata = item.metadata || {};
  const serviceType = metadata.serviceType || metadata.type || 'Service';
  const technician = metadata.technician || metadata.provider || '';
  const warranty = metadata.warranty || '';
  const notes = metadata.notes || '';

  const rows: CardDetailRow[] = [];
  if (technician) rows.push({ icon: 'user', text: technician, accent: true });
  if (warranty) rows.push({ icon: 'shield', text: warranty });
  if (notes) rows.push({ icon: 'info', text: notes, numberOfLines: 2 });
  if (rows.length === 0) {
    rows.push({
      icon: 'clock',
      text: getRelativeDateLabel(item.date),
      accent: true,
    });
  }

  const detailContent = <CardDetailRows rows={rows} accentColor={ACCENT_COLOR} />;

  return (
    <BaseCard
      item={item}
      onPress={onPress}
      onLinkPress={onLinkPress}
      isHighlighted={isHighlighted}
      accentColor={ACCENT_COLOR}
      iconName="tool"
      iconBgColor={ICON_BG_COLOR}
      detailContent={detailContent}
      subtitleOverride={serviceType}
    />
  );
};
