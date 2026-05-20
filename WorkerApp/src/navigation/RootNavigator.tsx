import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkerTabs } from './WorkerTabs';
import { SplashScreen } from '../screens/SplashScreen';
import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { SkillTipsScreen } from '../screens/SkillTipsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HelpScreen } from '../screens/HelpScreen';

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  WorkerTabs: undefined;
  SkillTips: undefined;
  Earnings: undefined;
  Chat: { jobId: string; contractorId: string; projectName: string };
  Help: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { token, isBootstrapping } = useAuth();
  const { hasSelectedLanguage, isLanguageReady } = useLanguage();

  // Show loading screen while initializing
  if (isBootstrapping || !isLanguageReady) {
    console.log(`🔄 Loading: isBootstrapping=${isBootstrapping}, isLanguageReady=${isLanguageReady}`);
    return <SplashScreen />;
  }

  // Determine initial route based on auth and language state
  const guestInitialRoute = hasSelectedLanguage ? 'Login' : 'LanguageSelection';

  console.log(`✅ App initialized: token=${!!token}, hasSelectedLanguage=${hasSelectedLanguage}, initialRoute=${token ? 'WorkerTabs' : guestInitialRoute}`);

  return (
    <Stack.Navigator
      initialRouteName={token ? 'WorkerTabs' : guestInitialRoute}
      screenOptions={{ headerShown: false }}
    >
      {!token ? (
        <>
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="SkillTips" component={SkillTipsScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
