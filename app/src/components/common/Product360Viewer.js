import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Image,
  PanResponder,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Maximize2 } from 'lucide-react-native';
import { articles360FramesApi } from '../../apis/api';
import { apiFunction } from '../../apis/apiFunction';

// ---------------------------------------------------------------------------
// Global in-memory frame cache – survives component unmount/remount cycles.
// Key: gifUrl string  →  Value: string[] (already prefetched to disk cache)
// ---------------------------------------------------------------------------
export const globalFramesCache = new Map();

// Loading pipeline phases
const Phase = {
  IDLE:        'idle',        // isStatic or no gifUrl
  FETCHING:    'fetching',    // requesting frame URL list from backend
  PREFETCHING: 'prefetching', // Image.prefetch() downloading all frames
  READY:       'ready',       // all frames on disk — safe to display & spin
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Product360Viewer = ({
  isStatic = false,
  gifUrl,
  staticImageUrl,
  angle = 0,
  isAutoSpinning = false,
  zoomScale = 1,
  height = 360,
  containerStyle,
  onAngleChange,
  onAutoSpinChange,
  onScaleChange,
  onPressImage,
  onFramesReady,
  showTapHint = false,
}) => {
  // Seed from global cache (prefetched in a previous mount) — instant READY
  const seedFrames = (!isStatic && gifUrl && globalFramesCache.get(gifUrl)) || null;

  const [frames, setFrames] = useState(seedFrames || []);
  const [phase, setPhase]   = useState(
    seedFrames        ? Phase.READY
    : isStatic || !gifUrl ? Phase.IDLE
    : Phase.FETCHING
  );
  const [currentFrame, setCurrentFrame] = useState(0);

  // Pan, pitch & zoom animated values
  const pan        = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset  = useRef({ x: 0, y: 0 });
  const scaleAnim  = useRef(new Animated.Value(zoomScale)).current;
  const pitchAnim  = useRef(new Animated.Value(0)).current;
  const pitchOffset = useRef(0);

  // Gesture-state refs (no re-renders)
  const lastTapRef           = useRef(0);
  const startXRef            = useRef(0);
  const currentFrameRef      = useRef(0);
  const isAutoSpinningRef    = useRef(isAutoSpinning);
  const zoomScaleRef         = useRef(zoomScale);
  const framesCountRef       = useRef(1);
  const pinchStartDistRef    = useRef(0);
  const pinchStartScaleRef   = useRef(1);
  const touchStartTimeRef    = useRef(0);

  currentFrameRef.current   = currentFrame;
  isAutoSpinningRef.current = isAutoSpinning;
  zoomScaleRef.current      = zoomScale;
  framesCountRef.current    = isStatic ? 1 : frames.length || 1;

  // ── Sync zoomScale prop → scaleAnim ────────────────────────────────────
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: zoomScale,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();
    if (zoomScale <= 1.05) {
      panOffset.current = { x: 0, y: 0 };
      pitchOffset.current = 0;
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        friction: 7,
      }).start();
      Animated.spring(pitchAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }).start();
    }
  }, [zoomScale, scaleAnim, pan, pitchAnim]);

  // ── Reset pitch when angle resets to 0 at normal scale ─────────────────
  useEffect(() => {
    if (angle === 0 && zoomScale <= 1.05) {
      pitchOffset.current = 0;
      Animated.spring(pitchAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }).start();
    }
  }, [angle, zoomScale, pitchAnim]);

  // ── Main loading pipeline ───────────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    if (isStatic || !gifUrl) {
      setPhase(Phase.IDLE);
      return;
    }

    // Cache hit → already prefetched, use instantly
    if (globalFramesCache.has(gifUrl)) {
      const cached = globalFramesCache.get(gifUrl);
      if (cached && cached.length > 0) {
        setFrames(cached);
        setCurrentFrame(0);
        setPhase(Phase.READY);
        requestAnimationFrame(() => { if (alive) onFramesReady?.(); });
        return;
      }
    }

    const run = async () => {
      // Step 1 ─ fetch frame list from backend
      setPhase(Phase.FETCHING);

      let list = null;
      try {
        const endpoint = `${articles360FramesApi}?gifUrl=${encodeURIComponent(gifUrl)}`;
        const res = await apiFunction(endpoint, [], {}, 'GET');
        list = res?.frames || res?.data?.frames || res?.data?.data?.frames;
      } catch (e) {
        console.warn('360 frames fetch error:', e);
      }

      if (!alive) return;
      if (!Array.isArray(list) || list.length === 0) {
        setPhase(Phase.IDLE);
        return;
      }

      // Step 2 ─ Only prefetch if URLs are remote HTTP/HTTPS (base64 data URIs are already in memory)
      const isHttp = typeof list[0] === 'string' && list[0].startsWith('http');
      if (isHttp) {
        setPhase(Phase.PREFETCHING);
        try {
          await Promise.all(
            list.map(async (url) => {
              try { await Image.prefetch(url); } catch (_) {}
            })
          );
        } catch (_) {}
      }

      if (!alive) return;

      // Step 3 ─ commit frames to state; auto-spin effect fires on next render
      globalFramesCache.set(gifUrl, list);
      setFrames(list);
      setCurrentFrame(0);
      setPhase(Phase.READY);
      requestAnimationFrame(() => { if (alive) onFramesReady?.(); });
    };

    run();
    return () => { alive = false; };
  }, [gifUrl, isStatic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when source is cleared
  useEffect(() => {
    if (!gifUrl || isStatic) setPhase(isStatic || !gifUrl ? Phase.IDLE : Phase.FETCHING);
  }, [gifUrl, isStatic]);

  // ── Manual angle → frame sync ───────────────────────────────────────────
  useEffect(() => {
    if (isStatic || isAutoSpinning || frames.length <= 1) return;
    const total = frames.length;
    const norm  = ((Math.round(angle) % 360) + 360) % 360;
    setCurrentFrame(Math.round((norm / 360) * total) % total);
  }, [angle, isAutoSpinning, isStatic, frames.length]);

  // ── Auto-spin — ONLY fires after all frames are downloaded (READY) ───────
  useEffect(() => {
    if (isStatic || !isAutoSpinning || phase !== Phase.READY || frames.length <= 1) return;
    const t = setInterval(() => setCurrentFrame(p => (p + 1) % frames.length), 95);
    return () => clearInterval(t);
  }, [isAutoSpinning, isStatic, phase, frames.length]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getTouchDist = useCallback((touches) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // ── PanResponder ─────────────────────────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onMoveShouldSetPanResponder: (evt, gs) => {
      // Always claim 2-finger pinch
      if (evt.nativeEvent.touches?.length === 2) return true;
      // Claim on any meaningful drag in any direction (X or Y)
      return Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3;
    },

    // Block parent ScrollView from hijacking touch during active interaction
    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: (evt) => {
      touchStartTimeRef.current = Date.now();
      // Pause auto-spin on touch
      if (!isStatic && isAutoSpinningRef.current) onAutoSpinChange?.(false);

      const t = evt.nativeEvent.touches;
      if (t?.length === 2) {
        pinchStartDistRef.current  = getTouchDist(t);
        pinchStartScaleRef.current = zoomScaleRef.current;
        return;
      }

      startXRef.current = currentFrameRef.current;

      // Double-tap → toggle zoom between 1.0x ↔ 2.5x
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        onScaleChange?.(zoomScaleRef.current > 1.2 ? 1.0 : 2.5);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    },

    onPanResponderMove: (evt, gs) => {
      const t = evt.nativeEvent.touches;

      // 2-finger pinch zoom
      if (t?.length === 2) {
        const dist = getTouchDist(t);
        if (pinchStartDistRef.current > 0) {
          const newScale = Math.max(
            0.7,
            Math.min(3.5, pinchStartScaleRef.current * (dist / pinchStartDistRef.current))
          );
          onScaleChange?.(newScale);
        }
        return;
      }

      // 1-finger pan when zoomed (both X and Y)
      if (zoomScaleRef.current > 1.08) {
        pan.setValue({
          x: panOffset.current.x + gs.dx,
          y: panOffset.current.y + gs.dy,
        });
        return;
      }

      // 1-finger 360 horizontal scrub (X axis)
      if (!isStatic && framesCountRef.current > 1) {
        const total = framesCountRef.current;
        let next = (startXRef.current - Math.round(gs.dx / 8)) % total;
        if (next < 0) next += total;
        setCurrentFrame(next);
        onAngleChange?.(Math.round((next / total) * 360) % 360);
      } else if (isStatic) {
        pan.setValue({
          x: panOffset.current.x + gs.dx * 0.4,
          y: panOffset.current.y + gs.dy * 0.4,
        });
      }

      // 1-finger 3D vertical pitch tilt (Y axis)
      // Moving finger up (-dy) tilts view up, finger down (+dy) tilts view down
      const targetPitch = Math.max(-28, Math.min(28, pitchOffset.current - gs.dy * 0.25));
      pitchAnim.setValue(targetPitch);
    },

    onPanResponderRelease: (evt, gs) => {
      if (zoomScaleRef.current > 1.08) {
        panOffset.current.x += gs.dx;
        panOffset.current.y += gs.dy;
      } else if (isStatic) {
        panOffset.current.x += gs.dx * 0.4;
        panOffset.current.y += gs.dy * 0.4;
      }
      pitchOffset.current = Math.max(-28, Math.min(28, pitchOffset.current - gs.dy * 0.25));
      pinchStartDistRef.current = 0;

      // Single clean tap → trigger onPressImage
      const dur  = Date.now() - touchStartTimeRef.current;
      const dist = Math.hypot(gs.dx, gs.dy);
      if (dur < 280 && dist < 8 && onPressImage) onPressImage();
    },
  }), [isStatic, getTouchDist, onAngleChange, onAutoSpinChange, onScaleChange, onPressImage]);

  // ── URI selection ────────────────────────────────────────────────────────
  const isGif = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return lower.includes('.gif') || lower.includes('360');
  }, []);

  const cleanStatic = useMemo(() => {
    if (staticImageUrl && !isGif(staticImageUrl)) return staticImageUrl;
    return null;
  }, [staticImageUrl, isGif]);

  const staticSource = useMemo(() => {
    return cleanStatic ? { uri: cleanStatic } : null;
  }, [cleanStatic]);

  // Loading state labels
  const isLoadingPhase = phase === Phase.FETCHING || phase === Phase.PREFETCHING;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View
      style={[styles.container, height ? { height } : null, containerStyle]}
      {...panResponder.panHandlers}
    >
      {/*
       * LAYER 1 — Static placeholder underlayer.
       * Rendered ONLY while phase !== Phase.READY to eliminate scale jumps,
       * double-layer ghosting, and background bleed during rotation.
       */}
      {phase !== Phase.READY && (
        cleanStatic ? (
          <View style={[StyleSheet.absoluteFill, styles.layerCenter]}>
            <Image
              source={staticSource}
              style={styles.frameImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          </View>
        ) : isLoadingPhase ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color="#C6122E" />
            <Text style={styles.loadingText}>Loading 360° model...</Text>
          </View>
        ) : phase === Phase.IDLE && !cleanStatic ? (
          <View style={styles.centerBox}>
            <Text style={styles.loadingText}>No Image Available</Text>
          </View>
        ) : null
      )}

      {/*
       * LAYER 2 — 360 frame (or static zoom/pan) layer.
       * Only rendered when phase === READY (all frames confirmed on disk/memory).
       */}
      {(phase === Phase.READY || isStatic) && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.frameLayer,
            {
              transform: [
                { perspective: 1000 },
                { scale: scaleAnim },
                { translateX: pan.x },
                { translateY: pan.y },
                {
                  rotateX: pitchAnim.interpolate({
                    inputRange: [-28, 28],
                    outputRange: ['-28deg', '28deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {isStatic ? (
            <Image
              source={staticSource || { uri: gifUrl }}
              style={styles.frameImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : frames.length > 0 ? (
            <Image
              source={{ uri: frames[currentFrame] }}
              style={styles.frameImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : null}
        </Animated.View>
      )}

      {/* Non-blocking loading pill — top-right corner during fetch */}
      {isLoadingPhase && !isStatic && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#C6122E" />
          <Text style={styles.loadingOverlayText}>Loading 360° Studio...</Text>
        </View>
      )}

      {/* Tap-to-fullscreen hint badge — only shown when READY */}
      {showTapHint && onPressImage && phase === Phase.READY && (
        <TouchableOpacity
          style={styles.tapToExpandBadge}
          onPress={onPressImage}
          activeOpacity={0.75}
        >
          <Maximize2 size={11} color="#334155" />
          <Text style={styles.tapToExpandText}>Tap image for fullscreen studio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 360,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  layerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameLayer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameImage: {
    width: '90%',
    height: '90%',
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
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  loadingOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tapToExpandBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  tapToExpandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
});

export default Product360Viewer;
