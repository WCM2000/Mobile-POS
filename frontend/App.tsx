import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigator';
import SplashLoginScreen from './src/screens/SplashLoginScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/services/LocalDbService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initDatabase();
  }, []);

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
