import React from 'react';
import { AppRegistry } from 'react-native';
import * as RN from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Global Quicksand Font configuration for React Native components
const OriginalText = RN.Text;
const CustomText = React.forwardRef((props, ref) => {
  const { style, children, ...rest } = props;
  
  let resolvedStyle = style;
  if (style) {
    const flat = RN.StyleSheet.flatten(style);
    if (flat && flat.fontFamily && flat.fontFamily !== 'sans-serif' && flat.fontFamily !== 'System' && flat.fontFamily !== 'normal') {
      // Respect custom fonts (e.g., Lucide icons, vector icons, etc.)
      resolvedStyle = style;
    } else {
      let fontFamily = 'Quicksand-Regular';
      if (flat) {
        if (flat.fontWeight === 'bold' || flat.fontWeight === '700' || flat.fontWeight === '800' || flat.fontWeight === '900') {
          fontFamily = 'Quicksand-Bold';
        } else if (flat.fontWeight === '600') {
          fontFamily = 'Quicksand-SemiBold';
        } else if (flat.fontWeight === '500') {
          fontFamily = 'Quicksand-Medium';
        } else if (flat.fontWeight === '300') {
          fontFamily = 'Quicksand-Light';
        }
      }
      resolvedStyle = [style, { fontFamily }];
    }
  } else {
    resolvedStyle = { fontFamily: 'Quicksand-Regular' };
  }
  
  return <OriginalText ref={ref} {...rest} style={resolvedStyle}>{children}</OriginalText>;
});

Object.defineProperty(RN, 'Text', {
  get() {
    return CustomText;
  },
  configurable: true,
});

const OriginalTextInput = RN.TextInput;
const CustomTextInput = React.forwardRef((props, ref) => {
  const { style, ...rest } = props;
  
  let resolvedStyle = style;
  if (style) {
    const flat = RN.StyleSheet.flatten(style);
    if (flat && flat.fontFamily && flat.fontFamily !== 'sans-serif' && flat.fontFamily !== 'System' && flat.fontFamily !== 'normal') {
      resolvedStyle = style;
    } else {
      let fontFamily = 'Quicksand-Regular';
      if (flat) {
        if (flat.fontWeight === 'bold' || flat.fontWeight === '700' || flat.fontWeight === '800' || flat.fontWeight === '900') {
          fontFamily = 'Quicksand-Bold';
        } else if (flat.fontWeight === '600') {
          fontFamily = 'Quicksand-SemiBold';
        } else if (flat.fontWeight === '500') {
          fontFamily = 'Quicksand-Medium';
        } else if (flat.fontWeight === '300') {
          fontFamily = 'Quicksand-Light';
        }
      }
      resolvedStyle = [style, { fontFamily }];
    }
  } else {
    resolvedStyle = { fontFamily: 'Quicksand-Regular' };
  }
  
  return <OriginalTextInput ref={ref} {...rest} style={resolvedStyle} />;
});

Object.defineProperty(RN, 'TextInput', {
  get() {
    return CustomTextInput;
  },
  configurable: true,
});

AppRegistry.registerComponent(appName, () => App);
