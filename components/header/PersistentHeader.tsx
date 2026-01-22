import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Image, Modal, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PersistentHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { label: 'HOME', icon: 'grid', path: '/' },
    { label: 'HISTORY', icon: 'clock', path: '/history' },
    { label: 'SETTINGS', icon: 'settings', path: '/settings' },
    { label: 'UI MOCKUP', icon: 'eye', path: '/mock' },
  ];

  const navigateTo = (path: string) => {
    setMenuVisible(false);
    if (pathname === path) return;
    router.push(path as any);
  };

  return (
    <>
      <View 
        style={{ 
          backgroundColor: '#2a0b4c',
          paddingTop: insets.top,
        }}
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          {/* Spacer to help center the logo */}
          <View className="w-10" />

          {/* Centered Logo — fills centre area between spacer and menu, aspectRatio preserves proportions */}
          <View className="flex-1 items-center justify-center min-w-0">
            {(Platform.OS as any) === 'web' ? (
              <Image
                source={{ uri: '/crescender-logo.svg' }}
                style={{ width: '100%', aspectRatio: 234 / 38 }}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require('../../assets/crescender-logo.png')}
                style={{ width: '100%', aspectRatio: 200 / 23 }}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Menu Button on the right */}
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)}
            className="w-10 h-10 items-center justify-center rounded-full bg-crescender-900/60"
          >
            <Feather name="menu" size={24} color="#f5c518" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/60" 
          onPress={() => setMenuVisible(false)}
        >
          <View 
            className="absolute top-16 right-6 bg-crescender-900 border border-crescender-700 rounded-2xl p-2 w-56 shadow-2xl"
            style={{ top: insets.top + 60 }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.path}
                onPress={() => navigateTo(item.path)}
                className={`flex-row items-center gap-3 p-4 rounded-xl ${pathname === item.path ? 'bg-gold/10' : ''} ${index < menuItems.length - 1 ? 'border-b border-crescender-800/50' : ''}`}
              >
                <Feather name={item.icon as any} size={20} color={pathname === item.path ? '#f5c518' : '#9ca3af'} />
                <Text className={`font-bold tracking-widest text-base ${pathname === item.path ? 'text-gold' : 'text-crescender-300'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
