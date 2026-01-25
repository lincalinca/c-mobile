import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CARD } from './cardStyles';

export interface CardDetailRow {
  icon: string;
  text: string;
  accent?: boolean;
  numberOfLines?: number;
}

export interface CardDetailRowsProps {
  rows: CardDetailRow[];
  accentColor: string;
}

export function CardDetailRows({ rows, accentColor }: CardDetailRowsProps) {
  if (rows.length === 0) return null;
  return (
    <View style={styles.container}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          <Feather
            name={r.icon as any}
            size={CARD.infoIconSize}
            color={r.accent ? accentColor : '#9ca3af'}
          />
          <Text
            style={[styles.text, r.accent && { color: accentColor }]}
            numberOfLines={r.numberOfLines ?? 1}
          >
            {r.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: CARD.infoRowGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD.infoRowGap,
  },
  text: {
    color: CARD.relativeDateColor,
    fontSize: CARD.infoTextFontSize,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
});
