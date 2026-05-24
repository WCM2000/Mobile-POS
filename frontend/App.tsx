import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigator';
import SplashLoginScreen from './src/screens/SplashLoginScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        {isLoggedIn ? (
          <NavigationContainer>
            <TabNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        ) : (
          <>
            <SplashLoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />
            <StatusBar style="light" />
          </>
        )}
      </SafeAreaProvider>
    </Provider>
  );
}
