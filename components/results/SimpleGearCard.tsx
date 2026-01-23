import { SimpleCard, SimpleCardProps } from './SimpleCard';

export const SimpleGearCard = (props: Omit<SimpleCardProps, 'accentColor' | 'iconName' | 'iconBgColor'>) => (
  <SimpleCard
    {...props}
    accentColor="#f5c518"
    iconName="package"
    iconBgColor="rgba(245, 197, 24, 0.15)"
  />
);
