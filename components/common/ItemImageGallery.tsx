import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, Alert, Platform, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ItemImage } from '@lib/repository';
import { DatePickerModal } from '../calendar/DatePickerModal';

const FS = FileSystem as any;
const ASSETS_DIR = FS.documentDirectory + 'assets/';

interface ItemImageGalleryProps {
  images: ItemImage[];
  onImagesChange: (newImages: ItemImage[]) => void;
  category: 'gear' | 'service';
  onShareImage?: (imageUri: string) => void;
  onShareItem?: () => void;
}

export const ItemImageGallery: React.FC<ItemImageGalleryProps> = ({ images, onImagesChange, category, onShareImage, onShareItem }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showExifModal, setShowExifModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ItemImage | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const gearTags = ['Manufacturer image', 'Performance Image', 'Still image', 'Serial Number', 'Damage/Condition', 'Action Shot'];
  const serviceTags = ['Before', 'Work in Progress', 'After', 'In-situ', 'Issue Found'];
  const tags = category === 'gear' ? gearTags : serviceTags;

  const handleAddImage = async (useCamera: boolean) => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 images.');
      return;
    }

    const { status } = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', `We need ${useCamera ? 'camera' : 'gallery'} permissions to add images.`);
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ exif: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ exif: true, quality: 0.8 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Ensure assets directory exists
      const dirInfo = await FS.getInfoAsync(ASSETS_DIR);
      if (!dirInfo.exists) {
        await FS.makeDirectoryAsync(ASSETS_DIR, { intermediates: true });
      }

      const filename = `item_image_${Date.now()}.jpg`;
      const localUri = ASSETS_DIR + filename;
      
      await FS.copyAsync({ from: asset.uri, to: localUri });

      const newImage: ItemImage = {
        uri: localUri,
        tag: tags[0], // Default tag
        exif: asset.exif,
        date: new Date().toISOString().split('T')[0],
      };

      const wasFirstImage = images.length === 0;
      onImagesChange([...images, newImage]);
      
      // Show toast after first image is loaded
      if (wasFirstImage) {
        setShowToast(true);
        Animated.sequence([
          Animated.timing(toastOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.delay(3000),
          Animated.timing(toastOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start(() => setShowToast(false));
      }
    }
  };

  const handleDeleteImage = (index: number) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          const newImages = [...images];
          newImages.splice(index, 1);
          onImagesChange(newImages);
        }
      }
    ]);
  };

  const handleUpdateImage = () => {
    if (editingImage && editingIndex !== null) {
      const newImages = [...images];
      newImages[editingIndex] = editingImage;
      onImagesChange(newImages);
      setEditingImage(null);
      setEditingIndex(null);
    }
  };

  const openEditModal = (index: number) => {
    setEditingImage(images[index]);
    setEditingIndex(index);
  };

  const handleImagePress = (index: number) => {
    if (onShareImage) {
      Alert.alert('Image Options', 'What would you like to do?', [
        { text: 'Edit/Tag', onPress: () => openEditModal(index) },
        { text: 'Share Image', onPress: () => onShareImage(images[index].uri) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      openEditModal(index);
    }
  };

  return (
    <View>
      <View className="flex-row w-full bg-black h-48">
        {[0, 1, 2].map((index) => {
          const img = images[index];
          const isNextSlot = index === images.length;

          if (img) {
            return (
              <View 
                key={index} 
                className="flex-1 border-r border-crescender-800 relative"
              >
                <TouchableOpacity 
                  className="w-full h-full"
                  onPress={() => handleImagePress(index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img.uri }} className="w-full h-full" resizeMode="cover" />
                </TouchableOpacity>
                <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded pointer-events-none">
                  <Text className="text-white text-[10px] font-bold">{img.tag}</Text>
                </View>
                <TouchableOpacity 
                  className="absolute bottom-2 right-2 px-2 py-1 rounded-full justify-center items-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setShowExifModal(true);
                  }}
                >
                  <Text className="text-white text-[10px] font-bold">EXIF</Text>
                </TouchableOpacity>
              </View>
            );
          }

          if (isNextSlot) {
            return (
              <TouchableOpacity 
                key={index}
                className="flex-1 justify-center items-center bg-crescender-900 border-r border-crescender-800"
                onPress={() => {
                  Alert.alert('Add Image', 'How would you like to add an image?', [
                    { text: 'Camera', onPress: () => handleAddImage(true) },
                    { text: 'Gallery', onPress: () => handleAddImage(false) },
                    { text: 'Cancel', style: 'cancel' }
                  ]);
                }}
              >
                <Feather name="plus" size={32} color="#f5c518" />
                <Text className="text-gold text-[10px] mt-1 font-bold">ADD {index + 1}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <View key={index} className="flex-1 bg-crescender-950/50 border-r border-crescender-800 justify-center items-center">
              <Feather name="image" size={24} color="#222" />
            </View>
          );
        })}
      </View>

      {/* Editing Modal */}
      <Modal visible={editingImage !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-crescender-950 rounded-t-3xl p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Edit Image Details</Text>
              <TouchableOpacity onPress={() => setEditingImage(null)}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {editingImage && (
              <ScrollView>
                <View className="mb-6">
                  <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-xs">Tag</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {tags.map(tag => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => setEditingImage({ ...editingImage, tag })}
                        className={`px-4 py-2 rounded-full border ${editingImage.tag === tag ? 'bg-gold border-gold' : 'bg-crescender-900 border-crescender-700'}`}
                      >
                        <Text className={`font-bold ${editingImage.tag === tag ? 'text-crescender-950' : 'text-crescender-400'}`}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-xs">Date</Text>
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    className="bg-crescender-900 p-4 rounded-xl border border-crescender-700 flex-row justify-between items-center"
                  >
                    <Text className="text-white">{editingImage.date || 'No date set'}</Text>
                    <Feather name="calendar" size={18} color="#f5c518" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-4">
                  <TouchableOpacity 
                    onPress={() => editingIndex !== null && handleDeleteImage(editingIndex)}
                    className="flex-1 bg-red-600/20 border border-red-600 p-4 rounded-xl justify-center items-center"
                  >
                    <Text className="text-red-400 font-bold">Delete Image</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleUpdateImage}
                    className="flex-1 bg-gold p-4 rounded-xl justify-center items-center"
                  >
                    <Text className="text-crescender-950 font-bold">Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        <DatePickerModal
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
          onDateSelect={(date) => {
            if (editingImage) setEditingImage({ ...editingImage, date });
            setShowDatePicker(false);
          }}
          selectedDate={editingImage?.date || new Date().toISOString().split('T')[0]}
        />
      </Modal>

      {/* EXIF Modal */}
      <Modal visible={showExifModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-crescender-900 w-full rounded-2xl p-6 border border-crescender-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">EXIF Data</Text>
              <TouchableOpacity onPress={() => setShowExifModal(false)}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-96">
              {selectedImageIndex !== null && images[selectedImageIndex]?.exif ? (
                Object.entries(images[selectedImageIndex].exif).map(([key, value], i) => (
                  <View key={i} className="flex-row justify-between py-2 border-b border-crescender-800">
                    <Text className="text-crescender-400 text-xs flex-1">{key}</Text>
                    <Text className="text-white text-xs flex-1 text-right">{String(value)}</Text>
                  </View>
                ))
              ) : (
                <Text className="text-crescender-500 text-center py-8">No EXIF data available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast Message */}
      {showToast && (
        <View className="absolute bottom-20 left-0 right-0 items-center pointer-events-none">
          <Animated.View
            className="bg-crescender-900 px-4 py-3 rounded-xl border border-crescender-700"
            style={{ 
              opacity: toastOpacity, 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 4.65, 
              elevation: 8 
            }}
          >
            <Text className="text-white text-sm font-medium text-center">
              Press the image to re-tag or edit
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
};
