import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import PosBillingScreen from '../screens/PosBillingScreen';
import InventoryScreen from '../screens/InventoryScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#6c757d',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#212529',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
      />
      <Tab.Screen 
        name="POS" 
        component={PosBillingScreen} 
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
