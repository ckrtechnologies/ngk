import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { THEME } from '../../utils/theme';

const AppHeader = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightElement,
  centerElement,
  style,
  variant = 'solid', // 'solid' (official #D0142C) or 'light' / 'transparent'
  backgroundColor,
  titleColor,
  subtitleColor,
  backIconColor,
  includeTopInset = true,
  showStatusBar = true,
}) => {
  const insets = useSafeAreaInsets();
  const isSolid = variant === 'solid';

  const resolvedBgColor =
    backgroundColor || (isSolid ? THEME.primary : 'transparent');
  const resolvedTitleColor =
    titleColor || (isSolid ? THEME.textOnPrimary : '#111827');
  const resolvedSubtitleColor =
    subtitleColor || (isSolid ? THEME.textOnPrimaryMuted : '#6B7280');
  const resolvedIconColor =
    backIconColor || (isSolid ? '#FFFFFF' : '#111827');

  const containerPaddingTop = includeTopInset
    ? insets.top + (Platform.OS === 'android' ? 6 : 4)
    : 10;

  return (
    <>
      {showStatusBar && (
        <StatusBar
          barStyle={isSolid ? 'light-content' : 'dark-content'}
          backgroundColor={isSolid ? THEME.primary : '#FFFFFF'}
          translucent={false}
        />
      )}

      <View
        style={[
          styles.headerContainer,
          isSolid && styles.solidHeader,
          {
            backgroundColor: resolvedBgColor,
            paddingTop: containerPaddingTop,
          },
          style,
        ]}
      >
        <View style={styles.headerContent}>
          {/* Left Action / Back Button */}
          <View style={styles.leftContainer}>
            {showBack ? (
              <TouchableOpacity
                style={[
                  styles.backButton,
                  isSolid ? styles.solidBackButton : styles.lightBackButton,
                ]}
                onPress={onBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.75}
              >
                <ArrowLeft size={20} color={resolvedIconColor} strokeWidth={2.4} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </View>

          {/* Center Title or Custom Element */}
          <View style={styles.centerContainer}>
            {centerElement ? (
              centerElement
            ) : (
              <>
                {title ? (
                  <Text
                    style={[styles.title, { color: resolvedTitleColor }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text
                    style={[styles.subtitle, { color: resolvedSubtitleColor }]}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {/* Right Action Element */}
          <View style={styles.rightContainer}>
            {rightElement ? rightElement : <View style={styles.backPlaceholder} />}
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  solidHeader: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.primaryDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  leftContainer: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  solidBackButton: {
    backgroundColor: THEME.glassBg,
    borderWidth: 1,
    borderColor: THEME.glassBorder,
  },
  lightBackButton: {
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 38,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default AppHeader;
