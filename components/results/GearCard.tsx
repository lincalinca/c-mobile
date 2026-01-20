import { BaseCard, BaseCardProps } from './BaseCard';

export const GearCard = (props: Omit<BaseCardProps, 'accentColor' | 'iconName' | 'iconBgColor'>) => (
  <BaseCard 
    {...props} 
    accentColor="#f5c518" 
    iconName="package" 
    iconBgColor="rgba(245, 197, 24, 0.15)"
  />
);
