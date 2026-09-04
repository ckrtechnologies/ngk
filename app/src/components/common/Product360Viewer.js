import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { articles360FramesApi } from '../../apis/api';
import { apiFunction } from '../../apis/apiFunction';

const Product360Viewer = ({
  isStatic = false,
  gifUrl,
  staticImageUrl,
  angle = 0,
  isAutoSpinning = false,
  zoomScale = 1,
  onAngleChange,
  onAutoSpinChange,
  onScaleChange,
}) => {
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(!isStatic && !!gifUrl);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Pan & Zoom animated values
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Track gesture state
  const lastTapRef = useRef(0);
  const startXRef = useRef(0);
  const currentFrameRef = useRef(0);
  const isAutoSpinningRef = useRef(isAutoSpinning);
  const zoomScaleRef = useRef(zoomScale);
  const framesCountRef = useRef(1);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);

  currentFrameRef.current = currentFrame;
  isAutoSpinningRef.current = isAutoSpinning;
  zoomScaleRef.current = zoomScale;
  framesCountRef.current = isStatic ? 1 : frames.length || 1;

  // Sync zoomScale prop to scaleAnim
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: zoomScale,
      useNativeDriver: true,
      friction: 7,
    }).start();

    if (zoomScale <= 1.05) {
      panOffset.current = { x: 0, y: 0 };
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
    }
  }, [zoomScale]);

  // Fetch 360 frames from backend in the background
  useEffect(() => {
    let isMounted = true;
    if (isStatic || !gifUrl) {
      setLoading(false);
      return;
    }

    const fetchFrames = async () => {
      setLoading(true);
      try {
        const endpoint = `${articles360FramesApi}?gifUrl=${encodeURIComponent(gifUrl)}`;
        const res = await apiFunction(endpoint, [], {}, 'GET');
        const framesList = res?.frames || res?.data?.frames || res?.data?.data?.frames;
        if (isMounted && Array.isArray(framesList) && framesList.length > 0) {
          // Pre-cache first 4 frames so there is ZERO flicker when switching to frames
          Promise.all(
            framesList.slice(0, 4).map((f) => Image.prefetch(f).catch(() => {}))
          ).finally(() => {
            if (isMounted) {
              setFrames(framesList);
              setCurrentFrame(0);
              setLoading(false);
            }
          });
          // Background prefetch the rest of the frames
          setTimeout(() => {
            framesList.slice(4).forEach((f) => Image.prefetch(f).catch(() => {}));
          }, 250);
          return;
        }
      } catch (err) {
        console.warn('Backend 360 frames fetch error:', err);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    fetchFrames();
    return () => {
      isMounted = false;
    };
  }, [gifUrl, isStatic]);

  // Handle angle prop change in 360 mode
  useEffect(() => {
    if (isStatic || isAutoSpinning) return;
    const total = frames.length;
    if (total > 1) {
      const normalized = ((Math.round(angle) % 360) + 360) % 360;
      const targetFrame = Math.round((normalized / 360) * total) % total;
      setCurrentFrame(targetFrame);
    }
  }, [angle, isAutoSpinning, isStatic, frames.length]);

  // Auto-Spin animation loop (only for 360 mode)
  // Runs smoothly at 90ms intervals once frames are ready
  useEffect(() => {
    let timer = null;
    if (!isStatic && isAutoSpinning && !loading && frames.length > 1) {
      timer = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 90);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoSpinning, isStatic, loading, frames.length]);

  // Helper: calculate distance between two touches for pinch-to-zoom
  const getTouchDistance = (touches) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Native touch & gesture responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // If 2 touches: multi-touch pinch zoom
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            return true;
          }
          // When zoomed in: capture all 2D pan gestures (horizontal and vertical)
          if (zoomScaleRef.current > 1.08) {
            return Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1;
          }
          // Normal 1.0x scale in 360 mode: ONLY capture horizontal swipe
          if (!isStatic && framesCountRef.current > 1) {
            return (
              Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
              Math.abs(gestureState.dx) > 6
            );
          }
          // Static photo at 1.0x: let parent ScrollView handle vertical scrolling
          return false;
        },
        onPanResponderGrant: (evt) => {
          // Pause auto-spin if active
          if (!isStatic && isAutoSpinningRef.current && onAutoSpinChange) {
            onAutoSpinChange(false);
          }

          const touches = evt.nativeEvent.touches;
          if (touches && touches.length === 2) {
            pinchStartDistanceRef.current = getTouchDistance(touches);
            pinchStartScaleRef.current = zoomScaleRef.current;
            return;
          }

          startXRef.current = currentFrameRef.current;

          // Double tap to toggle zoom between 1.0x and 2.0x
          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            const nextScale = zoomScaleRef.current > 1.2 ? 1.0 : 2.0;
            if (onScaleChange) onScaleChange(nextScale);
            lastTapRef.current = 0;
            return;
          }
          lastTapRef.current = now;
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          // 2-Finger Pinch Zoom
          if (touches && touches.length === 2) {
            const currentDist = getTouchDistance(touches);
            if (pinchStartDistanceRef.current > 0) {
              const factor = currentDist / pinchStartDistanceRef.current;
              const newScale = Math.max(0.7, Math.min(3.5, pinchStartScaleRef.current * factor));
              if (onScaleChange) onScaleChange(newScale);
            }
            return;
          }

          // 1-Finger Pan when zoomed in: allows both horizontal and vertical panning
          if (zoomScaleRef.current > 1.08) {
            const newX = panOffset.current.x + gestureState.dx;
            const newY = panOffset.current.y + gestureState.dy;
            pan.setValue({ x: newX, y: newY });
            return;
          }

          // 1-Finger 360 scrubbing (only when not static)
          if (!isStatic && framesCountRef.current > 1) {
            const total = framesCountRef.current;
            const frameDiff = Math.round(gestureState.dx / 8);
            let nextIndex = (startXRef.current - frameDiff) % total;
            if (nextIndex < 0) nextIndex += total;
            setCurrentFrame(nextIndex);

            const calculatedAngle = Math.round((nextIndex / total) * 360) % 360;
            if (onAngleChange) onAngleChange(calculatedAngle);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (zoomScaleRef.current > 1.08) {
            panOffset.current.x += gestureState.dx;
            panOffset.current.y += gestureState.dy;
          }
          pinchStartDistanceRef.current = 0;
        },
      }),
    [frames.length, isStatic]
  );

  // In static mode, ALWAYS show staticImageUrl; in 360 mode, show frames or fallback
  const fallbackUri = staticImageUrl || gifUrl;
  const displayUri = isStatic
    ? fallbackUri
    : frames.length > 0 && frames[currentFrame]
    ? frames[currentFrame]
    : fallbackUri;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {fallbackUri || displayUri ? (
        <Animated.View
          style={[
            styles.imageWrap,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
        >
          {/* Underlayer: persistent cached fallback so stage NEVER flashes blank white */}
          {fallbackUri && fallbackUri !== displayUri ? (
            <Image
              source={{ uri: fallbackUri }}
              style={[styles.productImage, styles.baseImageUnderlay]}
              resizeMode="contain"
            />
          ) : null}

          {/* Active display frame */}
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : null}
        </Animated.View>
      ) : (
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>No Image Available</Text>
        </View>
      )}

      {/* Subtle non-blocking spinner overlay while frames load in background */}
      {loading && !isStatic && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#C6122E" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 230,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '88%',
    height: '88%',
  },
  baseImageUnderlay: {
    position: 'absolute',
  },
});

export default Product360Viewer;
