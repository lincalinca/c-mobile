import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing,
  SharedValue
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Stave configuration constants at module scope
const STAVE_CONFIGS = [
  // Group 1
  { baseYPercent: 0.12, phase: 0, amplitude: 8, frequency: 0.6 },
  { baseYPercent: 0.16, phase: Math.PI / 4, amplitude: 6, frequency: 0.8 },
  { baseYPercent: 0.20, phase: Math.PI / 2, amplitude: 8, frequency: 0.7 },
  { baseYPercent: 0.24, phase: (3 * Math.PI) / 4, amplitude: 6, frequency: 0.75 },
  { baseYPercent: 0.28, phase: Math.PI, amplitude: 8, frequency: 0.65 },
  
  // Group 2
  { baseYPercent: 0.42, phase: Math.PI / 3, amplitude: 8, frequency: 0.62 },
  { baseYPercent: 0.46, phase: Math.PI / 2, amplitude: 6, frequency: 0.78 },
  { baseYPercent: 0.50, phase: (2 * Math.PI) / 3, amplitude: 8, frequency: 0.68 },
  { baseYPercent: 0.54, phase: (5 * Math.PI) / 6, amplitude: 6, frequency: 0.72 },
  { baseYPercent: 0.58, phase: Math.PI, amplitude: 8, frequency: 0.64 },
  
  // Group 3
  { baseYPercent: 0.72, phase: Math.PI / 6, amplitude: 8, frequency: 0.61 },
  { baseYPercent: 0.76, phase: Math.PI / 3, amplitude: 6, frequency: 0.76 },
  { baseYPercent: 0.80, phase: Math.PI / 2, amplitude: 8, frequency: 0.66 },
  { baseYPercent: 0.84, phase: (2 * Math.PI) / 3, amplitude: 6, frequency: 0.74 },
  { baseYPercent: 0.88, phase: (5 * Math.PI) / 6, amplitude: 8, frequency: 0.63 },
] as const;

interface StaveProps {
  baseYPercent: number;
  phase: number;
  amplitude: number;
  frequency: number;
  time: SharedValue<number>;
  widthSV: SharedValue<number>;
  heightSV: SharedValue<number>;
  color: string;
  strokeWidth?: number;
  opacity?: number;
}

const Stave = React.memo(({ baseYPercent, phase, amplitude, frequency, time, widthSV, heightSV, color, strokeWidth = 2, opacity = 1 }: StaveProps) => {
  // Explicitly capturing only the necessary primitives and shared value references
  // Adding explicit dependency array to prevent capturing extra scope
  // SharedValues (time, widthSV, heightSV) are auto-tracked in worklets
  // Only primitive values should be in the dependency array
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const progress = time.value;
    const width = widthSV.value;
    const height = heightSV.value;

    const baseY = height * baseYPercent;
    const yOffset = Math.sin(progress * frequency + phase) * amplitude;
    const y = baseY + yOffset;

    const step = width / 4;
    let pathString = `M 0,${y}`;

    for (let x = step; x <= width; x += step) {
      const controlY = y + Math.sin((progress * frequency + phase) + (x / step)) * (amplitude * 0.8);
      pathString += ` Q ${x - (step/2)},${controlY} ${x},${y}`;
    }

    return { d: pathString };
  }, [baseYPercent, phase, amplitude, frequency]);

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      opacity={opacity}
    />
  );
});

export const MusicFlowBackground = () => {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);
  const widthSV = useSharedValue(width);
  const heightSV = useSharedValue(height);

  useEffect(() => {
    widthSV.value = width;
    heightSV.value = height;
  }, [width, height, widthSV, heightSV]);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 15000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );
  }, [time]);

  const goldColor = '#5c4905ff';
  const purpleColor = '#311c72ff';

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2a0b4c' }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
        <G opacity={0.6}>
          {STAVE_CONFIGS.map((config, i) => {
            const staveColor = i % 2 === 0 ? goldColor : purpleColor;
            return (
              <React.Fragment key={`stave-${i}`}>
                <Stave 
                  baseYPercent={config.baseYPercent}
                  phase={config.phase}
                  amplitude={config.amplitude}
                  frequency={config.frequency}
                  time={time}
                  widthSV={widthSV}
                  heightSV={heightSV}
                  color={staveColor}
                  strokeWidth={6}
                  opacity={0.3}
                />
                <Stave 
                  baseYPercent={config.baseYPercent}
                  phase={config.phase}
                  amplitude={config.amplitude}
                  frequency={config.frequency}
                  time={time}
                  widthSV={widthSV}
                  heightSV={heightSV}
                  color={staveColor}
                  strokeWidth={1.5}
                  opacity={1}
                />
              </React.Fragment>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};
