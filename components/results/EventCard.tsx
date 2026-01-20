import { BaseCard, BaseCardProps } from './BaseCard';

export const EventCard = (props: Omit<BaseCardProps, 'accentColor' | 'iconName' | 'iconBgColor'>) => (
  <BaseCard 
    {...props} 
    accentColor="#22d3ee" 
    iconName="calendar" 
    iconBgColor="rgba(34, 211, 238, 0.15)"
  />
);
