import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenContainer = ({
  children,
  scrollable = false,
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  contentContainerStyle,
  style,
  keyboardVerticalOffset = 0,
  footer,
  paddingHorizontal = 20,
}) => {
  const insets = useSafeAreaInsets();
  const Container = scrollable ? ScrollView : View;

  return (
    <View
      style={[
        styles.safeContainer,
        {
          backgroundColor,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View
            style={[
              styles.innerWrapper,
              { paddingHorizontal },
              style,
            ]}
          >
            <Container
              style={scrollable ? styles.scrollView : styles.flexView}
              contentContainerStyle={
                scrollable
                  ? [styles.scrollContent, contentContainerStyle]
                  : undefined
              }
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </Container>
            {footer && <View style={styles.footerContainer}>{footer}</View>}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  innerWrapper: {
    flex: 1,
  },
  flexView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footerContainer: {
    paddingTop: 8,
  },
});

export default ScreenContainer;
