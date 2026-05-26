import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import PosBillingScreen from '../screens/PosBillingScreen';
import ManagementScreen from '../screens/ManagementScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { COLORS } from '../utils/styles';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0F172A', // Premium Slate 900
          borderTopWidth: 1.5,
          borderColor: '#1E293B',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0EA5E9', // Ocean Blue
        tabBarInactiveTintColor: '#94A3B8', // Slate 400
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
        },
        headerStyle: {
          backgroundColor: '#0F172A',
          borderBottomWidth: 1.5,
          borderColor: '#1E293B',
          height: 60,
        },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 16,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen 
        name="POS Cashier" 
        component={PosBillingScreen} 
        options={{
          title: '💵 Cashier Terminal',
          tabBarLabel: 'Cashier POS',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Management" 
        component={ManagementScreen} 
        options={{
          title: '📦 O3 Core Registries',
          tabBarLabel: 'Management',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{
          title: '📈 Sales & Ledgers',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-areaspline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          title: '⚙️ Shop Configuration',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
