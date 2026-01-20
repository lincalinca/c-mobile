import { BaseCard, BaseCardProps } from './BaseCard';

export const TransactionCard = (props: Omit<BaseCardProps, 'accentColor' | 'iconName' | 'iconBgColor'>) => (
  <BaseCard 
    {...props} 
    accentColor="#a3e635" 
    iconName="dollar-sign" 
    iconBgColor="rgba(163, 230, 53, 0.15)"
  />
);
