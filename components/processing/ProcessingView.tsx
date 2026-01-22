import { View, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

export const ProcessingView = () => {
  const ring1Progress = useSharedValue(0);
  const ring2Progress = useSharedValue(0);
  const ring3Progress = useSharedValue(0);

  useEffect(() => {
    // Create a staggered ring animation effect
    ring1Progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    
    ring2Progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    
    ring3Progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const createRingStyle = (progress: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => {
      const scale = interpolate(
        progress.value,
        [0, 1],
        [0.8, 1.2],
        Extrapolate.CLAMP
      );
      const opacity = interpolate(
        progress.value,
        [0, 0.5, 1],
        [0, 0.6, 0],
        Extrapolate.CLAMP
      );
      
      return {
        transform: [{ scale }],
        opacity,
      };
    });
  };

  const ring1Style = createRingStyle(ring1Progress);
  const ring2Style = createRingStyle(ring2Progress);
  const ring3Style = createRingStyle(ring3Progress);

  return (
    <View className="flex-1 bg-transparent justify-center items-center px-6">
      <View className="w-64 h-64 justify-center items-center mb-8 relative" style={{ overflow: 'visible' }}>
        {/* Card background */}
        <View className="w-64 h-64 bg-crescender-900/40 rounded-3xl border border-gold/20 justify-center items-center shadow-xl shadow-gold/10">
          {/* Lightning icon in centre */}
          <Feather name="zap" size={48} color="#f5c518" />
        </View>
        
        {/* Animated pulsing rings around the icon - positioned outside the card */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#f5c518',
              top: '50%',
              left: '50%',
              marginLeft: -40,
              marginTop: -40,
            },
            ring1Style
          ]}
        />
        <Animated.View 
          style={[
            {
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#f5c518',
              top: '50%',
              left: '50%',
              marginLeft: -40,
              marginTop: -40,
            },
            ring2Style
          ]}
        />
        <Animated.View 
          style={[
            {
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: '#f5c518',
              top: '50%',
              left: '50%',
              marginLeft: -40,
              marginTop: -40,
            },
            ring3Style
          ]}
        />
      </View>
      
      <Text className="text-white text-2xl font-bold mb-2 tracking-widest text-center" style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
        ANALYSING RECEIPT
      </Text>
      <Text className="text-crescender-400 text-center text-sm leading-relaxed">
        Our AI is extracting your gear, events, and transactions. This usually takes 5–10 seconds.
      </Text>
      
      <View className="flex-row gap-2 mt-12 items-center">
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-60 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
      </View>
    </View>
  );
};
