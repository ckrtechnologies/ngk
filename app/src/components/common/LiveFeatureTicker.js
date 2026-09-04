import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function LiveFeatureTicker({ items, onItemPress }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      // 1. Slide up & fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -16,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        translateY.setValue(16);
        scale.setValue(0.96);
        // 2. Slide in with spring bounce & fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.4)),
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3600);

    return () => clearInterval(interval);
  }, [items, translateY, opacity, scale]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const IconComp = currentItem.IconComponent;

  const handlePress = () => {
    if (currentItem.onPress) {
      currentItem.onPress();
    } else if (onItemPress) {
      onItemPress(currentItem);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.tickerContainer,
        {
          borderColor: (currentItem.themeColor || '#C6122E') + '35',
        },
      ]}
    >
      <View style={styles.tickerContent}>
        <Animated.View
          style={[
            styles.animatedRow,
            {
              transform: [{ translateY }, { scale }],
              opacity,
            },
          ]}
        >
          {/* Custom Vibrant Icon Container */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor:
                  currentItem.badgeBg || (currentItem.themeColor + '18'),
              },
            ]}
          >
            {IconComp ? <IconComp size={18} /> : null}
          </View>

          {/* Headline Text */}
          <View style={styles.textContainer}>
            <Text style={styles.tickerText} numberOfLines={1}>
              <Text
                style={[
                  styles.countHighlight,
                  { color: currentItem.themeColor || '#C6122E' },
                ]}
              >
                {currentItem.countHighlight}{' '}
              </Text>
              {currentItem.text}
            </Text>
          </View>

          {/* Right Highlight Pill Badge */}
          {currentItem.highlight && (
            <View
              style={[
                styles.tickerHighlightBadge,
                {
                  backgroundColor:
                    (currentItem.themeColor || '#C6122E') + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.tickerHighlightText,
                  { color: currentItem.themeColor || '#C6122E' },
                ]}
              >
                {currentItem.highlight}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      <ChevronRight
        size={14}
        color={currentItem.themeColor || '#C6122E'}
        strokeWidth={2.4}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  tickerContent: {
    flex: 1,
    overflow: 'hidden',
    height: 28,
    justifyContent: 'center',
    marginRight: 6,
  },
  animatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 6,
  },
  tickerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  countHighlight: {
    fontWeight: '800',
  },
  tickerHighlightBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tickerHighlightText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
