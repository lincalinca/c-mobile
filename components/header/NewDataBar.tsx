import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { hasUsedBaseScans } from '@lib/usageTracking';

interface NewDataBarProps {
  /** @deprecated Use startDate/endDate. Kept for backward compat. */
  selectedDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  onShowDatePicker?: () => void;
  onClearDate?: () => void;
}

function formatDayMonth(d: Date) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export const NewDataBar = ({
  selectedDate,
  startDate: startProp,
  endDate: endProp,
  onShowDatePicker,
  onClearDate,
}: NewDataBarProps) => {
  const router = useRouter();
  const [showGetMoreScans, setShowGetMoreScans] = useState(false);
  const [showAddReceiptMenu, setShowAddReceiptMenu] = useState(false);
  
  // Support legacy selectedDate or new start/end range
  const startDate = startProp ?? (selectedDate ?? null);
  const endDate = endProp ?? null;

  // Check if user has used all base scans
  useEffect(() => {
    const checkScans = async () => {
      const usedAll = await hasUsedBaseScans();
      setShowGetMoreScans(usedAll);
    };
    checkScans();
  }, []);

  const hasRange = startDate != null || endDate != null;
  const currentYear = new Date().getFullYear();
  const startYear = startDate?.getFullYear();
  const endYear = endDate?.getFullYear();
  const isSingleDate =
    !!startDate &&
    !!endDate &&
    formatDayMonth(startDate) === formatDayMonth(endDate);
  const shouldShowYears =
    !!startDate &&
    !!endDate &&
    (startYear !== currentYear || endYear !== currentYear);
  const shouldShowYearLine = shouldShowYears && startYear != null && endYear != null;

  const renderRangeLabel = () => {
    if (!startDate && !endDate) return null;
    if (isSingleDate) {
      return (
        <Text
          className="text-crescender-200 text-sm uppercase tracking-widest"
          numberOfLines={1}
        >
          {formatDayMonth(startDate!)}
        </Text>
      );
    }

    const startLabel = startDate ? formatDayMonth(startDate) : '…';
    const endLabel = endDate ? formatDayMonth(endDate) : '…';

    return (
      <View className="flex-row items-center justify-center gap-1">
        <Text
          className="text-crescender-200 text-sm uppercase tracking-widest"
          numberOfLines={1}
        >
          {startLabel}
        </Text>
        <Text
          className="text-crescender-200 text-sm uppercase tracking-widest"
          numberOfLines={1}
          style={{ lineHeight: 16 }}
        >
          –
        </Text>
        <Text
          className="text-crescender-200 text-sm uppercase tracking-widest"
          numberOfLines={1}
        >
          {endLabel}
        </Text>
      </View>
    );
  };
  const rangeLabelElement = renderRangeLabel();

  const handleAddReceiptPress = () => {
    if (showGetMoreScans) {
      router.push('/get-more-scans');
    } else {
      setShowAddReceiptMenu(true);
    }
  };

  const handleScanPress = () => {
    setShowAddReceiptMenu(false);
    router.push('/scan');
  };

  const handleUploadPress = () => {
    setShowAddReceiptMenu(false);
    router.push('/scan');
  };

  return (
    <View className="px-6 py-2 flex-row items-center gap-3">
      <TouchableOpacity
        onPress={handleAddReceiptPress}
        className={`flex-1 h-14 rounded-[18px] flex-row items-center justify-center gap-3 shadow-lg ${
          showGetMoreScans
            ? 'bg-crescender-800 border-2 border-gold/40'
            : 'bg-gold shadow-gold/20'
        }`}
      >
        <Feather 
          name={showGetMoreScans ? 'gift' : 'plus'} 
          size={24} 
          color={showGetMoreScans ? '#f5c518' : '#2e1065'} 
        />
        <Text 
          className={`font-bold text-xl ${
            showGetMoreScans ? 'text-gold' : 'text-crescender-950'
          }`} 
          style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}
        >
          {showGetMoreScans ? 'GET MORE SCANS' : 'ADD RECEIPT'}
        </Text>
      </TouchableOpacity>

      {/* Add Receipt Context Menu */}
      <Modal
        visible={showAddReceiptMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddReceiptMenu(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowAddReceiptMenu(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-crescender-900 rounded-[18px] p-4 border border-crescender-700 w-full max-w-sm"
          >
            <Text className="text-white text-lg font-bold mb-4 text-center">Add Receipt</Text>
            
            <TouchableOpacity
              onPress={handleScanPress}
              className="flex-row items-center gap-3 p-4 rounded-[14px] bg-crescender-800/50 border border-crescender-700 mb-3"
            >
              <View className="w-10 h-10 rounded-full bg-gold/20 items-center justify-center">
                <Feather name="camera" size={20} color="#f5c518" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Scan</Text>
                <Text className="text-crescender-400 text-sm">Take a photo of your receipt</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUploadPress}
              className="flex-row items-center gap-3 p-4 rounded-[14px] bg-crescender-800/50 border border-crescender-700"
            >
              <View className="w-10 h-10 rounded-full bg-gold/20 items-center justify-center">
                <Feather name="upload" size={20} color="#f5c518" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">Upload</Text>
                <Text className="text-crescender-400 text-sm">Select from your gallery</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
            {/* Separator */}
            <View className="h-[1px] bg-crescender-800 w-full mb-3" />

            <TouchableOpacity
              onPress={() => {
                setShowAddReceiptMenu(false);
                router.push('/manual-entry' as any);
              }}
              className="flex-row items-center gap-3 p-4 rounded-[14px]"
            >
              <View className="w-10 h-10 rounded-full bg-crescender-800 items-center justify-center">
                <Feather name="edit-3" size={20} color="#9ca3af" />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-300 text-base font-semibold">Don't have a receipt?</Text>
                <Text className="text-crescender-500 text-sm">Add item details manually</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#6b7280" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Button */}
      {onShowDatePicker && (
        <TouchableOpacity
          onPress={onShowDatePicker}
          className="h-14 bg-crescender-800/40 px-4 rounded-[18px] border border-crescender-700/50 flex-row items-center justify-center gap-2"
        >
          <Feather name="calendar" size={18} color="#f5c518" />
          {rangeLabelElement && (
            <View className="items-center justify-center gap-[2px]">
              {rangeLabelElement}
              {shouldShowYearLine && (
                <View className="flex-row items-center justify-between self-stretch">
                  <Text
                    className="text-crescender-400 text-[10px] uppercase tracking-widest"
                    numberOfLines={1}
                  >
                    {startYear}
                  </Text>
                  <Text
                    className="text-crescender-400 text-[10px] uppercase tracking-widest"
                    numberOfLines={1}
                  >
                    {endYear}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Clear Date Button */}
      {hasRange && onClearDate && (
        <TouchableOpacity onPress={onClearDate} className="p-2">
          <Feather name="x" size={20} color="#f5c518" />
        </TouchableOpacity>
      )}
    </View>
  );
};
