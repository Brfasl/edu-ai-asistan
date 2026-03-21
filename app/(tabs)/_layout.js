import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: '#2BE26E',
        tabBarInactiveTintColor: '#8B949F',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#11161C',
          borderTopColor: '#1C232C',
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
