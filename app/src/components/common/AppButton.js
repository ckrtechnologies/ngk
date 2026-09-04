import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

const AppButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'dark' | 'ghost'
  backgroundColor,
  textColor,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  height = 48,
}) => {
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    switch (variant) {
      case 'primary':
        return '#D0142C'; // NGK Crimson Red
      case 'dark':
        return '#111827'; // Executive Slate Black
      case 'secondary':
        return '#F3F4F6';
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return '#D0142C';
    }
  };

  const getTextColor = () => {
    if (textColor) return textColor;
    switch (variant) {
      case 'primary':
      case 'dark':
        return '#FFFFFF';
      case 'secondary':
        return '#1F2937';
      case 'outline':
        return '#D0142C';
      case 'ghost':
        return '#4B5563';
      default:
        return '#FFFFFF';
    }
  };

  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height,
          backgroundColor: disabled ? '#E5E7EB' : getBackgroundColor(),
          borderColor: isOutline ? (disabled ? '#D1D5DB' : '#D0142C') : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
        },
        variant === 'primary' && !disabled ? styles.primaryShadow : null,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? '#D0142C' : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              { color: disabled ? '#9CA3AF' : getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryShadow: {
    shadowColor: '#D0142C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default AppButton;
