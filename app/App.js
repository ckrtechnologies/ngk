import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import store from './src/redux/store';
import { AuthProvider } from './src/core/auth/AuthContext';
import RootNavigator from './src/core/navigation/RootNavigator';
import { navigationRef } from './src/functions/navigationRefFunc';
import Toast from 'react-native-toast-message';
import ErrorBoundary from './src/components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthProvider>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </SafeAreaProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
