import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import { navigationRef } from './src/functions/navigationRefFunc';
import Toast  from 'react-native-toast-message';

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        
        
        <NavigationContainer ref={navigationRef}>
          <Toast />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
