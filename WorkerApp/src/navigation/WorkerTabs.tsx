import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { useLanguage } from '../contexts/LanguageContext';

const Tab = createBottomTabNavigator();

export const WorkerTabs = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'home-outline',
            Jobs: 'briefcase-outline',
            Profile: 'person-outline',
            Help: 'help-circle-outline',
          };

          return <Ionicons color={color} name={iconMap[route.name]} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: t('jobs') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
      <Tab.Screen name="Help" component={HelpScreen} options={{ title: t('help') }} />
    </Tab.Navigator>
  );
};
