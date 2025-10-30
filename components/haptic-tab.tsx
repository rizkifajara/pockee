import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Animated } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = (ev: any) => {
    if (process.env.EXPO_OS === 'ios') {
      // Add a soft haptic feedback when pressing down on the tabs.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    props.onPressIn?.(ev);
  };

  const handlePressOut = () => {
    // Scale back up animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <PlatformPressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      />
    </Animated.View>
  );
}
