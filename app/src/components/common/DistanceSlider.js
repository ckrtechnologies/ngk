import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MapPin } from 'lucide-react-native';

const PRESET_DISTANCES = [
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: '250 km', value: 250 },
  { label: 'All SA', value: 1500 },
];

const MIN_KM = 5;
const MAX_KM = 500;
const ALL_SA_VAL = 1500;

export default function DistanceSlider({
  value = 50,
  onValueChange,
}) {
  const [trackWidth, setTrackWidth] = useState(280);
  const [internalKm, setInternalKm] = useState(value);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  // Convert km value to 0..1 ratio
  const kmToRatio = useCallback((km) => {
    if (km >= ALL_SA_VAL) return 1.0;
    const clamped = Math.max(MIN_KM, Math.min(MAX_KM, km));
    // Use slightly nonlinear/log curve or piecewise so 5-50km has generous precision
    if (clamped <= 100) {
      // 0 to 100km maps to 0 to 0.6 of track
      return (clamped / 100) * 0.6;
    } else {
      // 100 to 500km maps to 0.6 to 0.9 of track
      return 0.6 + ((clamped - 100) / 400) * 0.3;
    }
  }, []);

  // Convert ratio (0..1) to rounded km value
  const ratioToKm = useCallback((r) => {
    const clampedRatio = Math.max(0, Math.min(1, r));
    if (clampedRatio >= 0.92) return ALL_SA_VAL;
    if (clampedRatio <= 0.6) {
      const km = Math.round((clampedRatio / 0.6) * 100);
      // Snap to increments of 5 below 50km, increments of 10 up to 100km
      if (km <= 20) return Math.max(MIN_KM, Math.round(km / 5) * 5);
      return Math.round(km / 5) * 5;
    } else {
      const km = 100 + Math.round(((clampedRatio - 0.6) / 0.3) * 400);
      return Math.min(500, Math.round(km / 25) * 25);
    }
  }, []);

  // Synchronize internal state when prop changes
  useEffect(() => {
    setInternalKm(value);
    const targetRatio = kmToRatio(value);
    Animated.spring(animatedProgress, {
      toValue: targetRatio,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [value, kmToRatio, animatedProgress]);

  const updateFromPosition = (pageX) => {
    if (trackWidth <= 0) return;
    if (!trackRef.current) return;

    trackRef.current.measure((fx, fy, width, height, px, py) => {
      const relativeX = Math.max(0, Math.min(width, pageX - px));
      const ratio = relativeX / width;
      const km = ratioToKm(ratio);
      setInternalKm(km);
      animatedProgress.setValue(ratio);
      if (onValueChange) onValueChange(km);
    });
  };

  const trackRef = useRef(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateFromPosition(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        updateFromPosition(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: (evt) => {
        updateFromPosition(evt.nativeEvent.pageX);
      },
    })
  ).current;

  const handleSelectPreset = (presetKm) => {
    setInternalKm(presetKm);
    const targetRatio = kmToRatio(presetKm);
    Animated.spring(animatedProgress, {
      toValue: targetRatio,
      useNativeDriver: false,
      friction: 8,
      tension: 70,
    }).start();
    if (onValueChange) onValueChange(presetKm);
  };

  const formattedLabel =
    internalKm >= ALL_SA_VAL
      ? 'All South Africa'
      : `Within ${internalKm} km`;

  return (
    <View style={styles.container}>
      {/* Header with Distance Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MapPin size={16} color="#C6122E" strokeWidth={2.4} />
          <Text style={styles.titleText}>Search Radius</Text>
        </View>

        <View style={styles.radiusBadge}>
          <Text style={styles.radiusBadgeText}>{formattedLabel}</Text>
        </View>
      </View>

      {/* Interactive Slider Track */}
      <View
        ref={trackRef}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setTrackWidth(w);
        }}
        style={styles.touchArea}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBackground}>
          {/* Active Colored Fill */}
          <Animated.View
            style={[
              styles.trackFill,
              {
                width: animatedProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Draggable Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: animatedProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(0, trackWidth - 24)],
              }),
            },
          ]}
        >
          <View style={styles.thumbCenterDot} />
        </Animated.View>
      </View>

      {/* Min / Max Labels */}
      <View style={styles.minMaxRow}>
        <Text style={styles.minMaxText}>5 km</Text>
        <Text style={styles.minMaxText}>50 km</Text>
        <Text style={styles.minMaxText}>150 km</Text>
        <Text style={styles.minMaxText}>All SA</Text>
      </View>

      {/* Quick Preset Chips */}
      <View style={styles.presetsRow}>
        {PRESET_DISTANCES.map((preset) => {
          const isSelected =
            (preset.value >= ALL_SA_VAL && internalKm >= ALL_SA_VAL) ||
            Math.abs(preset.value - internalKm) <= 2;

          return (
            <TouchableOpacity
              key={preset.label}
              activeOpacity={0.75}
              onPress={() => handleSelectPreset(preset.value)}
              style={[
                styles.presetChip,
                isSelected && styles.presetChipActive,
              ]}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && styles.presetChipTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  radiusBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  radiusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C6122E',
  },
  touchArea: {
    height: 36,
    justifyContent: 'center',
  },
  trackBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#C6122E',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#C6122E',
    shadowColor: '#C6122E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C6122E',
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  minMaxText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#C6122E',
    borderColor: '#C6122E',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
