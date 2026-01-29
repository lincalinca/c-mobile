import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MusicFlowBackground } from '@components/common/MusicFlowBackground';

/**
 * AppLaunchPreview Component
 * 
 * Preview component showing the app launch/splash screen design.
 * Used in the mock UI to showcase the branding and launch experience.
 * 
 * This component displays:
 * - Crescender logo/text
 * - Animated music flow background
 * - Brand colors and styling
 */
export default function AppLaunchPreview() {
  return (
    <View className="relative overflow-hidden rounded-2xl border border-crescender-700" style={{ height: 400 }}>
      {/* Background Animation */}
      <View style={StyleSheet.absoluteFill}>
        <MusicFlowBackground />
      </View>
      
      {/* Content Overlay */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo/Title */}
        <View className="items-center mb-8">
          {(Platform.OS as any) === 'web' ? (
            <Image 
              source={{ uri: '/crescender-logo.svg' }}
              style={{ width: 234, height: 38 }} 
              resizeMode="contain"
            />
          ) : (
            <Text 
              className="text-gold text-5xl font-bold tracking-tight" 
              style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}
            >
              CRESCENDER
            </Text>
          )}
        </View>
        
        {/* Tagline */}
        <Text className="text-crescender-300 text-center text-sm font-semibold tracking-wide">
          Track Your Musical Journey
        </Text>
      </View>
      
      {/* Preview Label */}
      <View className="absolute top-4 left-4 bg-crescender-900/80 px-3 py-1.5 rounded-full border border-crescender-700">
        <Text className="text-gold text-[10px] font-bold uppercase tracking-widest">
          Launch Preview
        </Text>
      </View>
    </View>
  );
}
