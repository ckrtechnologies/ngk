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
  const [loading, setLoading] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Pan & Zoom animated values
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Track touch gesture state
  const lastTapRef = useRef(0);
  const startXRef = useRef(0);
  const currentFrameRef = useRef(0);
  const isAutoSpinningRef = useRef(isAutoSpinning);
  const zoomScaleRef = useRef(zoomScale);
  const framesCountRef = useRef(1);

  currentFrameRef.current = currentFrame;
  isAutoSpinningRef.current = isAutoSpinning;
  zoomScaleRef.current = zoomScale;
  framesCountRef.current = frames.length || 1;

  // Sync zoomScale prop to scaleAnim
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: zoomScale,
      useNativeDriver: true,
      friction: 7,
    }).start();
    if (zoomScale <= 1.05) {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
    }
  }, [zoomScale]);

  // Fetch 360 frames from backend
  useEffect(() => {
    let isMounted = true;
    const fetchFrames = async () => {
      if (!gifUrl) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const endpoint = `${articles360FramesApi}?gifUrl=${encodeURIComponent(gifUrl)}`;
        const res = await apiFunction(endpoint, 'get');
        if (isMounted && res?.data?.frames && res.data.frames.length > 0) {
          setFrames(res.data.frames);
          setCurrentFrame(0);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch 360 frames from backend:', err);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    fetchFrames();
    return () => {
      isMounted = false;
    };
  }, [gifUrl]);

  // Handle angle prop change (e.g. when user clicks 0°, 90°, 180°, 270°)
  useEffect(() => {
    const total = framesCountRef.current;
    if (total > 1) {
      const normalized = ((Math.round(angle) % 360) + 360) % 360;
      const targetFrame = Math.round((normalized / 360) * total) % total;
      setCurrentFrame(targetFrame);
    }
  }, [angle]);

  // Auto-Spin animation loop
  useEffect(() => {
    let timer = null;
    if (isAutoSpinning && frames.length > 1) {
      timer = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = (prev + 1) % frames.length;
          const calcAngle = Math.round((next / frames.length) * 360) % 360;
          if (onAngleChange) onAngleChange(calcAngle);
          return next;
        });
      }, 50);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoSpinning, frames.length]);

  // Native touch & gesture responder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // When zoomed in: capture all pan gestures
          if (zoomScaleRef.current > 1.15) {
            return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
          }
          // Normal 1.0x scale: ONLY capture horizontal swipes!
          // Vertical swipe is completely ignored so parent ScrollView scrolls natively!
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 6;
        },
        onPanResponderGrant: (evt) => {
          // Pause auto-spin immediately when user touches
          if (isAutoSpinningRef.current && onAutoSpinChange) {
            onAutoSpinChange(false);
          }

          startXRef.current = currentFrameRef.current;

          // Double tap detection (toggles between 1.0x and 2.0x)
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
          // If zoomed in: pan the image
          if (zoomScaleRef.current > 1.15) {
            pan.setValue({ x: gestureState.dx, y: gestureState.dy });
            return;
          }

          // Horizontal 360 scrubbing: every 9 pixels changes 1 frame
          const total = framesCountRef.current;
          if (total > 1) {
            const frameDiff = Math.round(gestureState.dx / 9);
            let nextIndex = (startXRef.current - frameDiff) % total;
            if (nextIndex < 0) nextIndex += total;
            setCurrentFrame(nextIndex);

            const calculatedAngle = Math.round((nextIndex / total) * 360) % 360;
            if (onAngleChange) onAngleChange(calculatedAngle);
          }
        },
        onPanResponderRelease: () => {
          pan.flattenOffset();
        },
      }),
    [frames.length]
  );

  const displayUri =
    frames.length > 0 && frames[currentFrame]
      ? frames[currentFrame]
      : staticImageUrl || gifUrl;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#C6122E" />
          <Text style={styles.loadingText}>Loading 360° Studio...</Text>
        </View>
      ) : displayUri ? (
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
          <Image
            source={{ uri: displayUri }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </Animated.View>
      ) : (
        <View style={styles.centerBox}>
          <Text style={styles.loadingText}>No 360 Image Available</Text>
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
});

export default Product360Viewer;
