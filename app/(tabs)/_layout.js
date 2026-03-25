import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Kutuphane',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="library-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Istatistikler',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="bar-chart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
