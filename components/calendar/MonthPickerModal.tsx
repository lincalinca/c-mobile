import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';

const MONTHS: [string, string][] = [
  ['Jan', 'Jul'],
  ['Feb', 'Aug'],
  ['Mar', 'Sep'],
  ['Apr', 'Oct'],
  ['May', 'Nov'],
  ['Jun', 'Dec'],
];

interface MonthPickerModalProps {
  visible: boolean;
  onRequestClose: () => void;
  /** Currently displayed year. Used to highlight and scroll into view. */
  year: number;
  /** Currently displayed month (1–12). */
  month: number;
  onSelect: (year: number, month: number) => void;
}

const YEAR_START = 2010;
const YEAR_END = 2035;
const ROW_HEIGHT = 36;
const YEAR_BLOCK_HEIGHT = 2 * ROW_HEIGHT + 4; // 2 rows + margin

export function MonthPickerModal({
  visible,
  onRequestClose,
  year,
  month,
  onSelect,
}: MonthPickerModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const yearIndex = Math.max(0, year - YEAR_START);

  useEffect(() => {
    if (visible && scrollRef.current) {
      const y = Math.max(0, yearIndex * YEAR_BLOCK_HEIGHT - YEAR_BLOCK_HEIGHT);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y, animated: false });
      });
    }
  }, [visible, yearIndex]);

  const handleSelect = (y: number, m: number) => {
    onSelect(y, m);
    onRequestClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdropPress]} onPress={onRequestClose} />
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text
            className="text-gold text-base font-bold mb-3"
            style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : undefined }}
          >
            Pick a month
          </Text>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => {
              const y = YEAR_START + i;
              const isCurrentYear = y === year;
              return (
                <View key={y} style={styles.yearBlock}>
                  <View style={[styles.yearCell, isCurrentYear && styles.yearCellActive]}>
                    <Text
                      style={[styles.yearText, isCurrentYear && styles.yearTextActive]}
                      numberOfLines={1}
                    >
                      {y}
                    </Text>
                  </View>
                  <View style={styles.monthsGrid}>
                    {MONTHS.map(([top, bottom], col) => (
                      <View key={col} style={styles.monthColumn}>
                        <TouchableOpacity
                          style={[
                            styles.monthCell,
                            isCurrentYear && month === col + 1 && styles.monthCellActive,
                          ]}
                          onPress={() => handleSelect(y, col + 1)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthText,
                              isCurrentYear && month === col + 1 && styles.monthTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {top}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.monthCell,
                            isCurrentYear && month === col + 7 && styles.monthCellActive,
                          ]}
                          onPress={() => handleSelect(y, col + 7)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthText,
                              isCurrentYear && month === col + 7 && styles.monthTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {bottom}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            onPress={onRequestClose}
            className="mt-3 py-2 rounded-xl bg-crescender-800 border border-crescender-600"
          >
            <Text className="text-crescender-200 font-semibold text-center text-sm">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropPress: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    backgroundColor: 'rgba(24,9,48,0.98)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: 440,
    borderWidth: 1,
    borderColor: 'rgba(126,34,206,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  scroll: {
    maxHeight: 320,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  yearBlock: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'rgba(126,34,206,0.05)',
    borderRadius: 10,
    paddingRight: 4,
  },
  yearCell: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(126,34,206,0.2)',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    marginRight: 10,
  },
  yearCellActive: {
    backgroundColor: 'rgba(245,197,24,0.25)',
    borderRightWidth: 2,
    borderColor: '#f5c518',
  },
  yearText: {
    color: '#c4b5fd',
    fontSize: 18,
    fontWeight: '700',
    transform: [{ rotate: '-90deg' }],
    width: 80,
    textAlign: 'center',
  },
  yearTextActive: {
    color: '#f5c518',
  },
  monthsGrid: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 4,
  },
  monthColumn: {
    flex: 1,
  },
  monthCell: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  monthCellActive: {
    backgroundColor: 'rgba(245,197,24,0.3)',
  },
  monthText: {
    color: '#e9d5ff',
    fontSize: 20,  // was 13 → now 20 (+54%)
  },
  monthTextActive: {
    color: '#f5c518',
    fontWeight: '600',
  },
});
