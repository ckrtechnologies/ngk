import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

// ---------------------------------------------------------------------------
// Global Modal Event Bus
// ---------------------------------------------------------------------------
const listeners = new Set();

/**
 * Trigger the common AppModal from anywhere in the app.
 *
 * @param {Object} options
 * @param {'success'|'error'|'info'|'warning'} [options.type='info']
 * @param {string} options.title - Header text
 * @param {string} [options.message] - Body description
 * @param {string} [options.buttonText='OK'] - Primary action button text
 * @param {string} [options.secondaryButtonText] - Optional secondary button text
 * @param {Function} [options.onConfirm] - Callback on primary button press
 * @param {Function} [options.onCancel] - Callback on secondary / dismiss
 * @param {number} [options.autoClose] - Optional auto-close timer in ms
 */
export const showModal = (options) => {
  listeners.forEach((listener) => listener(options));
};

export const hideModal = () => {
  listeners.forEach((listener) => listener(null));
};

// ---------------------------------------------------------------------------
// Automatic Interception of Toast.show
// Maps legacy Toast.show calls across the entire codebase to the new modal!
// ---------------------------------------------------------------------------
const originalToastShow = Toast.show;
const originalToastHide = Toast.hide;

Toast.show = (options = {}) => {
  const {
    type = 'info',
    text1 = '',
    text2 = '',
    onHide,
  } = options;

  showModal({
    type: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
    title: text1 || (type === 'error' ? 'Notice' : 'Information'),
    message: text2 || '',
    buttonText: type === 'error' ? 'Got it' : 'OK',
    onConfirm: onHide,
  });
};

Toast.hide = () => {
  hideModal();
};

// ---------------------------------------------------------------------------
// AppModal Component
// Mount once at root (in App.js)
// ---------------------------------------------------------------------------
export const AppModal = () => {
  const [modalState, setModalState] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoCloseTimer = useRef(null);

  const handleClose = useCallback((callback) => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalState(null);
      if (typeof callback === 'function') {
        callback();
      }
    });
  }, [opacityAnim, scaleAnim]);

  useEffect(() => {
    const onModalTrigger = (options) => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }

      if (!options) {
        handleClose();
        return;
      }

      setModalState(options);
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      if (options.autoClose && typeof options.autoClose === 'number') {
        autoCloseTimer.current = setTimeout(() => {
          handleClose(options.onConfirm);
        }, options.autoClose);
      }
    };

    listeners.add(onModalTrigger);
    return () => {
      listeners.delete(onModalTrigger);
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [handleClose, opacityAnim, scaleAnim]);

  if (!modalState) return null;

  const {
    type = 'info',
    title = '',
    message = '',
    buttonText = 'OK',
    secondaryButtonText,
    onConfirm,
    onCancel,
  } = modalState;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#059669" strokeWidth={2.4} />,
          badgeBg: '#ECFDF5',
          badgeBorder: '#A7F3D0',
          btnBg: '#059669',
          btnText: '#FFFFFF',
          accent: '#059669',
        };
      case 'error':
        return {
          icon: <AlertCircle size={32} color="#DC2626" strokeWidth={2.4} />,
          badgeBg: '#FEF2F2',
          badgeBorder: '#FECACA',
          btnBg: '#DC2626',
          btnText: '#FFFFFF',
          accent: '#DC2626',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="#D97706" strokeWidth={2.4} />,
          badgeBg: '#FEF3C7',
          badgeBorder: '#FDE68A',
          btnBg: '#D97706',
          btnText: '#FFFFFF',
          accent: '#D97706',
        };
      default:
        return {
          icon: <Info size={32} color="#2563EB" strokeWidth={2.4} />,
          badgeBg: '#EFF6FF',
          badgeBorder: '#BFDBFE',
          btnBg: '#0F172A',
          btnText: '#FFFFFF',
          accent: '#2563EB',
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal
      transparent
      visible={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => handleClose(onCancel)}
    >
      <View style={styles.backdrop}>
        <StatusBar backgroundColor="rgba(15, 23, 42, 0.65)" barStyle="light-content" />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Close "X" Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => handleClose(onCancel)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Centered Floating Status Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: theme.badgeBg,
                borderColor: theme.badgeBorder,
              },
            ]}
          >
            {theme.icon}
          </View>

          {/* Modal Title */}
          {!!title && <Text style={styles.title}>{title}</Text>}

          {/* Modal Message / Information Description */}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {!!secondaryButtonText && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => handleClose(onCancel)}
                activeOpacity={0.75}
              >
                <Text style={styles.secondaryBtnText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.btnBg },
                !secondaryButtonText && { flex: 1 },
              ]}
              onPress={() => handleClose(onConfirm)}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: theme.btnText }]}>
                {buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

export default AppModal;
