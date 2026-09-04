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
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isTransitioningRef = useRef(false);

  const numItems = items?.length || 0;

  useEffect(() => {
    if (numItems <= 1) return;

    const interval = setInterval(() => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // 1. Slide up & fade out smoothly
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -12,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) {
          isTransitioningRef.current = false;
          return;
        }

        // Set up starting position for entry
        translateY.setValue(12);
        scale.setValue(0.97);

        // Advance to next item
        setCurrentIndex((prev) => {
          const currentCount = itemsRef.current?.length || 1;
          return (prev + 1) % currentCount;
        });

        // 2. Slide in buttery smooth & fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isTransitioningRef.current = false;
        });
      });
    }, 3800);

    return () => {
      clearInterval(interval);
      isTransitioningRef.current = false;
    };
  }, [numItems, translateY, opacity, scale]);

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
      style={styles.tickerContainer}
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
