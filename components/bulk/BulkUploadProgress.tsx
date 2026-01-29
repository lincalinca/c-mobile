/**
 * Bulk Upload Progress Component
 *
 * Google Drive-style collapsible progress modal that shows:
 * - Collapsed: Progress bar pill at bottom with summary
 * - Expanded: Full list with individual progress and status
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUploadStore, UploadItem } from '@lib/stores/uploadStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 64;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6;

export function BulkUploadProgress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    items,
    isExpanded,
    isVisible,
    setExpanded,
    dismiss,
    clearCompleted,
    removeItem,
    getStats,
  } = useUploadStore();

  const stats = getStats();
  const animatedHeight = React.useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;

  React.useEffect(() => {
    Animated.spring(animatedHeight, {
      toValue: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
  }, [isExpanded, animatedHeight]);

  if (!isVisible || items.length === 0) {
    return null;
  }

  const handleItemPress = (item: UploadItem) => {
    if (item.status === 'ready_for_review' && item.aiResponseData) {
      router.push({
        pathname: '/review' as any,
        params: {
          data: JSON.stringify(item.aiResponseData),
          uri: item.imageUri,
          queueItemId: item.queueItemId,
        },
      });
    }
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <View className="w-4 h-4 rounded-full bg-crescender-600" />;
      case 'uploading':
      case 'processing':
        return <ActivityIndicator size="small" color="#f5c518" />;
      case 'ready_for_review':
        return <Feather name="check-circle" size={16} color="#22c55e" />;
      case 'error':
        return <Feather name="alert-circle" size={16} color="#ef4444" />;
    }
  };

  const getStatusText = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Analysing...';
      case 'ready_for_review':
        return 'Ready for review';
      case 'error':
        return 'Failed';
    }
  };

  const renderItem = ({ item }: { item: UploadItem }) => {
    const isReady = item.status === 'ready_for_review';
    const isError = item.status === 'error';

    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        disabled={!isReady}
        className={`flex-row items-center p-3 mb-2 rounded-xl ${
          isReady ? 'bg-crescender-800/60' : 'bg-crescender-900/40'
        }`}
      >
        {/* Thumbnail */}
        <View className="w-12 h-12 bg-black/40 rounded-lg overflow-hidden mr-3">
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} className="w-full h-full" resizeMode="cover" />
          )}
        </View>

        {/* Info */}
        <View className="flex-1 mr-2">
          <Text className={`font-medium ${isReady ? 'text-white' : 'text-crescender-300'}`} numberOfLines={1}>
            {item.merchantName || 'Processing...'}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            {getStatusIcon(item.status)}
            <Text className={`text-xs ${isError ? 'text-red-400' : 'text-crescender-400'}`}>
              {isError ? item.errorMessage : getStatusText(item.status)}
            </Text>
          </View>
          {/* Progress bar for uploading/processing */}
          {(item.status === 'uploading' || item.status === 'processing') && (
            <View className="h-1 bg-crescender-800 rounded-full mt-2 overflow-hidden">
              <View
                className="h-full bg-gold rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </View>
          )}
        </View>

        {/* Amount or action */}
        <View className="items-end">
          {item.total ? (
            <Text className="text-gold font-bold">${(item.total / 100).toFixed(2)}</Text>
          ) : null}
          {isReady && <Feather name="chevron-right" size={16} color="#f5c518" />}
          {isError && (
            <TouchableOpacity onPress={() => removeItem(item.id)} className="p-1">
              <Feather name="x" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate overall progress
  const overallProgress = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
    : 0;

  return (
    <Animated.View
      className="absolute left-4 right-4 bg-crescender-900 rounded-2xl border border-crescender-700 overflow-hidden shadow-2xl"
      style={{
        bottom: insets.bottom + 80, // Above tab bar
        height: animatedHeight,
        maxHeight: EXPANDED_HEIGHT,
      }}
    >
      {/* Collapsed Header (always visible) */}
      <TouchableOpacity
        onPress={() => setExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-4 py-3 border-b border-crescender-800"
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-3 flex-1">
          {stats.processing > 0 ? (
            <ActivityIndicator size="small" color="#f5c518" />
          ) : stats.readyForReview > 0 ? (
            <View className="w-6 h-6 bg-green-500/20 rounded-full items-center justify-center">
              <Feather name="check" size={14} color="#22c55e" />
            </View>
          ) : (
            <View className="w-6 h-6 bg-crescender-700 rounded-full items-center justify-center">
              <Feather name="check" size={14} color="#9ca3af" />
            </View>
          )}

          <View className="flex-1">
            <Text className="text-white font-medium text-sm">
              {stats.processing > 0
                ? `Processing ${stats.processing} of ${stats.total}...`
                : stats.readyForReview > 0
                ? `${stats.readyForReview} ready for review`
                : `${stats.completed} completed`}
            </Text>

            {/* Mini progress bar in collapsed state */}
            {!isExpanded && stats.processing > 0 && (
              <View className="h-1 bg-crescender-700 rounded-full mt-1.5 overflow-hidden">
                <View
                  className="h-full bg-gold rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {stats.readyForReview > 0 && (
            <View className="bg-gold rounded-full min-w-5 h-5 px-1.5 items-center justify-center">
              <Text className="text-crescender-950 text-xs font-bold">{stats.readyForReview}</Text>
            </View>
          )}
          <Feather
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color="#9ca3af"
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="flex-1">
          {/* Action buttons */}
          <View className="flex-row justify-between px-4 py-2 border-b border-crescender-800">
            <TouchableOpacity
              onPress={clearCompleted}
              className="flex-row items-center gap-1"
              disabled={stats.completed === 0}
            >
              <Feather name="trash-2" size={14} color={stats.completed > 0 ? '#9ca3af' : '#4b5563'} />
              <Text className={`text-sm ${stats.completed > 0 ? 'text-crescender-400' : 'text-crescender-600'}`}>
                Clear completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={dismiss}
              className="flex-row items-center gap-1"
            >
              <Feather name="x" size={14} color="#9ca3af" />
              <Text className="text-crescender-400 text-sm">Dismiss</Text>
            </TouchableOpacity>
          </View>

          {/* Item list */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </Animated.View>
  );
}
