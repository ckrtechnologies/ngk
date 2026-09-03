import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
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
}) => {
  const webViewRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const activeMediaUrl = gifUrl || staticImageUrl;

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
      touch-action: pan-y; /* CRITICAL: Allows vertical scrolling in React Native ScrollView */
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
      transition: transform 0.15s ease-out;
      transform-origin: center center;
    }
    #staticImg {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      transition: transform 0.2s ease-out;
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
    <div id="loading">Initializing 360° Studio...</div>
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

    const mediaUrl = "${activeMediaUrl || ''}";
    const isGif = mediaUrl.toLowerCase().includes('.gif');

    let frames = [];
    let currentFrame = 0;
    let totalFrames = 1;
    let autoSpinInterval = null;
    let currentScale = 1;

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

    function setScale(s) {
      currentScale = s;
      if (canvas.style.display !== 'none') {
        canvas.style.transform = 'scale(' + s + ')';
      }
      if (staticImg.style.display !== 'none') {
        staticImg.style.transform = 'scale(' + s + ')';
      }
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

    // Touch & Swipe Event Handling for 360 Frame Scrubbing
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let isHorizontalGesture = false;

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontalGesture = false;
        stopAutoSpin();
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const diffX = curX - startX;
      const diffY = curY - startY;

      // Determine gesture direction
      if (!isHorizontalGesture) {
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
          isHorizontalGesture = true;
        } else if (Math.abs(diffY) > 8) {
          // Vertical swipe: let the parent ScrollView handle it!
          isDragging = false;
          return;
        }
      }

      if (isHorizontalGesture && totalFrames > 1) {
        // Sensitivity: 7 pixels = 1 frame
        const frameDiff = Math.round(diffX / 7);
        if (frameDiff !== 0) {
          setFrame(currentFrame - frameDiff);
          startX = curX;
        }
      }
    }, { passive: true });

    stage.addEventListener('touchend', () => {
      isDragging = false;
      isHorizontalGesture = false;
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
          stopAutoSpin();
          setFrame(0);
          setScale(1);
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleIncomingMessage);
    document.addEventListener('message', handleIncomingMessage);

    // Fetch and Decode GIF with omggif
    async function loadMedia() {
      if (!mediaUrl) {
        loading.textContent = 'No 360 asset available';
        return;
      }

      if (isGif && window.omggif && window.omggif.GifReader) {
        try {
          const resp = await fetch(mediaUrl);
          const buffer = await resp.arrayBuffer();
          const reader = new window.omggif.GifReader(new Uint8Array(buffer));
          
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
          canvas.style.display = 'block';
          setFrame(0);
          sendToRN({ type: 'READY', totalFrames });
          return;
        } catch (e) {
          console.warn('GIF decode fallback:', e);
        }
      }

      // Fallback to image tag if GIF decode not possible or media is standard image
      staticImg.src = mediaUrl;
      staticImg.onload = () => {
        loading.style.display = 'none';
        staticImg.style.display = 'block';
        sendToRN({ type: 'READY', totalFrames: 1 });
      };
      staticImg.onerror = () => {
        loading.textContent = 'TecAlliance 3D Preview';
      };
    }

    // Initialize once omggif script loads
    if (window.omggif) {
      loadMedia();
    } else {
      window.onload = loadMedia;
      setTimeout(loadMedia, 600);
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
      } else if (data.type === 'AUTOSPIN_STATE') {
        if (onAutoSpinChange) onAutoSpinChange(data.isSpinning);
      }
    } catch (e) {}
  };

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
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default Product360Viewer;
