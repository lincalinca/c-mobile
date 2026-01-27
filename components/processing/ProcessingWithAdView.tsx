import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';

interface ProcessingWithAdViewProps {
  onReview: () => void;
  resultsReady: boolean;
}

export const ProcessingWithAdView = ({ onReview, resultsReady }: ProcessingWithAdViewProps) => {
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

  const createRingStyle = (progress: SharedValue<number>) => {
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
    <View className="flex-1 bg-crescender-950 justify-center items-center px-6">
      <View className="w-64 h-64 justify-center items-center mb-8 relative" style={{ overflow: 'visible' }}>
        {/* Card background */}
        <View className="w-64 h-64 bg-crescender-900/40 rounded-[26px] border border-gold/20 justify-center items-center shadow-xl shadow-gold/10">
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
      
      <Text className="text-white text-3xl font-bold mb-2 tracking-widest text-center" style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
        Analysing Your Receipt
      </Text>
      <Text className="text-crescender-400 text-center text-base leading-relaxed mb-8">
        Crescender's custom AI is searching your receipt to find gear, events, services, and any lesson details, as well as merchant or provider details. This usually takes less than 20 seconds.
      </Text>
      
      <View className="flex-row gap-2 mb-8 items-center">
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-60 animate-pulse" />
        <View className="w-1.5 h-1.5 bg-gold rounded-full opacity-40 animate-pulse" />
      </View>

      {/* Review Button - visible but disabled until results are ready */}
      <TouchableOpacity
        onPress={onReview}
        disabled={!resultsReady}
        className={`w-full max-w-sm h-14 rounded-[18px] flex-row items-center justify-center gap-3 shadow-lg ${
          resultsReady 
            ? 'bg-gold shadow-gold/20' 
            : 'bg-crescender-800/50 border border-crescender-700'
        }`}
        style={{ opacity: resultsReady ? 1 : 0.5 }}
      >
        <Feather 
          name={resultsReady ? "check-circle" : "loader"} 
          size={24} 
          color={resultsReady ? "#2e1065" : "#9ca3af"} 
        />
        <Text
          className={`font-bold text-xl ${
            resultsReady ? 'text-crescender-950' : 'text-crescender-400'
          }`}
          style={{ fontFamily: Platform.OS === 'web' ? 'Bebas Neue, system-ui' : 'System' }}
        >
          {resultsReady ? 'REVIEW RESULTS' : 'PROCESSING...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
