/**
 * AutoSizingText - Dynamically sizes text to fit, then enables horizontal scrolling if needed
 * Prevents text wrapping for single-line values like emails, URLs, phone numbers
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, LayoutChangeEvent, TextLayoutEventData } from 'react-native';

interface AutoSizingTextProps {
  value: string;
  baseFontSize?: number;
  minFontSize?: number;
  style?: any;
  className?: string;
  testID?: string;
}

export function AutoSizingText({
  value,
  baseFontSize = 14,
  minFontSize = 10,
  style,
  className,
  testID,
}: AutoSizingTextProps) {
  const [fontSize, setFontSize] = useState(baseFontSize);
  const [containerWidth, setContainerWidth] = useState(0);
  const [needsScroll, setNeedsScroll] = useState(false);
  const containerRef = useRef<View>(null);
  const textRef = useRef<Text>(null);
  const isMeasuringRef = useRef(false);
  const measurementAttempts = useRef(0);

  // Reset when value changes
  useEffect(() => {
    setFontSize(baseFontSize);
    setNeedsScroll(false);
    isMeasuringRef.current = false;
    measurementAttempts.current = 0;
  }, [value, baseFontSize]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
      // Reset when container size changes
      setFontSize(baseFontSize);
      setNeedsScroll(false);
      isMeasuringRef.current = false;
      measurementAttempts.current = 0;
    }
  }, [containerWidth, baseFontSize]);

  const handleTextLayout = useCallback((event: { nativeEvent: TextLayoutEventData }) => {
    if (isMeasuringRef.current || containerWidth === 0 || !value) return;
    
    const { lines } = event.nativeEvent;
    if (!lines || lines.length === 0) return;

    const textWidth = lines[0].width;
    const currentFontSize = fontSize;

    // If text fits, we're done
    if (textWidth <= containerWidth - 2) { // 2px margin for safety
      setNeedsScroll(false);
      isMeasuringRef.current = false;
      measurementAttempts.current = 0;
      return;
    }

    // If we're at minimum size and still too wide, enable scrolling
    if (currentFontSize <= minFontSize) {
      setNeedsScroll(true);
      isMeasuringRef.current = false;
      return;
    }

    // Prevent infinite loops
    if (measurementAttempts.current >= 10) {
      setNeedsScroll(true);
      isMeasuringRef.current = false;
      return;
    }

    // Calculate new font size based on ratio
    const ratio = (containerWidth - 2) / textWidth;
    const newFontSize = Math.max(minFontSize, Math.floor(currentFontSize * ratio * 0.9)); // 0.9 for safety margin

    if (newFontSize < currentFontSize && newFontSize >= minFontSize) {
      isMeasuringRef.current = true;
      measurementAttempts.current += 1;
      setFontSize(newFontSize);
      // Allow re-measurement after state update
      setTimeout(() => {
        isMeasuringRef.current = false;
      }, 100);
    } else {
      // Can't reduce further, enable scrolling
      setNeedsScroll(true);
      isMeasuringRef.current = false;
    }
  }, [containerWidth, fontSize, minFontSize, value]);

  const textElement = (
    <Text
      ref={textRef}
      onTextLayout={handleTextLayout}
      className={className}
      style={[
        style,
        {
          fontSize,
          includeFontPadding: false,
        },
      ]}
      numberOfLines={1}
      testID={testID}
    >
      {value}
    </Text>
  );

  if (needsScroll) {
    return (
      <View ref={containerRef} onLayout={handleContainerLayout} style={{ flex: 1, minWidth: 0 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled={true}
        >
          {textElement}
        </ScrollView>
      </View>
    );
  }

  return (
    <View ref={containerRef} onLayout={handleContainerLayout} style={{ flex: 1, minWidth: 0 }}>
      {textElement}
    </View>
  );
}
