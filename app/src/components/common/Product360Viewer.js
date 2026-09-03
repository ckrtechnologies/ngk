import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { OMGGIF_SCRIPT } from '../../utils/omggifCode';

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
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [base64Media, setBase64Media] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(true);

  const activeMediaUrl = gifUrl || staticImageUrl;

  // Fetch media in React Native natively to bypass browser CORS
  useEffect(() => {
    let isMounted = true;
    if (!activeMediaUrl) {
      setLoadingMedia(false);
      return;
    }

    const fetchNativeMedia = async () => {
      try {
        setLoadingMedia(true);
        if (activeMediaUrl.toLowerCase().includes('.gif')) {
          const res = await fetch(activeMediaUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) {
              setBase64Media(reader.result);
              setLoadingMedia(false);
            }
          };
          reader.readAsDataURL(blob);
        } else {
          setBase64Media(activeMediaUrl);
          setLoadingMedia(false);
        }
      } catch (e) {
        console.warn('Native 360 fetch fallback:', e);
        if (isMounted) {
          setBase64Media(activeMediaUrl);
          setLoadingMedia(false);
        }
      }
    };

    fetchNativeMedia();
    return () => {
      isMounted = false;
    };
  }, [activeMediaUrl]);

  // Generate HTML for the WebView
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #F8FAFC;
      display: flex;
      justify-content: center;
      align-items: center;
      touch-action: pan-y; /* Allows vertical scrolling in React Native ScrollView */
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    #stage {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      touch-action: pan-y;
    }
    #canvas {
      max-width: 92%;
      max-height: 92%;
      object-fit: contain;
      cursor: ew-resize;
      transition: transform 0.12s ease-out;
      transform-origin: center center;
    }
    #staticImg {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      transition: transform 0.18s ease-out;
      transform-origin: center center;
    }
    #loading {
      position: absolute;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #94A3B8;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div id="stage">
    <div id="loading">Loading 360° frames...</div>
    <canvas id="canvas" style="display:none;"></canvas>
    <img id="staticImg" style="display:none;" />
  </div>

  <script>
    ${OMGGIF_SCRIPT}
  </script>
  <script>
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const loading = document.getElementById('loading');
    const staticImg = document.getElementById('staticImg');

    const rawMedia = "${base64Media ? base64Media.replace(/"/g, '\\"') : ''}";

    let frames = [];
    let currentFrame = 0;
    let totalFrames = 1;
    let autoSpinInterval = null;
    let currentScale = 1;

    // Pinch to zoom & Pan state
    let isPinching = false;
    let initialPinchDistance = 0;
    let pinchStartScale = 1;
    let panX = 0;
    let panY = 0;
    let lastTapTime = 0;

    function sendToRN(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function renderCurrentFrame() {
      if (frames.length > 0 && frames[currentFrame]) {
        ctx.putImageData(frames[currentFrame], 0, 0);
        const calculatedAngle = Math.round((currentFrame / totalFrames) * 360) % 360;
        sendToRN({ type: 'ANGLE_CHANGE', angle: calculatedAngle, frame: currentFrame });
      }
    }

    function setFrame(idx) {
      if (totalFrames <= 0) return;
      currentFrame = ((idx % totalFrames) + totalFrames) % totalFrames;
      renderCurrentFrame();
    }

    function setAngle(deg) {
      if (totalFrames <= 0) return;
      const normalized = ((Math.round(deg) % 360) + 360) % 360;
      const targetFrame = Math.round((normalized / 360) * totalFrames) % totalFrames;
      setFrame(targetFrame);
    }

    function getDistance(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function applyTransform() {
      const transformStr = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + currentScale + ')';
      if (canvas.style.display !== 'none') {
        canvas.style.transform = transformStr;
      }
      if (staticImg.style.display !== 'none') {
        staticImg.style.transform = transformStr;
      }
    }

    function setScale(s) {
      currentScale = Math.max(0.6, Math.min(3.5, s));
      if (currentScale <= 1.05) {
        panX = 0;
        panY = 0;
      }
      applyTransform();
      sendToRN({ type: 'SCALE_CHANGE', scale: currentScale });
    }

    function resetView() {
      stopAutoSpin();
      setFrame(0);
      panX = 0;
      panY = 0;
      setScale(1);
    }

    function startAutoSpin() {
      stopAutoSpin();
      autoSpinInterval = setInterval(() => {
        setFrame(currentFrame + 1);
      }, 45);
      sendToRN({ type: 'AUTOSPIN_STATE', isSpinning: true });
    }

    function stopAutoSpin() {
      if (autoSpinInterval) {
        clearInterval(autoSpinInterval);
        autoSpinInterval = null;
      }
      sendToRN({ type: 'AUTOSPIN_STATE', isSpinning: false });
    }

    // Touch & Swipe Event Handling: 360 Rotation + Multi-touch Pinch Zoom + Panning
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let isHorizontalGesture = false;

    stage.addEventListener('touchstart', (e) => {
      stopAutoSpin();
      if (e.touches.length === 2) {
        isPinching = true;
        isDragging = false;
        initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
        pinchStartScale = currentScale;
        if (e.cancelable) e.preventDefault();
      } else if (e.touches.length === 1) {
        // Double-tap to toggle zoom (1x <-> 2x)
        const now = Date.now();
        if (now - lastTapTime < 300) {
          if (currentScale > 1.2) {
            resetView();
          } else {
            setScale(2.0);
          }
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;

        isDragging = true;
        isPinching = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontalGesture = false;
      }
    }, { passive: false });

    stage.addEventListener('touchmove', (e) => {
      // 2-Finger Pinch Zoom
      if (e.touches.length === 2 && isPinching) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        if (initialPinchDistance > 0) {
          const ratio = currentDistance / initialPinchDistance;
          setScale(pinchStartScale * ratio);
        }
        if (e.cancelable) e.preventDefault();
        return;
      }

      if (!isDragging || e.touches.length !== 1) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const diffX = curX - startX;
      const diffY = curY - startY;

      // When zoomed in, 1-finger drags pan in all directions
      if (currentScale > 1.15) {
        panX += diffX * 0.75;
        panY += diffY * 0.75;
        applyTransform();
        startX = curX;
        startY = curY;
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Normal 1.0x scale:
      if (!isHorizontalGesture) {
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
          isHorizontalGesture = true;
        } else if (Math.abs(diffY) > 8) {
          // Vertical swipe: let parent ScrollView scroll smoothly!
          isDragging = false;
          return;
        }
      }

      if (isHorizontalGesture && totalFrames > 1) {
        const frameDiff = Math.round(diffX / 7);
        if (frameDiff !== 0) {
          setFrame(currentFrame - frameDiff);
          startX = curX;
        }
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    stage.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        isDragging = false;
        isPinching = false;
        isHorizontalGesture = false;
      } else if (e.touches.length === 1) {
        isPinching = false;
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    // Handle React Native postMessages
    function handleIncomingMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SET_ANGLE') {
          setAngle(data.angle);
        } else if (data.type === 'SET_SCALE') {
          setScale(data.scale);
        } else if (data.type === 'TOGGLE_AUTOSPIN') {
          if (data.enabled) startAutoSpin();
          else stopAutoSpin();
        } else if (data.type === 'RESET') {
          resetView();
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleIncomingMessage);
    document.addEventListener('message', handleIncomingMessage);

    function base64ToUint8Array(base64) {
      const raw = window.atob(base64);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    }

    // Decode and blit all frames in memory
    function initViewer() {
      if (!rawMedia) {
        loading.textContent = 'No 360 asset available';
        return;
      }

      const GifReaderClass = (window.omggif && window.omggif.GifReader) || window.GifReader;

      if (rawMedia.startsWith('data:image/gif') && GifReaderClass) {
        try {
          const b64Part = rawMedia.split(',')[1];
          const uint8 = base64ToUint8Array(b64Part);
          const reader = new GifReaderClass(uint8);

          canvas.width = reader.width;
          canvas.height = reader.height;
          totalFrames = reader.numFrames();
          frames = [];

          for (let i = 0; i < totalFrames; i++) {
            const imgData = ctx.createImageData(reader.width, reader.height);
            reader.decodeAndBlitFrameRGBA(i, imgData.data);
            frames.push(imgData);
          }

          loading.style.display = 'none';
          staticImg.style.display = 'none';
          canvas.style.display = 'block';
          setFrame(0);
          sendToRN({ type: 'READY', totalFrames });
          return;
        } catch (e) {
          console.warn('In-memory GIF decode fallback:', e);
        }
      }

      // If standard static photo:
      staticImg.src = rawMedia;
      staticImg.onload = () => {
        loading.style.display = 'none';
        canvas.style.display = 'none';
        staticImg.style.display = 'block';
        sendToRN({ type: 'READY', totalFrames: 1 });
      };
      staticImg.onerror = () => {
        loading.textContent = 'TecAlliance 3D Preview';
      };
    }

    if (document.readyState === 'complete') {
      initViewer();
    } else {
      window.onload = initViewer;
      setTimeout(initViewer, 200);
    }
  </script>
</body>
</html>
  `;

  // Sync angle from props to WebView
  useEffect(() => {
    if (isReady && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'SET_ANGLE', angle })
      );
    }
  }, [angle, isReady]);

  // Sync scale from props to WebView
  useEffect(() => {
    if (isReady && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'SET_SCALE', scale: zoomScale })
      );
    }
  }, [zoomScale, isReady]);

  // Sync autoSpin from props to WebView
  useEffect(() => {
    if (isReady && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: 'TOGGLE_AUTOSPIN', enabled: isAutoSpinning })
      );
    }
  }, [isAutoSpinning, isReady]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setIsReady(true);
      } else if (data.type === 'ANGLE_CHANGE') {
        if (onAngleChange) onAngleChange(data.angle);
      } else if (data.type === 'SCALE_CHANGE') {
        if (onScaleChange) onScaleChange(data.scale);
      } else if (data.type === 'AUTOSPIN_STATE') {
        if (onAutoSpinChange) onAutoSpinChange(data.isSpinning);
      }
    } catch (e) {}
  };

  if (loadingMedia) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="small" color="#C6122E" />
        <Text style={styles.loadingText}>Preparing 360° Studio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 230,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
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
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default Product360Viewer;
