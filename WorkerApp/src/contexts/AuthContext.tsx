import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  isBootstrapping: boolean;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = 'rozgarsetu-worker-token';
const USER_TYPE_KEY = 'rozgarsetu-user-type';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      setTokenState(storedToken);
      setIsBootstrapping(false);
    };

    bootstrap();
  }, []);

  const setToken = async (nextToken: string) => {
    setTokenState(nextToken);
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_TYPE_KEY, 'worker');
  };

  const logout = async () => {
    setTokenState(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_TYPE_KEY]);
  };

  const value = useMemo(
    () => ({
      token,
      isBootstrapping,
      setToken,
      logout,
    }),
    [isBootstrapping, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
