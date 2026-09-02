import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';

const ScreenContainer = ({
  children,
  scrollable = false,
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  contentContainerStyle,
  style,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0,
  footer,
}) => {
  const Container = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[styles.innerWrapper, style]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  innerWrapper: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingVertical: 12,
  },
});

export default ScreenContainer;
